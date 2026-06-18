const fs = require('fs');
const acorn = require('acorn');
const file = 'src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

// clean up repeated quotes
content = content.replace(/(',)+/g, "',");

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    // If line has ', fix it to  ', to avoid escape issues
    lines[i] = lines[i].replace(/',$/, " ',");
}
content = lines.join('\n');

for (let i = 0; i < 500; i++) {
    try {
        acorn.parse(content, { ecmaVersion: 2022, sourceType: 'module' });
        console.log('Success!');
        fs.writeFileSync(file, content, 'utf8');
        process.exit(0);
    } catch (e) {
        if (e.loc) {
            let lines = content.split('\n');
            let lineIdx = e.loc.line - 1;
            let line = lines[lineIdx];
            
            // Fix unterminated string by appending " '," (space then quote)
            lines[lineIdx] = line.replace(/\r?$/, " ',");
            
            content = lines.join('\n');
            console.log(`Fixed line ${e.loc.line}`);
        } else {
            console.log(e);
            break;
        }
    }
}
fs.writeFileSync(file, content, 'utf8');
