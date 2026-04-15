import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const rotaCollection = createCollection({
  ...persistedCollectionOptions({
    id: 'rota',
    persistence: sqlitePersistence,
  }),
  ...localOnlyCollectionOptions({
    getKey: (item: any) => item.id,
  }),
  schemaVersion: 1,
});
