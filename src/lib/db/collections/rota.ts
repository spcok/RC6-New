import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const rotaCollection = createCollection({
  id: 'rota',
  persistence: sqlitePersistence,
});
