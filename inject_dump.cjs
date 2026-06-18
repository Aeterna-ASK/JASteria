// This script will read the local storage directly via evaluating in browser? No, we can't do that from here.
// But we can add a console.log in the vue component or a global window variable to expose the store.
// Alternatively, since the user is running the app locally and their browser is storing it, I cannot easily extract it without injecting code.
// I can inject code into `main.js` to dump the menus to a file.

const fs = require('fs');
const path = require('path');

const mainJsPath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/main.js';
let content = fs.readFileSync(mainJsPath, 'utf8');

if (!content.includes('dumpMenusToDisk')) {
  const codeToInject = `
setTimeout(() => {
  try {
    const data = localStorage.getItem('jas_restaurant_store_v2');
    if (data) {
      const parsed = JSON.parse(data);
      const menus = parsed.menus || [];
      fetch('http://localhost:5175/__dump_menus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(menus)
      }).catch(e => console.log(e));
    }
  } catch (e) {}
}, 3000);
`;
  content += codeToInject;
  fs.writeFileSync(mainJsPath, content, 'utf8');
  console.log('Injected dump code into main.js');
}
