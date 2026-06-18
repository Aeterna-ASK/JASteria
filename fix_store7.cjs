const fs = require('fs');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');
for (let i = 60; i <= 150; i++) {
    if (lines[i]) {
        lines[i] = lines[i].replace(/E \}/g, "E' }");
        lines[i] = lines[i].replace(/E ,/g, "E' ,");
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
