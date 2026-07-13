const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, '..', 'components', 'KaryawanDashboard.tsx');
let text = fs.readFileSync(file, 'utf8');

const target = `        const resTeam = await fetch('/api/staff/team', { headers: api.getAuthHeaders() });
        if (resTeam.ok) setMyTeam((await resTeam.json()).team);`;

const replacement = `        const resTeam = await fetch('/api/staff/team', { headers: api.getAuthHeaders() });
        if (resTeam.ok) {
          const teamData = await resTeam.json();
          setMyTeam(Array.isArray(teamData) ? teamData : (teamData.team || []));
        }`;

if (text.includes(target)) {
    text = text.replace(target, replacement);
    fs.writeFileSync(file, text);
    console.log('Successfully fixed setMyTeam logic');
} else {
    console.log('Could not find the target string');
}
