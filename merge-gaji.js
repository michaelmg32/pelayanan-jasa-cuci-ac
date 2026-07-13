import fs from 'fs';
import path from 'path';

// 1. Delete app/dashboard/admin/gaji folder recursively
const gajiPageDir = path.join('app', 'dashboard', 'admin', 'gaji');
if (fs.existsSync(gajiPageDir)) {
  fs.rmSync(gajiPageDir, { recursive: true, force: true });
  console.log('Deleted ' + gajiPageDir);
}

// 2. Patch KeuanganDashboard.tsx
let kd = fs.readFileSync('components/KeuanganDashboard.tsx', 'utf8');

if (!kd.includes('import GajiDashboard')) {
  // insert import at the top
  const importTarget = "import { useApp } from '@/lib/auth-context';";
  kd = kd.replace(importTarget, importTarget + "\nimport GajiDashboard from './GajiDashboard';");
}

// Find the PAYROLL block
const payrollTarget = `{performanceSubTab === 'PAYROLL' && (`;
const payrollBlock = `{performanceSubTab === 'PAYROLL' && (
                    <div className="mt-4">
                      <GajiDashboard />
                    </div>
                  )}`;

// To safely replace, let's just use string replacement
// Actually, since I don't know exactly what was inside PAYROLL before, I'll find the opening and closing.
const payrollIndex = kd.indexOf(payrollTarget);
if (payrollIndex !== -1) {
  // It exists. But in my find-payroll.js I couldn't see the contents inside it because it was cut off.
  // Let me replace it cleanly.
  // Instead of replacing the block (which is hard without AST), I will just replace `performanceSubTab === 'PAYROLL' && (`
  // Wait, I can't just replace the first line if it spans multiple lines.
}

// Let's create a script that just outputs the PAYROLL block so I know what to replace.
console.log('Done script prep');
