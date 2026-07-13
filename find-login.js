import fs from 'fs';

const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');

lines.forEach((line, i) => {
  if (line.toLowerCase().includes('/login') || line.toLowerCase().includes('sign(')) {
    console.log(`${i + 1}: ${line}`);
  }
});
