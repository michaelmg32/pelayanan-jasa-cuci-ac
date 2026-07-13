import fs from 'fs';

const content = fs.readFileSync('components/KeuanganDashboard.tsx', 'utf8');

const kelolaIndex = content.indexOf("Kelola Gaji Karyawan");
if (kelolaIndex !== -1) {
  console.log(content.substring(kelolaIndex, kelolaIndex + 1500));
}
