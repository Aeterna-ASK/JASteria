const fs = require('fs');
let content = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');

// Line 351
content = content.replace(/謫堺E・\/th>/g, '謫堺E・</th>');
// Line 465
content = content.replace(/placeholder="萓E" 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E"/g, 'placeholder="萓E 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E"');
// Line 547
content = content.replace(/\{\{ authError' \}\}/g, '{{ authError }}');

fs.writeFileSync('src/components/IngredientsView.vue', content, 'utf8');
