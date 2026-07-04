const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'components', 'OwnerDashboard.tsx');
let content = fs.readFileSync(file, 'utf8');

// We need to restore the lost buttons. Let's find where they should be inserted.
// The deletion happened between 'users' tab setting and the logout button.
// Let's replace the corrupted block.
const corruptedRegex = /className=\{`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 \$\{activeTab === 'users' \? 'text-indigo-600 bg-indigo-50\/20 font-black' : ''\}`\}\s*>\s*\}\s*className="w-full px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer text-rose-600"/;

const correctCode = `className={\`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 \${activeTab === 'users' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}\`}
              >
                <UserCog size={14} className={activeTab === 'users' ? 'text-indigo-600' : 'text-slate-400'} />
                <span>Akses Pengguna</span>
              </button>
                
              {!activeUser?.region_id && (
                <button
                  onClick={() => {
                    setActiveTab('activity-logs');
                    setShowMoreMenu(false);
                  }}
                  className={\`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 \${activeTab === 'activity-logs' ? 'text-indigo-600 bg-indigo-50/20 font-black' : ''}\`}
                >
                  <ShieldCheck size={14} className={activeTab === 'activity-logs' ? 'text-indigo-600' : 'text-slate-400'} />
                  <span>Log Aktivitas Admin</span>
                </button>
              )}
              
              <hr className="my-1 border-slate-100" />
              <button
                onClick={() => {
                  setShowMoreMenu(false);
                  logout();
                }}
                className="w-full px-4 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2 transition cursor-pointer text-rose-600"`;

if (content.match(corruptedRegex)) {
  content = content.replace(corruptedRegex, correctCode);
  fs.writeFileSync(file, content, 'utf8');
  console.log('Restored buttons successfully');
} else {
  console.log('Regex did not match, trying alternative pattern');
  // Fallback
  const fallbackRegex = /className=\{`w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2 transition cursor-pointer text-slate-700 \$\{activeTab === 'users' \? 'text-indigo-600 bg-indigo-50\/20 font-black' : ''\}`\}[\s\S]*?logout\(\);\s*\}\}\s*className="w-full px-4 py-2 text-rose-600/;
  
  if (content.match(fallbackRegex)) {
    content = content.replace(fallbackRegex, correctCode.replace(/logout\(\);\s*\}\}\s*className="w-full px-4 py-2 text-rose-600/, 'logout();\n                }}\n                className="w-full px-4 py-2 text-rose-600'));
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restored buttons successfully using fallback');
  } else {
    console.log('Failed to restore, no match');
  }
}
