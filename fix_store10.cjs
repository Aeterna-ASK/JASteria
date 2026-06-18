const fs = require('fs');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i]) {
        lines[i] = lines[i].replace(/こと、E\r?$/, "こと、E',");
        lines[i] = lines[i].replace(/こと。E\r?$/, "こと。E',");
        
        let quoteCount = (lines[i].match(/'/g) || []).length;
        if (quoteCount === 1 && lines[i].match(/^\s*'/)) {
             lines[i] = lines[i].replace(/\r?$/, "',");
        }
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
