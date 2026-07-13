const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'server.js');

let lines = fs.readFileSync(file, 'utf8').split('\n');
const startIdx = lines.findIndex(l => l.includes('// Auto-migration: Create staff_salary_configs table'));
const endIdx = lines.findIndex((l, i) => i > startIdx && l.includes('\'salary_records\' table"'));

if (startIdx !== -1 && endIdx !== -1) {
    lines.splice(startIdx, endIdx - startIdx + 1);
    fs.writeFileSync(file, lines.join('\n'));
    console.log(`Deleted lines from index ${startIdx} to ${endIdx}`);
} else {
    console.log('Could not find the block to delete', startIdx, endIdx);
}
