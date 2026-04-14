import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const timesheetsCollection = createCollection({
  id: 'timesheets',
  persistence: sqlitePersistence,
});
