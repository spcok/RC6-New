import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const safetyDrillsCollection = createCollection({
  id: 'safetyDrills',
  persistence: sqlitePersistence,
});
