<script setup>
import { ref, reactive, computed } from 'vue';
import { restaurantStore } from '../store/restaurantStore';

const store = restaurantStore;
const { state, addCleaningLog, updateCleaningLog, deleteCleaningLog } = store;

// --- 状態 (UI用のリアクティブ変数) ---
const isModalOpen = ref(false);
const isEditMode = ref(false);
const editingLogId = ref(null);

const filterArea = ref('all');
const filterStatus = ref('all');

// フォームのモデル (reactiveを使用してテンプレートでのバインド追跡エラーを回避)
const form = reactive({
  date: new Date().toISOString().split('T')[0],
  area: 'ホール',
  checkedBy: '',
  isFloorCleaned: true,
  isTrashRemoved: true,
  isContactPrevented: true,
  status: 'good',
  notes: ''
});

// --- 計算プロパティ (Computed) ---
const filteredLogs = computed(() => {
  return store.decodedCleaningLogs.filter(log => {
    const areaMatch = filterArea.value === 'all' || log.area === filterArea.value;
    const statusMatch = filterStatus.value === 'all' || log.status === filterStatus.value;
    return areaMatch && statusMatch;
  });
});

const activeManager = computed(() => state.restaurantInfo.manager);

// --- アクション (Methods) ---
function openAddModal() {
  isEditMode.value = false;
  editingLogId.value = null;
  Object.assign(form, {
    date: new Date().toISOString().split('T')[0],
    area: 'ホール',
    checkedBy: activeManager.value || '',
    isFloorCleaned: true,
    isTrashRemoved: true,
    isContactPrevented: true,
    status: 'good',
    notes: ''
  });
  isModalOpen.value = true;
}

function openEditModal(log) {
  isEditMode.value = true;
  editingLogId.value = log.id;
  Object.assign(form, {
    date: log.date,
    area: log.area,
    checkedBy: log.checkedBy,
    isFloorCleaned: log.isFloorCleaned,
    isTrashRemoved: log.isTrashRemoved,
    isContactPrevented: log.isContactPrevented,
    status: log.status,
    notes: log.notes
  });
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
}

function handleSubmit() {
  if (!form.checkedBy.trim()) {
    alert('点検責任者を入力してください。');
    return;
  }

  const logData = { ...form };

  if (isEditMode.value && editingLogId.value) {
    updateCleaningLog(editingLogId.value, logData);
  } else {
    addCleaningLog(logData);
  }
  closeModal();
}

function handleDelete(id) {
  if (confirm('この清掃点検ログを削除してよろしいですか？\n(JAS監査の証跡データですので慎重に行ってください)')) {
    deleteCleaningLog(id);
  }
}

// 印刷処理（JAS監査提出用の美しいレイアウトで印刷）
function triggerPrint() {
  window.print();
}
</script>

<template>
  <div class="cleaning-container">
    <!-- ヘッダー -->
    <header class="view-header">
      <div class="header-title-area">
        <span class="badge badge-amber">JAS 0004 衛生管理</span>
        <h1 class="view-title">衛生・清掃点検記録簿</h1>
        <p class="view-subtitle">ホールの日常清掃および出荷場・厨房等のJAS衛生管理の証跡。過去の監査指摘「ホールの清掃」を完全カバーしています。</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-secondary" @click="triggerPrint">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          監査用印刷
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
          新規点検記録
        </button>
      </div>
    </header>

    <!-- 検索 & フィルター -->
    <div class="filter-card no-print">
      <div class="filter-group">
        <div class="filter-item">
          <label>点検エリア</label>
          <select v-model="filterArea" class="form-select">
            <option value="all">すべてのエリア</option>
            <option value="ホール">ホール（一般客エリア）</option>
            <option value="厨房">厨房（調理加工エリア）</option>
            <option value="食材保管庫">食材保管庫（区分保管庫）</option>
            <option value="出荷場">出荷場（配送・出荷エリア）</option>
          </select>
        </div>
        <div class="filter-item">
          <label>点検評価</label>
          <select v-model="filterStatus" class="form-select">
            <option value="all">すべてのステータス</option>
            <option value="good">良 (良好)</option>
            <option value="warning">要改善</option>
            <option value="bad">不可 (一般混同等)</option>
          </select>
        </div>
      </div>
      <div class="filter-stats">
        合計: <strong class="text-amber">{{ filteredLogs.length }}</strong> 件の記録
      </div>
    </div>

    <!-- 点検記録リスト（グリッド / 印刷対応） -->
    <div v-if="filteredLogs.length === 0" class="empty-state card">
      <div class="empty-icon">🧹</div>
      <h3>該当する清掃点検記録はありません</h3>
      <p>検索条件を変更するか、新しい点検記録を追加してください。</p>
      <button class="btn btn-primary" @click="openAddModal">最初の清掃記録を登録</button>
    </div>

    <div v-else class="logs-grid">
      <div 
        v-for="log in filteredLogs" 
        :key="log.id" 
        class="log-card card"
        :class="{ 'border-warning': log.status === 'warning', 'border-danger': log.status === 'bad' }"
      >
        <div class="log-card-header">
          <div class="log-date-area">
            <span class="log-date">{{ log.date }}</span>
            <span class="badge" :class="{
              'badge-green': log.area === '厨房' || log.area === '食材保管庫',
              'badge-amber': log.area === 'ホール',
              'badge-brown': log.area === '出荷場'
            }">{{ log.area }}</span>
          </div>
          <div class="log-status">
            <span class="status-indicator" :class="log.status">
              {{ log.status === 'good' ? '良好' : log.status === 'warning' ? '要改善' : '不適合' }}
            </span>
          </div>
        </div>

        <div class="log-checklist">
          <div class="check-item" :class="{ active: log.isFloorCleaned }">
            <span class="check-box">{{ log.isFloorCleaned ? '✓' : '✗' }}</span>
            <span class="check-label">床・壁・台の清掃および消毒</span>
          </div>
          <div class="check-item" :class="{ active: log.isTrashRemoved }">
            <span class="check-box">{{ log.isTrashRemoved ? '✓' : '✗' }}</span>
            <span class="check-label">ゴミ・非有機廃棄物のクリーン処理</span>
          </div>
          <div class="check-item" :class="{ active: log.isContactPrevented }">
            <span class="check-box">{{ log.isContactPrevented ? '✓' : '✗' }}</span>
            <span class="check-label">非有機食材（一般品）との混同防止</span>
          </div>
        </div>

        <div class="log-notes-box" v-if="log.notes">
          <span class="notes-title">特記事項:</span>
          <p class="notes-content">{{ log.notes }}</p>
        </div>

        <div class="log-card-footer">
          <div class="checked-by-badge">
            <span class="avatar">👨‍🍳</span>
            <span class="checked-label">点検者:</span>
            <strong class="checked-name">{{ log.checkedBy }}</strong>
          </div>
          <div class="card-actions no-print">
            <button class="btn-icon text-amber" @click="openEditModal(log)" title="編集">
              <svg class="icon" viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>
            </button>
            <button class="btn-icon text-danger" @click="handleDelete(log.id)" title="削除">
              <svg class="icon" viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 印刷用特別コンポーネント（印刷時のみ表示） -->
    <div class="print-only-container">
      <h2 class="print-title">有機JAS 0004 清掃点検実績報告書</h2>
      <div class="print-meta-grid">
        <div><strong>店舗名：</strong>{{ state.restaurantInfo.name }}</div>
        <div><strong>認定番号：</strong>{{ state.restaurantInfo.certNumber }}</div>
        <div><strong>生産行程管理責任者：</strong>{{ state.restaurantInfo.manager }}</div>
        <div><strong>印刷日：</strong>{{ new Date().toLocaleDateString('ja-JP') }}</div>
      </div>
      <table class="print-table-sheet">
        <thead>
          <tr>
            <th style="width: 12%">点検日</th>
            <th style="width: 15%">エリア</th>
            <th style="width: 15%">床壁清掃</th>
            <th style="width: 15%">廃棄クリーン</th>
            <th style="width: 15%">混同・接触防止</th>
            <th style="width: 8%">評価</th>
            <th style="width: 12%">点検責任者</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td>{{ log.date }}</td>
            <td><strong>{{ log.area }}</strong></td>
            <td class="text-center">{{ log.isFloorCleaned ? '適合 (良)' : '不適合' }}</td>
            <td class="text-center">{{ log.isTrashRemoved ? '適合 (良)' : '不適合' }}</td>
            <td class="text-center">{{ log.isContactPrevented ? '適合 (良)' : '不適合' }}</td>
            <td class="text-center">
              <span :class="log.status">{{ log.status === 'good' ? '良好' : log.status === 'warning' ? '要改善' : '不可' }}</span>
            </td>
            <td>{{ log.checkedBy }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- 点検追加・編集用モーダル -->
    <teleport to="body">
      <div v-if="isModalOpen" class="modal-overlay no-print" @click.self="closeModal">
        <div class="modal-card">
          <div class="modal-header">
            <h3>{{ isEditMode ? '清掃点検記録の編集' : '新規清掃点検記録の登録' }}</h3>
            <button class="btn-close" @click="closeModal">×</button>
          </div>
          <form @submit.prevent="handleSubmit" class="modal-form">
            <div class="form-row">
              <div class="form-group col-6">
                <label class="required">点検年月日</label>
                <input type="date" v-model="form.date" required class="form-control" />
              </div>
              <div class="form-group col-6">
                <label class="required">点検エリア</label>
                <select v-model="form.area" required class="form-select">
                  <option value="ホール">ホール (一般客席・提供エリア)</option>
                  <option value="厨房">厨房 (調理・盛り付けエリア)</option>
                  <option value="食材保管庫">食材保管庫 (冷蔵・ドライ保管庫)</option>
                  <option value="出荷場">出荷場 (食材受入・搬出口)</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label class="required">点検責任者</label>
              <input type="text" v-model="form.checkedBy" required placeholder="例：鈴木 美咲" class="form-control" />
            </div>

            <!-- チェックリスト -->
            <div class="form-checklist-group">
              <h4 class="form-sub-title">JAS 0004 必須点検チェックリスト</h4>
              
              <label class="checkbox-container">
                <input type="checkbox" v-model="form.isFloorCleaned" />
                <span class="checkmark"></span>
                <div class="checkbox-text">
                  <strong>床・壁・台の清掃および消毒</strong>
                  <p>調理台やテーブルが清潔に保たれ、有機適合の消毒（アルコール等）がなされているか。</p>
                </div>
              </label>

              <label class="checkbox-container">
                <input type="checkbox" v-model="form.isTrashRemoved" />
                <span class="checkmark"></span>
                <div class="checkbox-text">
                  <strong>一般食材ゴミの分別・クリーン処理</strong>
                  <p>非有機食材のゴミ・残渣が飛散せず、速やかに蓋付きゴミ箱等へ分別処理されているか。</p>
                </div>
              </label>

              <label class="checkbox-container">
                <input type="checkbox" v-model="form.isContactPrevented" />
                <span class="checkmark"></span>
                <div class="checkbox-text">
                  <strong>非有機食材（一般品）との接触・混同防止</strong>
                  <p>調理器具（トング・まな板等）が分別されているか、または使用前に徹底洗浄されたか。</p>
                </div>
              </label>
            </div>

            <div class="form-row">
              <div class="form-group col-12">
                <label>総合評価</label>
                <div class="status-radio-group">
                  <label class="radio-label good" :class="{ selected: form.status === 'good' }">
                    <input type="radio" value="good" v-model="form.status" /> 良 (良好)
                  </label>
                  <label class="radio-label warning" :class="{ selected: form.status === 'warning' }">
                    <input type="radio" value="warning" v-model="form.status" /> 要改善
                  </label>
                  <label class="radio-label bad" :class="{ selected: form.status === 'bad' }">
                    <input type="radio" value="bad" v-model="form.status" /> 不適合
                  </label>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label>特記事項・改善処置内容</label>
              <textarea v-model="form.notes" placeholder="例：ホールのメニュー掲示板に、自家製ビールは一般品である旨を明確に追記したことを確認。" rows="3" class="form-control"></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" @click="closeModal">キャンセル</button>
              <button type="submit" class="btn btn-primary">{{ isEditMode ? '更新保存' : '記録を追加' }}</button>
            </div>
          </form>
        </div>
      </div>
    </teleport>
  </div>
</template>

<style scoped>
.cleaning-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.logs-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 1.5rem;
}

.log-card {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
  border-left: 5px solid var(--olive-primary);
}

.log-card:hover {
  transform: translateY(-4px);
}

.border-warning {
  border-left: 5px solid var(--amber-dark) !important;
}

.border-danger {
  border-left: 5px solid #d9534f !important;
}

.log-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid rgba(139, 90, 43, 0.1);
  padding-bottom: 0.75rem;
}

.log-date-area {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.log-date {
  font-family: 'Outfit', sans-serif;
  font-weight: 700;
  color: var(--amber-dark);
  font-size: 1.1rem;
}

.log-status .status-indicator {
  font-size: 0.85rem;
  font-weight: 700;
  padding: 0.25rem 0.6rem;
  border-radius: 4px;
}

.status-indicator.good {
  background-color: rgba(40, 167, 69, 0.1);
  color: #28a745;
}

.status-indicator.warning {
  background-color: rgba(255, 193, 7, 0.1);
  color: var(--amber-dark);
}

.status-indicator.bad {
  background-color: rgba(220, 53, 69, 0.1);
  color: #dc3545;
}

.log-checklist {
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.check-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #777;
}

.check-item.active {
  color: var(--olive-dark);
}

.check-box {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  width: 18px;
  height: 18px;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 900;
  background-color: #f0f0f0;
}

.active .check-box {
  background-color: var(--olive-primary);
  color: white;
}

.log-notes-box {
  background-color: rgba(139, 90, 43, 0.04);
  border: 1px dashed rgba(139, 90, 43, 0.15);
  border-radius: 6px;
  padding: 0.75rem;
  font-size: 0.85rem;
}

.notes-title {
  font-weight: 700;
  color: var(--amber-dark);
}

.notes-content {
  margin: 0.25rem 0 0 0;
  line-height: 1.4;
  color: #555;
}

.log-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(139, 90, 43, 0.1);
  padding-top: 0.75rem;
  margin-top: auto;
}

.checked-by-badge {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.checked-label {
  color: #777;
}

.checked-name {
  color: var(--olive-dark);
}

/* モーダルのラジオボタン特化 */
.status-radio-group {
  display: flex;
  gap: 1rem;
  margin-top: 0.5rem;
}

.radio-label {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;
}

.radio-label input {
  display: none;
}

.radio-label.good.selected {
  border-color: #28a745;
  background-color: rgba(40, 167, 69, 0.05);
  color: #28a745;
}

.radio-label.warning.selected {
  border-color: var(--amber-dark);
  background-color: rgba(245, 166, 35, 0.05);
  color: var(--amber-dark);
}

.radio-label.bad.selected {
  border-color: #dc3545;
  background-color: rgba(220, 53, 69, 0.05);
  color: #dc3545;
}

/* 印刷用レイアウト */
.print-only-container {
  display: none;
}

@media print {
  .no-print {
    display: none !important;
  }
  
  .cleaning-container {
    background-color: white !important;
    color: black !important;
  }

  .logs-grid {
    display: none !important;
  }

  .print-only-container {
    display: block !important;
    font-family: "MS Mincho", "Hiragino Mincho Pro", serif;
  }

  .print-title {
    text-align: center;
    font-size: 1.6rem;
    margin-bottom: 1.5rem;
    border-bottom: 3px double #000;
    padding-bottom: 0.5rem;
  }

  .print-meta-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.5rem;
    margin-bottom: 1.5rem;
    font-size: 0.9rem;
  }

  .print-table-sheet {
    width: 100%;
    border-collapse: collapse;
  }

  .print-table-sheet th,
  .print-table-sheet td {
    border: 1px solid #000;
    padding: 0.6rem;
    font-size: 0.85rem;
    text-align: left;
  }

  .print-table-sheet th {
    background-color: #f0f0f0 !important;
    font-weight: bold;
    text-align: center;
  }

  .text-center {
    text-align: center !important;
  }

  .good {
    color: green !important;
    font-weight: bold;
  }

  .warning {
    color: orange !important;
    font-weight: bold;
  }

  .bad {
    color: red !important;
    font-weight: bold;
  }
}
</style>
