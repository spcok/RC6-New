import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const directoryCollection = createCollection({
  id: 'directory',
  persistence: sqlitePersistence,
});
