import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const medicalLogsCollection = createCollection({
  id: 'medicalLogs',
  persistence: sqlitePersistence,
});
