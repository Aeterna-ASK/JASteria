const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

const injectionCode = `
function migrateExcelDataZeros(parsed) {
  if (parsed && parsed.excelDataZerosImportedV1) return;
  
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
      if (quantity !== 0) return; // This time ONLY process 0 quantities!

      let menu = state.menus.find(m => m.name.includes(menuName) || m.masterName && m.masterName.includes(menuName));
      const menuId = menu ? menu.id : 'temp_' + menuName;
      
      const exists = existingLogs.some(l => l.date === row.month && l.menuId === menuId);
      if (!exists) {
        
        let generatedLotDetails = '[過去データ紐付け省略]';
        // Auto-generate lot details if organic menu
        if (menu && menu.isOrganicClaim) {
          let recipeDetails = menu.recipeDetails || menu.recipe || [];
          const orgIngNames = recipeDetails
            .filter(detail => detail.type === 'organic' || (state.ingredients.find(i => i.id === detail.ingredientId)?.type === 'organic'))
            .map(detail => {
               const ing = state.ingredients.find(i => i.id === detail.ingredientId);
               return ing ? ing.name : (detail.name || detail.ingredientName || '有機食材');
            });
          
          const uniqueOrgIngNames = [...new Set(orgIngNames)];

          if (uniqueOrgIngNames.length > 0) {
            const suggestions = uniqueOrgIngNames.map(name => {
              const ing = state.ingredients.find(i => i.name === name);
              if (ing) {
                const lastRec = [...state.receipts]
                  .filter(r => r.ingredientId === ing.id)
                  .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
                if (lastRec) {
                  return name.replace('有機JAS', '') + ': ' + lastRec.lotNumber;
                }
              }
              return name.replace('有機JAS', '') + ': [ロット確認]';
            });
            generatedLotDetails = suggestions.join(', ');
          } else {
             generatedLotDetails = 'レシピから有機食材を自動取得できませんでした';
          }
        } else {
             generatedLotDetails = '';
        }

        existingLogs.push({
          id: 'log_auto_zero_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
          date: row.month,
          menuId: menuId,
          quantity: 0,
          checkedBy: state.restaurantInfo.manager || '竹下 義隆',
          isUtensilsClean: true,
          isIngredientVerified: true,
          lotDetails: generatedLotDetails
        });
        added = true;
      }
    });
  });

  if (added) {
    state.cookingLogs = existingLogs;
    console.log('[store] Injected 0 quantity logs');
  }
}
`;

if (!content.includes('migrateExcelDataZeros(parsed)')) {
  content = content.replace('// 受入点検の点検者を調理責任者へ一度だけ移行する', injectionCode + '\n// 受入点検の点検者を調理責任者へ一度だけ移行する');
  
  content = content.replace('migrateLotDetailsWording(rawData ? JSON.parse(rawData) : null);', 'migrateLotDetailsWording(rawData ? JSON.parse(rawData) : null);\n    migrateExcelDataZeros(rawData ? JSON.parse(rawData) : null);');
  
  content = content.replace('excelDataLotDetailsWordingV1: true,', 'excelDataLotDetailsWordingV1: true,\n      excelDataZerosImportedV1: true,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected zero quantity migration.');
} else {
  console.log('Already injected.');
}
