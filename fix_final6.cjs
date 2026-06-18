const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');

lines[117] = '    errorMessage.value = err.message;';
lines[123] = "  if (confirm(`蜴滓攝譁吶€・${name}縲阪E蜑企勁縺励※繧めEE繧阪E縺・〒縺吶°・`)) {";
// wait, line 124 in the console was 123 in 0-indexed array! `name` should be interpolated!

fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
