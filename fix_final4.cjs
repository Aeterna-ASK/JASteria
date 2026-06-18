const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');
lines[97] = "      errorMessage.value = '蜴滓攝譁吝錐繧貞E蜉帙＠縺E縺上□縺輔＞';";
fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
