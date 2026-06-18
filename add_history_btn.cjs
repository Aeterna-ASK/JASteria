const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(filePath, 'utf8');

const targetStr = '<button class="btn btn-outline btn-xs" @click="openEditModal(menu)">';
const historyBtn = `            <button class="btn btn-outline btn-xs flex items-center gap-1" @click="openHistoryModal(menu.masterName || menu.name)">
              <Calendar :size="14" /> 履歴
            </button>\n            `;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, historyBtn + targetStr);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Successfully inserted history button.');
} else {
    console.log('Could not find target string.');
}
