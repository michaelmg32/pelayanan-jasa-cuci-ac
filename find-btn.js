import fs from 'fs';

const content = fs.readFileSync('components/KeuanganDashboard.tsx', 'utf8');

const kelolaIndex = content.indexOf("Kelola Gaji Karyawan");
if (kelolaIndex !== -1) {
  // Let's get the whole button
  console.log(content.substring(kelolaIndex - 300, kelolaIndex + 100));
}
