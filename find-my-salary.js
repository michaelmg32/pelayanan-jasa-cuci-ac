import fs from 'fs';
const content = fs.readFileSync('server.js', 'utf8');
const lines = content.split('\n');
const matchLines = lines.map((l, i) => [i+1, l]).filter(([i, l]) => l.includes('my-salary'));
console.log(matchLines);
