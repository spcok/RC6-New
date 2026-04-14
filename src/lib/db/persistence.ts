import { 
  BrowserCollectionCoordinator, 
  createBrowserWASQLitePersistence, 
  openBrowserWASQLiteOPFSDatabase 
} from '@tanstack/browser-db-sqlite-persistence';
import sqliteWasm from '@sqlite.org/sqlite-wasm';

const DB_NAME = 'koa_offline_vault';

declare global {
  var __koa_db_persistence: any;
  var __koa_db_coordinator: any;
}

export async function initPersistentStorage() {
  // Return the existing connection if it survived the reload
  if (globalThis.__koa_db_persistence) {
    return { 
      persistence: globalThis.__koa_db_persistence, 
      coordinator: globalThis.__koa_db_coordinator 
    };
  }

  const coordinator = new BrowserCollectionCoordinator({ dbName: DB_NAME });

  try {
    const database = await openBrowserWASQLiteOPFSDatabase({ 
      databaseName: DB_NAME 
    });
    
    const persistence = createBrowserWASQLitePersistence({ 
      database, 
      coordinator, 
      getSqlite: () => sqliteWasm() 
    });

    globalThis.__koa_db_persistence = persistence;
    globalThis.__koa_db_coordinator = coordinator;

    // VITE HMR FIX: This specifically prevents the OPFS lock crash.
    // When Vite detects a code change, it tells the coordinator to drop the lock.
    if (import.meta.hot) {
      import.meta.hot.dispose(async () => {
        console.log('🧹 [HMR] Releasing SQLite OPFS locks for hot reload...');
        await coordinator.dispose();
        globalThis.__koa_db_persistence = null;
        globalThis.__koa_db_coordinator = null;
      });
    }

    console.log('✅ [Database] Persistent SQLite OPFS Vault Established.');
    return { persistence, coordinator };
  } catch (err: any) {
    console.error('🛑 [Database] Vault Initialization Failed:', err);
    throw err;
  }
}
