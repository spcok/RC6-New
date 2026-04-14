import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const roundsCollection = createCollection({
  id: 'rounds',
  persistence: sqlitePersistence,
});
