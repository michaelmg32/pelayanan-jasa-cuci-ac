import fs from 'fs';
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
const idx = lines.findIndex(l => l.includes('assign-team'));
if (idx !== -1) {
  console.log(`Found assign-team at line ${idx+1}`);
  console.log(lines.slice(idx, idx + 10).join('\n'));
} else {
  console.log('assign-team NOT FOUND in server.js!');
}
