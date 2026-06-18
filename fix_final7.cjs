const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('//') && lines[i].includes('const checkExpiryStatus =')) {
        lines[i] = lines[i].replace('const checkExpiryStatus =', '\nconst checkExpiryStatus =');
    }
    if (lines[i].includes('//') && lines[i].includes('const openEditModal =')) {
        lines[i] = lines[i].replace('const openEditModal =', '\nconst openEditModal =');
    }
    if (lines[i].includes('//') && lines[i].includes('const handleJasCertUpload =')) {
        lines[i] = lines[i].replace('const handleJasCertUpload =', '\nconst handleJasCertUpload =');
    }
    if (lines[i].includes('//') && lines[i].includes('const confirmJasCertDelete =')) {
        lines[i] = lines[i].replace('const confirmJasCertDelete =', '\nconst confirmJasCertDelete =');
    }
    if (lines[i].includes('//') && lines[i].includes('const handleSyncFromRiRyLink =')) {
        lines[i] = lines[i].replace('const handleSyncFromRiRyLink =', '\nconst handleSyncFromRiRyLink =');
    }
    if (lines[i].includes('//') && lines[i].includes('const selectQuickAccount =')) {
        lines[i] = lines[i].replace('const selectQuickAccount =', '\nconst selectQuickAccount =');
    }
    if (lines[i].includes('//') && lines[i].includes('const submitAuthAndSync =')) {
        lines[i] = lines[i].replace('const submitAuthAndSync =', '\nconst submitAuthAndSync =');
    }
}
fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
