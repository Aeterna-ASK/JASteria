const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('errorMessage.value =') && lines[i].includes(';')) {
        // Just make sure it ends with '; and not missing the '
        if (lines[i].endsWith(';')) {
            // Check if the previous char is '
            if (lines[i][lines[i].length - 2] !== "'") {
                lines[i] = lines[i].slice(0, -1) + "';";
            }
        }
    }
}

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
