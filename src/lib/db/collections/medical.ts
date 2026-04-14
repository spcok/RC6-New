import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const medicalCollection = createCollection({
  id: 'medical',
  persistence: sqlitePersistence,
});
