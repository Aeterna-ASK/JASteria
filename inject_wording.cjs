const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(file, 'utf8');

const injectionCode = `
function migrateLotDetailsWording(parsed) {
  if (parsed && parsed.excelDataLotDetailsWordingV1) return;
  
  if (!Array.isArray(state.cookingLogs)) return;

  let modified = false;

  state.cookingLogs.forEach(log => {
    if (log.lotDetails && log.lotDetails.includes('[過去データ紐付け省略]')) {
      log.lotDetails = log.lotDetails.replace(/\\[過去データ紐付け省略\\]/g, '[ロット確認]');
      modified = true;
    }
  });

  if (modified) {
    console.log('[store] Migrated lot details wording to match user input style');
  }
}
`;

if (!content.includes('migrateLotDetailsWording(parsed)')) {
  content = content.replace('// 受入点検の点検者を調理責任者へ一度だけ移行する', injectionCode + '\n// 受入点検の点検者を調理責任者へ一度だけ移行する');
  
  content = content.replace('migrateCookingLogsLotDetails(rawData ? JSON.parse(rawData) : null);', 'migrateCookingLogsLotDetails(rawData ? JSON.parse(rawData) : null);\n    migrateLotDetailsWording(rawData ? JSON.parse(rawData) : null);');
  
  content = content.replace('excelDataLotDetailsV1: true,', 'excelDataLotDetailsV1: true,\n      excelDataLotDetailsWordingV1: true,');
  
  fs.writeFileSync(file, content, 'utf8');
  console.log('Injected lot details wording migration.');
} else {
  console.log('Already injected.');
}
