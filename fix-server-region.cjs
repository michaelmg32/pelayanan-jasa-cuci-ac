const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'server.js');
let content = fs.readFileSync(file, 'utf8');

// Fix the corrupted block
const corruptedRegex = /    res\.json\(settings\);\n  } catch \(error\) {\n    console\.error\('Error fetching settings:', error\);\n    res\.status\(500\)\.json\(\{ error: error\.message \}\);\n  } finally {\n    if \(connection\) connection\.release\(\);\n  }\n\}\);\n\n\/\/ PUT App Settings \(Update Settings\)\napp\.put\('\/api\/settings', verifyToken, async \(req, res\) => \{/;

if (content.match(corruptedRegex)) {
  content = content.replace(corruptedRegex, `app.put('/api/settings', verifyToken, async (req, res) => {`);
}

// Fix both strict checks
content = content.replace(/if \(region_id === null\) \{/g, 'if (!region_id) {');

fs.writeFileSync(file, content, 'utf8');
console.log("Fixed server.js corruption and region_id logic.");
