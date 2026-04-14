import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const dailyRoundsCollection = createCollection({
  id: 'dailyRounds',
  persistence: sqlitePersistence,
});
