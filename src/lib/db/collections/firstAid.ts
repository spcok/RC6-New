import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const firstAidCollection = createCollection({
  id: 'firstAid',
  persistence: sqlitePersistence,
});
