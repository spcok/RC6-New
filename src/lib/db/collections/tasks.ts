import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const tasksCollection = createCollection({
  id: 'tasks',
  persistence: sqlitePersistence,
});
