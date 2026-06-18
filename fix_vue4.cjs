const fs = require('fs');
let content = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');

content = content.replace(/([^\x00-\x7F])\/h2>/g, '$1</h2>');
content = content.replace(/([^\x00-\x7F])\/button>/g, '$1</button>');
content = content.replace(/([^\x00-\x7F])\/td>/g, '$1</td>');
content = content.replace(/([^\x00-\x7F])\/span>/g, '$1</span>');
content = content.replace(/([^\x00-\x7F])\/p>/g, '$1</p>');
content = content.replace(/([^\x00-\x7F])\/label>/g, '$1</label>');

// fix missing quote before @click
content = content.replace(/title="([^"]+) @click=/g, 'title="$1" @click=');

// fix placeholder missing quote
content = content.replace(/placeholder="([^"]+?)(?=\s|>)/g, '$&"');
// wait, if it already had a quote, it might become ""
content = content.replace(/""/g, '"');

// fix ternary string literals
content = content.replace(/\? '([^']+) : '([^']+)/g, "? '$1' : '$2");
content = content.replace(/: '([^']+) \}\}/g, ": '$1' }}");

fs.writeFileSync('src/components/IngredientsView.vue', content, 'utf8');
