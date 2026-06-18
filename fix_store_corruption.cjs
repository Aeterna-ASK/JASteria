const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

// Fix corruption that may have been caused by powershell Get-Content
content = content.replace(/牁E/g, '版');
content = content.replace(/[\(EE\?\(\u7B2C\(\\\\d\+\)\u7241E/g, '[\(（]?(第(\\d+)版'); // Best effort, but the node fix store script will fix it properly

fs.writeFileSync(file, content, 'utf8');
