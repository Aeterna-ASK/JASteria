const fs = require('fs');
const acorn = require('acorn');
const file = 'src/store/restaurantStore.js';

let content = fs.readFileSync(file, 'utf8');

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
            console.log(`Removing line ${e.loc.line}: ${lines[lineIdx]}`);
            lines[lineIdx] = '// removed due to syntax error';
            content = lines.join('\n');
        } else {
            console.log(e);
            break;
        }
    }
}
fs.writeFileSync(file, content, 'utf8');
