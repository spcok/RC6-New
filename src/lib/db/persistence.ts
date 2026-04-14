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

    // VITE HMR GUARD: Prevents sqlite3_open_v2 locking crashes
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

// 1. Await the DB initialization
const { persistence, coordinator } = await initPersistentStorage();

// 2. EXPLICIT STATIC EXPORT (Satisfies Vite's strict import analysis)
export const sqlitePersistence = persistence;
export const dbCoordinator = coordinator;
