const fs = require('fs');

let content = fs.readFileSync('components/OwnerDashboard.tsx', 'utf-8');

// 1. Replace the control tabs system with the one from KeuanganDashboard
const startTabsMarker = '{/* ===================== CONTROL TABS SYSTEM ===================== */}';
const endTabsMarker = '{/* ===================== TAB: USER MANAGEMENT ===================== */}';
const startTabsIdx = content.indexOf(startTabsMarker);
let endTabsIdx = content.indexOf(endTabsMarker);

// Find the parent div closure for tabs
if (startTabsIdx !== -1 && endTabsIdx !== -1) {
    const newTabs = `{/* ===================== CONTROL TABS SYSTEM ===================== */}
        <div className="px-5 -mt-8 relative z-40 shrink-0 mb-4 overflow-x-auto no-scrollbar pb-2">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl shadow-xl shadow-slate-200/50 border border-white p-3 min-w-max flex items-center justify-center gap-1.5 md:gap-3">
            
            <div onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                 <TrendingUp size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'dashboard' ? 'text-blue-700' : 'text-slate-500'}\`}>Ringkasan</span>
            </div>

            <div onClick={() => setActiveTab('settings')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'settings' ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                 <Settings size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'settings' ? 'text-amber-700' : 'text-slate-500'}\`}>Bisnis</span>
            </div>

            <div onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'profile' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                 <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'profile' ? 'text-emerald-700' : 'text-slate-500'}\`}>Profil</span>
            </div>

            <div onClick={() => setActiveTab('users')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'users' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                 <UserCog size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'users' ? 'text-indigo-700' : 'text-slate-500'}\`}>Akses</span>
            </div>

            {!activeUser?.region_id && (
              <div onClick={() => setActiveTab('activity-logs')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
                <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'activity-logs' ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                   <ShieldCheck size={24} strokeWidth={2.5} />
                </div>
                <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'activity-logs' ? 'text-purple-700' : 'text-slate-500'}\`}>Log</span>
              </div>
            )}

            <div onClick={() => {
               if (window.confirm('Apakah Anda yakin ingin keluar?')) {
                   logout();
               }
            }} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100">
                 <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-center uppercase tracking-wider text-rose-600">Keluar</span>
            </div>

          </div>
        </div>
        
        {/* ===================== MAIN CONTENT AREA ===================== */}
        <div className="flex-1 overflow-y-auto px-4 pb-20 pt-2 relative z-10 w-full max-w-full space-y-4">
          `;

    // Wait, the main content area in OwnerDashboard already has `<div className="flex-1 overflow-y-auto p-4 space-y-4">` or similar?
    // Let's replace up to `{activeTab === 'users' && (` ? No, there might be other tabs before it.
    // Let's just find the end of the CONTROL TABS SYSTEM block.
    let searchArea = content.substring(startTabsIdx, endTabsIdx);
    
    // In OwnerDashboard, after TABS there's usually:
    // {activeTab === 'users' && ...
    // Wait, OwnerDashboard.tsx has:
    // {activeTab === 'settings' && (
    // {activeTab === 'dashboard' && (
    // We should just replace the `CONTROL TABS SYSTEM` div.
    
    // I need to accurately find where the control tabs div ends.
    // The div starts with `<div className="px-5 -mt-8 relative z-40 shrink-0 mb-2">`
    // Let's use string replacement for the whole block.
    
    const blockEndStr = '          {/* ===================== TAB: USER MANAGEMENT ===================== */}';
    if (content.includes(blockEndStr)) {
        content = content.substring(0, startTabsIdx) + newTabs + '\n' + content.substring(content.indexOf(blockEndStr));
    }
}

// 2. Remove max-w limits from content tabs to make them full width
content = content.replace(/max-w-2xl mx-auto/g, 'w-full');
content = content.replace(/max-w-sm/g, 'w-full');
content = content.replace(/max-w-md/g, 'w-full');
content = content.replace(/max-w-lg/g, 'w-full');

fs.writeFileSync('components/OwnerDashboard.tsx', content);
console.log("Updated OwnerDashboard.tsx");
