const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'store', 'restaurantStore.js');
let c = fs.readFileSync(targetPath, 'utf8');

const MIGRATION_CONST = `const MENU_APPROVER_VERSION = 'v1.1';`;
const MIGRATION_CONST_NEW = `const MENU_APPROVER_VERSION = 'v1.1';
const SUPPLIER_MIGRATE_VERSION = 'v1.0';`;

if (c.includes(MIGRATION_CONST) && !c.includes('SUPPLIER_MIGRATE_VERSION')) {
  c = c.replace(MIGRATION_CONST, MIGRATION_CONST_NEW);
}

const CALL_SEARCH = `migrateMenuVersions(rawData ? JSON.parse(rawData) : null);`;
const CALL_REPLACE = `migrateMenuVersions(rawData ? JSON.parse(rawData) : null);
    migratePastSupplierData(rawData ? JSON.parse(rawData) : null);`;

if (c.includes(CALL_SEARCH) && !c.includes('migratePastSupplierData')) {
  c = c.replace(CALL_SEARCH, CALL_REPLACE);
}

const FUNC_TO_INSERT = `
function migratePastSupplierData(parsed) {
  if (parsed && parsed.supplierMigrateVersion === SUPPLIER_MIGRATE_VERSION) return;
  
  let changed = false;
  state.ingredients.forEach(ing => {
    if (ing.type === 'organic' && ing.supplier === '過去データインポート') {
      ing.supplier = 'AGRI KAKUIDA';
      changed = true;
    }
  });
  
  state.supplierMigrateVersion = SUPPLIER_MIGRATE_VERSION;
  
  if (changed) {
    console.log('[store] Migrated past supplier data to AGRI KAKUIDA');
  }
}
`;

if (!c.includes('function migratePastSupplierData')) {
  // Append right before `function migrateMenuApprovers`
  const funcSearch = `function migrateMenuApprovers(parsed) {`;
  c = c.replace(funcSearch, FUNC_TO_INSERT + '\n' + funcSearch);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('Migration function added to restaurantStore.js');
