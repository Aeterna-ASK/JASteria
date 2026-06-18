const fs = require('fs');
const acorn = require('acorn');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

let fixed = false;
for (let i = 0; i < 300; i++) {
    try {
        acorn.parse(content, { ecmaVersion: 2022, sourceType: 'module' });
        console.log('Successfully parsed!');
        if (fixed) fs.writeFileSync(file, content, 'utf8');
        break;
    } catch (e) {
        if (e.loc) {
            let lines = content.split('\n');
            let lineIdx = e.loc.line - 1;
            let line = lines[lineIdx];
            
            if ((line.match(/'/g) || []).length % 2 !== 0) {
                // Find where to place the quote
                // Usually it's an unterminated string before a comma or end of line.
                // We'll just append it to the end of the string content, right before the first comma that comes after the string, or at end of line.
                let match = line.match(/^([^']*)'(.*)$/);
                if (match) {
                    // Try to place quote right before the FIRST comma after the unterminated string, or at the end
                    // Wait, multiple strings on one line? e.g. `{ id: 'ch1', title: 'abc }`
                    let idx = line.lastIndexOf('E,');
                    if (idx !== -1) {
                         lines[lineIdx] = line.substring(0, idx + 1) + "'" + line.substring(idx + 1);
                    } else if (line.indexOf(',     //') !== -1) {
                         lines[lineIdx] = line.replace(/,     \/\//, "',     //");
                    } else {
                         lines[lineIdx] = line + "'";
                    }
                }
                
                // Brute force: let's just append ' before the FIRST comma that is not inside quotes
                // Actually, just replacing 'E,' with "E',"
                if (line.includes('E,')) {
                    lines[lineIdx] = line.replace(/E,/g, "E',");
                } else if (line.includes('E ,')) {
                    lines[lineIdx] = line.replace(/E ,/g, "E',");
                } else {
                    // find last word char
                    let endStrIdx = line.search(/[,\]\)]|$/);
                    lines[lineIdx] = line.slice(0, endStrIdx) + "'" + line.slice(endStrIdx);
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
