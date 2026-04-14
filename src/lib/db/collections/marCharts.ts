import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const marChartsCollection = createCollection({
  id: 'marCharts',
  persistence: sqlitePersistence,
});
