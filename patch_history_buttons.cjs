const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

const searchStr = `<div>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;" @click="openSpecSheetModal(vMenu)">
                    <FileText :size="14" /> 監査表表示
                  </button>
                </div>`;

const replaceStr = `<div class="flex items-center gap-2">
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f8fafc; border-color: #cbd5e1; color: #334155;" @click="openEditModal(vMenu); showHistoryModal = false;">
                    <Edit3 :size="14" /> 編集
                  </button>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #fef2f2; border-color: #fecaca; color: #dc2626;" @click="deleteMenu(vMenu.id, vMenu.versionName || vMenu.name)">
                    <Trash2 :size="14" /> 削除
                  </button>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;" @click="openSpecSheetModal(vMenu)">
                    <FileText :size="14" /> 監査表表示
                  </button>
                </div>`;

if (c.includes(searchStr)) {
    c = c.replace(searchStr, replaceStr);
    fs.writeFileSync(targetPath, c, 'utf8');
    console.log('Added edit and delete buttons to history modal.');
} else {
    console.log('Search string not found in MenusView.vue');
}
