const fs = require('fs');
const path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(path, 'utf8');

const fixFallbackRegex = /if \(error\.code === 'invalid-argument' && error\.message\.includes\('longer than 1048487 bytes'\)\) \{/g;
content = content.replace(fixFallbackRegex, `if (error.message && error.message.includes('longer than 1048487 bytes')) {`);

// Also add a method to restore seed data
const exportStoreIdx = content.indexOf('function exportStore() {');
if (exportStoreIdx !== -1) {
    const restoreFunc = `
  function restoreSeedData() {
    state.ingredients = [...seedIngredients];
    state.menus = [...seedMenus];
    state.cleaningLogs = [...seedCleaningLogs];
    state.manualChapters = [...seedManualChapters];
    state.t_inbox_documents = [...seedInboxDocuments];
    state.auditDocuments = [...seedAuditDocuments];
    saveStore();
    syncStoreToCloud();
    return true;
  }
  
`;
    content = content.substring(0, exportStoreIdx) + restoreFunc + content.substring(exportStoreIdx);
    
    // Add to export
    const exportEndIdx = content.lastIndexOf('export const restaurantStore = readonly({');
    if (exportEndIdx !== -1) {
        content = content.replace('export const restaurantStore = readonly({', 'export const restaurantStore = readonly({\n    restoreSeedData,');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Fixed fallback and added restoreSeedData.');
