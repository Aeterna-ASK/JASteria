const fs = require('fs');
const acorn = require('acorn');
let content = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

let lines = content.split('\n');
for (let i = 60; i <= 150; i++) {
    // try to fix manual chapters
    if (lines[i] && lines[i].includes('E, content: ')) {
        lines[i] = lines[i].replace(/E, content: /g, "E', content: ");
    }
    // try to fix ends of lines with E },
    if (lines[i] && lines[i].match(/E \},$/)) {
        lines[i] = lines[i].replace(/E \},$/, "E' },");
    }
    // manual fixes for specific known lines
    if (lines[i] && lines[i].includes('manager: \'竹丁E義隁E,     //')) {
        lines[i] = lines[i].replace(/E,     \/\//, "E',     //");
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
