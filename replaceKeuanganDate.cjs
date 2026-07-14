const fs = require('fs');
let content = fs.readFileSync('components/KeuanganDashboard.tsx', 'utf-8');

// 1. Update the state initialization for dates
const oldDateInit = `  const [performanceDate, setPerformanceDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [performanceEndDate, setPerformanceEndDate] = useState(() => new Date().toISOString().split('T')[0]);`;

const newDateInit = `  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return \`\${year}-\${month}-\${day}\`;
  };
  const getLastDayOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return \`\${year}-\${month}-\${day}\`;
  };
  const [filterStartDate, setFilterStartDate] = useState(getFirstDayOfMonth());
  const [filterEndDate, setFilterEndDate] = useState(getLastDayOfMonth());`;

content = content.replace(oldDateInit, newDateInit);

// 2. Replace usages of performanceDate with filterStartDate
content = content.replace(/performanceDate/g, 'filterStartDate');
content = content.replace(/setPerformanceDate/g, 'setFilterStartDate');
content = content.replace(/performanceEndDate/g, 'filterEndDate');
content = content.replace(/setPerformanceEndDate/g, 'setFilterEndDate');

// 3. Remove the old date filter block inside STAFF_PERFORMANCE
// The old block looks like:
// <div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0">
//   <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Rentang Tanggal:</label>
//   ...
//   <input type="date" value={filterEndDate} ... />
//   </div>
// </div>
// It is directly inside `<div className="flex border-b border-slate-200 mb-2 gap-2">` or somewhere there?
// Let's use a regex to strip it.
const regexDateFilter = /<div className="flex flex-col md:flex-row items-start md:items-center gap-3 shrink-0">[\s\S]*?<label className="text-\[10px\] font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">Rentang Tanggal:<\/label>[\s\S]*?<input[\s\S]*?value=\{filterStartDate\}[\s\S]*?\/>[\s\S]*?S\/D[\s\S]*?<input[\s\S]*?value=\{filterEndDate\}[\s\S]*?\/>[\s\S]*?<\/div>\s*<\/div>/g;

content = content.replace(regexDateFilter, '');

// 4. Inject global date filter at the top of the main content area
const mainContentMarker = '{/* ===================== MAIN CONTENT AREA ===================== */}\n      <div className="flex-1 overflow-y-auto px-4 pb-20 pt-2 relative z-10 w-full max-w-full">';

const globalDateFilter = `
        {/* Global Date Filter (Top Right) */}
        {activeTab !== 'PROFIL' && (
          <div className="flex justify-end mb-4">
            <div className="bg-white/80 backdrop-blur border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-2 shadow-sm">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider hidden sm:inline-block">Filter Tanggal:</span>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-700 font-bold">
                <input
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 font-mono"
                />
                <span className="text-slate-400">s/d</span>
                <input
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="bg-slate-50 border border-slate-200 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 font-mono"
                />
              </div>
            </div>
          </div>
        )}`;

if (content.includes(mainContentMarker)) {
    content = content.replace(mainContentMarker, mainContentMarker + globalDateFilter);
}

fs.writeFileSync('components/KeuanganDashboard.tsx', content);
console.log('Update Keuangan date filter complete.');
