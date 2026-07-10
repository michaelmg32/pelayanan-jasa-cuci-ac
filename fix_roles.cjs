const fs = require('fs');
let content = fs.readFileSync('server.js', 'utf8');

// The replacement logic
content = content.replace(/req\.user\.role === 'admin'/g, "req.user.role?.toUpperCase() === 'ADMIN'");
content = content.replace(/req\.user\.role === 'karyawan'/g, "req.user.role?.toUpperCase() === 'KARYAWAN'");
content = content.replace(/req\.user\.role === 'owner'/g, "req.user.role?.toUpperCase() === 'OWNER'");

fs.writeFileSync('server.js', content);
console.log('Fixed role comparisons in server.js');
