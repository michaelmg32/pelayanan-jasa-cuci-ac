import fs from 'fs';

const content = fs.readFileSync('components/AdminDashboard.tsx', 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('activeTab') || line.includes('setActiveTab')) {
    console.log(`${index+1}: ${line.trim()}`);
  }
});
