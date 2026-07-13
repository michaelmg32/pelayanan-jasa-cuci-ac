import fs from 'fs';
import path from 'path';

function searchInDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.git' && file !== '.next') {
        searchInDir(fullPath, query);
      }
    } else {
      if (fullPath.endsWith('.js') || fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
        const content = fs.readFileSync(fullPath, 'utf8');
        if (content.toLowerCase().includes(query.toLowerCase())) {
          console.log(`Found in: ${fullPath}`);
          const lines = content.split('\n');
          lines.forEach((line, i) => {
            if (line.toLowerCase().includes(query.toLowerCase())) {
              console.log(`${i + 1}: ${line}`);
            }
          });
        }
      }
    }
  }
}

searchInDir('.', 'region_id diperlukan');
searchInDir('.', 'createstaffgrade');
