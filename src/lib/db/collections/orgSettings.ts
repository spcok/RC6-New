import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const orgSettingsCollection = createCollection({
  id: 'orgSettings',
  persistence: sqlitePersistence,
});
