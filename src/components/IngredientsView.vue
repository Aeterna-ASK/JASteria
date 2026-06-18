<script setup>
import { ref, computed } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  Sprout, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Calendar, 
  Search,
  Check,
  X,
  PlusCircle,
  HelpCircle
} from 'lucide-vue-next';

const state = restaurantStore.state;
const ingredients = computed(() => state.ingredients);

// 検索 & フィルター
const searchQuery = ref('');
const filterType = ref('all'); // all, organic, general, salt_water

const filteredIngredients = computed(() => {
  return ingredients.value.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          ing.supplier.toLowerCase().includes(searchQuery.value.toLowerCase());
    const matchesFilter = filterType.value === 'all' || ing.type === filterType.value;
    return matchesSearch && matchesFilter;
  });
});

// モーダル・フォーム状態
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

const form = ref({
  name: '',
  supplier: '',
  type: 'organic', // organic, general, salt_water
  hasCertificate: true,
  certificateExpiry: '',
  hasJasLabel: true,
    jasPhoto: ''
});

const errorMessage = ref('');

const handlePhotoUpload = (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    form.value.jasPhoto = e.target.result;
  };
  reader.readAsDataURL(file);
};

// モーダルオープン (新規)
const openAddModal = () => {
  isEditing.value = false;
  currentId.value = null;
  form.value = {
    name: '',
    supplier: '',
    type: 'organic',
    hasCertificate: true,
    certificateExpiry: '',
    hasJasLabel: true,
    jasPhoto: ''
  };
  errorMessage.value = '';
  showModal.value = true;
};

// モーダルオープン (編集)
const openEditModal = (ing) => {
  isEditing.value = true;
  currentId.value = ing.id;
  form.value = {
    name: ing.name,
    supplier: ing.supplier,
    type: ing.type,
    hasCertificate: ing.hasCertificate,
    certificateExpiry: ing.certificateExpiry,
    hasJasLabel: ing.hasJasLabel,
    jasPhoto: ing.jasPhoto || ''
  };
  errorMessage.value = '';
  showModal.value = true;
};

// 保存アクション
const saveIngredient = () => {
  if (!form.value.name.trim()) {
    errorMessage.value = '原材料名を入力してください。';
    return;
  }
  if (!form.value.supplier.trim()) {
    errorMessage.value = '仕入先を入力してください。';
    return;
  }
  if (form.value.type === 'organic' && form.value.hasCertificate && !form.value.certificateExpiry) {
    errorMessage.value = '有機区分かつ証明書有りの場合は、有効期限を入力してください。';
    return;
  }

  try {
    if (isEditing.value) {
      restaurantStore.updateIngredient(currentId.value, form.value);
    } else {
      restaurantStore.addIngredient(form.value);
    }
    showModal.value = false;
  } catch (err) {
    errorMessage.value = err.message;
  }
};

// 削除アクション
const deleteIngredient = (id, name) => {
  if (confirm(`原材料「${name}」を削除してもよろしいですか？`)) {
    try {
      restaurantStore.deleteIngredient(id);
    } catch (err) {
      alert(err.message);
    }
  }
};

// 証明書期限切れチェック
const checkExpiryStatus = (expiryDate, type) => {
  if (type !== 'organic' || !expiryDate) return 'none';
  const today = new Date();
  const expiry = new Date(expiryDate);
  const warningLimit = new Date();
  warningLimit.setDate(today.getDate() + 30);

  if (expiry <= today) return 'expired';
  if (expiry <= warningLimit) return 'warning';
  return 'good';
};
</script>

<template>
  <div class="animate-fade-in">
    <div class="view-header mb-6">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><Sprout :size="24" /> 原材料マスター管理</h2>
        <p class="text-sub">仕入れるすべての原材料を登録し、有機JAS証明書や格付表示（JASマーク）の有無を管理します。</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <Plus :size="18" /> 新規原材料登録
      </button>
    </div>

    <!-- 検索 & フィルターバー -->
    <div class="filter-bar card mb-6">
      <div class="search-input-wrapper">
        <Search class="search-icon" :size="18" />
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="原材料名、仕入先で検索..." 
          class="input-organic"
        />
      </div>
      <div class="filter-options">
        <label class="filter-label">区分：</label>
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
            有機JAS認定品
          </button>
          <button 
            :class="['filter-btn', filterType === 'general' ? 'active' : '']" 
            @click="filterType = 'general'"
          >
            一般食品
          </button>
          <button 
            :class="['filter-btn', filterType === 'salt_water' ? 'active' : '']" 
            @click="filterType = 'salt_water'"
          >
            水・食塩 (計算除外)
          </button>
        </div>
      </div>
    </div>

    <!-- 原材料テーブル -->
    <div class="table-container">
      <table class="table-organic">
        <thead>
          <tr>
            <th>原材料名</th>
            <th>区分</th>
            <th>仕入先</th>
            <th>JAS証明書</th>
            <th>証明書有効期限</th>
            <th>JAS表示有無</th>
            <th style="width: 100px; text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredIngredients.length === 0">
            <td colspan="7" class="text-center text-light py-8">
              該当する原材料が見つかりませんでした。
            </td>
          </tr>
          <tr v-for="ing in filteredIngredients" :key="ing.id" :class="checkExpiryStatus(ing.certificateExpiry, ing.type) === 'expired' ? 'row-expired' : ''">
            <td>
              <div class="font-semibold">{{ ing.name }}</div>
              <span class="id-badge">{{ ing.id }}</span>
            </td>
            <td>
              <span v-if="ing.type === 'organic'" class="badge badge-success">有機JAS品</span>
              <span v-else-if="ing.type === 'general'" class="badge badge-neutral">一般食品</span>
              <span v-else-if="ing.type === 'salt_water'" class="badge badge-warning">水・食塩</span>
            </td>
            <td>{{ ing.supplier }}</td>
            <td>
              <span v-if="ing.type === 'organic'" class="flex items-center gap-1 text-sm font-medium">
                <Check v-if="ing.hasCertificate" class="text-success" :size="16" />
                <X v-else class="text-danger" :size="16" />
                {{ ing.hasCertificate ? '提出済' : '未提出' }}
              </span>
              <span v-else class="text-light text-sm">-</span>
            </td>
            <td>
              <span v-if="ing.type === 'organic' && ing.hasCertificate" class="flex items-center gap-1 font-mono text-sm">
                <Calendar :size="14" class="text-sub" />
                <span :class="[
                  checkExpiryStatus(ing.certificateExpiry, ing.type) === 'expired' ? 'text-danger font-bold' : '',
                  checkExpiryStatus(ing.certificateExpiry, ing.type) === 'warning' ? 'text-warning font-bold' : ''
                ]">
                  {{ ing.certificateExpiry }}
                </span>
                <span v-if="checkExpiryStatus(ing.certificateExpiry, ing.type) === 'expired'" class="small-alert">
                  [期限切れ]
                </span>
                <span v-else-if="checkExpiryStatus(ing.certificateExpiry, ing.type) === 'warning'" class="small-alert warn">
                  [近日期限]
                </span>
              </span>
              <span v-else class="text-light text-sm">-</span>
            </td>
            <td>
              <span v-if="ing.type === 'organic'" class="flex items-center gap-1 text-sm font-medium">
                <Check v-if="ing.hasJasLabel" class="text-success" :size="16" />
                <X v-else class="text-danger" :size="16" />
                {{ ing.hasJasLabel ? 'JASマーク有' : '表示なし' }}
              </span>
              <span v-else class="text-light text-sm">-</span>
            </td>
            <td style="text-align: center;">
              <div class="action-buttons-cell">
                <button class="btn-icon-only text-primary" title="編集" @click="openEditModal(ing)">
                  <Edit3 :size="16" />
                </button>
                <button class="btn-icon-only text-danger" title="削除" @click="deleteIngredient(ing.id, ing.name)">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 新規・編集モーダル (UX Safety) -->
    <div v-if="showModal" class="modal-overlay">
      <div class="modal-card animate-fade-in">
        <div class="modal-header">
          <h3>{{ isEditing ? '原材料情報の編集' : '新規原材料の登録' }}</h3>
          <button class="btn-close" @click="showModal = false">
            <X :size="20" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger py-2 px-3 mb-4 text-sm">
            <AlertTriangle :size="16" /> {{ errorMessage }}
          </div>

          <div class="form-group">
            <label class="form-label">原材料名 <span class="required">*</span></label>
            <input 
              v-model="form.name" 
              type="text" 
              class="input-organic" 
              placeholder="例: 有機JASアボカド"
            />
          </div>

          <div class="form-group">
            <label class="form-label">仕入区分 <span class="required">*</span></label>
            <select v-model="form.type" class="input-organic select-organic">
              <option value="organic">有機JAS認定品 (有機割合の加算対象)</option>
              <option value="general">一般食品 (有機割合の加算対象外/一般品分母)</option>
              <option value="salt_water">水・食塩 (有機割合計算から完全に除外)</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label">仕入先名 <span class="required">*</span></label>
            <input 
              v-model="form.supplier" 
              type="text" 
              class="input-organic" 
              placeholder="例: グリーンベジタブル株式会社"
            />
          </div>

          <!-- 有機JAS品のみに表示する詳細設定 (UX Safety: 状況に応じたおもてなしUI) -->
          <fieldset v-if="form.type === 'organic'" class="form-fieldset">
            <legend class="fieldset-title">有機JAS適合要件の設定</legend>
            
            <div class="form-checkbox-group mb-3">
              <label class="checkbox-label">
                <input v-model="form.hasCertificate" type="checkbox" />
                <span>有機JAS認定証明書を取得・保管している</span>
              </label>
              <p class="checkbox-help">※年次審査時に、仕入先から取り寄せた有効な証明書の原本（写し）が必要です。</p>
            </div>

            <div v-if="form.hasCertificate" class="form-group mb-3">
              <label class="form-label">証明書の有効期限</label>
              <input 
                v-model="form.certificateExpiry" 
                type="date" 
                class="input-organic"
              />
            </div>

            <div class="form-checkbox-group">
              <label class="checkbox-label">
                <input v-model="form.hasJasLabel" type="checkbox" />
                <span>受入時に荷姿に「有機JASマーク」の貼付がある</span>
              </label>
              <p class="checkbox-help">※JASマークがない農産物を「有機」として使用することはできません。</p>
            </div>
            
            <div class="form-group mt-3" v-if="form.hasJasLabel">
              <label class="form-label">JASマーク現物写真（見本）</label>
              <input type="file" accept="image/*" @change="handlePhotoUpload" class="input-organic" style="padding: 0.5rem;" />
              <div v-if="form.jasPhoto" class="mt-2 text-center" style="position: relative; display: inline-block;">
                <img :src="form.jasPhoto" alt="JASマーク見本" style="max-height: 120px; border-radius: 4px; border: 1px solid var(--border);" />
                <button type="button" @click="form.jasPhoto = ''" style="position: absolute; top: -8px; right: -8px; background-color: var(--danger); color: white; border: none; border-radius: 50%; width: 24px; height: 24px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;">×</button>
              </div>
            </div>
          </fieldset>
        </div>
        <div class="modal-footer">
          <button class="btn btn-outline" @click="showModal = false">キャンセル</button>
          <button class="btn btn-primary" @click="saveIngredient">
            {{ isEditing ? '変更を保存' : '登録する' }}
          </button>
        </div>
      </div>
    </div>
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

/* テーブル追加要素 */
.id-badge {
  font-family: var(--font-mono);
  font-size: 0.7rem;
  background-color: var(--bg-sub);
  color: var(--text-sub);
  padding: 0.125rem 0.375rem;
  border-radius: 4px;
  border: 1px solid var(--border);
  display: inline-block;
  margin-top: 0.125rem;
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

.row-expired {
  background-color: rgba(220, 38, 38, 0.02);
}

.small-alert {
  font-size: 0.7rem;
  font-weight: bold;
  color: var(--danger);
  margin-left: 0.25rem;
}
.small-alert.warn {
  color: var(--warning);
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
  max-width: 550px;
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
</style>
