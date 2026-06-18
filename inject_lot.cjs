const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

const injectionCode = `
function migrateCookingLogsLotDetails(parsed) {
  if (parsed && parsed.excelDataLotDetailsV1) return;
  
  if (!Array.isArray(state.cookingLogs)) return;

  let modified = false;

  state.cookingLogs.forEach(log => {
    // Only process logs that have an empty lotDetails
    if (!log.lotDetails || log.lotDetails === '') {
      const menu = state.menus.find(m => m.id === log.menuId);
      
      // If menu is found and is organic, generate lot details
      if (menu && menu.isOrganicClaim) {
        let recipeDetails = menu.recipeDetails || [];
        if (recipeDetails.length === 0 && menu.recipe) {
           // fallback to recipe if recipeDetails is missing
           // Note: in vue component it's menu.recipeDetails but menus structure has 'recipe' array usually
           // Let's check both
           recipeDetails = menu.recipe || [];
        }

        const orgIngNames = recipeDetails
          .filter(detail => {
             // either the detail itself has type 'organic' or it refers to an ingredient that is organic
             if (detail.type === 'organic') return true;
             const ing = state.ingredients.find(i => i.id === detail.ingredientId);
             return ing && ing.type === 'organic';
          })
          .map(detail => {
             const ing = state.ingredients.find(i => i.id === detail.ingredientId);
             return ing ? ing.name : (detail.name || detail.ingredientName || '有機食材');
          });
        
        // Remove duplicates
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
            return name.replace('有機JAS', '') + ': [過去データ紐付け省略]';
          });
          log.lotDetails = suggestions.join(', ');
          modified = true;
        } else {
           // It's organic but no organic ingredients found? Give it a default string.
           log.lotDetails = 'レシピから有機食材を自動取得できませんでした';
           modified = true;
        }
      }
    }
  });

  if (modified) {
    console.log('[store] Migrated lot details for imported cooking logs');
  }
}
`;

// Insert the migration function into the code
if (!content.includes('migrateCookingLogsLotDetails(parsed)')) {
  content = content.replace('// 受入点検の点検者を調理責任者へ一度だけ移行する', injectionCode + '\n// 受入点検の点検者を調理責任者へ一度だけ移行する');
  
  content = content.replace('migrateExcelData(rawData ? JSON.parse(rawData) : null);', 'migrateExcelData(rawData ? JSON.parse(rawData) : null);\n    migrateCookingLogsLotDetails(rawData ? JSON.parse(rawData) : null);');
  
  content = content.replace('excelDataImportedV2: true,', 'excelDataImportedV2: true,\n      excelDataLotDetailsV1: true,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected lot details migration.');
} else {
  console.log('Already injected.');
}
