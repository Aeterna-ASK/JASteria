const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let s = fs.readFileSync(file, 'utf8');

// 1. isSyncingFromCloud flag
if (!s.includes('let isSyncingFromCloud = false;')) {
  s = s.replace('let isFirestoreSyncInitialized = false;', 'let isFirestoreSyncInitialized = false;\nlet isSyncingFromCloud = false;');
}

// 2. syncInboxToCloud -> syncStoreToCloud
const targetSyncInbox = `async function syncInboxToCloud() {
    try {
      const docRef = doc(db, 'restaurants', 'default');
      await setDoc(docRef, {
        t_inbox_documents: JSON.parse(JSON.stringify(state.t_inbox_documents)),
        auditDocuments: JSON.parse(JSON.stringify(state.auditDocuments || [])),
        auditCategories: JSON.parse(JSON.stringify(state.auditCategories || {}))
      }, { merge: true });
      console.log('[Firestore Sync] 受信箱と監査ドキュメント・カテゴリ設定の変更をクラウドに反映しました');
    } catch (error) {
      console.error('[Firestore Sync] クラウド同期に失敗しました:', error);
    }
  }`;

// If encoding messed up the console.log string, find block dynamically
const syncInboxStart = s.indexOf('async function syncInboxToCloud() {');
const syncInboxEndStr = '  function addInboxDocument(doc) {';
const syncInboxEnd = s.indexOf(syncInboxEndStr);

if (syncInboxStart !== -1 && syncInboxEnd !== -1) {
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
  }
  
`;
  s = s.substring(0, syncInboxStart) + syncStoreFn + s.substring(syncInboxEnd);
}

s = s.replace(/syncInboxToCloud/g, 'syncStoreToCloud');

// 3. onSnapshot
const onSnapStartStr = 'onSnapshot(docRef, (docSnap) => {';
const onSnapEndStr = '    }, (error) => {';
const onSnapStart = s.indexOf(onSnapStartStr);
const onSnapEnd = s.indexOf(onSnapEndStr);

if (onSnapStart !== -1 && onSnapEnd !== -1) {
  const newOnSnapshot = `onSnapshot(docRef, (docSnap) => {
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
            console.log('[Firestore Sync] 初回マイグレーション実行');
            syncStoreToCloud();
        }
      } else {
        console.log('[Firestore Sync] ドキュメントが見つからないため、シードデータを投入します...');
        syncStoreToCloud();
      }
`;
  s = s.substring(0, onSnapStart) + newOnSnapshot + s.substring(onSnapEnd);
}

// 4. Modify saveStore
const saveStoreStartStr = 'function saveStore() {';
const saveStoreEndStr = "      }));\r\n    } catch (error) {"; // Wait, CRLF or LF? Let's just indexOf the catch block
let saveStoreStart = s.indexOf(saveStoreStartStr);
let saveStoreCatch = s.indexOf('} catch (error) {', saveStoreStart);

if (saveStoreStart !== -1 && saveStoreCatch !== -1) {
    const saveStoreBlock = s.substring(saveStoreStart, saveStoreCatch);
    if (!saveStoreBlock.includes('syncStoreToCloud()')) {
        // insert before catch
        const injection = `
      if (!isSyncingFromCloud && isFirestoreSyncInitialized) {
        syncStoreToCloud();
      }
    `;
        s = s.substring(0, saveStoreCatch) + injection + s.substring(saveStoreCatch);
    }
}

fs.writeFileSync(file, s);
console.log('Update logic applied directly with exact indices');
