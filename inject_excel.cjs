const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

const injectionCode = `
function migrateExcelData(parsed) {
  if (parsed && parsed.excelDataImportedV2) return;
  
  const rawData = [
    { month: '2024-09', data: { 'オーガニックランチコース': 338, 'その他のランチコース': 2316, 'サルサソース': 11, 'サラダ': 8, '有機ブルーベリー酢': 2, 'コーヒー': 21, 'ピクルス': 4, 'ぬか漬け': 0, 'バーニャカウダ': 8, 'ポタージュ': 2 } },
    { month: '2024-10', data: { 'オーガニックランチコース': 107, 'その他のランチコース': 2793, 'サルサソース': 8, 'サラダ': 3, '有機ブルーベリー酢': 3, 'コーヒー': 3, 'ピクルス': 2, 'ぬか漬け': 1, 'バーニャカウダ': 10, 'ポタージュ': 0 } },
    { month: '2024-11', data: { 'オーガニックランチコース': 130, 'その他のランチコース': 3157, 'サルサソース': 12, 'サラダ': 3, '有機ブルーベリー酢': 3, 'コーヒー': 8, 'ピクルス': 5, 'ぬか漬け': 0, 'バーニャカウダ': 3, 'ポタージュ': 1 } },
    { month: '2024-12', data: { 'オーガニックランチコース': 135, 'その他のランチコース': 2370, 'サルサソース': 2, 'サラダ': 5, '有機ブルーベリー酢': 2, 'コーヒー': 5, 'ピクルス': 2, 'ぬか漬け': 0, 'バーニャカウダ': 4, 'ポタージュ': 1 } },
    { month: '2025-01', data: { 'オーガニックランチコース': 125, 'その他のランチコース': 2550, 'サルサソース': 3, 'サラダ': 1, '有機ブルーベリー酢': 1, 'コーヒー': 20, 'ピクルス': 1, 'ぬか漬け': 1, 'バーニャカウダ': 8, 'ポタージュ': 3 } },
    { month: '2025-02', data: { 'オーガニックランチコース': 111, 'その他のランチコース': 2490, 'サルサソース': 8, 'サラダ': 2, '有機ブルーベリー酢': 5, 'コーヒー': 3, 'ピクルス': 1, 'ぬか漬け': 0, 'バーニャカウダ': 4, 'ポタージュ': 1 } },
    { month: '2025-03', data: { 'オーガニックランチコース': 115, 'その他のランチコース': 2912, 'サルサソース': 1, 'サラダ': 5, '有機ブルーベリー酢': 0, 'コーヒー': 8, 'ピクルス': 3, 'ぬか漬け': 0, 'バーニャカウダ': 2, 'ポタージュ': 8 } },
    { month: '2025-04', data: { 'オーガニックランチコース': 117, 'その他のランチコース': 2573, 'サルサソース': 0, 'サラダ': 2, '有機ブルーベリー酢': 0, 'コーヒー': 10, 'ピクルス': 2, 'ぬか漬け': 0, 'バーニャカウダ': 1, 'ポタージュ': 0 } },
    { month: '2025-05', data: { 'オーガニックランチコース': 134, 'その他のランチコース': 3291, 'サルサソース': 3, 'サラダ': 3, '有機ブルーベリー酢': 1, 'コーヒー': 12, 'ピクルス': 2, 'ぬか漬け': 0, 'バーニャカウダ': 6, 'ポタージュ': 3 } }
  ];

  const existingLogs = state.cookingLogs || [];
  let added = false;

  rawData.forEach(row => {
    Object.entries(row.data).forEach(([menuName, quantity]) => {
      if (quantity === 0) return; // Skip 0 quantities

      // Try to find a matching menu by name
      let menu = state.menus.find(m => m.name.includes(menuName) || m.masterName && m.masterName.includes(menuName));
      
      // If no menu is found, we use a temp ID that is basically the menu name
      // This will show up as a blank selection in the UI until the user manually changes it to an existing menu.
      const menuId = menu ? menu.id : 'temp_' + menuName;
      
      // Prevent duplicates
      const exists = existingLogs.some(l => l.date === row.month && l.menuId === menuId);
      if (!exists) {
        existingLogs.push({
          id: 'log_auto_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          date: row.month,
          menuId: menuId,
          quantity: quantity,
          checkedBy: state.restaurantInfo.manager || '竹下 義隆',
          isUtensilsClean: true,
          isIngredientVerified: true,
          lotDetails: ''
        });
        added = true;
      }
    });
  });

  if (added) {
    state.cookingLogs = existingLogs;
  }
}
`;

// Insert the migration function into the code
if (!content.includes('migrateExcelData(parsed)')) {
  // Find where other migrations are defined
  content = content.replace('// 受入点検の点検者を調理責任者へ一度だけ移行する', injectionCode + '\n// 受入点検の点検者を調理責任者へ一度だけ移行する');
  
  // Call the migration in loadStore()
  content = content.replace('migrateNewAuditDocs(rawData ? JSON.parse(rawData) : null);', 'migrateNewAuditDocs(rawData ? JSON.parse(rawData) : null);\n    migrateExcelData(rawData ? JSON.parse(rawData) : null);');
  
  // Update the saveStore to save the flag
  content = content.replace('auditDocsMigrationVersion: AUDIT_DOCS_MIGRATION_VERSION,', 'auditDocsMigrationVersion: AUDIT_DOCS_MIGRATION_VERSION,\n      excelDataImportedV2: true,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected excel data migration.');
} else {
  console.log('Already injected.');
}
