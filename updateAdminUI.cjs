const fs = require('fs');

const file = 'components/AdminDashboard.tsx';
let content = fs.readFileSync(file, 'utf8');

// 1. Update Header Container
content = content.replace(
  '      <div className="bg-slate-900 text-white px-5 py-4 shrink-0 shadow-md flex justify-between items-center z-30 relative">',
  '      <div className="bg-slate-900 text-white px-5 pt-4 pb-12 shrink-0 shadow-md rounded-b-[32px] flex justify-between items-start z-30 relative overflow-hidden">'
);

// 2. Add Region Badge (using appSettings if needed or just hardcoded like OwnerDashboard if any)
// Let's just add the region badge if it doesn't exist, using activeUser?.region_id to display the region
const headerTitleRegex = /          <div className="text-left">\n            <h1 className="text-sm font-black leading-none">\{appSettings\?\.\['GLOBAL'\]\?\.business_name \|\| 'CoolAir Pro'\}<\/h1>\n            <p className="text-\[9px\] text-blue-200 mt-1">Sistem Layanan AC Profesional \| Admin<\/p>\n          <\/div>/;

const newHeaderTitle = `          <div className="text-left flex items-center gap-2.5">
            <div>
              <h1 className="text-sm font-black leading-none">{appSettings?.['GLOBAL']?.business_name || 'CoolAir Pro'}</h1>
              <p className="text-[9px] text-blue-200 mt-1">Sistem Layanan AC Profesional | Admin</p>
            </div>
            {activeUser?.region_id && (
              <span className="bg-gradient-to-r from-indigo-500 to-indigo-700 text-white text-[8px] font-black px-2.5 py-1 rounded-full border border-indigo-400/20 uppercase tracking-widest ml-1 shadow-sm">
                Region: {categories.find(c => c.region_id === activeUser.region_id)?.region_id || activeUser.region_id}
              </span>
            )}
          </div>`;
          
content = content.replace(headerTitleRegex, newHeaderTitle);


// 3. Update Grid Container & Items
const gridRegex = /      \{\/\* ===================== CONTROL TABS SYSTEM \(GRID ICON\) ===================== \*\/\}[\s\S]*?      \{\/\* ===================== TAB BODY \(SCROLLABLE Area\) ===================== \*\/\}/;

const newGrid = `      {/* ===================== CONTROL TABS SYSTEM (NEW GRID ICON) ===================== */}
      <div className="px-5 -mt-8 relative z-40 shrink-0 mb-2">
        <div className="bg-white rounded-3xl shadow-lg shadow-slate-200/40 border border-slate-100/60 p-4 md:p-5">
          <div className="grid grid-cols-3 md:grid-cols-6 gap-y-5 gap-x-2">
            
            <div onClick={() => setActiveTab('JOBS_TRACKER')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'JOBS_TRACKER' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                <ClipboardList size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'JOBS_TRACKER' ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-700'}\`}>Pantauan Jasa</span>
            </div>

            <div onClick={() => { setActiveTab('MASTER_DATA'); if (categories.length > 0) setNewServiceCategory(categories[0].id); }} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'MASTER_DATA' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                <Wrench size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'MASTER_DATA' ? 'text-emerald-700' : 'text-slate-500 group-hover:text-slate-700'}\`}>Master Data</span>
            </div>

            <div onClick={() => setActiveTab('USER_MANAGEMENT')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'USER_MANAGEMENT' ? 'bg-orange-100 text-orange-600 border border-orange-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                <UserCog size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'USER_MANAGEMENT' ? 'text-orange-700' : 'text-slate-500 group-hover:text-slate-700'}\`}>Edit Pengguna</span>
            </div>

            <div onClick={() => setActiveTab('VOUCHERS')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'VOUCHERS' ? 'bg-violet-100 text-violet-600 border border-violet-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                <Tag size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'VOUCHERS' ? 'text-violet-700' : 'text-slate-500 group-hover:text-slate-700'}\`}>Kelola Voucher</span>
            </div>

            <div onClick={() => setActiveTab('PROFIL')} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className={\`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors \${activeTab === 'PROFIL' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-500 border border-slate-100 hover:bg-slate-100'}\`}>
                <UserIcon size={24} strokeWidth={2.5} />
              </div>
              <span className={\`text-[9px] font-extrabold text-center uppercase tracking-wider \${activeTab === 'PROFIL' ? 'text-indigo-700' : 'text-slate-500 group-hover:text-slate-700'}\`}>Profil</span>
            </div>

            <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all group">
              <div className="w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100 transition-colors">
                <LogOut size={24} strokeWidth={2.5} />
              </div>
              <span className="text-[9px] font-extrabold text-center uppercase tracking-wider text-rose-600 group-hover:text-rose-700">Keluar</span>
            </div>

          </div>
        </div>
      </div>

      {/* ===================== TAB BODY (SCROLLABLE Area) ===================== */}`;
      
content = content.replace(gridRegex, newGrid);

fs.writeFileSync(file, content);
console.log('Update complete.');
