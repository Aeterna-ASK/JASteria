const fs = require('fs');
let c = fs.readFileSync('src/store/restaurantStore.js', 'utf8');
c = c.replace(/E, content:/g, "E', content:");
c = c.replace(/\.\.\.' \}',/g, "...' },"); // Reverting the auto_fix mistake
fs.writeFileSync('src/store/restaurantStore.js', c, 'utf8');
