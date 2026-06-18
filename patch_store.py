filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# Add constant at top
const_str = "const AUDIT_DOCS_MIGRATION_VERSION = 'audit-docs-import-2026.06';\n"
if const_str not in content:
    content = content.replace("const MENU_APPROVER_VERSION = 'approver-nakamura-tanaka-2026.06';", 
        "const MENU_APPROVER_VERSION = 'approver-nakamura-tanaka-2026.06';\n" + const_str)

# Add migration function
migration_func = """
// 追加PDFドキュメントを監査ドキュメントセンターへ一度だけ移行する
function migrateNewAuditDocs(parsed) {
  if (parsed && parsed.auditDocsMigrationVersion === AUDIT_DOCS_MIGRATION_VERSION) return;
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
  state.auditDocuments.push(...newDocs);
}
"""
if 'function migrateNewAuditDocs' not in content:
    content = content.replace("// 即時初期化", migration_func + "\n// 即時初期化")

# Call migration function inside loadStore
call_func = "    migrateNewAuditDocs(rawData ? JSON.parse(rawData) : null);"
if 'migrateNewAuditDocs(' not in content:
    content = content.replace("migrateMenuApprovers(rawData ? JSON.parse(rawData) : null);",
        "migrateMenuApprovers(rawData ? JSON.parse(rawData) : null);\n" + call_func)

# Save version flag in saveStore
save_flag = "      auditDocsMigrationVersion: AUDIT_DOCS_MIGRATION_VERSION,"
if 'auditDocsMigrationVersion:' not in content:
    content = content.replace("menuApproverVersion: MENU_APPROVER_VERSION,",
        "menuApproverVersion: MENU_APPROVER_VERSION,\n" + save_flag)

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('Patch applied successfully.')
