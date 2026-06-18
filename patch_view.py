import re

filepath = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/AuditDocsView.vue'
with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add Edit button to card actions
edit_btn = """
          <button 
            class="btn-icon-only text-primary" 
            style="border: 1px solid var(--border); border-radius: 4px; padding: 0.25rem; background: #fff; margin-left: 4px;" 
            title="資料の編集"
            @click="openEditModal(item)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>
"""
if 'openEditModal(item)' not in content:
    content = content.replace(
        '<button class="btn btn-primary btn-xs flex-1 flex items-center justify-center gap-0.5" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openSecureWindow(item.fileUrl)"><Printer :size="12" /> 印刷</button>',
        '<button class="btn btn-primary btn-xs flex-1 flex items-center justify-center gap-0.5" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openSecureWindow(item.fileUrl)"><Printer :size="12" /> 印刷</button>' + edit_btn
    )

# 2. Add Edit Modal state and logic
edit_logic = """
// --- 編集モーダル関連 ---
const showEditModal = ref(false);
const editingDocId = ref(null);
const editingSourceType = ref(null);
const editingIngredientId = ref(null);
const editDocForm = ref({
  date: '',
  type: '',
  title: '',
  supplier: '',
  notes: '',
  fileUrl: ''
});

const openEditModal = (item) => {
  editingSourceType.value = item.sourceType;
  if (item.sourceType === 'jas_cert') {
    // jas_cert-id形式からidを抽出
    const ingId = item.id.replace('jas-cert-', '');
    editingIngredientId.value = ingId;
    editingDocId.value = item.id;
    editDocForm.value = {
      date: item.rawDate || '',
      type: '適合証明書',
      title: item.title,
      supplier: item.partnerName,
      notes: item.notes,
      fileUrl: item.fileUrl
    };
  } else {
    editingDocId.value = item.id;
    editDocForm.value = {
      date: item.rawDate || item.date || '',
      type: item.type || '',
      title: item.title || '',
      supplier: item.partnerName || '',
      notes: item.notes || '',
      fileUrl: item.fileUrl || ''
    };
  }
  showEditModal.value = true;
};

const handleEditFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  if (file.type !== 'application/pdf' && !file.type.startsWith('image/')) {
    alert('PDFまたは画像ファイルを選択してください。');
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    editDocForm.value.fileUrl = e.target.result;
  };
  reader.readAsDataURL(file);
};

const saveEditDocument = () => {
  if (!editDocForm.value.title.trim()) {
    alert('資料名は必須です。');
    return;
  }
  if (!editDocForm.value.fileUrl) {
    alert('スキャンファイルまたは画像が選択されていません。');
    return;
  }

  if (editingSourceType.value === 'jas_cert') {
    // 適合証明書の場合は原材料マスタを更新する
    const originalIng = ingredients.value.find(i => i.id === editingIngredientId.value);
    if (!originalIng) {
      alert('エラー：元の原材料が見つかりません。');
      return;
    }
    
    restaurantStore.updateIngredient(editingIngredientId.value, {
      supplier: editDocForm.value.supplier,
      certificateExpiry: editDocForm.value.date,
      jasCertUrl: editDocForm.value.fileUrl
    });
    
  } else {
    // 通常の監査ドキュメントの場合
    restaurantStore.updateAuditDocument(editingDocId.value, {
      date: editDocForm.value.date,
      type: editDocForm.value.type,
      title: editDocForm.value.title,
      supplier: editDocForm.value.supplier,
      notes: editDocForm.value.notes,
      fileUrl: editDocForm.value.fileUrl
    });
  }

  showEditModal.value = false;
  alert('変更を保存しました！');
};
"""
if 'showEditModal' not in content:
    content = content.replace('// 新規手動登録モード', edit_logic + '\n\n// 新規手動登録モード')

# 3. Add Edit Modal Template
edit_modal_template = """
    <!-- 編集モーダル -->
    <teleport to="body">
      <div v-if="showEditModal" class="modal-overlay" style="z-index: 1200;">
        <div class="modal-card animate-fade-in" style="max-width: 550px;">
          <div class="modal-header">
            <h3>✏️ 監査ドキュメントの編集</h3>
            <button class="btn-close" @click="showEditModal = false">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div v-if="editingSourceType === 'jas_cert'" class="mb-4 p-3 text-sm rounded-md border" style="background-color: #fefce8; color: #854d0e; border-color: #fef08a;">
              ⚠️ これは原材料マスタから自動連携された「有機JAS適合証明書」です。ここで発行元や有効期限、ファイルを編集すると、該当の原材料マスタ側のデータも更新されます。※資料名は編集できません。
            </div>

            <div class="form-group mb-3" v-if="editingSourceType !== 'jas_cert'">
              <label class="form-label">資料の種別・区分 <span class="required">*</span></label>
              <select v-model="editDocForm.type" class="input-organic select-organic">
                <option :value="state.auditCategories?.contract || '委託契約書'">{{ state.auditCategories?.contract || '委託契約書' }}</option>
                <option :value="state.auditCategories?.analysis || '分析・検査表'">{{ state.auditCategories?.analysis || '分析・検査表' }}</option>
                <option :value="state.auditCategories?.machine || '設備保守管理表'">{{ state.auditCategories?.machine || '設備保守管理表' }}</option>
                <option :value="state.auditCategories?.other || 'その他資料'">{{ state.auditCategories?.other || 'その他資料' }}</option>
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">資料名（必須） <span class="required">*</span></label>
              <input v-model="editDocForm.title" type="text" class="input-organic w-full" placeholder="例：生ゴミ処理委託契約書 2026年度版" :disabled="editingSourceType === 'jas_cert'" :style="editingSourceType === 'jas_cert' ? 'background: #f3f4f6;' : ''" />
            </div>

            <div class="grid-cols-2" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
              <div class="form-group mb-3">
                <label class="form-label">発行元・仕入先</label>
                <input v-model="editDocForm.supplier" type="text" class="input-organic w-full" placeholder="例：福山環境保全株式会社" />
              </div>
              <div class="form-group mb-3">
                <label class="form-label">{{ editingSourceType === 'jas_cert' ? '有効期限' : '発行日・登録日' }}</label>
                <input v-model="editDocForm.date" type="date" class="input-organic w-full" />
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">ファイルの再アップロード (PDF/画像)</label>
              <input type="file" accept="application/pdf,image/jpeg,image/png" @change="handleEditFileUpload" class="input-organic w-full text-sm" style="padding: 0.35rem;" />
              <div v-if="editDocForm.fileUrl" class="mt-2 p-2 border rounded bg-gray-50 text-xs text-gray-500 truncate" style="background-color: #f9fafb;">
                現在のファイル: {{ editDocForm.fileUrl.startsWith('data:') ? 'アップロード済みの内部データ' : editDocForm.fileUrl }}
              </div>
            </div>

            <div class="form-group mb-0" v-if="editingSourceType !== 'jas_cert'">
              <label class="form-label">メモ・特記事項（任意）</label>
              <textarea v-model="editDocForm.notes" class="input-organic" rows="2" placeholder="監査の際に説明するポイントなど..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showEditModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="saveEditDocument">変更を保存</button>
          </div>
        </div>
      </div>
    </teleport>
"""
if '✏️ 監査ドキュメントの編集' not in content:
    content = content.replace('<!-- 手動追加モーダル -->', edit_modal_template + '\n\n    <!-- 手動追加モーダル -->')


with open(filepath, 'w', encoding='utf-8') as f:
    f.write(content)
print('AuditDocsView.vue patched successfully.')
