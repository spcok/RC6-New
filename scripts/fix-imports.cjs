const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const outDir = path.join(__dirname, '../src/lib/db/collections');
const indexFilePath = path.join(__dirname, '../src/lib/db/index.ts');

if (!fs.existsSync(outDir)) { fs.mkdirSync(outDir, { recursive: true }); }

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    if (fs.statSync(file).isDirectory()) { 
      results = results.concat(walk(file)); 
    } else if (file.endsWith('.ts') || file.endsWith('.tsx')) { 
      results.push(file); 
    }
  });
  return results;
}

const files = walk(srcDir);
const collectionNames = new Set();
let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf-8');
  let changed = false;

  // 1. SCAN: Find exactly which collections the app is asking for
  const importBlockRegex = /import\s+\{([^}]+)\}\s+from\s+['"][^'"]*\/lib\/(?:database|db)['"]/g;
  let match;
  while ((match = importBlockRegex.exec(content)) !== null) {
    const imports = match[1].split(',').map(s => s.trim().replace(/\n/g, '')).filter(Boolean);
    imports.forEach(imp => {
      if (imp.endsWith('Collection')) {
        collectionNames.add(imp);
      }
    });
  }

  // 2. FIX: Update the broken paths from /lib/database to /lib/db
  const pathRegex = /from\s+['"]([^'"]*?)\/lib\/database['"]/g;
  if (pathRegex.test(content)) {
    content = content.replace(pathRegex, "from '$1/lib/db'");
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(file, content, 'utf-8');
    fixedCount++;
  }
});

console.log(`✅ Fixed import paths in ${fixedCount} component files.`);

// 3. GENERATE: Create the exact collections requested by the UI
let indexContent = '';
collectionNames.forEach(colName => {
  const baseId = colName.replace('Collection', '');
  const fileContent = `import { createCollection } from '@tanstack/db';\nimport { sqlitePersistence } from '../persistence';\n\nexport const ${colName} = createCollection({\n  id: '${baseId}',\n  persistence: sqlitePersistence,\n});\n`;
  
  fs.writeFileSync(path.join(outDir, `${baseId}.ts`), fileContent, 'utf-8');
  indexContent += `export * from './collections/${baseId}';\n`;
});

fs.writeFileSync(indexFilePath, indexContent, 'utf-8');
console.log(`✅ Successfully mapped and generated ${collectionNames.size} distinct collections.`);
