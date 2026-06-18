const fs = require('fs');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');
for (let i = 60; i <= 200; i++) {
    if (lines[i] && lines[i].includes('ことを確認すること、E')) {
        lines[i] = lines[i].replace(/ことを確認すること、E/g, "ことを確認すること、E',");
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
