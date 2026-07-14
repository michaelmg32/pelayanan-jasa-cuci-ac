const fs = require('fs');

let content = fs.readFileSync('components/OwnerDashboard.tsx', 'utf-8');

// 1. Add state variables
const stateTarget = 'const [showCashFlowModal, setShowCashFlowModal] = useState(false);';
const stateReplacement = `const [showCashFlowModal, setShowCashFlowModal] = useState(false);\n  const [showMovingAssetModal, setShowMovingAssetModal] = useState(false);\n  const [showFixedAssetModal, setShowFixedAssetModal] = useState(false);\n  const [showPayrollModal, setShowPayrollModal] = useState(false);`;
content = content.replace(stateTarget, stateReplacement);

// 2. Add onClick to cards
// Card 1: Total Nilai Aset Bergerak (Inventaris)
content = content.replace('<div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">', '<div onClick={() => setShowMovingAssetModal(true)} className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-6 rounded-3xl border border-indigo-400/30 shadow-lg shadow-indigo-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">');

// Card 2: Total Pembelian Aset Tetap
content = content.replace('<div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400/30 shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">', '<div onClick={() => setShowFixedAssetModal(true)} className="bg-gradient-to-br from-emerald-500 to-teal-600 p-6 rounded-3xl border border-emerald-400/30 shadow-lg shadow-emerald-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">');

// Card 3: Pengeluaran Gaji Karyawan
content = content.replace('<div className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl border border-cyan-400/30 shadow-lg shadow-cyan-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">', '<div onClick={() => setShowPayrollModal(true)} className="bg-gradient-to-br from-cyan-500 to-blue-600 p-6 rounded-3xl border border-cyan-400/30 shadow-lg shadow-cyan-200/50 relative overflow-hidden group hover:-translate-y-1 hover:shadow-xl transition-all duration-300 cursor-pointer">');


// 3. Add Modal JSX
const modalsJSX = `      {/* Modal Aset Bergerak */}
      {showMovingAssetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Aset Bergerak</h3>
              <button onClick={() => setShowMovingAssetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Nama Barang</th>
                      <th className="py-2.5 px-2 text-center">Stok</th>
                      <th className="py-2.5 px-2">HPP (Modal)</th>
                      <th className="py-2.5 px-3 text-right">Total Nilai</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {addons.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 font-medium">Belum ada aset terdaftar.</td>
                      </tr>
                    ) : addons.map(a => (
                      <tr key={a.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 font-bold text-slate-800">{a.name}</td>
                        <td className="py-2.5 px-2 text-center">
                           <span className={\`px-2 py-0.5 rounded-md font-mono text-[10px] font-black \${(a.stock || 0) < 20 ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-600'}\`}>
                             {a.stock || 0}
                           </span>
                        </td>
                        <td className="py-2.5 px-2 font-mono text-slate-500">Rp {Number(a.hpp || 0).toLocaleString('id-ID')}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-indigo-600 font-black">Rp {((a.stock || 0) * (a.hpp || 0)).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aset Tetap */}
      {showFixedAssetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Aset Tetap</h3>
              <button onClick={() => setShowFixedAssetModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nama Aset</th>
                      <th className="py-2.5 px-3 text-right">Harga Beli</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {fixedAssets.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-4 text-center text-slate-400 font-medium">Belum ada aset tetap.</td>
                      </tr>
                    ) : fixedAssets.map(fa => (
                      <tr key={fa.id} className="hover:bg-slate-50/50 transition">
                        <td className="py-2.5 px-3 text-slate-500 font-mono">{fa.purchase_date ? new Date(fa.purchase_date).toLocaleDateString('id-ID') : '-'}</td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">{fa.name}</td>
                        <td className="py-2.5 px-3 text-right font-mono text-emerald-600 font-black">Rp {Number(fa.purchase_price || 0).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Gaji Karyawan */}
      {showPayrollModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in duration-300 relative">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 sticky top-0 z-10">
              <h3 className="font-black text-sm uppercase tracking-wider text-slate-800">Rincian Pengeluaran Gaji</h3>
              <button onClick={() => setShowPayrollModal(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-200 text-slate-600 hover:bg-rose-100 hover:text-rose-600 transition-colors">
                 <X size={18} strokeWidth={3} />
              </button>
            </div>
            <div className="p-4 overflow-y-auto">
              <div className="overflow-x-auto rounded-xl border border-slate-200">
                <table className="w-full text-left text-xs whitespace-nowrap">
                  <thead className="bg-slate-100/50 text-slate-500 uppercase tracking-widest text-[9px] font-black border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">Nama Karyawan</th>
                      <th className="py-2.5 px-2">Jenis Klaim</th>
                      <th className="py-2.5 px-3 text-right">Nominal (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {approvedClaims.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-4 text-center text-slate-400 font-medium">Belum ada pengeluaran gaji.</td>
                      </tr>
                    ) : approvedClaims.map(c => {
                        const isPoints = c.type === 'points';
                        const amount = isPoints ? (Number(c.amount || c.points_claimed || 0) * 1000) : Number(c.amount || 0);
                        return (
                          <tr key={c.id} className="hover:bg-slate-50/50 transition">
                            <td className="py-2.5 px-3 text-slate-500 font-mono">{new Date(c.created_at).toLocaleDateString('id-ID')}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-800">{c.employee_name || 'Tanpa Nama'}</td>
                            <td className="py-2.5 px-2">
                               <span className={\`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider \${isPoints ? 'bg-cyan-50 text-cyan-600 border border-cyan-200' : 'bg-indigo-50 text-indigo-600 border border-indigo-200'}\`}>
                                 {isPoints ? 'Poin' : 'Gaji'}
                               </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700 font-black">Rp {amount.toLocaleString('id-ID')}</td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}\n\n`;

const targetInsert = '{showCashFlowModal && (';
content = content.replace(targetInsert, modalsJSX + targetInsert);

fs.writeFileSync('components/OwnerDashboard.tsx', content);
console.log("Added 3 new modals.");
