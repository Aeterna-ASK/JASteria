const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/竹丁E義隁E/g, '竹下 義隆');
c = c.replace(/田中大輁E;/g, "田中大輔';");
c = c.replace(/田中大輁E/g, "田中大輔");

// Also check for the missing single quote causing the syntax error
c = c.replace(/m\.creatorApproved = '田中大輔;/g, "m.creatorApproved = '田中大輔';");

fs.writeFileSync(file, c, 'utf8');
console.log('Fixed syntax and mojibake in migrateMenuApprovers');
