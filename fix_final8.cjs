const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    // check for unterminated string assignments like `var = '...;`
    if (line.includes("= '") && line.trim().endsWith(";") && !line.trim().endsWith("';")) {
        // if it doesn't have a second single quote after the first one
        let firstQuoteIdx = line.indexOf("'");
        let lastQuoteIdx = line.lastIndexOf("'");
        if (firstQuoteIdx === lastQuoteIdx) {
            lines[i] = line.replace(/;$/, "';");
            console.log('Fixed:', lines[i]);
        }
    }
}

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
