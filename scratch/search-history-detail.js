import fs from 'fs';

const content = fs.readFileSync('components/PelangganDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('selectedHistoryOrder') && (line.includes('flex') || line.includes('span') || line.includes('Total Pembayaran'))) {
    console.log(`${index+1}: ${line.trim()}`);
  }
});
