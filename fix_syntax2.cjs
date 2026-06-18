const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let s = fs.readFileSync(file, 'utf8');

const replacement = `function migrateNewAuditDocs(parsed) {
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
  ];
`;

const startIdx = s.indexOf('function migrateNewAuditDocs(parsed) {');
if (startIdx !== -1) {
    const endIdx = s.indexOf('  if (docsToAdd.length > 0) {\n    state.auditDocuments.push(...docsToAdd);');
    if (endIdx !== -1) {
        s = s.substring(0, startIdx) + replacement + s.substring(endIdx);
    } else {
        console.log('endIdx not found');
    }
} else {
    console.log('startIdx not found');
}

fs.writeFileSync(file, s);
console.log('Repair done.');
