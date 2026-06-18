const fs = require('fs');
const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

const regex = /([ \t]*)<div class="modal-body print-area"/;
const match = content.match(regex);

if (match) {
    const spaces = match[1];
    const replacement = `    <!-- スペックプレビューモーダル (JAS 0004 帳票版) (v1.2.0 Teleport対応) (v1.4.0 帳票リニューアル) -->
    <Teleport to="body">
      <div v-if="showSpecSheet && selectedMenuForSpec" class="modal-backdrop">
      <div class="modal modal-spec animate-fade-in" style="max-width: 900px; width: 95vw; max-height: 95vh; display: flex; flex-direction: column;">
        <div class="modal-header no-print" style="background: linear-gradient(to right, #faf8f5, #f5f0e8); color: #5c3d2e; border-bottom: 1.5px solid #dcd1be; padding: 1rem 1.5rem; display: flex; align-items: center; justify-content: space-between;">
          <h3 class="flex items-center gap-2" style="color: #801c15 !important; margin: 0; font-size: 1.15rem; font-weight: bold; display: flex; align-items: center;">
            <FileText :size="20" style="color: #801c15;" /> 
            <span>JAS 0004 スペック管理票 (格付表示用)</span>
          </h3>
          <div class="flex items-center gap-3">
            <button class="btn btn-outline btn-xs flex items-center gap-1" style="color: #801c15 !important; border-color: #dcd1be !important; background: white !important; font-weight: 600; padding: 0.35rem 0.75rem; border-radius: 4px;" @click="handlePrint">
              <Printer :size="14" style="color: #801c15;" /> 帳票PDF出力
            </button>
            <button class="btn-close" style="color: #68645f !important; display: flex; align-items: center; justify-content: center;" @click="showSpecSheet = false"><X :size="20" /></button>
          </div>
        </div>\n` + match[0];

    content = content.replace(regex, replacement);
    fs.writeFileSync(file, content, 'utf8');
    console.log('Restored modal header successfully.');
} else {
    console.log('modal-body print-area not found.');
}
