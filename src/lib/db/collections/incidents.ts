import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const incidentsCollection = createCollection({
  id: 'incidents',
  persistence: sqlitePersistence,
});
