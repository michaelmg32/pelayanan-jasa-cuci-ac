const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'components', 'KaryawanDashboard.tsx');
let content = fs.readFileSync(filePath, 'utf8');

const target = `                        <div className="border-l border-emerald-400/30 pl-4">
                          <span className="text-emerald-100/80 text-[10px] font-bold block mb-0.5">Saldo Poin Bonus</span>
                          <span className="text-xl font-black">{mySalary.points_balance || 0}</span>
                        </div>
                      </div>
                    </div>`;

const replacement = `                        <div className="border-l border-emerald-400/30 pl-4">
                          <span className="text-emerald-100/80 text-[10px] font-bold block mb-0.5">Saldo Poin Bonus</span>
                          <span className="text-xl font-black">{mySalary.points_balance || 0}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-emerald-500/50 flex gap-3">
                        <button 
                          onClick={() => handleClaim('daily_salary', Number(mySalary.salary_balance))}
                          disabled={!mySalary.salary_balance || Number(mySalary.salary_balance) <= 0}
                          className="flex-1 bg-white text-emerald-700 py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-emerald-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Klaim Gaji
                        </button>
                        <button 
                          onClick={() => handleClaim('points', Number(mySalary.points_balance))}
                          disabled={!mySalary.points_balance || Number(mySalary.points_balance) <= 0}
                          className="flex-1 bg-teal-800 text-white py-2 rounded-lg font-bold text-xs uppercase tracking-wider hover:bg-teal-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          Klaim Poin
                        </button>
                      </div>
                    </div>`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Successfully added claim buttons');
} else {
  console.log('Target not found');
}
