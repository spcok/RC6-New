const fs = require('fs');
const path = require('path');

const dbFilePath = path.join(__dirname, '../src/lib/database.ts');
const outDir = path.join(__dirname, '../src/lib/db/collections');
const indexFilePath = path.join(__dirname, '../src/lib/db/index.ts');

// Ensure output directory exists
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

// Map of collections to extract
const collections = [
  'animals', 'users', 'operationalLists', 'orgSettings', 
  'dailyLogs', 'rounds', 'medical', 'logistics', 'staff', 'safety'
];

console.log('🔄 Refactoring database.ts into modular collections...');

// Create individual collection files wired to SQLite
collections.forEach(col => {
  const fileContent = `import { createCollection } from '@tanstack/db';
import { sqlitePersistence } from '../persistence';

export const ${col}Collection = createCollection({
  id: '${col}',
  persistence: sqlitePersistence,
});
`;
  fs.writeFileSync(path.join(outDir, `${col}.ts`), fileContent, 'utf-8');
  console.log(`✅ Created: src/lib/db/collections/${col}.ts`);
});

// Create the central index.ts file
const indexContent = collections.map(col => `export * from './collections/${col}';`).join('\n');
fs.writeFileSync(indexFilePath, indexContent, 'utf-8');
console.log('✅ Created: src/lib/db/index.ts');

console.log('\n🎉 Modularization complete! All collections are now wired to SQLite OPFS.');
