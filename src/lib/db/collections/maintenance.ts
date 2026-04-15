import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const maintenanceCollection = createCollection(
  persistedCollectionOptions({
    ...localOnlyCollectionOptions({
      getKey: (item: any) => item.id,
    }),
    id: 'maintenance',
    persistence: sqlitePersistence,
    schemaVersion: 1,
  })
);
