import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const dailyLogsCollection = createCollection({
  id: 'dailyLogs',
  persistence: sqlitePersistence,
});
