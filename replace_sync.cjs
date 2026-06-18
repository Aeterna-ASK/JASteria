const fs = require('fs');
let code = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

const target = `  function initFirestoreSync() {
    if (isFirestoreSyncInitialized) return;
    isFirestoreSyncInitialized = true;
    const docRef = doc(db, 'restaurants', 'default');
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.activeTab) state.activeTab = data.activeTab;
        if (data.restaurantInfo) state.restaurantInfo = data.restaurantInfo;
        if (data.ingredients) state.ingredients = data.ingredients;
        if (data.menus) state.menus = data.menus;
        if (data.receipts) state.receipts = data.receipts;
        if (data.cookingLogs) state.cookingLogs = data.cookingLogs;
        if (data.cleaningLogs) state.cleaningLogs = data.cleaningLogs;
        if (data.documents) state.documents = data.documents;
        if (data.auditDocuments) state.auditDocuments = data.auditDocuments;
        if (data.auditCategories) state.auditCategories = data.auditCategories;
        if (data.externalRegInfo) state.externalRegInfo = data.externalRegInfo;
        if (data.targetMenuToClone) state.targetMenuToClone = data.targetMenuToClone;
        if (data.t_inbox_documents) state.t_inbox_documents = data.t_inbox_documents;
      }
    });
  }`;

const replacement = `  function initFirestoreSync() {
    if (isFirestoreSyncInitialized) return;
    isFirestoreSyncInitialized = true;
    const docRef = doc(db, 'restaurants', 'default');
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.t_inbox_documents) state.t_inbox_documents = data.t_inbox_documents;
      }
    });
  }`;

code = code.replace(target, replacement);
fs.writeFileSync('src/store/restaurantStore.js', code);
console.log('Done');
