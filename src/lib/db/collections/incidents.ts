import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const incidentsCollection = createCollection({
  ...persistedCollectionOptions({
    id: 'incidents',
    persistence: sqlitePersistence,
  }),
  ...localOnlyCollectionOptions({
    getKey: (item: any) => item.id,
  }),
  schemaVersion: 1,
});
