const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let s = fs.readFileSync(file, 'utf8');

// 1. Add isSyncingFromCloud flag near the top
const isSyncingDecl = `let isFirestoreSyncInitialized = false;`;
const newIsSyncingDecl = `let isFirestoreSyncInitialized = false;
let isSyncingFromCloud = false;`;
s = s.replace(isSyncingDecl, newIsSyncingDecl);

// 2. Modify saveStore to call syncStoreToCloud
const saveStoreRegex = /function saveStore\(\) \{\s*try \{\s*localStorage\.setItem\(STORE_KEY, JSON\.stringify\(\{([^}]+)\}\)\);\s*\} catch \(error\) \{\s*console\.error\('Failed to save storage for JAS Restaurant:', error\);\s*\}\s*\}/s;

s = s.replace(saveStoreRegex, (match, p1) => {
  return `function saveStore() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify({${p1}}));
      if (!isSyncingFromCloud && isFirestoreSyncInitialized) {
        syncStoreToCloud();
      }
    } catch (error) {
      console.error('Failed to save storage for JAS Restaurant:', error);
    }
  }`;
});

// 3. Rename syncInboxToCloud to syncStoreToCloud and sync all data
const syncInboxRegex = /async function syncInboxToCloud\(\) \{\s*try \{\s*const docRef = doc\(db, 'restaurants', 'default'\);\s*await setDoc\(docRef, \{[^\}]+\}, \{ merge: true \}\);\s*console\.log\('\[Firestore Sync\] [^']+'\);\s*\} catch \(error\) \{\s*console\.error\('\[Firestore Sync\] [^']+', error\);\s*\}\s*\}/s;

const syncStoreFn = `async function syncStoreToCloud() {
    try {
      const docRef = doc(db, 'restaurants', 'default');
      await setDoc(docRef, {
        t_inbox_documents: JSON.parse(JSON.stringify(state.t_inbox_documents || [])),
        auditDocuments: JSON.parse(JSON.stringify(state.auditDocuments || [])),
        auditCategories: JSON.parse(JSON.stringify(state.auditCategories || {})),
        ingredients: JSON.parse(JSON.stringify(state.ingredients || [])),
        menus: JSON.parse(JSON.stringify(state.menus || [])),
        receipts: JSON.parse(JSON.stringify(state.receipts || [])),
        cookingLogs: JSON.parse(JSON.stringify(state.cookingLogs || [])),
        cleaningLogs: JSON.parse(JSON.stringify(state.cleaningLogs || [])),
        manualChapters: JSON.parse(JSON.stringify(state.manualChapters || [])),
        documents: JSON.parse(JSON.stringify(state.documents || {})),
        externalRegInfo: JSON.parse(JSON.stringify(state.externalRegInfo || {}))
      }, { merge: true });
      console.log('[Firestore Sync] 全データをクラウドに同期しました');
    } catch (error) {
      console.error('[Firestore Sync] クラウド同期に失敗:', error);
    }
  }`;

if (s.match(syncInboxRegex)) {
  s = s.replace(syncInboxRegex, syncStoreFn);
} else {
  console.log("Could not find syncInboxToCloud regex!");
}

// Ensure addInboxDocument uses saveStore instead of syncInboxToCloud (since saveStore now syncs)
s = s.replace(/syncInboxToCloud\(\);/g, 'saveStore();');

// 4. Modify onSnapshot
const onSnapshotTarget = /onSnapshot\(docRef, \(docSnap\) => \{\s*if \(docSnap\.exists\(\)\) \{\s*const data = docSnap\.data\(\);\s*if \(Array\.isArray\(data\.t_inbox_documents\)\) \{[^\}]+status: d\.status,[^\}]+suggestedType: d\.suggestedType,[^\}]+\}\s*\}\s*\)\s*;\s*\}[^\}]+\}\s*if \(Array\.isArray\(data\.auditDocuments\)\) \{\s*state\.auditDocuments = data\.auditDocuments;\s*\}\s*if \(data\.auditCategories\) \{\s*state\.auditCategories = \{ \.\.\.defaultAuditCategories, \.\.\.data\.auditCategories \};\s*\}\s*saveStore\(\);\s*\} else \{/s;

const newOnSnapshot = `onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
        // マイグレーション判定：クラウドにデータがなく、ローカルにデータがある場合はアップロードを優先
        let needsMigration = false;
        if (!data.menus && state.menus && state.menus.length > 0) needsMigration = true;
        if (!data.ingredients && state.ingredients && state.ingredients.length > 0) needsMigration = true;

        if (!needsMigration) {
            isSyncingFromCloud = true;
            
            if (Array.isArray(data.t_inbox_documents)) {
              state.t_inbox_documents = data.t_inbox_documents.map(d => ({
                id: d.id,
                fileName: d.fileName,
                fileUrl: d.fileUrl,
                receivedAt: d.receivedAt,
                status: d.status,
                suggestedType: d.suggestedType,
                parsedData: d.parsedData ? {
                  date: d.parsedData.date,
                  expiryDate: d.parsedData.expiryDate,
                  partnerName: d.parsedData.partnerName,
                  lotNumber: d.parsedData.lotNumber,
                  items: Array.isArray(d.parsedData.items) ? d.parsedData.items.map(item => ({
                    ingredientName: item.ingredientName || item.materialName || '',
                    quantity: item.quantity || '1',
                    unit: item.unit || 'kg',
                    type: item.type || 'organic'
                  })) : []
                } : null
              }));
            }
            if (Array.isArray(data.auditDocuments)) {
              state.auditDocuments = data.auditDocuments;
            }
            if (data.auditCategories) {
              state.auditCategories = { ...defaultAuditCategories, ...data.auditCategories };
            }
            
            if (Array.isArray(data.ingredients)) state.ingredients = data.ingredients;
            if (Array.isArray(data.menus)) state.menus = data.menus;
            if (Array.isArray(data.receipts)) state.receipts = data.receipts;
            if (Array.isArray(data.cookingLogs)) state.cookingLogs = data.cookingLogs;
            if (Array.isArray(data.cleaningLogs)) state.cleaningLogs = data.cleaningLogs;
            if (Array.isArray(data.manualChapters)) state.manualChapters = data.manualChapters;
            if (data.documents) state.documents = data.documents;
            if (data.externalRegInfo) state.externalRegInfo = data.externalRegInfo;
            
            saveStore();
            isSyncingFromCloud = false;
        } else {
            console.log('[Firestore Sync] 初回マイグレーション：ローカルデータをクラウドにアップロードします');
            syncStoreToCloud();
        }
      } else {`;

if (s.match(onSnapshotTarget)) {
  s = s.replace(onSnapshotTarget, newOnSnapshot);
} else {
  console.log("Could not find onSnapshotTarget regex!");
}

fs.writeFileSync(file, s);
console.log('Update script executed successfully!');
