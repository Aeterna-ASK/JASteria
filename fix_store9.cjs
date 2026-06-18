const fs = require('fs');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i] && lines[i].includes("こと、E")) {
        lines[i] = lines[i].replace(/こと、E$/, "こと、E',");
    }
    if (lines[i] && lines[i].includes("こと。E")) {
        lines[i] = lines[i].replace(/こと。E$/, "こと。E',");
    }
    // General case for the checklist items:
    // If a line starts with some spaces and a quote, and has exactly 1 quote, add ', at end
    let match = lines[i].match(/^\s*'/);
    if (match) {
        let quoteCount = (lines[i].match(/'/g) || []).length;
        if (quoteCount === 1) {
            lines[i] = lines[i] + "',";
        }
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
