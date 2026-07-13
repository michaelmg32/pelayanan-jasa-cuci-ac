const fs = require('fs');
const path = require('path');
const serverFile = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

const target1 = `    if (status !== undefined) { updateFields.push('status = ?'); updateValues.push(status); }`;
const replacement1 = `    if (status !== undefined) {
      updateFields.push('status = ?');
      updateValues.push(status);
      if (status === 'SELESAI') {
        updateFields.push('completedAt = NOW()');
      }
    }`;

if (content.includes(target1)) {
  content = content.replace(target1, replacement1);
  console.log('✅ Replaced target 1 (completedAt)');
  fs.writeFileSync(serverFile, content, 'utf8');
} else {
  console.log('❌ Target 1 not found');
}
