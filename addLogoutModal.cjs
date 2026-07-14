const fs = require('fs');
let content = fs.readFileSync('components/OwnerDashboard.tsx', 'utf-8');

// 1. Add state variable
if (!content.includes('showLogoutConfirm')) {
    content = content.replace('const [showPayrollModal, setShowPayrollModal] = useState(false);', 'const [showPayrollModal, setShowPayrollModal] = useState(false);\n  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);');
}

// 2. Modify logout button
const oldLogoutButton = `<div onClick={() => {
              if (window.confirm('Apakah Anda yakin ingin keluar?')) {
                logout();
              }
            }} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">`;
const newLogoutButton = `<div onClick={() => setShowLogoutConfirm(true)} className="flex flex-col items-center gap-2.5 cursor-pointer hover:scale-105 active:scale-95 transition-all">`;
content = content.replace(oldLogoutButton, newLogoutButton);

// 3. Add Modal JSX
const modalJSX = `
      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-5 animate-in zoom-in-95 duration-200">
            <div className="mx-auto w-16 h-16 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mb-2">
              <LogOut size={32} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-800">Keluar dari Akun?</h3>
              <p className="text-xs font-medium text-slate-500 mt-2">Anda harus login kembali untuk mengakses data.</p>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button onClick={() => setShowLogoutConfirm(false)} className="py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition">Batal</button>
              <button onClick={() => { setShowLogoutConfirm(false); logout(); }} className="py-3 rounded-xl font-bold text-white bg-rose-500 hover:bg-rose-600 shadow-md shadow-rose-500/30 transition">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
`;

if (!content.includes('Keluar dari Akun?')) {
    const endMarker = '    </div>\n  );\n}';
    content = content.replace(endMarker, modalJSX + endMarker);
}

fs.writeFileSync('components/OwnerDashboard.tsx', content);
console.log('Update logout modal in OwnerDashboard complete.');
