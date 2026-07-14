const ts = require('typescript');
const fs = require('fs');
const code = fs.readFileSync('components/OwnerDashboard.tsx', 'utf8');
const sourceFile = ts.createSourceFile('OwnerDashboard.tsx', code, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
const parseDiagnostics = sourceFile.parseDiagnostics;
if (parseDiagnostics.length > 0) {
    parseDiagnostics.forEach(d => {
        const pos = sourceFile.getLineAndCharacterOfPosition(d.start);
        console.log(`Line ${pos.line + 1}, Col ${pos.character + 1}: ${d.messageText}`);
    });
} else {
    console.log('No parse errors found by typescript compiler API.');
}
