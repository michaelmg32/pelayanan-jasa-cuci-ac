const fs = require('fs');
let content = fs.readFileSync('components/OwnerDashboard.tsx', 'utf-8');

// 1. Change the date initialization
const oldDateInit = `  const todayDateStr = getLocalDateString();
  const [filterStartDate, setFilterStartDate] = useState(todayDateStr);
  const [filterEndDate, setFilterEndDate] = useState(todayDateStr);`;

const newDateInit = `  const getFirstDayOfMonth = () => {
    const d = new Date();
    d.setDate(1);
    return getLocalDateString(d);
  };
  const getLastDayOfMonth = () => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return getLocalDateString(d);
  };
  const [filterStartDate, setFilterStartDate] = useState(getFirstDayOfMonth());
  const [filterEndDate, setFilterEndDate] = useState(getLastDayOfMonth());`;

content = content.replace(oldDateInit, newDateInit);


// 2. Remove date filters inside the Cash Flow Modal
const oldModalDateFilter = `            {/* Modal Body */}
            <div className="p-4 overflow-y-auto">
              {/* Date Filters inside Modal */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-4 border-b border-slate-105 pb-3">
                <span className="text-xs font-bold text-slate-500">Filter Periode</span>
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold w-full sm:w-auto">
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 text-[10px] font-semibold"
                  />
                  <span>s/d</span>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="bg-slate-50 border border-slate-200 text-slate-700 px-2 py-1 rounded-lg outline-none focus:border-indigo-500 text-[10px] font-semibold"
                  />
                </div>
              </div>

              <div className="space-y-3">`;

const newModalDateFilter = `            {/* Modal Body */}
            <div className="p-4 overflow-y-auto">
              <div className="space-y-3">`;

content = content.replace(oldModalDateFilter, newModalDateFilter);


// 3. Add global date filter above the 4 summary cards
const oldCardsStart = `    return (
      <>
        {/* 4 Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">`;

const newCardsStart = `    return (
      <>
        {/* Global Date Filter (Top Right) */}
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

        {/* 4 Cards Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-4">`;

content = content.replace(oldCardsStart, newCardsStart);

fs.writeFileSync('components/OwnerDashboard.tsx', content);
console.log('Update date filters complete.');
