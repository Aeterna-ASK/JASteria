const fs = require('fs');
const path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(path, 'utf8');

// 1. Fix updateCookingLog
const updateCookingLogRegex = /function updateCookingLog\(id, updatedFields\) \{[\s\S]*?async function syncStoreToCloud\(\) \{[\s\S]*?\}\n  if \(idx !== -1\) \{/g;
if (updateCookingLogRegex.test(content)) {
    content = content.replace(updateCookingLogRegex, 'function updateCookingLog(id, updatedFields) {\n  const idx = state.cookingLogs.findIndex(c => c.id === id);\n  if (idx !== -1) {');
    console.log('Fixed updateCookingLog.');
} else {
    // maybe try to find it differently
    const startIdx = content.indexOf('function updateCookingLog(id, updatedFields) {');
    const endStr = '  async function syncStoreToCloud() {\r\n    try {\r\n      const docRef = doc(db, \'restaurants\', \'default\');';
    if (startIdx !== -1) {
        console.log('Found updateCookingLog manually');
    }
}

// Just rewrite updateCookingLog manually with substring
const cookingLogStart = content.indexOf('function updateCookingLog(id, updatedFields) {');
if (cookingLogStart !== -1) {
    const endStr = '  if (idx !== -1) {';
    const cookingLogEnd = content.indexOf(endStr, cookingLogStart + 50);
    if (cookingLogEnd !== -1) {
        const toReplace = content.substring(cookingLogStart, cookingLogEnd + endStr.length);
        if (toReplace.includes('onSnapshot')) {
            content = content.replace(toReplace, 'function updateCookingLog(id, updatedFields) {\n  const idx = state.cookingLogs.findIndex(c => c.id === id);\n  if (idx !== -1) {');
            console.log('Fixed updateCookingLog via substring.');
        }
    }
}

// 2. Fix initFirestoreSync
const initSyncStart = content.indexOf('function initFirestoreSync() {');
if (initSyncStart !== -1) {
    const endSyncStr = '      }\n    }, (error) => {\n      console.warn(\'[Firestore Sync] G[:\', error);\n    });\n  }';
    let initSyncEnd = content.indexOf(endSyncStr, initSyncStart);
    if (initSyncEnd === -1) {
        // try looking for a different end string since encoding might be garbled
        initSyncEnd = content.indexOf('    });\r\n  }\r\n  \r\n  function addInboxDocument(doc) {', initSyncStart);
        if (initSyncEnd !== -1) {
            initSyncEnd = initSyncEnd + 11; // up to "}\r\n"
        } else {
             // fallback
             initSyncEnd = content.indexOf('  function addInboxDocument(doc) {', initSyncStart);
        }
    }
    
    if (initSyncEnd !== -1) {
        const replacement = `function initFirestoreSync() {
    if (isFirestoreSyncInitialized) return;
    isFirestoreSyncInitialized = true;
  
    console.log('[Firestore Sync] リアルタイム同期開始...');
    
    const docRef = doc(db, 'restaurants', 'default');
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        
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
            if (Array.isArray(data.auditDocuments)) state.auditDocuments = data.auditDocuments;
            if (data.auditCategories) state.auditCategories = { ...defaultAuditCategories, ...data.auditCategories };
            
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
            console.log('[Firestore Sync] 初回マイグレーション実行：ローカルからクラウドへ');
            syncStoreToCloud();
        }
      } else {
        console.log('[Firestore Sync] ドキュメントが見つからないため、初期データを投入します...');
        syncStoreToCloud();
      }
    }, (error) => {
      console.warn('[Firestore Sync] 同期エラー:', error);
    });
  }

  async function syncStoreToCloud() {
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
      console.log('[Firestore Sync] 全データクラウドに保存完了');
    } catch (error) {
      console.error('[Firestore Sync] 保存失敗:', error);
    }
  }
`;
        const toReplaceSync = content.substring(initSyncStart, initSyncEnd);
        content = content.replace(toReplaceSync, replacement);
        console.log('Fixed initFirestoreSync and syncStoreToCloud.');
    } else {
        console.log('Could not find end of initFirestoreSync.');
    }
} else {
    console.log('Could not find initFirestoreSync.');
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done.');
