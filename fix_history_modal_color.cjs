const fs = require('fs');
const path = require('path');

const filePath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'MenusView.vue');
let c = fs.readFileSync(filePath, 'utf8');

const targetStr = `<div class="modal-header" style="background: linear-gradient(to right, #f1f5f9, #e2e8f0); border-bottom: 1px solid #cbd5e1;">
            <h3 style="margin: 0; color: #334155; display: flex; align-items: center; gap: 0.5rem;"><Calendar :size="18" /> 「{{ historyMenuMasterName }}」の改訂履歴</h3>
            <button class="btn-close" @click="showHistoryModal = false" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;"><X :size="20" /></button>
          </div>`;

const replacementStr = `<div class="history-modal-header" style="padding: 1.25rem 1.5rem; display: flex; align-items: center; justify-content: space-between; background: linear-gradient(to right, #f1f5f9, #e2e8f0); border-bottom: 1px solid #cbd5e1;">
            <h3 style="margin: 0; color: #334155; font-size: 1.25rem; font-weight: bold; display: flex; align-items: center; gap: 0.5rem;"><Calendar :size="18" /> 「{{ historyMenuMasterName }}」の改訂履歴</h3>
            <button @click="showHistoryModal = false" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b; display: flex; align-items: center; justify-content: center; padding: 0.5rem; border-radius: 4px; transition: background-color 0.2s;" onmouseover="this.style.backgroundColor='rgba(0,0,0,0.05)'" onmouseout="this.style.backgroundColor='transparent'"><X :size="20" /></button>
          </div>`;

if (c.includes(targetStr)) {
    c = c.replace(targetStr, replacementStr);
    fs.writeFileSync(filePath, c, 'utf8');
    console.log('Fixed history modal header coloring.');
} else {
    console.log('Could not find target string to fix.');
    // Let's print out what is actually there to debug
    const startIdx = c.indexOf('{{ historyMenuMasterName }}」の改訂履歴</h3>');
    if (startIdx > -1) {
        console.log("Found near text:", c.substring(startIdx - 150, startIdx + 200));
    }
}
