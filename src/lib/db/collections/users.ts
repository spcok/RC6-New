import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const usersCollection = createCollection({
  id: 'users',
  persistence: sqlitePersistence,
});
