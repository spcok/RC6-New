import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const maintenanceCollection = createCollection({
  id: 'maintenance',
  persistence: sqlitePersistence,
});
