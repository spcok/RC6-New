import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const transfersCollection = createCollection({
  id: 'transfers',
  persistence: sqlitePersistence,
});
