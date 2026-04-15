import { createCollection, localOnlyCollectionOptions } from '@tanstack/db';
import { persistedCollectionOptions } from '@tanstack/browser-db-sqlite-persistence';
import { sqlitePersistence } from '../persistence';

export const marChartsCollection = createCollection(
  persistedCollectionOptions({
    ...localOnlyCollectionOptions({
      getKey: (item: any) => item.id,
    }),
    id: 'marCharts',
    persistence: sqlitePersistence,
    schemaVersion: 1,
  })
);
