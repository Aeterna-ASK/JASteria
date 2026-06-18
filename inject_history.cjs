const fs = require('fs');

const file = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue';
let content = fs.readFileSync(file, 'utf8');

// 1. Add History State
if (!content.includes('const showHistoryModal = ref(false);')) {
  const stateCode = `
// 改訂履歴モーダル
const showHistoryModal = ref(false);
const historyMenuMasterName = ref('');
const historyVersions = computed(() => {
  if (!historyMenuMasterName.value) return [];
  return state.menus.filter(m => (m.masterName || m.name) === historyMenuMasterName.value)
    .sort((a, b) => b.id.localeCompare(a.id)); // Newer first
});

const openHistoryModal = (masterName) => {
  historyMenuMasterName.value = masterName;
  showHistoryModal.value = true;
};
`;
  content = content.replace('const showSpecSheet = ref(false);', stateCode + '\nconst showSpecSheet = ref(false);');
}

// 2. Add Save as New Version action inside saveMenu()
if (!content.includes('saveAsNewVersion')) {
  const saveActionCode = `
const saveAsNewVersion = () => {
  if (!form.value.name.trim()) {
    errorMessage.value = 'メニュー名を入力してください。';
    return;
  }
  if (form.value.recipe.some(r => !r.ingredientId || r.amount <= 0)) {
    errorMessage.value = 'レシピのすべての原材料について、正しい原材料の選択と0より大きい重量を設定してください。';
    return;
  }

  try {
    const newVersionName = prompt('新しい改訂版の名前を入力してください（例：第2版、2025年秋 等）', '新バージョン');
    if (!newVersionName) return;

    // 現在の最新版をアーカイブ
    if (currentId.value) {
      const oldMenu = state.menus.find(m => m.id === currentId.value);
      if (oldMenu) {
        restaurantStore.updateMenu(oldMenu.id, { ...oldMenu, isActiveVersion: false });
      }
    }

    // 新しいバージョンを作成
    const newMenuData = { ...form.value, isActiveVersion: true, versionName: newVersionName };
    // masterNameが未設定なら設定
    if (!newMenuData.masterName) {
      newMenuData.masterName = newMenuData.name;
    }
    restaurantStore.addMenu(newMenuData);

    showRecipeModal.value = false;
    showModal.value = false;
  } catch (err) {
    errorMessage.value = err.message;
  }
};
`;
  content = content.replace('// 削除アクション', saveActionCode + '\n// 削除アクション');
}

// 3. Add History Modal Template
if (!content.includes('history-modal')) {
  const historyModalTemplate = `
    <!-- 改訂履歴モーダル -->
    <Teleport to="body">
      <div v-if="showHistoryModal" class="modal-backdrop no-print">
        <div class="modal animate-fade-in-up" style="max-width: 800px; width: 95vw; max-height: 85vh; display: flex; flex-direction: column;">
          <div class="modal-header" style="background: linear-gradient(to right, #f1f5f9, #e2e8f0); border-bottom: 1px solid #cbd5e1;">
            <h3 style="margin: 0; color: #334155; display: flex; align-items: center; gap: 0.5rem;"><Calendar :size="18" /> 「{{ historyMenuMasterName }}」の改訂履歴</h3>
            <button class="btn-close" @click="showHistoryModal = false" style="background: transparent; border: none; font-size: 1.2rem; cursor: pointer; color: #64748b;"><X :size="20" /></button>
          </div>
          <div class="modal-body p-6" style="overflow-y: auto; background: #f8fafc;">
            <div v-for="(vMenu, index) in historyVersions" :key="vMenu.id" class="history-card mb-4" style="background: white; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1rem; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
              <div class="flex justify-between items-center mb-3">
                <div class="flex items-center gap-2">
                  <span v-if="vMenu.isActiveVersion" style="background: #10b981; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">最新版 (利用中)</span>
                  <span v-else style="background: #94a3b8; color: white; padding: 0.2rem 0.5rem; border-radius: 4px; font-size: 0.7rem; font-weight: bold;">旧版 (アーカイブ)</span>
                  <h4 style="margin: 0; font-size: 1rem; color: #1e293b; font-weight: bold;">{{ vMenu.versionName || '名称未設定' }}</h4>
                  <span style="font-size: 0.75rem; color: #64748b;">(登録: {{ vMenu.targetCreatedDate || '不明' }})</span>
                </div>
                <div>
                  <button class="btn btn-outline btn-xs flex items-center gap-1" style="background-color: #f0fdf4; border-color: #bbf7d0; color: #166534;" @click="openSpecSheetModal(vMenu)">
                    <FileText :size="14" /> 監査表表示
                  </button>
                </div>
              </div>
              <div style="font-size: 0.8rem; color: #475569; background: #f1f5f9; padding: 0.75rem; border-radius: 6px;">
                <div style="font-weight: bold; margin-bottom: 0.25rem;">📝 JAS変更内容・履歴:</div>
                <div style="margin-bottom: 0.5rem;">{{ vMenu.changeDetails || '記載なし' }}</div>
                
                <div style="font-weight: bold; margin-bottom: 0.25rem;">⚖️ レシピ配合 (有機率: {{ vMenu.organicRatio }}%):</div>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                  <span v-for="item in vMenu.recipeDetails" :key="item.ingredientId" style="background: white; border: 1px solid #cbd5e1; padding: 0.15rem 0.4rem; border-radius: 4px; font-size: 0.75rem;">
                    {{ item.name }} ({{ item.amount }}g)
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
`;
  content = content.replace('<!-- 統合型・新規/編集モーダル (大画面配合デザイナーベース) (v1.3.1) -->', historyModalTemplate + '\n    <!-- 統合型・新規/編集モーダル (大画面配合デザイナーベース) (v1.3.1) -->');
}

// 4. Update Modal save buttons to include "Save as New Version"
const originalButtons = `<button type="button" class="btn btn-outline" @click="showRecipeModal = false" style="background: white; border: 1.5px solid #cbd5e1; color: #475569; font-weight: 600; padding: 0.6rem 1.25rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">キャンセル</button>
            <button type="button" class="btn btn-primary" @click="saveMenu" style="background: linear-gradient(to right, #801c15, #b42b23); border: none; font-weight: bold; padding: 0.6rem 1.5rem; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(128, 28, 21, 0.2); display: flex; align-items: center; gap: 0.5rem;">`;

const newButtons = `<button type="button" class="btn btn-outline" @click="showRecipeModal = false" style="background: white; border: 1.5px solid #cbd5e1; color: #475569; font-weight: 600; padding: 0.6rem 1.25rem; font-size: 0.95rem; display: flex; align-items: center; gap: 0.5rem;">キャンセル</button>
            <button v-if="isEditing" type="button" class="btn" @click="saveAsNewVersion" style="background: #10b981; color: white; border: none; font-weight: bold; padding: 0.6rem 1.5rem; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(16, 185, 129, 0.2); display: flex; align-items: center; gap: 0.5rem;">
              ✨ 新バージョンとして改訂
            </button>
            <button type="button" class="btn btn-primary" @click="saveMenu" style="background: linear-gradient(to right, #801c15, #b42b23); border: none; font-weight: bold; padding: 0.6rem 1.5rem; font-size: 0.95rem; box-shadow: 0 4px 6px -1px rgba(128, 28, 21, 0.2); display: flex; align-items: center; gap: 0.5rem;">`;

content = content.replace(originalButtons, newButtons);

fs.writeFileSync(file, content, 'utf8');
console.log('Injected history modal and actions successfully.');
