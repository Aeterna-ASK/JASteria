const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

lines[350] = '            <th style="width: 100px; text-align: center;">謫堺</th>';
lines[464] = '                placeholder="萓E 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E"';

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
