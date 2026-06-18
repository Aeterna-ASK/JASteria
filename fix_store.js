import fs from 'fs';

const p = 'C:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/store/restaurantStore.js';
let content = fs.readFileSync(p, 'utf8');

// 1. Add definitions at top
if (!content.includes('let isSyncingFromCloud = false;\nlet isFirestoreSyncInitialized = false;')) {
    content = content.replace("const AUDIT_DOCS_MIGRATION_VERSION = 'audit-docs-import-2026.06-v2';", "const AUDIT_DOCS_MIGRATION_VERSION = 'audit-docs-import-2026.06-v2';\n\nlet isSyncingFromCloud = false;\nlet isFirestoreSyncInitialized = false;");
}

// 2. Remove old definitions
content = content.replace("let isFirestoreSyncInitialized = false;\nlet isSyncingFromCloud = false;\n\nfunction initFirestoreSync()", "function initFirestoreSync()");

fs.writeFileSync(p, content, 'utf8');
console.log("Fixed restaurantStore.js");
