const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let s = fs.readFileSync(file, 'utf8');

// 1. Fix migrateNewAuditDocs
const badAuditDocsStart = s.indexOf('function migrateNewAuditDocs(parsed) {\n  if (!Array.isArray(state.auditDocuments)) {\n  ];');
if (badAuditDocsStart !== -1) {
  const goodAuditDocs = `function migrateNewAuditDocs(parsed) {
  if (!Array.isArray(state.auditDocuments)) {
    state.auditDocuments = [];
  }
  const newDocs = [
    {
      id: 'audit_doc_manual_v6',
      date: '2026-06-02',
      type: 'その他資料',
      title: 'オーガニック料理教育マニュアル（第6版）',
      supplier: '自社（福山黒酢株式会社）',
      fileUrl: '/audit_docs/オーガニック料理教育マニュアル（第6版）.pdf',
      notes: 'オーガニック料理教育マニュアル（第6版）'
    },
    {
      id: 'audit_doc_management_review',
      date: '2026-06-02',
      type: 'その他資料',
      title: 'マネジメントレビュー',
      supplier: '自社（福山黒酢株式会社）',
      fileUrl: '/audit_docs/マネジメントレビュー.pdf',
      notes: 'マネジメントレビュー記録'
    },
    {
      id: 'audit_doc_internal_audit',
      date: '2026-06-02',
      type: 'その他資料',
      title: '内部監査表2025.6',
      supplier: '自社（福山黒酢株式会社）',
      fileUrl: '/audit_docs/内部監査表2025.6.pdf',
      notes: '内部監査表'
    },
    {
      id: 'audit_doc_education_report',
      date: '2026-06-02',
      type: 'その他資料',
      title: '教育訓練報告書',
      supplier: '自社（福山黒酢株式会社）',
      fileUrl: '/audit_docs/教育訓練報告書.pdf',
      notes: '教育訓練報告書'
    },
    {
      id: 'audit_doc_oil_spec',
      date: '2026-06-02',
      type: '分析・検査表',
      title: '規格書_オーガニック ハイオレイック パームオレイン 揚げ油 18kg',
      supplier: '仕入先',
      fileUrl: '/audit_docs/規格書_オーガニック ハイオレイック パームオレイン 揚げ油 18kg RSPO IP_RBD706_20250203 (2).pdf',
      notes: '揚げ油規格書'
    }
  ];`;
  s = s.substring(0, badAuditDocsStart) + goodAuditDocs + s.substring(badAuditDocsStart + 86);
}

// 2. Fix updateCookingLog
const updateCookingLogStart = s.indexOf('function updateCookingLog(id, updatedFields) {\n  const idx = state.cookingLogs.findIndex(c => c.id === id);\n  if (idx !== -1) {\n    onSnapshot');
if (updateCookingLogStart !== -1) {
    const endBlockStr = '    };\n    saveStore();\n    return true;\n  }\n  return false;\n}';
    const updateCookingLogEnd = s.indexOf(endBlockStr, updateCookingLogStart);
    if (updateCookingLogEnd !== -1) {
        const goodUpdateCookingLog = `function updateCookingLog(id, updatedFields) {
  const idx = state.cookingLogs.findIndex(c => c.id === id);
  if (idx !== -1) {
    state.cookingLogs[idx] = {
      ...state.cookingLogs[idx],
      ...updatedFields
    };
    saveStore();
    return true;
  }
  return false;
}`;
        s = s.substring(0, updateCookingLogStart) + goodUpdateCookingLog + s.substring(updateCookingLogEnd + endBlockStr.length);
    }
}

// 3. Fix the real onSnapshot
const realOnSnapStartStr = "  const docRef = doc(db, 'restaurants', 'default');\n  onSnapshot(docRef, (docSnap) => {";
const realOnSnapEndStr = "    }, (error) => {\n      console.warn('[Firestore Sync] A^CG[iItCj:', error);\n    });\n  }"; // We'll just indexof '  syncStoreToCloud()'
let realOnSnapStart = s.indexOf(realOnSnapStartStr);
if (realOnSnapStart !== -1) {
    // Find the end of this block
    const endStr = "    });\n  }";
    const realOnSnapEnd = s.indexOf(endStr, realOnSnapStart);
    if (realOnSnapEnd !== -1) {
        const newOnSnapshot = `  const docRef = doc(db, 'restaurants', 'default');
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
  }`;
        s = s.substring(0, realOnSnapStart) + newOnSnapshot + s.substring(realOnSnapEnd + endStr.length);
    }
}

fs.writeFileSync(file, s);
console.log('Fixed restaurantStore.js');
