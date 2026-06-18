const fs = require('fs');
const path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(path, 'utf8');

const initStart = content.indexOf('function initFirestoreSync() {');
if (initStart !== -1) {
    let initEnd = content.indexOf('function addInboxDocument(doc) {', initStart);
    if (initEnd !== -1) {
        const block = content.substring(initStart, initEnd);
        const replacement = `function initFirestoreSync() {
    if (isFirestoreSyncInitialized) return;
    isFirestoreSyncInitialized = true;
  
    console.log('[Firestore Sync] リアルタイム同期開始...');
    
    const collections = [
      'menus', 'ingredients', 'receipts', 'cookingLogs', 'cleaningLogs', 
      'manualChapters', 'auditDocuments', 't_inbox_documents', 'meta'
    ];

    let loadedCount = 0;
    let needsMigration = false;

    collections.forEach(colName => {
      const docRef = doc(db, 'restaurants', colName);
      onSnapshot(docRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data().data;
          isSyncingFromCloud = true;
          
          if (colName === 'meta') {
            if (data.auditCategories) state.auditCategories = { ...defaultAuditCategories, ...data.auditCategories };
            if (data.documents) state.documents = data.documents;
            if (data.externalRegInfo) state.externalRegInfo = data.externalRegInfo;
          } else {
             if (Array.isArray(data)) {
                 if (colName === 't_inbox_documents') {
                     state[colName] = data.map(d => ({
                        id: d.id, fileName: d.fileName, fileUrl: d.fileUrl, receivedAt: d.receivedAt,
                        status: d.status, suggestedType: d.suggestedType,
                        parsedData: d.parsedData ? {
                          date: d.parsedData.date, expiryDate: d.parsedData.expiryDate, partnerName: d.parsedData.partnerName,
                          lotNumber: d.parsedData.lotNumber, items: Array.isArray(d.parsedData.items) ? d.parsedData.items.map(item => ({
                            ingredientName: item.ingredientName || item.materialName || '', quantity: item.quantity || '1',
                            unit: item.unit || 'kg', type: item.type || 'organic'
                          })) : []
                        } : null
                     }));
                 } else {
                     state[colName] = data;
                 }
             }
          }
          
          saveStore();
          isSyncingFromCloud = false;
        } else {
          // If ANY collection is missing, we likely need to migrate local data up
          if (colName === 'menus' && state.menus && state.menus.length > 0) {
              needsMigration = true;
          }
          if (colName === 'ingredients' && state.ingredients && state.ingredients.length > 0) {
              needsMigration = true;
          }
        }
        
        loadedCount++;
        // If all collections checked and migration is needed
        if (loadedCount === collections.length && needsMigration) {
            console.log('[Firestore Sync] 初回マイグレーション実行：ローカルからクラウドへ');
            syncStoreToCloud();
        }
      }, (error) => {
        console.warn('[Firestore Sync] 同期エラー:', colName, error);
      });
    });
  }

  async function syncStoreToCloud() {
    try {
      console.log('[Firestore Sync] クラウドへの分割保存を開始...');
      const promises = [
        setDoc(doc(db, 'restaurants', 'menus'), { data: JSON.parse(JSON.stringify(state.menus || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'ingredients'), { data: JSON.parse(JSON.stringify(state.ingredients || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'receipts'), { data: JSON.parse(JSON.stringify(state.receipts || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'cookingLogs'), { data: JSON.parse(JSON.stringify(state.cookingLogs || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'cleaningLogs'), { data: JSON.parse(JSON.stringify(state.cleaningLogs || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'manualChapters'), { data: JSON.parse(JSON.stringify(state.manualChapters || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'auditDocuments'), { data: JSON.parse(JSON.stringify(state.auditDocuments || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 't_inbox_documents'), { data: JSON.parse(JSON.stringify(state.t_inbox_documents || [])) }, { merge: true }),
        setDoc(doc(db, 'restaurants', 'meta'), { 
          data: {
            auditCategories: JSON.parse(JSON.stringify(state.auditCategories || {})),
            documents: JSON.parse(JSON.stringify(state.documents || {})),
            externalRegInfo: JSON.parse(JSON.stringify(state.externalRegInfo || {}))
          }
        }, { merge: true })
      ];
      await Promise.all(promises);
      console.log('[Firestore Sync] 全データの分割保存完了');
    } catch (error) {
      console.error('[Firestore Sync] 保存失敗:', error);
      // Fallback: If still too large, we might need to strip images or ignore
      if (error.code === 'invalid-argument' && error.message.includes('longer than 1048487 bytes')) {
         console.warn("データが1MBの制限を超えました。容量超過を回避するため、画像の同期をスキップして再試行します...");
         const menusNoImg = JSON.parse(JSON.stringify(state.menus || [])).map(m => {
             const m2 = {...m};
             delete m2.imageUrl; delete m2.sampleImageUrl;
             return m2;
         });
         try {
             await setDoc(doc(db, 'restaurants', 'menus'), { data: menusNoImg }, { merge: true });
             console.log('[Firestore Sync] 画像を除外してメニューを保存しました。');
         } catch(e2) {
             console.error("再試行も失敗:", e2);
         }
      }
    }
  }
  
  `;
        content = content.replace(block, replacement);
        console.log('initFirestoreSync and syncStoreToCloud modified for multi-document.');
    }
}

fs.writeFileSync(path, content, 'utf8');
console.log('Done multi-document fix.');
