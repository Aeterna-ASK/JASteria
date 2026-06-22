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

// ============================================================================
// 日常清掃チェック表（印刷 → 手書き → スキャン受信箱へ取り込み）
//  - 縦＝清掃項目／横＝日付(1〜末日) の月間チェック表（チェックを書き込むだけ）
//  - エリアごと・月ごとに1枚。確実に動く別ウィンドウ書き出し方式で印刷（A4横）。
// ============================================================================
const cleaningAreas = ['ホール', '厨房', '食材保管庫', '出荷場'];
const dailyCleaningItems = [
  '床の清掃・消毒',
  '壁・什器・備品の清掃',
  'テーブル・カウンターの清掃消毒',
  'ゴミの廃棄・分別',
  '手洗い・消毒設備の点検',
  '一般エリアとの区分・接触防止',
  '害虫・異物の有無確認'
];
const dcArea = ref('ホール');
const dcYear = ref(new Date().getFullYear());
const dcMonth = ref(new Date().getMonth() + 1);
const dcYears = computed(() => {
  const c = new Date().getFullYear();
  return Array.from({ length: 5 }, (_, i) => c - 2 + i);
});

function printDailyCleaning() {
  const year = dcYear.value;
  const month = dcMonth.value;
  const days = new Date(year, month, 0).getDate();
  const storeName = state.restaurantInfo.name || '';
  const manager = state.restaurantInfo.manager || '';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  let dayTh = '';
  let dayBlank = '';
  for (let d = 1; d <= days; d++) { dayTh += `<th class="day">${d}</th>`; dayBlank += '<td></td>'; }

  let rows = '';
  dailyCleaningItems.forEach(it => { rows += `<tr><th class="item">${esc(it)}</th>${dayBlank}</tr>`; });

  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>日常清掃チェック表</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; }
  body { font-family: "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif; color: #111827; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .head { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 6px; }
  h1 { font-size: 18px; margin: 0; }
  .sub { font-size: 12px; color: #374151; }
  table { border-collapse: collapse; width: 100%; table-layout: fixed; }
  th, td { border: 1px solid #555; text-align: center; font-size: 9px; height: 22px; }
  th.item { width: 130px; text-align: left; padding: 2px 4px; background: #f1f5f9; font-size: 10px; white-space: nowrap; }
  th.day { background: #ecfdf5; color: #065f46; font-weight: 700; }
  .note { font-size: 10px; color: #6b7280; margin-top: 6px; }
  .sign-area { display: flex; align-items: flex-end; gap: 24px; margin-top: 14px; font-size: 12px; }
  .sign-line { display: inline-block; min-width: 180px; border-bottom: 1px solid #111827; }
  .sign-date { display: inline-block; min-width: 110px; border-bottom: 1px solid #111827; }
</style></head><body>
  <div class="head">
    <div><h1>日常清掃チェック表</h1><div class="sub">${esc(storeName)}　／　エリア: ${esc(dcArea.value)}</div></div>
    <div class="sub">${year}年 ${month}月　／　責任者: ${esc(manager)}</div>
  </div>
  <table><thead><tr><th class="item">清掃項目 ＼ 日</th>${dayTh}</tr></thead><tbody>${rows}</tbody></table>
  <div class="sign-area">
    <span>月次確認（確認者サイン）：<span class="sign-line"></span></span>
    <span>確認日：<span class="sign-date"></span></span>
  </div>
  <div class="note">※ 実施した日にチェック（レ）を記入してください。確認者のサインは月末に1か所のみで結構です。記入後はスキャンして「スキャン受信箱」に取り込み、当月・当エリアの証跡として保存します。</div>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) { alert('ポップアップがブロックされました。印刷するには、このサイトのポップアップを許可してください。'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
}
</script>

<template>
  <div class="cleaning-container">
    <!-- モダンヘッダー -->
    <header class="hyg-header">
      <div class="header-title-area">
        <span class="badge badge-amber">JAS 0004 衛生管理</span>
        <h1 class="view-title">衛生・清掃点検記録簿</h1>
        <p class="view-subtitle">エリアごとに月次点検を実施。日常清掃は専用シートを印刷→手書き→スキャンして証跡化します。</p>
      </div>
      <button class="btn btn-primary" @click="openAddModal">
        <svg class="icon" viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>
        新規点検記録
      </button>
    </header>

    <!-- 日常清掃チェック表（印刷用紙） -->
    <section class="hyg-panel hyg-panel--print no-print">
      <div class="hyg-panel-head">
        <div class="hyg-panel-icon">
          <svg viewBox="0 0 24 24" width="22" height="22" fill="#16a34a"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
        </div>
        <div>
          <h2 class="hyg-panel-title">日常清掃チェック表（印刷用紙）</h2>
          <p class="hyg-panel-desc">縦＝清掃項目／横＝日付の月間チェック表。印刷して毎日手書き → スキャンして「スキャン受信箱」へ取り込み、証跡化します。</p>
        </div>
      </div>
      <div class="hyg-controls">
        <label class="hyg-field"><span>エリア</span>
          <select v-model="dcArea" class="form-select hyg-select">
            <option v-for="a in cleaningAreas" :key="a" :value="a">{{ a }}</option>
          </select>
        </label>
        <label class="hyg-field"><span>対象年</span>
          <select v-model="dcYear" class="form-select hyg-select">
            <option v-for="y in dcYears" :key="y" :value="y">{{ y }}年</option>
          </select>
        </label>
        <label class="hyg-field"><span>対象月</span>
          <select v-model="dcMonth" class="form-select hyg-select">
            <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
          </select>
        </label>
        <button class="btn btn-emerald" @click="printDailyCleaning">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          この内容で印刷
        </button>
      </div>
    </section>

    <!-- 点検記録（月次点検） -->
    <section class="hyg-panel no-print">
      <div class="hyg-panel-head hyg-panel-head--between">
        <div class="hyg-head-left">
          <div class="hyg-panel-icon hyg-panel-icon--amber">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="#b45309"><path d="M16 11l-1.42-1.42L9 15.17 6.41 12.6 5 14l4 4 7-7zM12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"/></svg>
          </div>
          <div>
            <h2 class="hyg-panel-title">点検記録（月次点検）</h2>
            <p class="hyg-panel-desc">合計 <strong style="color:#b45309;">{{ filteredLogs.length }}</strong> 件の記録</p>
          </div>
        </div>
        <button class="btn btn-soft" @click="triggerPrint">
          <svg class="icon" viewBox="0 0 24 24"><path d="M19 8H5c-1.66 0-3 1.34-3 3v6h4v4h12v-4h4v-6c0-1.66-1.34-3-3-3zm-3 11H8v-5h8v5zm3-7c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm-1-9H6v4h12V3z"/></svg>
          監査用印刷
        </button>
      </div>
      <div class="hyg-controls">
        <label class="hyg-field"><span>エリアで絞り込み</span>
          <select v-model="filterArea" class="form-select hyg-select">
            <option value="all">すべてのエリア</option>
            <option value="ホール">ホール（一般客エリア）</option>
            <option value="厨房">厨房（調理加工エリア）</option>
            <option value="食材保管庫">食材保管庫（区分保管庫）</option>
            <option value="出荷場">出荷場（配送・出荷エリア）</option>
          </select>
        </label>
        <label class="hyg-field"><span>評価で絞り込み</span>
          <select v-model="filterStatus" class="form-select hyg-select">
            <option value="all">すべてのステータス</option>
            <option value="good">良 (良好)</option>
            <option value="warning">要改善</option>
            <option value="bad">不可 (一般混同等)</option>
          </select>
        </label>
      </div>
    </section>

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
  gap: 1.25rem;
}

/* ===== モダン版 ヘッダー＆操作パネル ===== */
.hyg-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1rem;
  flex-wrap: wrap;
}
.hyg-panel {
  background: #ffffff;
  border: 1px solid #e6efe9;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(16, 24, 40, 0.05);
  padding: 1.1rem 1.25rem;
}
.hyg-panel--print { border-left: 5px solid #16a34a; }
.hyg-panel-head {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 0.9rem;
}
.hyg-panel-head--between { justify-content: space-between; align-items: center; }
.hyg-head-left { display: flex; align-items: center; gap: 0.6rem; }
.hyg-panel-icon {
  width: 40px; height: 40px; border-radius: 10px;
  background: #ecfdf5; display: flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.hyg-panel-icon--amber { background: #fffbeb; }
.hyg-panel-title { font-size: 1.05rem; font-weight: 700; color: #1f2937; margin: 0; }
.hyg-panel-desc { font-size: 0.8rem; color: #6b7280; margin: 2px 0 0; line-height: 1.5; }
.hyg-controls { display: flex; flex-wrap: wrap; align-items: flex-end; gap: 0.75rem; }
.hyg-field { display: flex; flex-direction: column; gap: 0.3rem; font-size: 0.78rem; color: #475569; font-weight: 600; }
.hyg-select {
  padding: 0.5rem 0.7rem !important;
  border: 1px solid #cbd5e1 !important;
  border-radius: 9px !important;
  background: #fff;
  font-size: 0.95rem;
  font-weight: 400;
  min-width: 160px;
  color: #1f2937;
}
.hyg-select:focus { outline: none; border-color: #10b981 !important; box-shadow: 0 0 0 3px rgba(16,185,129,0.15); }
.btn-emerald {
  background: #16a34a; color: #fff; border: none;
  padding: 0.55rem 1.1rem; border-radius: 10px; font-weight: 700; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.btn-emerald:hover { background: #15803d; }
.btn-soft {
  background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;
  padding: 0.5rem 0.9rem; border-radius: 10px; font-weight: 600; cursor: pointer;
  display: inline-flex; align-items: center; gap: 0.4rem;
}
.btn-soft:hover { background: #e2e8f0; }
.btn-emerald .icon, .btn-soft .icon { width: 16px; height: 16px; fill: currentColor; }

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
