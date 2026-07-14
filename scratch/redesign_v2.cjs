const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'KaryawanDashboard.tsx');
let text = fs.readFileSync(file, 'utf8');

// 1. Add showLogoutConfirm state
if (!text.includes('showLogoutConfirm')) {
    text = text.replace('const [apiError, setApiError] = useState<string | null>(null);', 'const [apiError, setApiError] = useState<string | null>(null);\\n  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);');
    console.log('Added showLogoutConfirm state');
}

// 2. Remove three-dots menu
const topBarStart = text.indexOf('<div className="relative">');
const topBarEnd = text.indexOf('</div>\\n        </div>\\n\\n        {/* MAIN CONTENT AREA */}');
if (topBarEnd === -1) {
    // try different newline
    const topBarEnd2 = text.indexOf('</div>\\r\\n        </div>\\r\\n\\r\\n        {/* MAIN CONTENT AREA */}');
    if (topBarEnd2 !== -1 && topBarStart !== -1) {
        text = text.substring(0, topBarStart) + text.substring(topBarEnd2);
        console.log('Removed three-dots menu');
    }
}

// Let's use regex to replace the old main content area header
const oldHeaderRegex = /\{\/\* MAIN CONTENT AREA \*\/\}[\\s\\S]*?\{\/\* ==================== TAB 1: DASHBOARD ==================== \*\/\}[\\s\\S]*?activeTab === 'dashboard' && \([\\s\\S]*?<h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Daftar Kunjungan Service<\/h3>/;

const newHeader = `{/* MAIN CONTENT AREA */}
        <div className="flex-1 overflow-y-auto pb-6 min-h-0 bg-slate-50">

        {/* UNIFIED HEADER & ICON GRID */}
        <div className="bg-slate-900 text-white rounded-b-[32px] pt-4 pb-12 px-5 shrink-0 relative shadow-lg">
          <span className="text-[8px] bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
             Departemen Teknisi Lapangan
          </span>
          <h2 className="text-xl font-extrabold text-white mt-2">Halo Sobat, {activeUser.name}!</h2>
          <p className="text-[10.5px] text-slate-300 mt-1">Status: <strong className="text-emerald-400">SIAP BEKERJA</strong></p>
        </div>

        {/* ICON NAVIGATION GRID */}
        <div className="px-5 -mt-8 relative z-10 shrink-0 mb-4">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4">
            <div className="grid grid-cols-4 gap-y-4 gap-x-2">
              
              <div onClick={() => setActiveTab('dashboard')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${activeTab === 'dashboard' ? 'bg-blue-100 text-blue-600 border border-blue-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}\`}>
                   <Home size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Penugasan</span>
              </div>
              
              <div onClick={() => setActiveTab('history')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${activeTab === 'history' ? 'bg-emerald-100 text-emerald-600 border border-emerald-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}\`}>
                   <Clock size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Histori</span>
              </div>
              
              <div onClick={() => setActiveTab('profile')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${activeTab === 'profile' ? 'bg-purple-100 text-purple-600 border border-purple-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}\`}>
                   <UserIcon size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Profil</span>
              </div>
              
              <div onClick={() => setActiveTab('gaji')} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${activeTab === 'gaji' ? 'bg-amber-100 text-amber-600 border border-amber-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}\`}>
                   <FileText size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Gaji & Poin</span>
              </div>

              {activeUser?.is_leader && (
                <div onClick={() => setActiveTab('team')} className="flex flex-col items-center gap-2 cursor-pointer">
                  <div className={\`w-12 h-12 rounded-[14px] flex items-center justify-center \${activeTab === 'team' ? 'bg-indigo-100 text-indigo-600 border border-indigo-200 shadow-sm' : 'bg-slate-50 text-slate-600 border border-slate-100'}\`}>
                     <Users size={22} strokeWidth={2.5} />
                  </div>
                  <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Kinerja Tim</span>
                </div>
              )}

              <div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2 cursor-pointer">
                <div className="w-12 h-12 rounded-[14px] flex items-center justify-center bg-rose-50 text-rose-500 border border-rose-100 hover:bg-rose-100">
                   <LogOut size={22} strokeWidth={2.5} />
                </div>
                <span className="text-[8px] font-extrabold text-slate-700 text-center uppercase tracking-wider">Keluar</span>
              </div>

            </div>
          </div>
        </div>

          {/* ==================== TAB 1: DASHBOARD ==================== */}
          {activeTab === 'dashboard' && (
            <div className="animate-in fade-in duration-300">
              <div className="px-5 mb-5 mt-2">
                <div className="grid grid-cols-2 gap-3 p-4 bg-blue-600 text-white rounded-2xl shadow-md border border-blue-500 relative overflow-hidden">
                  <div className="absolute top-0 right-0 opacity-10">
                     <Home size={80} className="-mt-4 -mr-4" />
                  </div>
                  <div className="text-left relative z-10">
                    <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider block">Tugas Aktif</span>
                    <span className="text-2xl font-black font-mono mt-0.5 block">{activeTasks.length}</span>
                  </div>
                  <div className="text-right relative z-10 border-l border-blue-400/50 pl-3">
                    <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider block">Selesai</span>
                    <span className="text-2xl font-black font-mono mt-0.5 block">{completedTasks.length}</span>
                  </div>
                </div>
              </div>

              <div className="px-5 space-y-4">
                <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider text-left pl-1">Daftar Kunjungan Service</h3>`;

if (oldHeaderRegex.test(text)) {
    text = text.replace(oldHeaderRegex, newHeader);
    console.log('Replaced main header');
} else {
    console.log('Failed to match main header regex');
}

// Remove History, Profile, Gaji black headers using regex
const historyRegex = /<div className="bg-slate-900 px-5 pt-5 pb-5 text-white text-left rounded-b-\[24px\]">[\\s\\S]*?Histori Pekerjaan Selesai<\/h2>[\\s\\S]*?<\/div>[\\s\\S]*?<div className="px-4 py-4 space-y-4">/;
if (historyRegex.test(text)) {
    text = text.replace(historyRegex, '<div className="px-5 py-2 space-y-4 animate-in fade-in duration-300">');
    console.log('Replaced History header');
} else {
    console.log('Failed History regex');
}

const profileRegex = /<div className="bg-slate-900 px-5 pt-5 pb-5 text-white text-left rounded-b-\[24px\]">[\\s\\S]*?Profil Karyawan<\/h2>[\\s\\S]*?<\/div>[\\s\\S]*?<div className="p-4 space-y-5">/;
if (profileRegex.test(text)) {
    text = text.replace(profileRegex, '<div className="p-5 space-y-5 animate-in fade-in duration-300">\\n                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pl-1 mb-2">Profil Karyawan</h3>');
    console.log('Replaced Profile header');
} else {
    console.log('Failed Profile regex');
}

const gajiRegex = /<div className="bg-slate-900 px-5 pt-5 pb-5 text-white text-left rounded-b-\[24px\]">[\\s\\S]*?Gaji & Poin Member<\/h2>[\\s\\S]*?<\/div>[\\s\\S]*?<div className="p-4 space-y-5">/;
if (gajiRegex.test(text)) {
    text = text.replace(gajiRegex, '<div className="p-5 space-y-5 animate-in fade-in duration-300">\\n                <h3 className="font-extrabold text-slate-800 text-sm uppercase tracking-wider pl-1 mb-2">Gaji & Poin Member</h3>');
    console.log('Replaced Gaji header');
} else {
    console.log('Failed Gaji regex');
}

const popup = `      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Keluar dari Akun?</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Anda harus login kembali untuk mengakses pekerjaan Anda.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}`;

if (!text.includes('Keluar dari Akun?')) {
    text = text.replace('    </>\\n  );\\n}', popup + '\\n    </>\\n  );\\n}');
    // Check if that worked (for CRLF vs LF)
    if (!text.includes('Keluar dari Akun?')) {
        text = text.replace('    </>\\r\\n  );\\r\\n}', popup + '\\r\\n    </>\\r\\n  );\\r\\n}');
    }
    console.log('Added logout popup');
}

fs.writeFileSync(file, text);
console.log('Update script completed');
