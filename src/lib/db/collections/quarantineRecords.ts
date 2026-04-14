import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const quarantineRecordsCollection = createCollection({
  id: 'quarantineRecords',
  persistence: sqlitePersistence,
});
