const fs = require('fs');
const file = 'components/PelangganDashboard.tsx';
let content = fs.readFileSync(file, 'utf-8');

// 1. Add state variable
if (!content.includes('isCategoriesExpanded')) {
  content = content.replace(
    "const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');",
    "const [isCategoriesExpanded, setIsCategoriesExpanded] = useState(false);\n  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'profile'>('dashboard');"
  );
}

// 2. Add derived categories right before the JSX return
const returnStr = "  return (\n    <div className=\"flex-1 flex flex-col bg-slate-50 text-slate-800";
const newReturnStr = `  const hasMoreCategories = categories.length > 8;
  const displayCategories = hasMoreCategories && !isCategoriesExpanded ? categories.slice(0, 7) : categories;

  return (
    <div className="flex-1 flex flex-col bg-slate-50 text-slate-800`;
content = content.replace(returnStr, newReturnStr);


// 3. Replace grid
const gridStart = `<div className="grid grid-cols-4 gap-y-6 gap-x-2">`;
const newGridStart = `<div className="grid grid-cols-4 md:grid-cols-8 gap-y-6 gap-x-2">`;
content = content.replace(gridStart, newGridStart);

const mapStart = `{categories.map((cat: any, idx: number) => {`;
const newMapStart = `{displayCategories.map((cat: any, idx: number) => {`;
content = content.replace(mapStart, newMapStart);

// 4. Replace Lainnya button with expand/collapse logic
const oldLainnya = `{/* Extra button for New Order (Lainnya) */}
                    <div
                      onClick={() => setShowNewOrderModal(true)}
                      className="flex flex-col items-center justify-start cursor-pointer group"
                    >
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-slate-200 transition-colors">
                        <Plus size={26} className="text-slate-600" />
                      </div>
                      <span className="text-[10px] font-bold text-center text-slate-700">Lainnya</span>
                    </div>`;

const newButtons = `{hasMoreCategories && !isCategoriesExpanded && (
                      <div
                        onClick={() => setIsCategoriesExpanded(true)}
                        className="flex flex-col items-center justify-start cursor-pointer group"
                      >
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-slate-200 transition-colors">
                          <MoreHorizontal size={26} className="text-slate-600" />
                        </div>
                        <span className="text-[10px] font-bold text-center text-slate-700">Lainnya</span>
                      </div>
                    )}
                    {hasMoreCategories && isCategoriesExpanded && (
                      <div
                        onClick={() => setIsCategoriesExpanded(false)}
                        className="flex flex-col items-center justify-start cursor-pointer group"
                      >
                        <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-2 group-hover:bg-slate-200 transition-colors">
                          <ChevronUp size={26} className="text-slate-600" />
                        </div>
                        <span className="text-[10px] font-bold text-center text-slate-700">Tutup</span>
                      </div>
                    )}`;

content = content.replace(oldLainnya, newButtons);

// Make sure MoreHorizontal and ChevronUp are imported
if (!content.includes('MoreHorizontal')) {
    content = content.replace("Plus,", "Plus, MoreHorizontal, ChevronUp,");
}

fs.writeFileSync(file, content);
console.log('Update complete.');
