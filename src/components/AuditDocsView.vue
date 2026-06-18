<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  FolderArchive, ShieldCheck, FileText, Search, Calendar, 
  Trash2, X, Plus, Printer, AlertTriangle, Layers, Eye
} from 'lucide-vue-next';

const state = restaurantStore.state;
const ingredients = computed(() => state.ingredients || []);
const auditDocuments = computed(() => state.auditDocuments || []);

// 検索 & フィルター
const searchQuery = ref('');
const activeFilter = ref('all'); // all, jas_cert, contract, analysis, machine, other

// カテゴリ編集用のアコーディオン状態
const showCategoryEdit = ref(false);
const editCategories = ref({
  contract: state.auditCategories?.contract || '委託契約書',
  analysis: state.auditCategories?.analysis || '分析・検査表',
  machine: state.auditCategories?.machine || '設備保守管理表',
  other: state.auditCategories?.other || 'その他資料'
});

// state.auditCategories がストア側で更新されたら editCategories も同期する
watch(() => state.auditCategories, (newVal) => {
  if (newVal) {
    editCategories.value = {
      contract: newVal.contract || '委託契約書',
      analysis: newVal.analysis || '分析・検査表',
      machine: newVal.machine || '設備保守管理表',
      other: newVal.other || 'その他資料'
    };
  }
}, { deep: true });

// カテゴリ変更の保存
const saveCategories = () => {
  if (!editCategories.value.contract.trim() || !editCategories.value.analysis.trim() || !editCategories.value.machine.trim() || !editCategories.value.other.trim()) {
    alert('カテゴリ名は空欄にできません。');
    return;
  }
  restaurantStore.updateAuditCategory('contract', editCategories.value.contract.trim());
  restaurantStore.updateAuditCategory('analysis', editCategories.value.analysis.trim());
  restaurantStore.updateAuditCategory('machine', editCategories.value.machine.trim());
  restaurantStore.updateAuditCategory('other', editCategories.value.other.trim());
  showCategoryEdit.value = false;
  alert('フィルターカテゴリ名称を保存しました。');
};

// デフォルト値に戻す
const resetCategoriesToDefault = () => {
  if (confirm('フィルター名称をデフォルト（初期値）に戻しますか？')) {
    editCategories.value = {
      contract: '委託契約書',
      analysis: '分析・検査表',
      machine: '設備保守管理表',
      other: 'その他資料'
    };
    restaurantStore.updateAuditCategory('contract', '委託契約書');
    restaurantStore.updateAuditCategory('analysis', '分析・検査表');
    restaurantStore.updateAuditCategory('machine', '設備保守管理表');
    restaurantStore.updateAuditCategory('other', 'その他資料');
    showCategoryEdit.value = false;
    alert('フィルター名称を初期値に戻しました。');
  }
};

// 全ての監査資料をクローリング・統合してデコード
const allDocuments = computed(() => {
  const list = [];
  
  // 1. 原材料マスタから「有機JAS適合証明書」をクローリング
  ingredients.value.forEach(ing => {
    if (ing.type === 'organic' && (ing.jasCertUrl || ing.certUrl)) {
      list.push({
        id: `jas-cert-${ing.id}`,
        sourceType: 'jas_cert', // 適合証明書
        type: '適合証明書',
        title: `有機JAS適合証明書: ${ing.name}`,
        partnerName: ing.supplier || '不明な仕入先',
        date: ing.certificateExpiry ? `${ing.certificateExpiry} まで有効` : '有効期限未指定',
        rawDate: ing.certificateExpiry || '',
        fileUrl: ing.jasCertUrl || ing.certUrl,
        notes: ing.certificateExpiry ? `食材マスタに登録されている「${ing.name}」の適合証明書です。有効期限: ${ing.certificateExpiry}` : `食材マスタ「${ing.name}」の適合証明書。`
      });
    }
  });

  // 2. 登録されたその他監査資料
  auditDocuments.value.forEach(doc => {
    let category = 'other';
    const cats = state.auditCategories || { contract: '委託契約書', analysis: '分析・検査表', machine: '設備保守管理表', other: 'その他資料' };
    
    if (doc.type && cats.contract && doc.type.includes(cats.contract)) category = 'contract';
    else if (doc.type && cats.analysis && (doc.type.includes(cats.analysis) || doc.type.includes('分析') || doc.type.includes('成分'))) category = 'analysis';
    else if (doc.type && cats.machine && (doc.type.includes(cats.machine) || doc.type.includes('設備') || doc.type.includes('保守') || doc.type.includes('機械'))) category = 'machine';

    list.push({
      id: doc.id,
      sourceType: 'audit_doc', // その他監査資料
      type: doc.type || 'その他資料',
      categoryType: category,
      title: doc.title || '無題の監査資料',
      partnerName: doc.supplier || '不明な発行元',
      date: doc.date || '',
      rawDate: doc.date || '',
      fileUrl: doc.fileUrl,
      notes: doc.notes || ''
    });
  });

  // 日付の降順でソート
  return list.sort((a, b) => b.rawDate.localeCompare(a.rawDate));
});

// フィルタリングされたドキュメント
const filteredDocuments = computed(() => {
  return allDocuments.value.filter(doc => {
    // 検索語マッチング
    const matchesSearch = doc.title.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          doc.partnerName.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          doc.type.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          doc.notes.toLowerCase().includes(searchQuery.value.toLowerCase());
    
    // カテゴリフィルター
    if (activeFilter.value === 'all') return matchesSearch;
    if (activeFilter.value === 'jas_cert') return doc.sourceType === 'jas_cert' && matchesSearch;
    if (activeFilter.value === 'contract') return doc.categoryType === 'contract' && matchesSearch;
    if (activeFilter.value === 'analysis') return doc.categoryType === 'analysis' && matchesSearch;
    if (activeFilter.value === 'machine') return doc.categoryType === 'machine' && matchesSearch;
    if (activeFilter.value === 'other') return doc.sourceType === 'audit_doc' && doc.categoryType === 'other' && matchesSearch;
    
    return matchesSearch;
  });
});

// 統計データ
const stats = computed(() => {
  const jasCerts = allDocuments.value.filter(d => d.sourceType === 'jas_cert').length;
  const auditDocs = allDocuments.value.filter(d => d.sourceType === 'audit_doc').length;
  
  return {
    total: allDocuments.value.length,
    jasCerts,
    auditDocs
  };
});

// モーダル・プレビュー関連
const showPreviewModal = ref(false);
const previewItem = ref(null);
const previewBlobUrl = ref(null);

// 安全にBase64データをBlob URLに変換する共通ヘルパー
const convertToBlobUrlIfNeeded = (fileUrl) => {
  if (!fileUrl) return '';
  if (fileUrl.startsWith('data:')) {
    try {
      const parts = fileUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)[1];
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      return URL.createObjectURL(blob);
    } catch (e) {
      console.error('Blob URLの変換に失敗しました:', e);
      return fileUrl;
    }
  }
  return fileUrl;
};

const openPreview = (item) => {
  previewItem.value = item;
  // 古いBlob URLがあれば解放
  if (previewBlobUrl.value && previewBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
  previewBlobUrl.value = convertToBlobUrlIfNeeded(item.fileUrl);
  showPreviewModal.value = true;
};

const closePreview = () => {
  showPreviewModal.value = false;
  // Blob URLメモリ解放
  if (previewBlobUrl.value && previewBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
  previewBlobUrl.value = null;
  previewItem.value = null;
};

// 安全かつ同期的（ポップアップブロック回避）に別タブでプレビュー・印刷画面を開く関数
const openSecureWindow = (fileUrl) => {
  if (!fileUrl) return;
  try {
    const targetUrl = convertToBlobUrlIfNeeded(fileUrl);
    const newWindow = window.open(targetUrl, '_blank');
    if (!newWindow) {
      alert('ポップアップがブロックされました。ブラウザのアドレスバー右側にあるポップアップブロック設定を確認し、このサイトでのポップアップを許可してください。');
    }
  } catch (err) {
    console.error('証明書の表示エラー:', err);
    alert('証明書の表示に失敗しました: ' + err.message);
  }
};

// 資料の削除 (その他監査資料のみ)
const deleteDocumentItem = (item) => {
  if (item.sourceType !== 'audit_doc') {
    alert('有機JAS適合証明書は「原材料マスター」画面から削除または更新してください。');
    return;
  }
  
  if (confirm(`この監査資料「${item.title}」を完全に削除してもよろしいですか？`)) {
    restaurantStore.deleteAuditDocument(item.id);
    alert('資料を削除しました。');
  }
};

// 新規手動登録モーダル (UX Safety: 受信箱を経由しない直接登録もおもてなし提供)

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

const showAddModal = ref(false);
const newDocForm = ref({
  date: new Date().toISOString().split('T')[0],
  type: state.auditCategories?.contract || '委託契約書',
  title: '',
  supplier: '',
  notes: '',
  fileUrl: ''
});

const openAddModal = () => {
  newDocForm.value = {
    date: new Date().toISOString().split('T')[0],
    type: state.auditCategories?.contract || '委託契約書',
    title: '',
    supplier: '',
    notes: '',
    fileUrl: ''
  };
  showAddModal.value = true;
};

const handleFileUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    newDocForm.value.fileUrl = e.target.result;
    if (!newDocForm.value.title) {
      // ファイル名をデフォルトタイトルに設定 (拡張子除外)
      newDocForm.value.title = file.name.replace(/\.[^/.]+$/, "");
    }
  };
  reader.readAsDataURL(file);
};

const saveManualDocument = () => {
  if (!newDocForm.value.title.trim()) {
    alert('資料の名称を入力してください。');
    return;
  }
  if (!newDocForm.value.fileUrl) {
    alert('スキャンしたファイルまたは画像を選択してください。');
    return;
  }

  restaurantStore.addAuditDocument(newDocForm.value);
  showAddModal.value = false;
  alert('監査ドキュメントを追加しました！');
};

onUnmounted(() => {
  if (previewBlobUrl.value && previewBlobUrl.value.startsWith('blob:')) {
    URL.revokeObjectURL(previewBlobUrl.value);
  }
});
</script>

<template>
  <div class="animate-fade-in">
    <!-- ページヘッダー -->
    <div class="view-header mb-6">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><FolderArchive :size="24" /> 📂 監査ドキュメントセンター</h2>
        <p class="text-sub">有機JAS年次審査に対応するため、適合証明書や委託契約書、検査証明書などの適合エビデンス資料を一元管理・印刷できる中央書庫です。</p>
      </div>
      <button class="btn btn-primary flex items-center gap-1" @click="openAddModal">
        <Plus :size="18" /> 手動で資料を追加
      </button>
    </div>

    <!-- 統計ミニカード -->
    <div class="grid-cols-3 mb-6" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1.5rem;">
      <div class="card p-4 flex items-center gap-4" style="background: var(--bg-card); border: 1px solid var(--border);">
        <div class="p-3 rounded-md bg-primary-light" style="color: var(--primary); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
          <FolderArchive :size="24" />
        </div>
        <div>
          <div class="text-xs text-sub">保管資料の総数</div>
          <div class="text-2xl font-bold font-mono">{{ stats.total }} <span class="text-xs text-sub">件</span></div>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-4" style="background: var(--bg-card); border: 1px solid var(--border);">
        <div class="p-3 rounded-md bg-accent-light" style="color: var(--accent); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px;">
          <ShieldCheck :size="24" />
        </div>
        <div>
          <div class="text-xs text-sub">有機JAS適合証明書</div>
          <div class="text-2xl font-bold font-mono">{{ stats.jasCerts }} <span class="text-xs text-sub">件</span></div>
        </div>
      </div>

      <div class="card p-4 flex items-center gap-4" style="background: var(--bg-card); border: 1px solid var(--border);">
        <div class="p-3 rounded-md bg-neutral-100" style="color: var(--text-light); display: flex; align-items: center; justify-content: center; width: 48px; height: 48px; border: 1px solid #ddd;">
          <FileText :size="24" />
        </div>
        <div>
          <div class="text-xs text-sub">その他適合監査資料</div>
          <div class="text-2xl font-bold font-mono">{{ stats.auditDocs }} <span class="text-xs text-sub">件</span></div>
        </div>
      </div>
    </div>

    <!-- 検索 & フィルターバー -->
    <div class="filter-bar card mb-6" style="display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem;">
      <div class="search-input-wrapper w-full" style="position: relative;">
        <Search class="search-icon" :size="18" style="position: absolute; left: 0.75rem; top: 50%; transform: translateY(-50%); color: var(--text-light);" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="資料名、発行元・仕入先、種別、メモ内容で検索..." 
          class="input-organic w-full"
          style="padding-left: 2.25rem; width: 100%;"
        />
      </div>
      
      <div class="filter-options" style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap;">
          <label class="filter-label" style="font-size: 0.85rem; font-weight: 600; color: var(--text-sub); white-space: nowrap;">資料種別フィルター：</label>
          <div class="filter-buttons" style="display: flex; background: var(--bg-sub); padding: 0.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border); gap: 0.25rem; flex-wrap: wrap;">
            <button 
              :class="['filter-btn', activeFilter === 'all' ? 'active' : '']" 
              @click="activeFilter = 'all'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              すべて
            </button>
            <button 
              :class="['filter-btn', activeFilter === 'jas_cert' ? 'active' : '']" 
              @click="activeFilter = 'jas_cert'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              有機JAS証明書
            </button>
            <button 
              :class="['filter-btn', activeFilter === 'contract' ? 'active' : '']" 
              @click="activeFilter = 'contract'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              {{ state.auditCategories?.contract || '委託契約書' }}
            </button>
            <button 
              :class="['filter-btn', activeFilter === 'analysis' ? 'active' : '']" 
              @click="activeFilter = 'analysis'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              {{ state.auditCategories?.analysis || '分析・検査表' }}
            </button>
            <button 
              :class="['filter-btn', activeFilter === 'machine' ? 'active' : '']" 
              @click="activeFilter = 'machine'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              {{ state.auditCategories?.machine || '設備保守管理表' }}
            </button>
            <button 
              :class="['filter-btn', activeFilter === 'other' ? 'active' : '']" 
              @click="activeFilter = 'other'"
              style="background: none; border: none; padding: 0.35rem 0.75rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer; transition: all 0.2s;"
            >
              {{ state.auditCategories?.other || 'その他資料' }}
            </button>
          </div>
        </div>

        <button 
          @click="showCategoryEdit = !showCategoryEdit" 
          class="btn btn-outline btn-xs flex items-center gap-1"
          style="font-size: 0.75rem; padding: 0.35rem 0.6rem; border-color: var(--border); margin-left: auto; height: 32px;"
        >
          ⚙️ フィルター名称の編集
        </button>
      </div>

      <!-- カテゴリ編集アコーディオンパネル -->
      <div 
        v-if="showCategoryEdit" 
        class="category-edit-panel animate-fade-in" 
        style="background: var(--bg-sub); padding: 1.25rem; border-radius: var(--radius-sm); border: 1px solid var(--border); margin-top: 0.25rem;"
      >
        <h4 style="margin: 0 0 0.5rem 0; font-size: 0.9rem; font-weight: bold; color: var(--text-main); display: flex; align-items: center; gap: 0.25rem;">
          ⚙️ フィルターカテゴリ名称のカスタマイズ
        </h4>
        <p style="font-size: 0.75rem; color: var(--text-sub); margin: 0 0 1rem 0;">
          店舗の運用規則や独自の呼称に合わせて、各フィルター（書類種別）の名称を自由に変更できます。
          変更した名称はスキャン受信箱の仕分け先選択肢や登録されたカードにもリアルタイムに同期・反映されます。
        </p>
        
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-bottom: 1rem;">
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem; display: block;">① 委託契約書 の呼称</label>
            <input 
              v-model="editCategories.contract" 
              type="text" 
              class="input-organic w-full text-sm" 
              style="padding: 0.4rem 0.5rem;"
              placeholder="例: 委託契約書"
            />
          </div>
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem; display: block;">② 分析・検査表 の呼称</label>
            <input 
              v-model="editCategories.analysis" 
              type="text" 
              class="input-organic w-full text-sm" 
              style="padding: 0.4rem 0.5rem;"
              placeholder="例: 分析・検査表"
            />
          </div>
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem; display: block;">③ 設備保守管理表 の呼称</label>
            <input 
              v-model="editCategories.machine" 
              type="text" 
              class="input-organic w-full text-sm" 
              style="padding: 0.4rem 0.5rem;"
              placeholder="例: 設備保守管理表"
            />
          </div>
          <div class="form-group" style="margin: 0;">
            <label class="form-label" style="font-size: 0.75rem; font-weight: bold; margin-bottom: 0.25rem; display: block;">④ その他資料 の呼称</label>
            <input 
              v-model="editCategories.other" 
              type="text" 
              class="input-organic w-full text-sm" 
              style="padding: 0.4rem 0.5rem;"
              placeholder="例: その他資料"
            />
          </div>
        </div>
        
        <div style="display: flex; justify-content: flex-end; gap: 0.5rem; border-top: 1px solid var(--border); padding-top: 0.75rem;">
          <button 
            class="btn btn-outline btn-xs" 
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem; height: 28px;"
            @click="resetCategoriesToDefault"
          >
            初期値に戻す
          </button>
          <button 
            class="btn btn-primary btn-xs" 
            style="font-size: 0.75rem; padding: 0.25rem 0.5rem; height: 28px;"
            @click="saveCategories"
          >
            変更を保存
          </button>
        </div>
      </div>
    </div>

    <!-- ドキュメントグリッド -->
    <div v-if="filteredDocuments.length === 0" class="empty-state card py-12 text-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center; background: var(--bg-card); border: 1px solid var(--border);">
      <FolderArchive size="48" class="text-light mb-2" style="margin: 0 auto; color: var(--text-light);" />
      <p class="text-sub font-semibold">該当する保管資料が見つかりませんでした。</p>
      <p class="text-xs text-light mt-1">「スキャン受信箱」から監査ドキュメントとして登録するか、右上の「手動で資料を追加」ボタンから資料を登録してください。</p>
    </div>

    <div v-else class="cert-grid animate-fade-in" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem;">
      <div 
        v-for="item in filteredDocuments" 
        :key="item.id" 
        class="cert-card" 
        style="display: flex; flex-direction: column; height: auto; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden; background: var(--bg-card); cursor: pointer;"
        @click="openPreview(item)"
      >
        <!-- ドキュメント種類バッジ -->
        <div class="cert-badge" :style="{
          padding: '0.35rem 0.75rem',
          fontSize: '0.75rem',
          fontWeight: 'bold',
          textAlign: 'center',
          color: 'white',
          backgroundColor: item.sourceType === 'jas_cert' ? 'var(--primary)' : 'var(--accent)'
        }">
          {{ item.type }}
        </div>

        <!-- プレビューサムネイル -->
        <div class="cert-preview-thumb" style="height: 180px; background: var(--bg-main); display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--border);">
          <iframe v-if="item.fileUrl.startsWith('data:application/pdf') || item.fileUrl.includes('pdf')" :src="item.fileUrl + '#toolbar=0'" class="thumb-pdf" frameborder="0" style="width: 100%; height: 100%; overflow: hidden; pointer-events: none;"></iframe>
          <img v-else :src="item.fileUrl" alt="Thumbnail" class="thumb-img" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
        </div>

        <!-- ドキュメント情報 -->
        <div class="cert-info" style="padding: 1rem; flex-grow: 1; display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <h4 class="cert-title truncate" :title="item.title" style="margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: bold; color: var(--text-main);">{{ item.title }}</h4>
            <p class="cert-meta text-xs" style="margin: 0 0 0.25rem 0; color: var(--text-sub);">🏢 発行/仕入元: <strong>{{ item.partnerName }}</strong></p>
            <p class="cert-date text-xs font-mono" style="margin: 0 0 0.5rem 0; color: var(--text-light);">
              📅 {{ item.sourceType === 'jas_cert' ? item.date : `登録日: ${item.date}` }}
            </p>
          </div>
          <div class="notes-box text-xs mt-2" style="background-color: var(--bg-sub); padding: 0.5rem; border-radius: 4px; color: var(--text-sub); border: 1px solid var(--border); max-height: 60px; overflow-y: auto;">
            {{ item.notes || '備考なし' }}
          </div>
        </div>

        <!-- アクションボタン -->
        <div class="cert-actions" style="padding: 0.75rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; flex-wrap: wrap; background: var(--bg-sub);" @click.stop>
          <button class="btn btn-outline btn-xs flex-1 flex items-center justify-center gap-0.5" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openPreview(item)"><Eye :size="12" /> プレビュー</button>
          <button class="btn btn-primary btn-xs flex-1 flex items-center justify-center gap-0.5" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openSecureWindow(item.fileUrl)"><Printer :size="12" /> 印刷</button>
          <button 
            class="btn-icon-only text-primary" 
            style="border: 1px solid var(--border); border-radius: 4px; padding: 0.25rem; background: #fff; margin-left: 4px;" 
            title="資料の編集"
            @click="openEditModal(item)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
          </button>

          <button 
            v-if="item.sourceType === 'audit_doc'"
            class="btn-icon-only text-danger" 
            style="border: 1px solid var(--border); border-radius: 4px; padding: 0.25rem; background: #fff;" 
            title="資料の削除"
            @click="deleteDocumentItem(item)"
          >
            <Trash2 :size="14" />
          </button>
        </div>
      </div>
    </div>

    <!-- フルサイズ拡大表示 & 印刷モーダル -->
    <teleport to="body">
      <div v-if="showPreviewModal" class="modal-overlay" style="z-index: 1200;" @click="closePreview">
        <div class="modal-card animate-fade-in" style="max-width: 800px; width: 90%; height: 85vh;" @click.stop>
          <div class="modal-header">
            <h3 class="flex items-center gap-2" style="margin: 0; font-size: 1.15rem;"><FolderArchive :size="20" /> {{ previewItem?.title }}</h3>
            <button class="btn-close" @click="closePreview">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; background: #faf8f5; overflow: hidden; height: calc(100% - 130px);">
            <div class="meta text-xs text-sub mb-3" style="width: 100%; text-align: center; color: var(--text-light);">
              発行/仕入元: <strong>{{ previewItem?.partnerName }}</strong> | 資料区分: {{ previewItem?.type }}
            </div>
            
            <div style="flex-grow: 1; width: 100%; display: flex; align-items: center; justify-content: center; overflow: hidden; background: #ffffff; border: 1px solid var(--border); border-radius: 4px; padding: 10px;">
              <iframe 
                v-if="previewItem?.fileUrl.startsWith('data:application/pdf') || previewItem?.fileUrl.includes('pdf')" 
                :src="previewBlobUrl" 
                style="width: 100%; height: 100%; border: none;"
              ></iframe>
              <img 
                v-else 
                :src="previewBlobUrl" 
                alt="Audit Document Preview" 
                style="max-width: 100%; max-height: 100%; object-fit: contain;" 
              />
            </div>
          </div>
          <div class="modal-footer" style="background: var(--bg-sub); display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
            <span class="text-xs text-light">※印刷時はブラウザの印刷設定（余白・ヘッダーフッター）を確認してください。</span>
            <div class="flex gap-2" style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline" @click="closePreview">閉じる</button>
              <button class="btn btn-primary flex items-center gap-1" @click="openSecureWindow(previewItem?.fileUrl)">
                <Printer :size="14" /> この資料を印刷する
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    
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


    <!-- 手動追加モーダル -->
    <teleport to="body">
      <div v-if="showAddModal" class="modal-overlay" style="z-index: 1200;">
        <div class="modal-card animate-fade-in" style="max-width: 550px;">
          <div class="modal-header">
            <h3>📂 監査ドキュメントの手動追加</h3>
            <button class="btn-close" @click="showAddModal = false">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <div class="form-group mb-3">
              <label class="form-label">資料の種別・区分 <span class="required">*</span></label>
              <select v-model="newDocForm.type" class="input-organic select-organic">
                <option :value="state.auditCategories?.contract || '委託契約書'">{{ state.auditCategories?.contract || '委託契約書' }}（一般廃棄物・生ゴミ等収集運搬委託契約）</option>
                <option :value="state.auditCategories?.analysis || '製品分析証明書'">{{ state.auditCategories?.analysis || '製品分析証明書' }}（有機JAS製品分析証明・成分分析等）</option>
                <option :value="state.auditCategories?.machine || '機械設備保守点検表'">{{ state.auditCategories?.machine || '機械設備保守点検表' }}（機械器具・冷蔵庫温度保守点検等）</option>
                <option value="適合証明書">適合証明書（その他有機適合証明書類）</option>
                <option :value="state.auditCategories?.other || 'その他資料'">{{ state.auditCategories?.other || 'その他資料' }}（その他・任意資料）</option>
              </select>
            </div>

            <div class="form-group mb-3">
              <label class="form-label">登録日付・受入日 <span class="required">*</span></label>
              <input v-model="newDocForm.date" type="date" class="input-organic" />
            </div>

            <div class="form-group mb-3">
              <label class="form-label">資料の名称・タイトル <span class="required">*</span></label>
              <input v-model="newDocForm.title" type="text" class="input-organic" placeholder="例: 2026年度廃油処理委託契約書" />
            </div>

            <div class="form-group mb-3">
              <label class="form-label">発行元・相手先名</label>
              <input v-model="newDocForm.supplier" type="text" class="input-organic" placeholder="例: 福山環境保全株式会社" />
            </div>

            <div class="form-group mb-4">
              <label class="form-label">資料ファイルの選択（PDFまたは画像） <span class="required">*</span></label>
              <div class="flex items-center gap-3">
                <input type="file" accept="image/*,application/pdf" @change="handleFileUpload" style="display: none;" id="manual-doc-upload-input" />
                <label for="manual-doc-upload-input" class="btn btn-outline btn-sm flex items-center gap-1 cursor-pointer" style="margin: 0;">
                  ファイルを選択...
                </label>
                <span v-if="newDocForm.fileUrl" class="text-xs text-success font-bold">✓ 選択済み</span>
                <span v-else class="text-xs text-sub">※PDF、JPEG、PNG対応。</span>
              </div>
              <!-- サムネイルプレビュー -->
              <div v-if="newDocForm.fileUrl" class="mt-3 text-center" style="position: relative; display: inline-block; max-width: 100%;">
                <iframe v-if="newDocForm.fileUrl.startsWith('data:application/pdf')" :src="newDocForm.fileUrl + '#toolbar=0'" style="height: 120px; width: 160px; border: 1px solid #ddd; border-radius: 4px; pointer-events: none;"></iframe>
                <img v-else :src="newDocForm.fileUrl" alt="Preview" style="max-height: 120px; border-radius: 4px; border: 1px solid #ddd;" />
                <button type="button" @click="newDocForm.fileUrl = ''" style="position: absolute; top: -5px; right: -5px; background: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 20px; height: 20px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">備考・特記事項（監査員向けの補足）</label>
              <textarea v-model="newDocForm.notes" class="input-organic" rows="2" placeholder="この書類に関するメモ、監査時の説明用など..."></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showAddModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="saveManualDocument">資料を登録・保存</button>
          </div>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.view-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 1rem;
}

.view-header h2 {
  margin: 0;
  font-size: 1.6rem;
}

/* フィルターボタン */
.filter-btn {
  font-family: var(--font-sans);
  color: var(--text-sub);
  font-weight: 500;
}

.filter-btn:hover {
  color: var(--primary);
}

.filter-btn.active {
  background-color: var(--bg-card) !important;
  color: var(--primary) !important;
  box-shadow: var(--shadow-sm);
  font-weight: 600;
  border: 1px solid var(--border) !important;
}

/* モーダル */
.modal-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(44, 42, 39, 0.4);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-card {
  background-color: var(--bg-card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-lg);
  width: 100%;
  max-width: 580px;
  display: flex;
  flex-direction: column;
  max-height: 90vh;
}

.modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.2rem;
  color: var(--primary);
}

.btn-close {
  background: none;
  border: none;
  color: var(--text-light);
  cursor: pointer;
  transition: var(--transition);
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
}

.btn-close:hover {
  color: var(--text-main);
  background-color: var(--bg-sub);
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
}

.modal-footer {
  padding: 1.25rem 1.5rem;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.required {
  color: var(--danger);
  margin-left: 0.125rem;
}

.action-buttons-cell {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
}

.btn-icon-only {
  background: none;
  border: none;
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.btn-icon-only:hover {
  background-color: var(--bg-sub);
}
</style>
