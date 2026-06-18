const fs = require('fs');
let c = fs.readFileSync('src/store/restaurantStore.js', 'utf8');
c = c.replace(/E,\n/g, "E',\n");
c = c.replace(/E,\r\n/g, "E',\r\n");
fs.writeFileSync('src/store/restaurantStore.js', c, 'utf8');
