<script setup>
import { ref, computed, watch } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { 
  CheckCircle, 
  Plus, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Check, 
  X, 
  Search,
  Calendar,
  User,
  Coffee,
  Info,
  Printer
} from 'lucide-vue-next';

const state = restaurantStore.state;
const decodedCookingLogs = computed(() => restaurantStore.decodedCookingLogs);
const decodedMenus = computed(() => restaurantStore.decodedMenus);

// 検索 & フィルター
const filterStartDate = ref('');
const filterEndDate = ref('');
const filterMenu = ref('');

const availableMenus = computed(() => {
  const menus = new Set(decodedCookingLogs.value.map(log => log.masterName));
  return Array.from(menus).sort();
});

const filteredLogs = computed(() => {
  return decodedCookingLogs.value.filter(log => {
    let matchDate = true;
    if (filterStartDate.value) {
      matchDate = matchDate && log.date >= filterStartDate.value;
    }
    if (filterEndDate.value) {
      matchDate = matchDate && log.date <= filterEndDate.value;
    }
    const matchMenu = !filterMenu.value || log.masterName === filterMenu.value;
    return matchDate && matchMenu;
  });
});

const activeMasterMenus = computed(() => {
  const map = new Map();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  decodedMenus.value.forEach(menu => {
    const isAchieved = menu.deadline && new Date(menu.deadline) < today;
    const name = menu.masterName || menu.name;
    
    // 旧バージョン（アーカイブ）はプルダウンに表示しない
    if (menu.isActiveVersion === false) return;
    // レシピ画面のみ表示（非反映）は調理点検の対象外
    if (menu.recipeOnly) return;
    
    if (!map.has(name)) {
      map.set(name, menu);
    } else if (!isAchieved) {
      // If we find an active one, overwrite an achieved one
      const existing = map.get(name);
      const existingAchieved = existing.deadline && new Date(existing.deadline) < today;
      if (existingAchieved) {
        map.set(name, menu);
      }
    }
  });
  
  return Array.from(map.values());
});

// ============================================================================
// 表形式（月×メニューの食数マトリクス）モード
// ============================================================================
const viewMode = ref('list'); // 'list' | 'matrix'

const matrixYears = computed(() => {
  const cur = new Date().getFullYear();
  return Array.from({ length: 8 }, (_, i) => cur - 4 + i);
});
const matrixStartYear = ref(new Date().getFullYear());
const matrixStartMonth = ref(1);

// 開始年月から12ヶ月分の月キー(YYYY-MM)を生成
const matrixMonths = computed(() => {
  const arr = [];
  for (let i = 0; i < 12; i++) {
    let cm = matrixStartMonth.value + i;
    let cy = matrixStartYear.value;
    while (cm > 12) { cm -= 12; cy++; }
    arr.push({ key: `${cy}-${String(cm).padStart(2, '0')}`, year: cy, month: cm });
  }
  return arr;
});

// マトリクスの列（アクティブなメニュー）
const matrixMenus = computed(() => activeMasterMenus.value);

// 指定メニュー(masterName)・月(YYYY-MM)に一致する調理ログ
const logsForCell = (masterName, monthKey) =>
  decodedCookingLogs.value.filter(l => l.masterName === masterName && l.date === monthKey);

// セルの食数（その月・そのメニューの合計）
const cellQuantity = (masterName, monthKey) =>
  logsForCell(masterName, monthKey).reduce((s, l) => s + (Number(l.quantity) || 0), 0);

// 列（メニュー）ごとの合計
const columnTotal = (masterName) =>
  matrixMonths.value.reduce((s, m) => s + cellQuantity(masterName, m.key), 0);

// 全体合計
const grandTotal = computed(() =>
  matrixMenus.value.reduce((s, menu) => s + columnTotal(menu.masterName), 0)
);

// セル編集：食数を入力すると、その月・そのメニューの記録を作成／更新する
const setCellQuantity = (menu, monthKey, rawValue) => {
  const value = Math.max(0, Math.round(Number(rawValue) || 0));
  const matches = logsForCell(menu.masterName, monthKey);
  if (matches.length === 0) {
    if (value > 0) {
      restaurantStore.addCookingLog({
        date: monthKey,
        menuId: menu.id,
        quantity: value,
        checkedBy: state.restaurantInfo.manager,
        isUtensilsClean: true,
        isIngredientVerified: true,
        lotDetails: '',
        notes: ''
      });
    }
  } else {
    // 複数ある月は先頭の記録を更新する（1セル＝その月の代表記録）
    restaurantStore.updateCookingLog(matches[0].id, { quantity: value });
  }
};

// 食数表を印刷（確実に動く別ウィンドウ書き出し方式。値はプレーンな数値で出力）
const printMatrix = () => {
  const menus = matrixMenus.value;
  const months = matrixMonths.value;
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
  const storeName = state.restaurantInfo.name || '';

  let head = '<tr><th class="m">対象年月</th>';
  menus.forEach(mn => { head += `<th>${esc(mn.masterName || mn.name)}</th>`; });
  head += '<th class="tot">月合計</th></tr>';

  let body = '';
  months.forEach(m => {
    let rowTotal = 0;
    let cells = '';
    menus.forEach(mn => {
      const q = cellQuantity(mn.masterName, m.key);
      rowTotal += q;
      cells += `<td>${q ? q.toLocaleString() : ''}</td>`;
    });
    body += `<tr><th class="m">${m.year}年${m.month}月</th>${cells}<td class="tot">${rowTotal.toLocaleString()}</td></tr>`;
  });

  let footCells = '';
  menus.forEach(mn => { footCells += `<td>${columnTotal(mn.masterName).toLocaleString()}</td>`; });
  const foot = `<tr class="foot"><th class="m">合計</th>${footCells}<td class="tot">${grandTotal.value.toLocaleString()}</td></tr>`;

  const periodLabel = `${months[0].year}年${months[0].month}月 〜 ${months[11].year}年${months[11].month}月`;

  const html = `<!DOCTYPE html><html lang="ja"><head><meta charset="utf-8"><title>オーガニック料理 食数表</title>
<style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { font-family: "Hiragino Kaku Gothic ProN","Yu Gothic","Meiryo",sans-serif; color: #111827; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .head-bar { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 8px; }
  h1 { font-size: 18px; margin: 0; }
  .sub { font-size: 11px; color: #374151; }
  table { border-collapse: collapse; width: 100%; font-size: 11px; }
  th, td { border: 1px solid #9ca3af; padding: 4px 6px; text-align: center; white-space: nowrap; }
  thead th { background: #065f46; color: #fff; }
  th.m { text-align: left; background: #ecfdf5; color: #065f46; }
  thead th.m { background: #064e3b; color: #fff; }
  td.tot, th.tot { background: #fff7ed; color: #b45309; font-weight: bold; }
  thead th.tot { background: #047857; color: #fff; }
  tr.foot th, tr.foot td { background: #f1f5f9; font-weight: bold; }
  tr.foot td.tot { background: #fde68a; color: #92400e; }
</style></head>
<body>
  <div class="head-bar">
    <div><h1>オーガニック料理 食数表</h1><div class="sub">${esc(storeName)}</div></div>
    <div class="sub">対象期間: ${periodLabel}　／　作成日: ${new Date().toLocaleDateString('ja-JP')}</div>
  </div>
  <table><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table>
  <script>window.onload=function(){window.print();window.onafterprint=function(){window.close();};};<\/script>
</body></html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) { alert('ポップアップがブロックされました。印刷するには、このサイトのポップアップを許可してください。'); return; }
  win.document.open();
  win.document.write(html);
  win.document.close();
};

// モーダル・フォーム状態
const showModal = ref(false);
const isEditing = ref(false);
const currentId = ref(null);

const formYear = ref(new Date().getFullYear());
const formMonth = ref(new Date().getMonth() + 1);

watch([formYear, formMonth], ([year, month]) => {
  form.value.date = `${year}-${String(month).padStart(2, '0')}`;
});

const form = ref({
  date: '',
  menuId: '',
  quantity: 1,
  checkedBy: '',
  isUtensilsClean: true,
  isIngredientVerified: true,
  lotDetails: '',
  notes: ''
});

const errorMessage = ref('');

// モーダルオープン (新規)
const openAddModal = () => {
  isEditing.value = false;
  currentId.value = null;
  
  // 有機メニューとして主張しているものだけをフィルタ、なければすべて
  const claimMenus = activeMasterMenus.value.filter(m => m.isOrganicClaim);
  const defaultMenuId = claimMenus[0]?.id || activeMasterMenus.value[0]?.id || '';

  const now = new Date();
    formYear.value = now.getFullYear();
    formMonth.value = now.getMonth() + 1;
    
    form.value = {
      date: `${formYear.value}-${String(formMonth.value).padStart(2, '0')}`,
    menuId: defaultMenuId,
    quantity: 1,
    checkedBy: state.restaurantInfo.manager,
    isUtensilsClean: true,
    isIngredientVerified: true,
    lotDetails: '',
    notes: ''
  };
  
  updateLotDetailsDefault();
  errorMessage.value = '';
  showModal.value = true;
};

// モーダルオープン (編集)
const openEditModal = (log) => {
  isEditing.value = true;
  currentId.value = log.id;
  const [y, m] = log.date.substring(0, 7).split('-');
  formYear.value = parseInt(y, 10);
  formMonth.value = parseInt(m, 10);
  
  form.value = {
    date: log.date.substring(0, 7),
    menuId: log.menuId,
    quantity: log.quantity,
    checkedBy: log.checkedBy,
    isUtensilsClean: log.isUtensilsClean,
    isIngredientVerified: log.isIngredientVerified,
    lotDetails: log.lotDetails,
    notes: log.notes
  };
  errorMessage.value = '';
  showModal.value = true;
};

// メニュー選択時にロットの自動提案 (おもてなしUI)
const updateLotDetailsDefault = () => {
  const menu = decodedMenus.value.find(m => m.id === form.value.menuId);
  if (!menu) return;

  // メニューに含まれる有機原材料を検索
  const orgIngNames = menu.recipeDetails
    .filter(detail => detail.type === 'organic')
    .map(detail => detail.name);

  if (orgIngNames.length > 0) {
    // 直近の受入記録からロット番号を取得して自動提案
    const suggestions = orgIngNames.map(name => {
      const ing = state.ingredients.find(i => i.name === name);
      if (ing) {
        // この原材料に紐付く直近の受入記録
        const lastRec = [...state.receipts]
          .filter(r => r.ingredientId === ing.id)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
        if (lastRec) {
          return `${name.replace('有機JAS', '')}: ${lastRec.lotNumber}`;
        }
      }
      return `${name.replace('有機JAS', '')}: [ロット確認]`;
    });
    form.value.lotDetails = suggestions.join(', ');
  } else {
    form.value.lotDetails = '有機原材料なし';
  }
};

// 保存アクション
const saveLog = () => {
  if (!form.value.menuId) {
    errorMessage.value = '調理メニューを選択してください。';
    return;
  }
  if (form.value.quantity < 0) {
    errorMessage.value = '調理食数は0以上の数値を入力してください。';
    return;
  }
  if (!form.value.checkedBy.trim()) {
    errorMessage.value = '確認担当者を入力してください。';
    return;
  }

  try {
    if (isEditing.value) {
      restaurantStore.updateCookingLog(currentId.value, form.value);
    } else {
      restaurantStore.addCookingLog(form.value);
    }
    showModal.value = false;
  } catch (err) {
    errorMessage.value = err.message;
  }
};

// 削除アクション
const deleteLog = (id, menuName, date) => {
  if (confirm(`${date} 調理の「${menuName}」の提供・調理記録を削除してもよろしいですか？`)) {
    restaurantStore.deleteCookingLog(id);
  }
};

const getMenuOrganicClaim = (id) => {
  const menu = state.menus.find(m => m.id === id);
  return menu ? menu.isOrganicClaim : false;
};
</script>

<template>
  <div class="animate-fade-in">
    <div class="view-header mb-6">
      <div class="header-title">
        <h2 class="flex items-center gap-2"><CheckCircle :size="24" /> 調理・提供点検記録</h2>
        <p class="text-sub">「有機料理」としてメニューを提供する際、調理器具を洗浄して一般品と混ざるのを防ぎ、正しい有機材料を使用したロットを追跡した証跡です。</p>
      </div>
      <div style="display: flex; gap: 0.5rem; align-items: center;">
        <button class="btn btn-outline" @click="viewMode = viewMode === 'list' ? 'matrix' : 'list'">
          {{ viewMode === 'list' ? '表形式（食数表）で表示' : 'リスト表示に戻す' }}
        </button>
        <button class="btn btn-primary" @click="openAddModal">
          <Plus :size="18" /> 新規調理記録
        </button>
      </div>
    </div>

    <!-- リスト表示モード -->
    <template v-if="viewMode === 'list'">
    <!-- 検索 & フィルターバー -->
    <div class="filter-bar card mb-6" style="display: flex; gap: 1rem; align-items: center;">
      <div class="form-group" style="margin-bottom: 0; display: flex; align-items: center; gap: 0.5rem;">
        <input type="month" v-model="filterStartDate" class="input-organic" style="min-width: 140px;" />
        <span class="text-sub">〜</span>
        <input type="month" v-model="filterEndDate" class="input-organic" style="min-width: 140px;" />
      </div>
      <div class="form-group" style="margin-bottom: 0; flex-grow: 1; max-width: 300px;">
        <select v-model="filterMenu" class="input-organic" style="width: 100%;">
          <option value="">すべてのメニュー</option>
          <option v-for="menuName in availableMenus" :key="menuName" :value="menuName">{{ menuName }}</option>
        </select>
      </div>
      <div class="text-sub text-xs flex items-center gap-1" style="margin-left: auto;">
        <Info :size="14" /> 有機JASの年次審査時に、仕入・調理・売上（提供）の「数量およびロットの辻褄」が合っているかが厳格にチェックされます。
      </div>
    </div>

    <!-- 調理記録テーブル -->
    <div class="table-container">
      <table class="table-organic">
        <thead>
          <tr>
            <th style="width: 110px;">対象年月</th>
            <th>調理メニュー</th>
            <th style="width: 100px; text-align: center;">提供食数</th>
            <th>使用有機ロット (追跡情報)</th>
            <th>混同防止点検 (JAS)</th>
            <th>確認者</th>
            <th>備考</th>
            <th style="width: 100px; text-align: center;">操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredLogs.length === 0">
            <td colspan="8" class="text-center text-light py-8">
              該当する調理・提供記録が見つかりませんでした。
            </td>
          </tr>
          <tr v-for="log in filteredLogs" :key="log.id">
            <td class="font-mono text-sm">
              <span class="flex items-center gap-1"><Calendar :size="14" class="text-sub" /> {{ log.date }}</span>
            </td>
            <td>
              <div class="font-semibold">{{ log.masterName }}</div>
              <span v-if="getMenuOrganicClaim(log.menuId)" class="badge badge-accent">有機表示メニュー</span>
              <span v-else class="badge badge-neutral">一般メニュー</span>
            </td>
            <td class="font-bold font-mono text-center text-accent" style="font-size: 1.1rem;">
              {{ log.quantity }} <span class="text-sub font-normal text-xs">食</span>
            </td>
            <td>
              <div class="font-mono text-xs bg-neutral-50 p-1 rounded border lot-details-text" :title="log.lotDetails">
                {{ log.lotDetails || '一般メニューのため追跡不要' }}
              </div>
            </td>
            <td>
              <div class="check-items-summary">
                <span :class="['check-pill', log.isUtensilsClean ? 'yes' : 'no']" :title="log.isUtensilsClean ? '調理器具類は洗浄済です' : '未洗浄・接触懸念！'">
                  {{ log.isUtensilsClean ? '✓ 器具洗浄済' : '✗ 接触懸念' }}
                </span>
                <span :class="['check-pill', log.isIngredientVerified ? 'yes' : 'no']" :title="log.isIngredientVerified ? '有機食材ロット一致確認済' : 'ロット未確認！'">
                  {{ log.isIngredientVerified ? '✓ ロット一致' : '✗ ロット未確認' }}
                </span>
              </div>
            </td>
            <td>
              <span class="flex items-center gap-1 text-sm"><User :size="14" class="text-sub" /> {{ log.checkedBy }}</span>
            </td>
            <td class="text-sub text-xs max-w-xs truncate" :title="log.notes">{{ log.notes || '-' }}</td>
            <td style="text-align: center;">
              <div class="action-buttons-cell">
                <button class="btn-icon-only text-primary" title="編集" @click="openEditModal(log)">
                  <Edit3 :size="16" />
                </button>
                <button class="btn-icon-only text-danger" title="削除" @click="deleteLog(log.id, log.masterName, log.date)">
                  <Trash2 :size="16" />
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    </template>

    <!-- 表形式（月×メニュー食数表）モード -->
    <template v-else>
      <div class="matrix-toolbar">
        <div class="matrix-period">
          <span class="matrix-period-label">表示期間</span>
          <select v-model="matrixStartYear" class="matrix-select">
            <option v-for="y in matrixYears" :key="y" :value="y">{{ y }}年</option>
          </select>
          <select v-model="matrixStartMonth" class="matrix-select">
            <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
          </select>
          <span class="matrix-period-hint">から 12 ヶ月</span>
        </div>
        <button class="btn btn-primary" @click="printMatrix" style="display: flex; align-items: center; gap: 0.35rem;">
          <Printer :size="16" /> 印刷 / PDF
        </button>
        <div class="matrix-hint">
          <Info :size="15" /> セルに食数を入力すると、その月・メニューの記録が自動で作成／更新されます
        </div>
      </div>

      <div class="matrix-wrap">
        <table class="foodcount-matrix">
          <thead>
            <tr>
              <th class="fm-corner">対象年月</th>
              <th v-for="menu in matrixMenus" :key="menu.id" class="fm-menu-head">{{ menu.masterName || menu.name }}</th>
              <th class="fm-total-head">月合計</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="matrixMenus.length === 0">
              <td :colspan="2" class="fm-empty">表示できるメニューがありません。</td>
            </tr>
            <tr v-for="m in matrixMonths" :key="m.key">
              <th class="fm-month">{{ m.year }}<span class="fm-month-unit">年</span>{{ m.month }}<span class="fm-month-unit">月</span></th>
              <td v-for="menu in matrixMenus" :key="menu.id" class="fm-cell">
                <input
                  type="number"
                  min="0"
                  class="fm-input"
                  :value="cellQuantity(menu.masterName, m.key) || ''"
                  @change="setCellQuantity(menu, m.key, $event.target.value)"
                  placeholder="–"
                />
              </td>
              <td class="fm-rowtotal">
                {{ matrixMenus.reduce((s, menu) => s + cellQuantity(menu.masterName, m.key), 0).toLocaleString() }}
              </td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <th class="fm-foot-label">合計</th>
              <td v-for="menu in matrixMenus" :key="menu.id" class="fm-foot-cell">{{ columnTotal(menu.masterName).toLocaleString() }}</td>
              <td class="fm-grandtotal">{{ grandTotal.toLocaleString() }}</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </template>

    <!-- モーダルダイアログ (UX Safety) -->
    <teleport to="body">
      <div v-if="showModal" class="modal-overlay">
        <div class="modal-card animate-fade-in">
          <div class="modal-header">
            <h3>{{ isEditing ? '調理点検記録の編集' : '調理点検記録の作成' }}</h3>
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
                <label class="form-label">対象年月 <span class="required">*</span></label>
                <div style="display: flex; gap: 8px;">
                    <select v-model="formYear" class="input-organic" style="flex: 1;">
                      <option v-for="y in [2024, 2025, 2026, 2027, 2028, 2029, 2030]" :key="y" :value="y">{{ y }}年</option>
                    </select>
                    <select v-model="formMonth" class="input-organic" style="flex: 1;">
                      <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
                    </select>
                  </div>
              </div>
              <div class="form-group">
                <label class="form-label">点検確認者 <span class="required">*</span></label>
                <input v-model="form.checkedBy" type="text" class="input-organic" placeholder="例: 角田 健一" />
              </div>
            </div>

            <div class="grid-cols-2 mb-3">
              <div class="form-group">
                <label class="form-label">提供メニュー <span class="required">*</span></label>
                <select 
                  v-model="form.menuId" 
                  class="input-organic select-organic"
                  @change="updateLotDetailsDefault"
                >
                  <option v-for="menu in activeMasterMenus" :key="menu.id" :value="menu.id">
                    {{ menu.masterName || menu.name }} {{ menu.isOrganicClaim ? '（有機表示）' : '' }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">提供数 (食) <span class="required">*</span></label>
                <input v-model.number="form.quantity" type="number" class="input-organic" min="0" />
              </div>
            </div>

            <!-- 有機メニューの場合のみ強調する詳細ロット情報 (UX Safety) -->
            <div class="form-group">
              <label class="form-label">
                使用した有機ロット情報・識別符号 
                <span v-if="getMenuOrganicClaim(form.menuId)" class="required">*</span>
              </label>
              <input 
                v-model="form.lotDetails" 
                type="text" 
                class="input-organic font-mono text-sm" 
                placeholder="例: トマト: KIRI-260505A, オリーブオイル: OIL-10"
              />
              <p class="checkbox-help">※受入時のロット番号と一致しているか、保管容器のラベル等を見て記録してください。</p>
            </div>

            <!-- JAS調理チェック項目 -->
            <fieldset class="form-fieldset">
              <legend class="fieldset-title flex items-center gap-1">
                <CheckCircle :size="14" /> 有機JAS調理管理 適合点検
              </legend>

              <div class="form-checkbox-group mb-3">
                <label class="checkbox-label">
                  <input v-model="form.isUtensilsClean" type="checkbox" />
                  <span>調理器具、食器、まな板は洗浄（または有機専用）されたものを使用した</span>
                </label>
                <p class="checkbox-help">※一般食材が付着した器具でそのまま調理すると、不適合（混入）になります。都度洗浄または専用器具の使用が義務付けられています。</p>
              </div>

              <div class="form-checkbox-group">
                <label class="checkbox-label">
                  <input v-model="form.isIngredientVerified" type="checkbox" />
                  <span>使用する原材料が、レシピで指定された有機JAS認定品であることを確認した</span>
                </label>
                <p class="checkbox-help">※一般品を間違えて「有機メニュー」に混入させないよう、投入前に再度チェックします。</p>
              </div>
            </fieldset>

            <div class="form-group mt-3">
              <label class="form-label">備考・異常時の処置等</label>
              <textarea 
                v-model="form.notes" 
                class="input-organic" 
                rows="2" 
                placeholder="調理時の状況、万が一一般品が混入したなどのインシデントと、その際の廃棄・一般メニューへの切り替え処置など..."
              ></textarea>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-outline" @click="showModal = false">キャンセル</button>
            <button class="btn btn-primary" @click="saveLog">
              {{ isEditing ? '記録を更新' : '点検を完了・記録' }}
            </button>
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

/* ============================================================================
   表形式（食数マトリクス）モダンデザイン
   ============================================================================ */
.matrix-toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1rem;
  background: #ffffff;
  border: 1px solid #e3ede7;
  border-radius: 14px;
  padding: 0.85rem 1.15rem;
  margin-bottom: 1.1rem;
  box-shadow: 0 1px 3px rgba(16, 24, 40, 0.04);
}
.matrix-period {
  display: flex;
  align-items: center;
  gap: 0.55rem;
}
.matrix-period-label {
  font-weight: 700;
  color: #065f46;
  font-size: 0.95rem;
}
.matrix-period-hint {
  color: #64748b;
  font-size: 0.85rem;
}
.matrix-select {
  padding: 0.5rem 0.75rem;
  border: 1px solid #cbd5e1;
  border-radius: 9px;
  font-size: 0.98rem;
  background: #fff;
  color: #1f2937;
  cursor: pointer;
}
.matrix-select:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.15);
}
.matrix-hint {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  color: #6b7280;
  font-size: 0.85rem;
}

.matrix-wrap {
  overflow-x: auto;
  border-radius: 16px;
  border: 1px solid #e3ede7;
  box-shadow: 0 6px 22px rgba(16, 24, 40, 0.07);
  background: #fff;
}
.foodcount-matrix {
  border-collapse: separate;
  border-spacing: 0;
  width: 100%;
  color: #1f2937;
}
.foodcount-matrix th,
.foodcount-matrix td {
  padding: 0.8rem 0.9rem;
  text-align: center;
  white-space: nowrap;
  border-bottom: 1px solid #eef3f0;
}
/* ヘッダー行 */
.foodcount-matrix thead th {
  position: sticky;
  top: 0;
  z-index: 3;
  background: #065f46;
  color: #ffffff;
  font-weight: 700;
  font-size: 0.95rem;
  border-bottom: none;
  letter-spacing: 0.02em;
}
.fm-menu-head { min-width: 104px; }
.fm-corner {
  position: sticky;
  left: 0;
  z-index: 4;
  text-align: left;
  background: #064e3b;
  min-width: 116px;
}
.fm-total-head { background: #047857; min-width: 90px; }
/* 年月（左固定列） */
.fm-month {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #f0fdf4;
  color: #065f46;
  font-weight: 700;
  text-align: left;
  font-size: 1rem;
  border-right: 1px solid #d1fae5;
}
.fm-month-unit {
  font-size: 0.72rem;
  font-weight: 600;
  color: #16a34a;
  margin: 0 1px;
}
/* ゼブラ & ホバー */
.foodcount-matrix tbody tr:nth-child(even) td.fm-cell { background: #f7fbf9; }
.foodcount-matrix tbody tr:hover td.fm-cell { background: #ecfdf5; }
.fm-cell { padding: 0.35rem; }
/* 入力セル */
.fm-input {
  width: 80px;
  text-align: center;
  font-size: 1.1rem;
  font-family: inherit;
  font-weight: 600;
  padding: 0.55rem 0.4rem;
  border: 1px solid transparent;
  border-radius: 9px;
  background: transparent;
  color: #111827;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}
.fm-input::placeholder { color: #cbd5e1; font-weight: 400; }
.fm-input:hover { background: #ffffff; border-color: #d1fae5; }
.fm-input:focus {
  outline: none;
  background: #ffffff;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.18);
}
.fm-input::-webkit-outer-spin-button,
.fm-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
/* 月合計列 */
.fm-rowtotal {
  background: #ecfdf5;
  color: #047857;
  font-weight: 800;
  font-family: monospace;
  font-size: 1.05rem;
}
/* 合計フッター */
.foodcount-matrix tfoot th,
.foodcount-matrix tfoot td {
  background: #064e3b;
  color: #ffffff;
  font-weight: 700;
  font-size: 1.02rem;
  border-bottom: none;
  font-family: monospace;
}
.fm-foot-label {
  position: sticky;
  left: 0;
  z-index: 2;
  background: #053d2e;
  text-align: left;
  font-family: inherit;
}
.fm-grandtotal {
  background: #022c22;
  color: #6ee7b7;
  font-size: 1.15rem;
}
.fm-empty { padding: 2.5rem; color: #94a3b8; font-size: 0.95rem; }

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

.lot-details-text {
  max-width: 220px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
.max-w-xs { max-width: 20rem; }
.truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
</style>
