<script setup>
import { ref } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  Settings, 
  Save, 
  RotateCcw, 
  Award, 
  User, 
  MapPin, 
  Calendar,
  AlertTriangle,
  Check
} from 'lucide-vue-next';

const state = restaurantStore.state;

const form = ref({
  name: state.restaurantInfo.name,
  manager: state.restaurantInfo.manager,
  cookManager: state.restaurantInfo.cookManager || '',
  grader: state.restaurantInfo.grader,
  certNumber: state.restaurantInfo.certNumber,
  certDate: state.restaurantInfo.certDate,
  address: state.restaurantInfo.address,
  geminiApiKey: state.restaurantInfo.geminiApiKey || ''
});

const isSaved = ref(false);
const errorMessage = ref('');

const saveSettings = () => {
  if (!form.value.name.trim()) {
    errorMessage.value = '店舗名を入力してください。';
    return;
  }
  if (!form.value.manager.trim()) {
    errorMessage.value = '運営責任者を入力してください。';
    return;
  }
  if (!form.value.cookManager.trim()) {
    errorMessage.value = '調理責任者を入力してください。';
    return;
  }
  if (!form.value.grader.trim()) {
    errorMessage.value = '顧客対応責任者を入力してください。';
    return;
  }

  restaurantStore.updateRestaurantInfo(form.value);
  isSaved.value = true;
  errorMessage.value = '';
  
  setTimeout(() => {
    isSaved.value = false;
  }, 3000);
};

const handleReset = () => {
  if (confirm('すべての登録データ（原材料、メニュー、受入履歴、調理履歴）を初期デモデータ（シード）にリセットしますか？\n※ご自身で追加したデータはすべて消去されます。')) {
    restaurantStore.resetToSeeds();
    form.value = {
      name: state.restaurantInfo.name,
      manager: state.restaurantInfo.manager,
      cookManager: state.restaurantInfo.cookManager || '',
      grader: state.restaurantInfo.grader,
      certNumber: state.restaurantInfo.certNumber,
      certDate: state.restaurantInfo.certDate,
      address: state.restaurantInfo.address,
      geminiApiKey: state.restaurantInfo.geminiApiKey || ''
    };
    alert('初期データにリセットされました。');
  }
};

const handleExport = () => {
  const data = window.localStorage.getItem('jas_restaurant_store_v2') || window.localStorage.getItem('jas_restaurant_store_v1');
  if (!data) {
    alert('エクスポートするデータがありません。');
    return;
  }
  const blob = new Blob([data], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `jas_restaurant_backup_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

const fileInput = ref(null);
const handleImport = (event) => {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const content = e.target.result;
      JSON.parse(content); // JSONの検証
      window.localStorage.setItem('jas_restaurant_store_v2', content);
      alert('データの復元が完了しました。ページを再読み込みします。');
      window.location.reload();
    } catch (err) {
      alert('無効なバックアップファイルです。');
    }
  };
  reader.readAsText(file);
};
</script>

<template>
  <div class="animate-fade-in">
    <div class="view-header mb-6">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><Settings :size="24" /> 有機JAS認証店舗設定</h2>
        <p class="text-sub">有機JASの認証情報、管理組織メンバー、店舗所在地などの基本情報の編集、およびシステム管理を行います。</p>
      </div>
    </div>

    <div class="grid-layout">
      <!-- 基本設定フォーム -->
      <div class="card card-primary">
        <h3 class="flex items-center gap-2 mb-4"><Award :size="20" /> 有機JAS認証・店舗基本情報</h3>
        
        <div v-if="errorMessage" class="alert alert-danger py-2 px-3 mb-4 text-sm">
          <AlertTriangle :size="16" /> {{ errorMessage }}
        </div>

        <div v-if="isSaved" class="alert alert-success py-2 px-3 mb-4 text-sm flex items-center gap-1">
          <Check :size="16" /> 店舗設定が正常に保存されました。
        </div>

        <div class="form-group">
          <label class="form-label flex items-center gap-1">
            <span>店舗名・事業者名</span> <span class="required">*</span>
          </label>
          <input v-model="form.name" type="text" class="input-organic" />
        </div>

        <div class="grid-cols-2">
          <div class="form-group">
            <label class="form-label flex items-center gap-1">
              <User :size="14" /> <span>運営責任者</span> <span class="required">*</span>
            </label>
            <input v-model="form.manager" type="text" class="input-organic" />
            <p class="checkbox-help">※内部規程・方針・目標・教育を統括する責任者です。</p>
          </div>
          <div class="form-group">
            <label class="form-label flex items-center gap-1">
              <User :size="14" /> <span>調理責任者</span> <span class="required">*</span>
            </label>
            <input v-model="form.cookManager" type="text" class="input-organic" />
            <p class="checkbox-help">※有機食材の受入れ・配合計画の承認・調理を管理する責任者です。</p>
          </div>
        </div>

        <div class="form-group">
          <label class="form-label flex items-center gap-1">
            <User :size="14" /> <span>顧客対応責任者</span> <span class="required">*</span>
          </label>
          <input v-model="form.grader" type="text" class="input-organic" />
          <p class="checkbox-help">※有機料理の表示・情報提供が正しく行われるか検証する担当者です。</p>
        </div>

        <div class="grid-cols-2">
          <div class="form-group">
            <label class="form-label">有機JAS認定番号</label>
            <input v-model="form.certNumber" type="text" class="input-organic font-mono" />
          </div>
          <div class="form-group">
            <label class="form-label flex items-center gap-1">
              <Calendar :size="14" /> <span>初回認定年月日</span>
            </label>
            <input v-model="form.certDate" type="date" class="input-organic" />
          </div>
        </div>

        <div class="form-group">
          <label class="form-label flex items-center gap-1">
            <MapPin :size="14" /> <span>店舗所在地</span>
          </label>
          <input v-model="form.address" type="text" class="input-organic" />
        </div>

        <div class="form-group">
          <label class="form-label flex items-center gap-1">
            <Settings :size="14" /> <span>Gemini API キー (PDF解析用)</span>
          </label>
          <input v-model="form.geminiApiKey" type="password" class="input-organic font-mono" placeholder="AI解析用のキーを入力してください" />
          <p class="checkbox-help">※入力されたキーはブラウザに安全に保存されます。</p>
        </div>

        <div class="flex justify-end mt-4">
          <button class="btn btn-primary" @click="saveSettings">
            <Save :size="18" /> 設定を保存する
          </button>
        </div>
      </div>

      <!-- システム管理・データメンテナンス -->
      <div class="flex flex-col gap-6">
        <!-- 有機JASレストランのおさらい -->
        <div class="card card-accent">
          <h3 class="flex items-center gap-2 mb-3 text-accent"><Award :size="20" /> 有機料理を提供する飲食店の基準</h3>
          <p class="text-sub text-sm mb-3">
            有機JASレストランは、提供する料理に使用する原材料に占める有機農産物等の重量割合が<strong>95%以上（水及び食塩を除く）</strong>である場合に、その料理に「有機」や「オーガニック」と表示して提供が可能です。
          </p>
          <ul class="jas-requirements-list text-xs text-sub">
            <li>仕入時に有機JASマークを目視点検し、証明書を保管する。</li>
            <li>保管庫やコンテナを一般品と明確に区分（分別保管）する。</li>
            <li>調理時に一般品と接触しないよう器具を都度洗浄、または専用化する。</li>
            <li>仕入、受入、調理提供、売上すべての数量・ロットを帳簿に記録する。</li>
          </ul>
        </div>

        <!-- 開発用リセットツール -->
        <div class="card border-red-200 bg-red-50/10">
          <h3 class="flex items-center gap-2 mb-2 text-danger"><RotateCcw :size="20" /> 開発・メンテナンス</h3>
          <p class="text-sub text-xs mb-4">
            本アプリはデータの永続化にブラウザのLocalStorageを使用しています。動作検証や実演デモのために、すべてのデータを初期の推奨デモ状態に戻すことができます。
          </p>
          <div class="flex gap-2">
            <button class="btn btn-outline text-danger border-red-200 hover:bg-red-50" @click="handleReset">
              <RotateCcw :size="16" /> 初期シードデータに全リセット
            </button>
            <button class="btn btn-outline" @click="handleExport">
              <Save :size="16" /> データをバックアップ (エクスポート)
            </button>
            <button class="btn btn-primary" @click="() => fileInput.click()">
              <Check :size="16" /> バックアップから復元 (インポート)
            </button>
            <input type="file" ref="fileInput" @change="handleImport" accept=".json" style="display: none;" />
          </div>
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

.grid-layout {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 2rem;
}

@media (max-width: 1024px) {
  .grid-layout {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
}

.required {
  color: var(--danger);
}

.checkbox-help {
  font-size: 0.75rem;
  color: var(--text-light);
  margin: 0.125rem 0 0 0;
}

.flex-col {
  display: flex;
  flex-direction: column;
}

.gap-6 {
  gap: 1.5rem;
}

.border-red-200 {
  border-color: #fecaca;
}

.bg-red-50\/10 {
  background-color: rgba(254, 242, 242, 0.2);
}

.hover\:bg-red-50:hover {
  background-color: #fef2f2;
}

.jas-requirements-list {
  padding-left: 1.25rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.jas-requirements-list li {
  list-style-type: square;
}
</style>
