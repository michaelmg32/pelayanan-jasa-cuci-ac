import fs from 'fs';
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
console.log(lines.slice(-20).join('\n'));
