const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'KaryawanDashboard.tsx');
let text = fs.readFileSync(file, 'utf8');

// 1. Add Award to lucide-react imports
if (!text.includes('Award,')) {
    text = text.replace('Star,', 'Star,\n  Award,');
}

// 2. Replace the grid
const targetGrid = `                      <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="text-center border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">AC Selesai</span>
                          <span className="font-bold text-sm text-slate-800">{member.total_ac_serviced} Unit</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Est. Bonus Member</span>
                          <span className="font-bold text-sm text-blue-600">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(member.projected_points)}</span>
                        </div>
                      </div>`;

const newGrid = `                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                        <div className="text-center border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Bintang</span>
                          <span className="font-bold text-sm text-amber-500 flex items-center justify-center gap-1">
                            <Star size={12} fill="currentColor" /> {member.avg_rating || '0.0'}
                          </span>
                        </div>
                        <div className="text-center border-r border-slate-200">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">AC Selesai</span>
                          <span className="font-bold text-sm text-slate-800">{member.total_ac_serviced} Unit</span>
                        </div>
                        <div className="text-center">
                          <span className="text-[9px] text-slate-400 font-bold uppercase block mb-1">Poin</span>
                          <span className="font-bold text-sm text-blue-600 flex items-center justify-center gap-1">
                            <Award size={12} /> {member.points_balance || 0}
                          </span>
                        </div>
                      </div>`;

if (text.includes(targetGrid)) {
    text = text.replace(targetGrid, newGrid);
    fs.writeFileSync(file, text);
    console.log('Successfully updated KaryawanDashboard');
} else {
    console.log('Could not find the target grid');
}
