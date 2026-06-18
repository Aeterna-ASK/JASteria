const fs = require('fs');
let lines = fs.readFileSync('src/components/IngredientsView.vue', 'utf8').split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('errorMessage.value') && lines[i].includes('蜴滓攝譁吝錐繧貞E蜉帙＠縺E縺上□縺輔＞縲・;')) {
        lines[i] = "      errorMessage.value = '蜴滓攝譁吝錐繧貞E蜉帙＠縺E縺上□縺輔＞縲・';";
    }
}
fs.writeFileSync('src/components/IngredientsView.vue', lines.join('\n'), 'utf8');
