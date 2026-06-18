const fs = require('fs');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');

// We know seedManualChapters starts at line 68
// Let's just find the exact block and replace it
function clearBlock(startLineStr, defaultObjStr) {
    let startIdx = lines.findIndex(l => l.includes(startLineStr));
    if (startIdx === -1) return;
    
    let endIdx = -1;
    let braces = 0;
    let inBlock = false;
    for (let i = startIdx; i < lines.length; i++) {
        if (!inBlock) {
            braces += (lines[i].match(/\[|\{/g) || []).length;
            braces -= (lines[i].match(/\]|\}/g) || []).length;
            if (braces > 0) inBlock = true;
        } else {
            braces += (lines[i].match(/\[|\{/g) || []).length;
            braces -= (lines[i].match(/\]|\}/g) || []).length;
            if (braces === 0) {
                endIdx = i;
                break;
            }
        }
    }
    
    if (endIdx !== -1) {
        for (let i = startIdx + 1; i <= endIdx; i++) {
            lines[i] = '// removed';
        }
        lines[startIdx] = startLineStr + defaultObjStr;
    }
}

// Clear seedManualChapters
clearBlock('const seedManualChapters = ', '[] ;');
// Clear seedJASDocs
clearBlock('const seedJASDocs = ', '[] ;');
// Clear initialSettings
clearBlock('const initialSettings = ', '{} ;');

fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
