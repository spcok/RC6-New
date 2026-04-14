import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const zlaDocumentsCollection = createCollection({
  id: 'zlaDocuments',
  persistence: sqlitePersistence,
});
