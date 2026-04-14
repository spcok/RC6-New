import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const staffCollection = createCollection({
  id: 'staff',
  persistence: sqlitePersistence,
});
