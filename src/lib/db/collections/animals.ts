import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const animalsCollection = createCollection({
  id: 'animals',
  persistence: sqlitePersistence,
});
