const fs = require('fs');
const path = require('path');

const file = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let c = fs.readFileSync(file, 'utf8');

const regex = /\s*}\);\s*state\.supplierMigrateVersion = SUPPLIER_MIGRATE_VERSION;\s*if \(changed\) {\s*console\.log\('\[store\] Migrated past supplier data to AGRI KAKUIDA'\);\s*}\s*}/g;
c = c.replace(regex, '');

fs.writeFileSync(file, c, 'utf8');
console.log('Removed dangling block');
