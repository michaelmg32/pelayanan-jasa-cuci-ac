const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let content = fs.readFileSync(serverFile, 'utf8');

// Find the line that checks for 'SELESAI' status transition
const target = `if (oldOrder && order.status === 'SELESAI' && oldOrder.status !== 'SELESAI') {`;
const replacement = `if (oldOrder && order.status === 'SELESAI' && oldOrder.status !== 'SELESAI' && !oldOrder.completedAt) {`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(serverFile, content, 'utf8');
  console.log('✅ Patched double-accumulation bug in server.js');
} else {
  console.log('❌ Target not found in server.js');
}
