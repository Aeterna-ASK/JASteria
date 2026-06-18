const fs = require('fs');

// Fix IngredientsView.vue
let vueContent = fs.readFileSync('src/components/IngredientsView.vue', 'utf8');
vueContent = vueContent.replace(/E琁Econst handleJasCertUpload = \(event\) => \{/, "E琁E\nconst handleJasCertUpload = (event) => {");
fs.writeFileSync('src/components/IngredientsView.vue', vueContent, 'utf8');

// Fix restaurantStore.js
let storeContent = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

// Replace the broken regexes
storeContent = storeContent.replace(/\/\[\\\(.*?第\(\\d\+\)牁ENo\\\.?\s\*\(\\d\+\)\|v\(\\d\+\)\|ver\\\.?\s\*\(\\d\+\)\|№\s\*\(\\d\+\)\).*?\?\/i/g, 
  "/(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))/i");

// Specifically line 914 and 937
storeContent = storeContent.replace(/name\.match\(\/\[\\\(.*?\?\)/i, "name.match(/(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))/i)");
storeContent = storeContent.replace(/\(m\.name \|\| ''\)\.match\(\/\[\\\(.*?\?\)/i, "(m.name || '').match(/(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))/i)");

// Actually, let's just do it directly line by line for safety:
let lines = storeContent.split('\n');
for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('name.match(/') && lines[i].includes('第(')) {
        lines[i] = "            const match = name.match(/(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))/i);";
    }
    if (lines[i].includes("(m.name || '').match(/") && lines[i].includes('第(')) {
        lines[i] = "          const match = (m.name || '').match(/(第(\\d+)版|No\\.?\\s*(\\d+)|v(\\d+)|ver\\.?\\s*(\\d+)|№\\s*(\\d+))/i);";
    }
}
fs.writeFileSync('src/store/restaurantStore.js', lines.join('\n'), 'utf8');
