import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const safetyCollection = createCollection({
  id: 'safety',
  persistence: sqlitePersistence,
});
