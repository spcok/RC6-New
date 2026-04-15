import { BrowserCollectionCoordinator, createBrowserIDBPersistence } from '@tanstack/browser-db-idb-persistence';

const DB_NAME = 'koa_idb_vault';

// Ensure global singletons for HMR stability
declare global {
  var __koa_idb_persistence: any;
  var __koa_idb_coordinator: any;
}

export function initPersistentStorage() {
  if (globalThis.__koa_idb_persistence) {
    return { 
      persistence: globalThis.__koa_idb_persistence, 
      coordinator: globalThis.__koa_idb_coordinator 
    };
  }

  const coordinator = new BrowserCollectionCoordinator({ dbName: DB_NAME });
  const persistence = createBrowserIDBPersistence({ coordinator });

  globalThis.__koa_idb_persistence = persistence;
  globalThis.__koa_idb_coordinator = coordinator;

  console.log('✅ [Database] Persistent IndexedDB Vault Established.');
  return { persistence, coordinator };
}

const { persistence, coordinator } = initPersistentStorage();

// Export under the original name so we don't have to rewrite all 25 collections
export const sqlitePersistence = persistence; 
export const dbCoordinator = coordinator;
