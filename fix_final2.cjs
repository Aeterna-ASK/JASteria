const fs = require('fs');
let vueContent = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');
vueContent = vueContent.replace(/'蜴滓攝譁吝錐繧貞E蜉帙＠縺E縺上□縺輔＞縲・;/g, "'蜴滓攝譁吝錐繧貞E蜉帙＠縺E縺上□縺輔＞縲・';");
fs.writeFileSync('src/components/IngredientsView.vue', vueContent, 'utf8');
