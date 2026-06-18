const fs = require('fs');
const acorn = require('acorn');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

// Try to parse, if it fails, fix the line and retry
let fixed = false;
for (let i = 0; i < 100; i++) {
    try {
        acorn.parse(content, { ecmaVersion: 2022, sourceType: 'module' });
        console.log('Successfully parsed!');
        if (fixed) fs.writeFileSync(file, content, 'utf8');
        break;
    } catch (e) {
        if (e.loc) {
            console.log(`Error at line ${e.loc.line}: ${e.message}`);
            let lines = content.split('\n');
            let lineIdx = e.loc.line - 1;
            let line = lines[lineIdx];
            
            // Common mojibake error: missing closing quote
            if ((line.match(/'/g) || []).length % 2 !== 0) {
                // Find where to add quote
                // Usually before the comma, or at the end
                if (line.includes(',')) {
                    let lastComma = line.lastIndexOf(',');
                    lines[lineIdx] = line.substring(0, lastComma) + "'" + line.substring(lastComma);
                } else {
                    lines[lineIdx] = line + "'";
                }
                content = lines.join('\n');
                fixed = true;
                console.log(`Fixed line ${e.loc.line}: ${lines[lineIdx]}`);
            } else {
                console.log(`Cannot auto-fix line ${e.loc.line}: ${line}`);
                break;
            }
        } else {
            console.log('Unknown error:', e);
            break;
        }
    }
}
