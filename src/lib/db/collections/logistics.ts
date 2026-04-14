import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const logisticsCollection = createCollection({
  id: 'logistics',
  persistence: sqlitePersistence,
});
