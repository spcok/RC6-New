import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const quarantineRecordsCollection = createCollection(
  persistedCollectionOptions({
    ...localOnlyCollectionOptions({
      getKey: (item: any) => item.id,
    }),
    id: 'quarantineRecords',
    persistence: sqlitePersistence,
    schemaVersion: 1,
  })
);
