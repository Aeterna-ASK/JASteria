<script setup>
import { ref, computed } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  TrendingUp, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  Search,
  Calendar,
  ClipboardList,
  User,
  ShieldCheck,
  RefreshCw
} from 'lucide-vue-next';

const state = restaurantStore.state;
const decodedReceipts = computed(() => restaurantStore.decodedReceipts);
const ingredients = computed(() => state.ingredients);

const hasMasterPhoto = (ingredientId) => {
  if (!ingredientId) return false;
  const ingredient = state.ingredients.find(i => i.id === ingredientId);
  return ingredient ? !!(ingredient.jasPhoto || ingredient.jasCertUrl || ingredient.certUrl) : false;
};

// スキャン証明書関連の追加ステート・関数
const activeSubTab = ref('records'); // 'records' または 'certificates'
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

const scannedCertificates = computed(() => {
  const list = [];
  
  // 1. 原材料マスタに紐付く有機JAS適合証明書
  ingredients.value.forEach(ing => {
    if (ing.type === 'organic' && (ing.jasCertUrl || ing.certUrl)) {
      list.push({
        id: `cert-${ing.id}`,
        type: 'jas_cert',
        title: `有機JAS適合証明書: ${ing.name}`,
        sourceName: ing.name,
        supplier: ing.supplier || '不明な仕入先',
        fileUrl: ing.jasCertUrl || ing.certUrl,
        date: ing.certificateExpiry ? `${ing.certificateExpiry} まで有効` : '有効期限未指定'
      });
    }
  });
  
  // 2. 受入記録に紐付く納品書（JASマーク写真やスキャンデータ）
  decodedReceipts.value.forEach(rec => {
    if (rec.jasPhoto) {
      list.push({
        id: `receipt-${rec.id}`,
        type: 'receipt_scan',
        title: `受入点検エビデンス: ${rec.ingredientName}`,
        sourceName: rec.ingredientName,
        supplier: rec.supplier || '不明な仕入先',
        fileUrl: rec.jasPhoto,
        date: `${rec.date} 受入 (ロット: ${rec.lotNumber})`
      });
    }
  });
  
  return list;
});

// 検索 & フィルター
const searchQuery = ref('');
const filterType = ref('all'); // all, organic, general
const filterStartMonth = ref('');
const filterEndMonth = ref('');
const selectedSupplier = ref(''); // すべての業者

// 抽出可能な年月リストの作成 (降順)
const availableMonths = computed(() => {
  const months = new Set();
  decodedReceipts.value.forEach(rec => {
    if (rec.date) {
      months.add(rec.date.substring(0, 7));
    }
  });
  return Array.from(months).sort((a, b) => b.localeCompare(a));
});

// 抽出可能な業者（仕入先）リストの作成 (五十音・アルファベット順)
const availableSuppliers = computed(() => {
  const suppliers = new Set();
  decodedReceipts.value.forEach(rec => {
    if (rec.supplier) {
      suppliers.add(rec.supplier);
    }
  });
  return Array.from(suppliers).sort((a, b) => a.localeCompare(b, 'ja'));
});

// Ri-Ry-Link からの同期ステート
const isSyncing = ref(false);
const syncResult = ref(null);
const syncError = ref(null);

// 認証モーダル関連ステート
const showAuthModal = ref(false);
const authForm = ref({
  email: '',
  password: ''
});
const authError = ref('');
const isAuthenticating = ref(false);

const handleSyncFromRiRyLink = async () => {
  isSyncing.value = true;
  syncResult.value = null;
  syncError.value = null;
  authError.value = '';
  try {
    const res = await restaurantStore.syncFromRiRyLink();
    if (res.requiresAuth) {
      showAuthModal.value = true;
    } else {
      syncResult.value = res.message;
      setTimeout(() => {
        syncResult.value = null;
      }, 7000);
    }
  } catch (err) {
    console.error(err);
    syncError.value = err.message || 'Ri-Ry-Linkからの同期に失敗しました。';
  } finally {
    isSyncing.value = false;
  }
};

const submitAuthAndSync = async () => {
  if (!authForm.value.email.trim() || !authForm.value.password.trim()) {
    authError.value = 'メールアドレスとパスワードを入力してください。';
    return;
  }
  
  isAuthenticating.value = true;
  authError.value = '';
  try {
    const res = await restaurantStore.syncFromRiRyLink(authForm.value.email, authForm.value.password);
    if (res.requiresAuth) {
      authError.value = 'ログインに失敗しました。アカウント情報をもう一度お確かめください。';
    } else {
      showAuthModal.value = false;
      syncResult.value = res.message;
      authForm.value.email = '';
      authForm.value.password = '';
      
      setTimeout(() => {
        syncResult.value = null;
      }, 7000);
    }
  } catch (err) {
    console.error(err);
    authError.value = err.message || 'サインインに失敗しました。';
  } finally {
    isAuthenticating.value = false;
  }
};

const selectQuickAccount = (email) => {
  authForm.value.email = email;
};

const filteredReceipts = computed(() => {
  return decodedReceipts.value.filter(rec => {
    const matchesSearch = rec.ingredientName.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          rec.lotNumber.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          rec.checkedBy.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
                          (rec.supplier && rec.supplier.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesFilter = filterType.value === 'all' || rec.ingredientType === filterType.value;
        const recMonth = rec.date ? rec.date.substring(0, 7) : '';
    let matchesMonth = true;
    if (filterStartMonth.value && recMonth < filterStartMonth.value) matchesMonth = false;
    if (filterEndMonth.value && recMonth > filterEndMonth.value) matchesMonth = false;
    const matchesSupplier = !selectedSupplier.value || rec.supplier === selectedSupplier.value;
    return matchesSearch && matchesFilter && matchesMonth && matchesSupplier;
  });
});

// モーダル・フォーム状態
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

const form = ref({
  date: '',
  ingredientId: '',
  quantity: 1,
  unit: 'kg', // 新規：単位
  lotNumber: '',
  checkedBy: '',
  isSeparated: true,
  hasJasLabelVerified: true,
  isClean: true,
  status: 'good',
  notes: '',
  jasPhoto: '' // 新規：JASマーク写真データ
});

const errorMessage = ref('');

// モーダルオープン (新規)
const openAddModal = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = {
    date: new Date().toISOString().split('T')[0],
    ingredientId: ingredients.value[0]?.id || '',
    quantity: 1,
    unit: 'kg', // 新規：単位
    lotNumber: '',
    checkedBy: state.restaurantInfo.cookManager || state.restaurantInfo.manager,
    isSeparated: true,
    hasJasLabelVerified: true,
    isClean: true,
    status: 'good',
    notes: '',
    jasPhoto: ''
  };
  // 選択された原材料のタイプに応じてJASマーク初期値を設定
  updateJasLabelDefault();
  errorMessage.value = '';
  showModal.value = true;
};

// モーダルオープン (編集)
const openEditModal = (rec) => {
  isEditing.value = true;
  currentId.value = rec.id;
  form.value = {
    date: rec.date,
    ingredientId: rec.ingredientId,
    quantity: rec.quantity,
    unit: rec.unit || 'kg', // 新規：単位
    lotNumber: rec.lotNumber,
    checkedBy: rec.checkedBy,
    isSeparated: rec.isSeparated,
    hasJasLabelVerified: rec.hasJasLabelVerified,
    isClean: rec.isClean,
    status: rec.status,
    notes: rec.notes,
    jasPhoto: rec.jasPhoto || ''
  };
  errorMessage.value = '';
  showModal.value = true;
};

// 写真ファイルアップロード処理
const handlePhotoUpload = (event) => {
  const file = event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    form.value.jasPhoto = e.target.result;
  };
  reader.readAsDataURL(file);
};

// JAS写真をサンプルで自動生成（おもてなしデモ機能）
const attachSampleJasPhoto = () => {
  form.value.jasPhoto = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 100 100"><circle cx="50" cy="50" r="45" fill="%23fcf9f2" stroke="%233c5b4a" stroke-width="3"/><circle cx="50" cy="50" r="38" fill="none" stroke="%233c5b4a" stroke-dasharray="2,2"/><text x="50" y="44" font-family="sans-serif" font-size="15" font-weight="bold" fill="%233c5b4a" text-anchor="middle">有機JAS</text><text x="50" y="64" font-family="sans-serif" font-size="9" font-weight="bold" fill="%233c5b4a" text-anchor="middle">アグリ角田</text><text x="50" y="78" font-family="monospace" font-size="6" fill="%23777" text-anchor="middle">LOT-OK</text></svg>';
};

// 原材料変更時にJASマーク確認トグルのデフォルト値を調整
const updateJasLabelDefault = () => {
  const ing = state.ingredients.find(i => i.id === form.value.ingredientId);
  if (ing) {
    if (ing.type === 'organic') {
      form.value.hasJasLabelVerified = true;
      form.value.isSeparated = true;
    } else {
      form.value.hasJasLabelVerified = false;
    }
  }
};

// 保存アクション
const saveReceipt = () => {
  if (!form.value.ingredientId) {
    errorMessage.value = '原材料を選択してください。';
    return;
  }
  if (form.value.quantity <= 0) {
    errorMessage.value = '数量は0より大きい数値を入力してください。';
    return;
  }
  if (!form.value.lotNumber.trim()) {
    errorMessage.value = 'ロット番号・識別符号を入力してください。';
    return;
  }
  if (!form.value.checkedBy.trim()) {
    errorMessage.value = '点検確認者を入力してください。';
    return;
  }

  // JAS適合判定の自動調整
  const selectedIng = state.ingredients.find(i => i.id === form.value.ingredientId);
  if (selectedIng && selectedIng.type === 'organic') {
    if (!form.value.hasJasLabelVerified || !form.value.isSeparated || !form.value.isClean) {
      form.value.status = 'warning';
    } else {
      form.value.status = 'good';
    }
  } else {
    form.value.status = form.value.isClean ? 'good' : 'warning';
  }

  try {
    if (isEditing.value) {
      restaurantStore.updateReceipt(currentId.value, form.value);
    } else {
      restaurantStore.addReceipt(form.value);
    }
    showModal.value = false;
  } catch (err) {
    errorMessage.value = err.message;
  }
};

// 削除アクション
const deleteReceipt = (id, name, date) => {
  if (confirm(`${date} 受入の「${name}」の点検記録を削除してもよろしいですか？`)) {
    restaurantStore.deleteReceipt(id);
  }
};

const getIngType = (id) => {
  const ing = state.ingredients.find(i => i.id === id);
  return ing ? ing.type : 'general';
};
</script>

<template>
  <div class="animate-fade-in">
    <div class="view-header mb-6">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><TrendingUp :size="24" /> 仕入・受入点検記録</h2>
        <p class="text-sub">有機原材料の入荷時に、「格付マーク（JASマーク）の有無」や「一般原材料との混同がないこと」を毎回検査した記録です。</p>
      </div>
      <div style="display: flex; gap: 0.75rem; align-items: center;">
        <button 
          class="btn btn-outline flex items-center gap-2" 
          style="border-color: var(--primary); color: var(--primary); font-weight: 600;" 
          @click="handleSyncFromRiRyLink" 
          :disabled="isSyncing"
        >
          <RefreshCw :size="16" :class="isSyncing ? 'animate-spin' : ''" />
          {{ isSyncing ? '同期中...' : 'Ri-Ry-Linkと同期' }}
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <Plus :size="18" /> 新規受入記録
        </button>
      </div>
    </div>

    <!-- 同期結果通知 (おもてなし通知) -->
    <Transition name="fade">
      <div v-if="syncResult" class="alert alert-success py-3 px-4 mb-6 text-sm flex items-center justify-between" style="border-left: 4px solid #16a34a; background: rgba(22, 163, 74, 0.05); border-radius: var(--radius-sm); display: flex; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #16a34a; font-weight: 500;">
          <Check :size="18" />
          <span>{{ syncResult }}</span>
        </div>
        <button class="btn-close" style="padding: 0; background: none; border: none; cursor: pointer; color: #16a34a;" @click="syncResult = null">
          <X :size="16" />
        </button>
      </div>
    </Transition>
    
    <Transition name="fade">
      <div v-if="syncError" class="alert alert-danger py-3 px-4 mb-6 text-sm flex items-center justify-between" style="border-left: 4px solid #dc2626; background: rgba(220, 38, 38, 0.05); border-radius: var(--radius-sm); display: flex; justify-content: space-between; width: 100%;">
        <div style="display: flex; align-items: center; gap: 0.5rem; color: #dc2626; font-weight: 500;">
          <AlertTriangle :size="18" />
          <span>{{ syncError }}</span>
        </div>
        <button class="btn-close" style="padding: 0; background: none; border: none; cursor: pointer; color: #dc2626;" @click="syncError = null">
          <X :size="16" />
        </button>
      </div>
    </Transition>

    <!-- サブタブ切り替え (JAS審査適合プレミアムUI) -->
    <div class="tabs-organic mb-6" style="display: flex; border-bottom: 2px solid var(--border); gap: 1.5rem;">
      <button 
        type="button"
        :class="['tab-btn-organic', activeSubTab === 'records' ? 'active' : '']"
        @click="activeSubTab = 'records'"
        style="background: none; border: none; padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; color: var(--text-light); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-bottom: 3px solid transparent; transition: all 0.2s;"
      >
        <ClipboardList :size="16" />
        受入点検記録簿
      </button>
      <button 
        type="button"
        :class="['tab-btn-organic', activeSubTab === 'certificates' ? 'active' : '']"
        @click="activeSubTab = 'certificates'"
        style="background: none; border: none; padding: 0.75rem 0.5rem; font-weight: 600; font-size: 0.95rem; color: var(--text-light); cursor: pointer; display: flex; align-items: center; gap: 0.5rem; border-bottom: 3px solid transparent; transition: all 0.2s;"
      >
        <ShieldCheck :size="16" />
        スキャン証明書一覧
      </button>
    </div>

    <template v-if="activeSubTab === 'records'">
      <!-- 検索 & フィルターバー -->
      <div class="filter-bar card mb-6">
        <div class="search-input-wrapper">
          <Search class="search-icon" :size="18" />
          <input 
            v-model="searchQuery" 
            type="text" 
            placeholder="原材料名、ロット、確認者で検索..." 
            class="input-organic"
          />
        </div>
        <div class="filter-options">
          <label class="filter-label">仕入タイプ：</label>
          <div class="filter-buttons">
            <button 
              :class="['filter-btn', filterType === 'all' ? 'active' : '']" 
              @click="filterType = 'all'"
            >
              すべて
            </button>
            <button 
              :class="['filter-btn', filterType === 'organic' ? 'active' : '']" 
              @click="filterType = 'organic'"
            >
              有機JAS品のみ
            </button>
            <button 
              :class="['filter-btn', filterType === 'general' ? 'active' : '']" 
              @click="filterType = 'general'"
            >
              一般食品
            </button>
          </div>
        </div>

        <!-- 新規：年月・業者フィルター (UX Enhancement) -->
        <div class="advanced-filters w-full" style="display: flex; gap: 1rem; width: 100%; border-top: 1px solid var(--border); padding-top: 0.75rem; margin-top: 0.75rem; flex-wrap: wrap; align-items: center;">
          <div class="filter-select-group" style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 300px;">
            <label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub); white-space: nowrap;">🗓 期間表示：</label>
            <div style="display: flex; gap: 0.5rem; flex: 1; min-width: 0;">
              <select v-model="filterStartMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer; min-width: 0;">
                <option value="">開始月</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
              <span style="display: flex; align-items: center; color: var(--text-sub);">〜</span>
              <select v-model="filterEndMonth" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer; min-width: 0;">
                <option value="">終了月</option>
                <option v-for="m in availableMonths" :key="m" :value="m">{{ m.substring(0, 4) }}年{{ m.substring(5, 7) }}月</option>
              </select>
            </div>
          </div>

          <div class="filter-select-group" style="display: flex; align-items: center; gap: 0.5rem; flex: 1; min-width: 200px;">
            <label class="filter-label" style="font-size: 0.85rem; color: var(--text-sub);">🏢 業者別：</label>
            <select v-model="selectedSupplier" class="input-organic select-organic" style="font-size: 0.85rem; padding: 0.35rem 2rem 0.35rem 0.75rem; flex: 1; border-radius: var(--radius-sm); border: 1px solid var(--border); background-color: var(--bg-card); cursor: pointer;">
              <option value="">すべての業者</option>
              <option v-for="s in availableSuppliers" :key="s" :value="s">
                {{ s }}
              </option>
            </select>
          </div>
          
          <!-- クリアボタン -->
          <button 
            v-if="filterStartMonth || filterEndMonth || selectedSupplier || searchQuery || filterType !== 'all'"
            type="button" 
            class="btn btn-outline" 
            style="font-size: 0.75rem; padding: 0.35rem 0.75rem; color: var(--text-light); border-color: var(--border); height: 34px; margin-left: auto;"
            @click="filterStartMonth = ''; filterEndMonth = ''; selectedSupplier = ''; searchQuery = ''; filterType = 'all';"
          >
            フィルターをリセット
          </button>
        </div>
      </div>

      <!-- 受入点検記録一覧テーブル -->
      <div v-if="filteredReceipts.length === 0" class="empty-state card">
        <p class="text-sub">点検記録がありません。実データと同期するか、新規作成してください。</p>
      </div>
      <div v-else class="table-container card">
        <table class="table-organic">
          <thead>
            <tr>
              <th>受入日</th>
              <th>原材料名 / 仕入先</th>
              <th>受入数量</th>
              <th>ロット番号</th>
              <th>有機JAS適合点検項目</th>
              <th style="text-align: center;">状態</th>
              <th>点検確認者</th>
              <th style="text-align: center;">操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="rec in filteredReceipts" :key="rec.id">
              <td class="font-mono text-sm">
                <span class="flex items-center gap-1"><Calendar :size="14" class="text-sub" /> {{ rec.date }}</span>
              </td>
              <td>
                <div class="font-semibold">{{ rec.ingredientName }}</div>
                <div class="flex items-center gap-2 mt-1.5 flex-wrap">
                  <span :class="['badge', rec.ingredientType === 'organic' ? 'badge-success' : 'badge-neutral']" style="font-size: 0.7rem; padding: 0.1rem 0.35rem;">
                    {{ rec.ingredientType === 'organic' ? '有機JAS品' : (rec.ingredientType === 'salt_water' ? '水/塩' : '一般食品') }}
                  </span>
                  <span v-if="rec.supplier" class="supplier-tag" title="仕入先（業者名）">
                    🏢 {{ rec.supplier }}
                  </span>
                </div>
              </td>
              <td class="font-semibold font-mono" style="white-space: nowrap;">
                <span class="qty-val">{{ rec.quantity }}</span>
                <span class="unit-badge-btn">{{ rec.unit || 'kg' }}</span>
              </td>
              <td>
                <span class="font-mono text-sm bg-neutral-100 px-2 py-0.5 rounded border">{{ rec.lotNumber }}</span>
              </td>
              <td>
                <!-- JAS適合点検項目の可視化 -->
                <div class="check-items-summary flex-wrap gap-1">
                  <span :class="['check-pill', rec.isSeparated ? 'yes' : 'no']" :title="rec.isSeparated ? '分別保管されています' : '混同の懸念があります'">
                    {{ rec.isSeparated ? '✓ 分別' : '✗ 分別' }}
                  </span>
                  
                  <span 
                    v-if="rec.ingredientType === 'organic'"
                    :class="['check-pill', rec.hasJasLabelVerified ? 'yes' : 'no']" 
                    :title="rec.hasJasLabelVerified ? 'JASマーク貼付確認済' : 'JASマークがありません！'">
                    {{ rec.hasJasLabelVerified ? '✓ JAS' : '✗ JAS' }}
                  </span>

                  <!-- JAS格付写真の有無の可視化 (新規追加) -->
                  <span 
                    v-if="rec.ingredientType === 'organic'"
                    :class="['check-pill', (rec.jasPhoto || hasMasterPhoto(rec.ingredientId)) ? 'yes' : 'no']" 
                    :title="rec.jasPhoto ? '格付JASマークの現物写真あり' : (hasMasterPhoto(rec.ingredientId) ? 'マスタにJASマーク写真あり' : 'JASマーク現物写真が未添付です')">
                    📷 {{ rec.jasPhoto ? '写真あり' : (hasMasterPhoto(rec.ingredientId) ? 'マスタに写真あり' : '写真なし') }}
                  </span>

                  <span :class="['check-pill', rec.isClean ? 'yes' : 'no']" :title="rec.isClean ? '容器等清潔です' : '汚損等があります'">
                    {{ rec.isClean ? '✓ 清潔' : '✗ 不潔' }}
                  </span>
                </div>
              </td>
              <td style="text-align: center;">
                <span v-if="rec.status === 'good'" class="badge badge-success">正常</span>
                <span v-else-if="rec.status === 'warning'" class="badge badge-warning">注意あり</span>
                <span v-else class="badge badge-danger">不適合</span>
              </td>
              <td>
                <span class="flex items-center gap-1 text-sm"><User :size="14" class="text-sub" /> {{ rec.checkedBy }}</span>
              </td>
              <td style="text-align: center;">
                <div class="action-buttons-cell">
                  <button class="btn-icon-only text-primary" title="編集" @click="openEditModal(rec)">
                    <Edit3 :size="16" />
                  </button>
                  <button class="btn-icon-only text-danger" title="削除" @click="deleteReceipt(rec.id, rec.ingredientName, rec.date)">
                    <Trash2 :size="16" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else>
      <!-- スキャン証明書一覧タブ (JAS監査対応エビデンス) -->
      <div v-if="scannedCertificates.length === 0" class="empty-state card py-12 text-center" style="display: flex; flex-direction: column; align-items: center; justify-content: center;">
        <ShieldCheck size="48" class="text-light mb-2" style="margin: 0 auto; color: var(--text-light);" />
        <p class="text-sub font-semibold">現在、登録されているスキャン証明書はありません。</p>
        <p class="text-xs text-light mt-1">「スキャン受信箱」から適合証明書をマスタ適用するか、受入記録にJASマーク写真を添付してください。</p>
      </div>
      
      <div v-else class="cert-grid animate-fade-in" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; padding: 0.5rem;">
        <div v-for="item in scannedCertificates" :key="item.id" class="cert-card card" style="display: flex; flex-direction: column; height: 100%; border: 1px solid var(--border); border-radius: var(--radius-md); box-shadow: var(--shadow-sm); overflow: hidden; background: var(--bg-card); cursor: pointer;" @click="openPreview(item)">
          <div class="cert-badge" :style="{
            padding: '0.35rem 0.75rem',
            fontSize: '0.75rem',
            fontWeight: 'bold',
            textAlign: 'center',
            color: 'white',
            backgroundColor: item.type === 'jas_cert' ? 'var(--primary)' : 'var(--accent)'
          }">
            {{ item.type === 'jas_cert' ? '適合証明書 (マスタ同期)' : '受入点検エビデンス (納品書等)' }}
          </div>
          
          <div class="cert-preview-thumb" style="height: 180px; background: var(--bg-main); display: flex; align-items: center; justify-content: center; overflow: hidden; border-bottom: 1px solid var(--border);">
            <iframe v-if="item.fileUrl.startsWith('data:application/pdf') || item.fileUrl.includes('pdf')" :src="item.fileUrl + '#toolbar=0'" class="thumb-pdf" frameborder="0" style="width: 100%; height: 100%; overflow: hidden; pointer-events: none;"></iframe>
            <img v-else :src="item.fileUrl" alt="Thumbnail" class="thumb-img" style="max-width: 100%; max-height: 100%; object-fit: contain;" />
          </div>
          
          <div class="cert-info" style="padding: 1rem; flex-grow: 1;">
            <h4 class="cert-title truncate" :title="item.title" style="margin: 0 0 0.5rem 0; font-size: 0.95rem; font-weight: bold; color: var(--text-main);">{{ item.title }}</h4>
            <p class="cert-meta text-xs" style="margin: 0 0 0.25rem 0; color: var(--text-sub);">🏢 仕入先: <strong>{{ item.supplier }}</strong></p>
            <p class="cert-date text-xs font-mono" style="margin: 0; color: var(--text-light);">📅 {{ item.date }}</p>
          </div>
          
          <div class="cert-actions" style="padding: 0.75rem; border-top: 1px solid var(--border); display: flex; gap: 0.5rem; background: var(--bg-sub);" @click.stop>
            <button class="btn btn-outline btn-xs flex-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openPreview(item)">🔍 拡大表示</button>
            <button class="btn btn-primary btn-xs flex-1 flex items-center justify-center gap-1" style="font-size: 0.75rem; padding: 0.25rem 0.5rem;" @click="openSecureWindow(item.fileUrl)">
              🖨️ 印刷
            </button>
          </div>
        </div>
      </div>
    </template>

    <!-- モーダルダイアログ (UX Safety) -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-card animate-fade-in">
          <div class="modal-header">
            <h3>{{ isEditing ? '受入点検記録の編集' : '受入点検記録の作成' }}</h3>
            <button class="btn-close" @click="showModal = false">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body">
            <div v-if="errorMessage" class="alert alert-danger py-2 px-3 mb-4 text-sm">
              <AlertTriangle :size="16" /> {{ errorMessage }}
            </div>

            <div class="grid-cols-2 mb-3">
              <div class="form-group">
                <label class="form-label">受入日 <span class="required">*</span></label>
                <input v-model="form.date" type="date" class="input-organic" />
              </div>
              <div class="form-group">
                <label class="form-label">点検者 <span class="required">*</span></label>
                <input v-model="form.checkedBy" type="text" class="input-organic" placeholder="例: 中村 誠治（調理責任者）" />
              </div>
            </div>

            <div class="grid-cols-2 mb-3">
              <div class="form-group">
                <label class="form-label">受入原材料 <span class="required">*</span></label>
                <select 
                  v-model="form.ingredientId" 
                  class="input-organic select-organic"
                  @change="updateJasLabelDefault"
                >
                  <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                    {{ ing.name }} ({{ ing.type === 'organic' ? '有機JAS' : '一般/その他' }})
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">受入数量・単位 <span class="required">*</span></label>
                <div class="flex gap-2">
                  <input v-model.number="form.quantity" type="number" step="0.01" class="input-organic" style="flex: 2; min-width: 0;" />
                  <select v-model="form.unit" class="input-organic select-organic" style="flex: 1; min-width: 80px;">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="個">個</option>
                    <option value="袋">袋</option>
                    <option value="本">本</option>
                    <option value="枚">枚</option>
                    <option value="ケース">ケース</option>
                  </select>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">ロット番号 / 識別符号 <span class="required">*</span></label>
              <input 
                v-model="form.lotNumber" 
                type="text" 
                class="input-organic" 
                placeholder="例: L260508-TomatoA (仕入伝票番号等でも可)"
              />
            </div>

            <!-- JAS点検必須チェック項目 (UX Safety & Compliance) -->
            <fieldset class="form-fieldset">
              <legend class="fieldset-title flex items-center gap-1">
                <ShieldCheck :size="14" /> 有機JAS管理基準 点検項目
              </legend>

              <div class="form-checkbox-group mb-3">
                <label class="checkbox-label">
                  <input v-model="form.isSeparated" type="checkbox" />
                  <span>一般品と完全に分離して保管した</span>
                </label>
                <p class="checkbox-help">※有機野菜が一般野菜と触れたり混同しないよう、専用コンテナや棚に区分格納します。</p>
              </div>

              <!-- 有機原材料のみマーク確認を促す -->
              <div v-if="getIngType(form.ingredientId) === 'organic'" class="form-checkbox-group mb-3">
                <label class="checkbox-label">
                  <input v-model="form.hasJasLabelVerified" type="checkbox" />
                  <span class="text-amber-800 font-bold">荷姿に有機JASマークが貼付されていることを目視確認した</span>
                </label>
                <p class="checkbox-help">※格付マーク（JASマーク）が貼られていないものは、有機食材として料理に使用できません。</p>
              </div>

              <div class="form-checkbox-group">
                <label class="checkbox-label">
                  <input v-model="form.isClean" type="checkbox" />
                  <span>荷姿・運搬容器に汚損や異物混入がない</span>
                </label>
                <p class="checkbox-help">※輸送中の農薬・資材などの汚染や、不衛生な環境がないことを点検します。</p>
              </div>
            </fieldset>

            <!-- 新規：JASマーク写真の保管（2025年人参の指摘改善対応） -->
            <div v-if="getIngType(form.ingredientId) === 'organic'" class="form-group mt-3" style="background-color: rgba(139,90,43,0.02); border: 1px solid rgba(139,90,43,0.1); border-radius: 6px; padding: 0.75rem;">
              <div v-if="hasMasterPhoto(form.ingredientId)" style="margin-bottom: 0.75rem; padding: 0.5rem; background-color: #f0fdf4; color: #166534; border-radius: 4px; font-size: 0.85rem; border: 1px solid #bbf7d0;">
                ✅ マスタにJASマーク写真が登録されているため、今回ここでの写真添付は省略できます
              </div>
              <label class="form-label flex justify-between items-center mb-2" style="font-weight: bold; color: var(--amber-dark); font-size: 0.85rem;">
                <span>📷 JASマーク現物写真保管 <span v-if="!hasMasterPhoto(form.ingredientId)" class="required">*</span></span>
                <button type="button" class="btn btn-outline btn-xs" @click="attachSampleJasPhoto" style="font-size: 0.7rem; padding: 0.1rem 0.4rem;">サンプル写真を自動貼付</button>
              </label>
              <div class="flex items-center gap-3">
                <input type="file" accept="image/*" @change="handlePhotoUpload" style="display: none;" id="jas-photo-upload-input" />
                <label for="jas-photo-upload-input" class="btn btn-outline btn-sm flex items-center gap-1 cursor-pointer" style="font-size: 0.8rem; margin: 0; padding: 0.25rem 0.6rem;">
                  ファイルを選択してアップロード...
                </label>
                <span v-if="form.jasPhoto" class="text-xs text-success font-bold">✓ 添付済み</span>
                <span v-else class="text-xs text-sub">※2025年監査指摘：「人参納品時のJASマーク現物写真」の保管義務を推奨。</span>
              </div>
              <!-- プレビュー表示 -->
              <div v-if="form.jasPhoto" class="mt-3 text-center" style="position: relative; display: inline-block; width: 100%;">
                <img :src="form.jasPhoto" alt="JASマーク現物プレビュー" style="max-height: 120px; border-radius: 4px; box-shadow: var(--shadow-sm); border: 1px solid #ddd;" />
                <button type="button" @click="form.jasPhoto = ''" style="position: absolute; top: -5px; right: 50%; transform: translateX(65px); background-color: rgba(0,0,0,0.6); color: white; border: none; border-radius: 50%; width: 22px; height: 22px; font-size: 0.8rem; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
              </div>
            </div>

            <div class="form-group mt-3">
              <label class="form-label">備考・特記事項</label>
              <textarea 
                v-model="form.notes" 
                class="input-organic" 
                rows="2" 
                placeholder="保管場所、荷姿の状態、点検時の補足など..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="saveReceipt">
              {{ isEditing ? '記録を更新' : '点検を完了・記録' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>

    <!-- スキャン証明書のフルプレビュー & 印刷モーダル (新規追加) -->
    <teleport to="body">
      <div v-if="showPreviewModal" class="modal-overlay" style="z-index: 1200;" @click="closePreview">
        <div class="modal-card animate-fade-in" style="max-width: 800px; width: 90%; height: 85vh;" @click.stop>
          <div class="modal-header">
            <h3 class="flex items-center gap-2" style="margin: 0; font-size: 1.15rem;"><ShieldCheck :size="20" /> {{ previewItem?.title }}</h3>
            <button class="btn-close" @click="closePreview">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body" style="padding: 1rem; display: flex; flex-direction: column; align-items: center; background: #faf8f5; overflow: hidden; height: calc(100% - 130px);">
            <div class="meta text-xs text-sub mb-3" style="width: 100%; text-align: center; color: var(--text-light);">
              仕入先: <strong>{{ previewItem?.supplier }}</strong> | 登録情報: {{ previewItem?.date }}
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
                alt="Scan Evidence Preview" 
                style="max-width: 100%; max-height: 100%; object-fit: contain;" 
              />
            </div>
          </div>
          <div class="modal-footer" style="background: var(--bg-sub); display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem;">
            <span class="text-xs text-light">※印刷時はブラウザの印刷設定（用紙サイズ・余白）を確認してください。</span>
            <div class="flex gap-2" style="display: flex; gap: 0.5rem;">
              <button class="btn btn-outline" @click="closePreview">閉じる</button>
              <button class="btn btn-primary flex items-center gap-1" @click="openSecureWindow(previewItem?.fileUrl)">
                🖨️ この証明書を印刷する
              </button>
            </div>
          </div>
        </div>
      </div>
    </teleport>

    <!-- Ri-Ry-Link 認証モーダル (実データを確実にインポートするための安全ログイン) -->
    <teleport to="body">
      <div v-if="showAuthModal" class="modal-overlay" style="z-index: 1100;">
        <div class="modal-card animate-fade-in" style="max-width: 450px;">
          <div class="modal-header" style="border-bottom: 1px solid var(--border); padding: 1.25rem 1.5rem;">
            <h3 style="color: var(--primary); margin: 0; font-size: 1.2rem; display: flex; align-items: center; gap: 0.5rem;">
              <RefreshCw :size="18" /> Ri-Ry-Link 認証サインイン
            </h3>
            <button class="btn-close" @click="showAuthModal = false; isSyncing = false;">
              <X :size="20" />
            </button>
          </div>
          <div class="modal-body" style="padding: 1.5rem;">
            <p class="text-sub text-sm mb-4" style="line-height: 1.5; color: var(--text-light);">
              実際の仕入・納品データを原材料マスターへ同期するため、仕入管理システム（Ri-Ry-Link）でご利用のログインアカウントで認証を完了させてください。
            </p>

            <div v-if="authError" class="alert alert-danger py-2 px-3 mb-4 text-sm" style="background: rgba(220,38,38,0.05); color: #dc2626; border-left: 3px solid #dc2626; border-radius: var(--radius-sm); display: flex; justify-content: space-between; width: 100%;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <AlertTriangle :size="16" /> <span>{{ authError }}</span>
              </div>
              <button class="btn-close" style="padding: 0; background: none; border: none; cursor: pointer; color: #dc2626;" @click="authError = ''">
                <X :size="16" />
              </button>
            </div>

            <!-- クイックアカウント選択 (おもてなし・ショートカット機能) -->
            <div class="mb-4">
              <label class="form-label" style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.375rem; display: block;">クイックアカウント選択</label>
              <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                <button 
                  type="button" 
                  class="btn btn-outline py-1 px-2 text-xs" 
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--border); color: var(--text-light);" 
                  @click="selectQuickAccount('tanaka@kakuida.com')"
                >
                  tanaka@kakuida.com
                </button>
                <button 
                  type="button" 
                  class="btn btn-outline py-1 px-2 text-xs" 
                  style="padding: 0.25rem 0.5rem; font-size: 0.75rem; border-color: var(--border); color: var(--text-light);" 
                  @click="selectQuickAccount('test@example.com')"
                >
                  test@example.com
                </button>
              </div>
            </div>

            <div class="form-group mb-3">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">メールアドレス</label>
              <input 
                v-model="authForm.email" 
                type="email" 
                class="input-organic" 
                placeholder="example@kakuida.com"
                style="width: 100%;"
              />
            </div>

            <div class="form-group mb-4">
              <label class="form-label" style="font-size: 0.85rem; font-weight: 500; display: block; margin-bottom: 0.25rem;">パスワード</label>
              <input 
                v-model="authForm.password" 
                type="password" 
                class="input-organic" 
                placeholder="••••••••"
                style="width: 100%;"
                @keyup.enter="submitAuthAndSync"
              />
            </div>
          </div>
          <div class="modal-footer" style="padding: 1.25rem 1.5rem; border-top: 1px solid var(--border); display: flex; justify-content: flex-end; gap: 0.75rem; background: var(--bg-sub);">
            <button class="btn btn-outline" @click="showAuthModal = false; isSyncing = false;">キャンセル</button>
            <button 
              class="btn btn-primary flex items-center gap-1" 
              style="font-weight: 600;" 
              @click="submitAuthAndSync" 
              :disabled="isAuthenticating"
            >
              <RefreshCw :size="16" :class="isAuthenticating ? 'animate-spin' : ''" />
              {{ isAuthenticating ? 'サインイン & 同期中...' : 'サインインして同期' }}
            </button>
          </div>
        </div>
      </div>
    </teleport>
  </div> <!-- animate-fade-in (最外部) 閉じ -->
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

/* フィルターバー */
.filter-bar {
  display: flex;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
  padding: 1rem 1.25rem;
}

.search-input-wrapper {
  position: relative;
  flex-grow: 1;
  min-width: 250px;
}

.search-icon {
  position: absolute;
  left: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: var(--text-light);
}

.search-input-wrapper .input-organic {
  padding-left: 2.25rem;
}

.filter-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.filter-label {
  font-size: 0.875rem;
  color: var(--text-sub);
  font-weight: 500;
  white-space: nowrap;
}

.filter-buttons {
  display: flex;
  background-color: var(--bg-sub);
  padding: 0.25rem;
  border-radius: var(--radius-sm);
  border: 1px solid var(--border);
}

.filter-btn {
  font-family: var(--font-sans);
  font-size: 0.825rem;
  font-weight: 500;
  color: var(--text-sub);
  background: none;
  border: none;
  padding: 0.375rem 0.75rem;
  border-radius: 4px;
  cursor: pointer;
  transition: var(--transition);
}

.filter-btn:hover {
  color: var(--primary);
}

.filter-btn.active {
  background-color: var(--bg-card);
  color: var(--primary);
  box-shadow: var(--shadow-sm);
  font-weight: 600;
}

/* 点検項目ピル */
.check-items-summary {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.check-pill {
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.125rem 0.5rem;
  border-radius: var(--radius-full);
  white-space: nowrap;
}

.check-pill.yes {
  background-color: var(--success-bg);
  color: var(--success);
  border: 1px solid var(--success-border);
}

.check-pill.no {
  background-color: var(--danger-bg);
  color: var(--danger);
  border: 1px solid var(--danger-border);
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

.form-fieldset {
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 1rem;
  margin-top: 1.25rem;
  background-color: var(--bg-main);
}

.fieldset-title {
  font-size: 0.825rem;
  font-weight: 600;
  color: var(--primary);
  padding: 0 0.5rem;
}

.form-checkbox-group {
  margin-bottom: 1rem;
}

.form-checkbox-group:last-child {
  margin-bottom: 0;
}

.checkbox-label {
  display: flex;
  align-items: flex-start;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.9rem;
  font-weight: 500;
  color: var(--text-main);
}

.checkbox-label input {
  margin-top: 0.25rem;
  cursor: pointer;
}

.checkbox-help {
  font-size: 0.75rem;
  color: var(--text-sub);
  margin: 0.125rem 0 0 1.25rem;
}

.py-2 { padding-top: 0.5rem; padding-bottom: 0.5rem; }
.px-3 { padding-left: 0.75rem; padding-right: 0.75rem; }
.text-sm { font-size: 0.875rem; }
.py-8 { padding-top: 2rem; padding-bottom: 2rem; }
.text-center { text-align: center; }
.mt-3 { margin-top: 0.75rem; }

/* 数量と単位の誤認防止デザイン */
.qty-val {
  font-size: 1.15rem;
  font-weight: 700;
  color: var(--text-main, #1e293b);
  margin-right: 0.4rem;
  vertical-align: middle;
}

.unit-badge-btn {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  background-color: var(--bg-sub, #f1f5f9);
  color: var(--text-sub, #475569);
  border: 1px solid var(--border, #cbd5e1);
  border-radius: 4px; /* マイルドな角丸（ボタン風） */
  font-size: 0.75rem;
  font-weight: 600;
  font-family: var(--font-sans, sans-serif);
  vertical-align: middle;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
  line-height: 1.2;
}
</style>
