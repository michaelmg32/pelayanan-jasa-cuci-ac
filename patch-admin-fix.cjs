const fs = require('fs');
const path = require('path');

const adminFile = path.join(__dirname, 'components', 'AdminDashboard.tsx');
let content = fs.readFileSync(adminFile, 'utf8');

// Insert filtered variables right after "if (!activeUser) return null;"
content = content.replace(
  /(\s+if \(!activeUser\) return null;\s+)(return \()/g,
  `$1  const filteredModels = models.filter((m: any) => !activeUser?.region_id || m.region_id === activeUser.region_id);
  const filteredCategories = categories.filter((c: any) => !activeUser?.region_id || c.region_id === activeUser.region_id);
  const filteredServices = services.filter((s: any) => !activeUser?.region_id || s.region_id === activeUser.region_id);
  const filteredAddons = addons.filter((a: any) => !activeUser?.region_id || a.region_id === activeUser.region_id);
$2`
);

fs.writeFileSync(adminFile, content, 'utf8');
console.log("AdminDashboard.tsx patched successfully with filteredModels.");
