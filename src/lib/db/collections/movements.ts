import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const movementsCollection = createCollection({
  id: 'movements',
  persistence: sqlitePersistence,
});
