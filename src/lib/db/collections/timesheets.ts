import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const timesheetsCollection = createCollection(
  persistedCollectionOptions({
    ...localOnlyCollectionOptions({
      getKey: (item: any) => item.id,
    }),
    id: 'timesheets',
    persistence: sqlitePersistence,
    schemaVersion: 1,
  })
);
