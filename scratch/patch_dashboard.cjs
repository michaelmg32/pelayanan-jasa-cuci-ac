const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'KaryawanDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// 1. Saldo Poin Bonus
content = content.replace(
  `{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(mySalary.points_balance || 0)}`,
  `{mySalary.points_balance || 0}`
);

// 2. Bonus / Poin per AC
content = content.replace(
  `{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(mySalary.point_reward)}`,
  `{mySalary.point_reward}`
);

// 3. Total Estimasi Bonus (projected_points)
content = content.replace(
  `{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(mySalary.projected_points)}`,
  `{mySalary.projected_points}`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed formatting in KaryawanDashboard.tsx');
