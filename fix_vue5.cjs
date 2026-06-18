const fs = require('fs');
let content = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');

// Fix tags missing <
content = content.replace(/E\/([a-zA-Z0-9]+)>/g, 'E</$1>');
content = content.replace(/E\/button>/g, 'E</button>');
content = content.replace(/E\/h2>/g, 'E</h2>');
content = content.replace(/E\/td>/g, 'E</td>');
content = content.replace(/E\/span>/g, 'E</span>');
content = content.replace(/E\/p>/g, 'E</p>');

// Fix broken lines explicitly
// Line 430
content = content.replace(/'蜴滓攝譁呎ュ蝣E縺E邱E髮・' : '譁E/, "'蜴滓攝譁呎ュ蝣E縺E邱E髮・' : '譁E'");
// Line 522
content = content.replace(/逋ｻ骭E縺吶EE' }}/g, "逋ｻ骭E縺吶EE' }}"); 
content = content.replace(/'螟画峩繧剁E晏ｭ・' : '逋ｻ骭E/, "'螟画峩繧剁E晏ｭ・' : '逋ｻ骭E'");

// Other missing quotes
content = content.replace(/placeholder="萓E 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E/, 'placeholder="萓E 繧E繝ｪ繝ｼ繝ｳ繝吶ず繧E繝悶Ν譬E蠑丈ｼ夂､E"');

content = content.replace(/<AlertTriangle :size="16" \/> <span>\{\{ authError \}\}<\/span>/, '<AlertTriangle :size="16" /> <span>{{ authError }}</span>');

fs.writeFileSync('src/components/IngredientsView.vue', content, 'utf8');
