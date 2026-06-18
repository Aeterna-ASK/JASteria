const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let c = fs.readFileSync(file, 'utf8');

c = c.replace(/migratePastSupplierData\(.*?\);\s*/g, '');
c = c.replace(/function migratePastSupplierData\([\s\S]*?}\n/g, '');

fs.writeFileSync(file, c, 'utf8');
console.log('Removed migratePastSupplierData');
