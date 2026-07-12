const fs = require('fs');
let code = fs.readFileSync('server.js', 'utf8');

// The lines we saw:
// 3372:    if (roleLower !== 'admin' && roleLower !== 'owner') { (POST /api/staff-grades)
// 3411:    if (roleLower !== 'admin' && roleLower !== 'owner') { (PUT /api/staff-grades/:id)
// 3460:    if (roleLower !== 'admin' && roleLower !== 'owner') { (DELETE /api/staff-grades/:id)
// 3489:    if (roleLower !== 'admin' && roleLower !== 'owner') { (POST /api/users/:id/assign-grade)
// 3511:    if (roleLower !== 'admin' && roleLower !== 'owner') { (POST /api/salary/generate)
// 3666:    if (roleLower !== 'admin' && roleLower !== 'owner') { (PUT /api/salary/records/:id)

// We want to replace these specific ones with 'keuangan' instead of 'admin'.
// Since they are exactly the string "if (roleLower !== 'admin' && roleLower !== 'owner') {",
// we can replace them in the context of the salary and staff grades section.

// The section starts around line 3300.
const targetPattern = /if \(roleLower !== 'admin' && roleLower !== 'owner'\) \{/g;
let replacedCount = 0;

code = code.replace(targetPattern, (match, offset) => {
    // Only replace in the bottom part of the file (after line ~3300)
    // which roughly corresponds to character offset > 100000.
    // Let's just check if it's past character offset 120000.
    if (offset > 120000) {
        replacedCount++;
        return "if (roleLower !== 'keuangan' && roleLower !== 'owner') {";
    }
    return match;
});

console.log('Replaced ' + replacedCount + ' occurrences.');
fs.writeFileSync('server.js', code);
