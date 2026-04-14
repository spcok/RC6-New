import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const holidaysCollection = createCollection({
  id: 'holidays',
  persistence: sqlitePersistence,
});
