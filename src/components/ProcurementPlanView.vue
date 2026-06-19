<script setup>
import { ref, computed } from 'vue';
import { restaurantStore } from '../store/restaurantStore';
import { CalendarRange, Printer, ArrowLeftRight } from 'lucide-vue-next';

// State
const state = restaurantStore.state;
const decodedMenus = computed(() => restaurantStore.decodedMenus);

// Settings
const viewMode = ref('menu'); // 'menu' or 'ingredient'
const startYear = ref(new Date().getFullYear());
const startMonth = ref(6);

const availableYears = computed(() => {
  const current = new Date().getFullYear();
  return Array.from({length: 10}, (_, i) => current - 3 + i);
});

const handlePrint = () => {
  // 画面の @media print はアプリ全体のレイアウト/アニメーションの影響を受けて
  // 空白になりやすいため、料理スペックと同じく「新しいウィンドウに内容を書き出して
  // 印刷する」確実な方式にする。現在表示中のビュー（メニュー別／食材別）を印刷する。
  const el = document.querySelector('.procurement-plan-view');
  if (!el) { window.print(); return; }

  // 現在ページの全スタイル（@media print を除く）を収集して引き継ぐ
  let cssText = '';
  try {
    for (const sheet of document.styleSheets) {
      try {
        for (const rule of sheet.cssRules) {
          if (rule.type !== CSSRule.MEDIA_RULE || !rule.media.mediaText.includes('print')) {
            cssText += rule.cssText + '\n';
          }
        }
      } catch {}
    }
  } catch {}

  const html = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="utf-8">
<title>有機食材調達計画書</title>
<style>
  @page { size: A4 landscape; margin: 8mm; }
  * { box-sizing: border-box; animation: none !important; transition: none !important; }
  html, body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  ${cssText}
  /* 画面用レイアウトを打ち消して印刷向けに整える */
  .procurement-plan-view { width: 100% !important; opacity: 1 !important; transform: none !important; padding: 0 !important; }
  .no-print { display: none !important; }
  .only-print { display: block !important; }
  .card { box-shadow: none !important; border: none !important; padding: 0 !important; margin-bottom: 8mm !important; opacity: 1 !important; transform: none !important; }
  .table-container { overflow: visible !important; border: none !important; }
  table { width: 100% !important; border-collapse: collapse !important; font-size: 9px !important; }
  th, td { border: 1px solid #000 !important; padding: 2px 3px !important; }
  .print-avoid-break { page-break-inside: avoid; }
</style>
</head>
<body>
  ${el.outerHTML}
  <script>
    window.onload = function () { window.print(); window.onafterprint = function () { window.close(); }; };
  <\/script>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1100,height=800');
  if (!win) { window.print(); return; } // ポップアップブロック時はフォールバック
  win.document.open();
  win.document.write(html);
  win.document.close();
};

const parseTarget = (str) => {
  if (!str) return 0;
  // 全角数字も半角に変換して対応
  const normalizedStr = str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  const match = normalizedStr.match(/\d+/);
  if (!match) return 0;
  const num = parseInt(match[0], 10);
  
  // レシピ登録のある目標数はすべて「年間目標」であるため、必ず12で割って月間目標にする
  return num / 12; 
};

const getMenuMonthlyTarget = (menu) => {
  const course = parseTarget(menu.courseTargetNum);
  const single = parseTarget(menu.singleTargetNum);
  return course + single;
};

// 月の配列を生成（startMonthから12ヶ月分）
const months = computed(() => {
  const m = [];
  let y = startYear.value;
  for (let i = 0; i < 12; i++) {
    let currentMonth = startMonth.value + i;
    let currentYear = y;
    if (currentMonth > 12) {
      currentMonth -= 12;
      currentYear++;
    }
    m.push({
      year: currentYear,
      month: currentMonth,
      label: currentMonth === 1 ? `${currentYear}年1月` : `${currentMonth}月`,
      key: `${currentYear}-${currentMonth}`
    });
  }
  return m;
});

// 対象年月かどうかを判定する
const isMenuTargetMonth = (menu, year, month) => {
  let isActive = true;
  
  // その月の1日を生成
  const targetDateStr = `${year}-${String(month).padStart(2, '0')}-01`;
  const targetTime = new Date(`${year}/${month}/01`).getTime();
  
  // 開始・終了日（達成期限）が設定されている場合、年月ベースで厳密に判定
  if (menu.startDate || menu.deadline) {
    let startT = null;
    let endT = null;
    
    if (menu.startDate) {
      const d = new Date(menu.startDate.replace(/-/g, '/'));
      // 開始月の1日を基準とする
      d.setDate(1); 
      startT = d.getTime();
    }
    
    if (menu.deadline) {
      const d = new Date(menu.deadline.replace(/-/g, '/'));
      // 終了月の末日を基準とする
      const eY = d.getFullYear();
      const eM = d.getMonth() + 1;
      const endOfMonth = new Date(eY, eM, 0); // その月の末日
      endT = endOfMonth.getTime();
    }
    
    if (startT !== null && endT !== null) {
      isActive = (targetTime >= startT && targetTime <= endT);
    } else if (startT !== null) {
      isActive = (targetTime >= startT);
    } else if (endT !== null) {
      isActive = (targetTime <= endT);
    }
    return isActive;
  }
  
  // 開始・終了日がない場合は、表示期間（文字列）から推測
  if (menu.displayPeriod) {
    const p = menu.displayPeriod;
    if (p.includes('春')) {
      isActive = [3, 4, 5].includes(month);
    } else if (p.includes('夏')) {
      isActive = [6, 7, 8].includes(month);
    } else if (p.includes('秋')) {
      isActive = [9, 10, 11].includes(month);
    } else if (p.includes('冬')) {
      isActive = [12, 1, 2].includes(month);
    }
  }
  
  return isActive;
};

// 開始予定日をタイムスタンプ化（無い場合は 0）
const getStartTime = (menu) => {
  if (!menu.startDate) return 0;
  const t = new Date(menu.startDate.replace(/-/g, '/')).getTime();
  return isNaN(t) ? 0 : t;
};

// メニュー別データ算出
const procurementByMenu = computed(() => {
  // 過去版も含めた全バージョンを対象にする（各版が担当する期間で計上するため）。
  // ソース系（自家製ソース等）は集計対象外。
  const targetMenus = decodedMenus.value.filter(menu => {
    if (menu.category && menu.category.includes('ソース')) return false;
    return true;
  });

  // 料理名(masterName)でバージョンをグループ化
  const groups = {}; // menuName -> [menu(version), ...]
  targetMenus.forEach(menu => {
    const menuName = menu.masterName || menu.name;
    if (!groups[menuName]) groups[menuName] = [];
    groups[menuName].push(menu);
  });

  const result = [];

  Object.entries(groups).forEach(([menuName, versions]) => {
    // 年間目標表示はグループ内の最大月間目標を採用（全シーズン共通の目標が入るケースが多いため）
    let maxMonthly = 0;
    versions.forEach(v => {
      const t = getMenuMonthlyTarget(v);
      if (t > maxMonthly) maxMonthly = t;
    });
    const monthlyTargetDisplay = Math.round(maxMonthly);
    const annualTarget = Math.round(maxMonthly * 12);

    const itemsMap = {}; // key: supplier_ingredientName

    months.value.forEach(m => {
      // その月に有効なバージョンのうち、開始予定日が最も新しいものを1つだけ採用する。
      // （版の期間が重なっても二重計上せず、最新版のレシピを優先する）
      let chosen = null;
      let chosenStart = -Infinity;
      versions.forEach(v => {
        if (!isMenuTargetMonth(v, m.year, m.month)) return;
        const s = getStartTime(v);
        if (s >= chosenStart) { chosenStart = s; chosen = v; }
      });
      if (!chosen) return;

      const monthlyTarget = getMenuMonthlyTarget(chosen);
      const items = (chosen.recipeDetails || []).filter(r => r.type === 'organic');
      items.forEach(r => {
        const ingName = r.name || '不明な食材';
        const supplier = r.supplier || '未登録';
        const itemKey = supplier + '_' + ingName;

        if (!itemsMap[itemKey]) {
          itemsMap[itemKey] = { ingredientName: ingName, supplier, monthly: {}, total: 0 };
          months.value.forEach(mm => itemsMap[itemKey].monthly[mm.key] = 0);
        }

        const amount = Math.round(monthlyTarget * (r.amount || 0));
        itemsMap[itemKey].monthly[m.key] += amount;
        itemsMap[itemKey].total += amount;
      });
    });

    const items = Object.values(itemsMap);
    const totalInPeriod = items.reduce((sum, it) => sum + it.total, 0);
    if (items.length === 0 || annualTarget <= 0 || totalInPeriod <= 0) return;

    result.push({
      id: versions[0].id, // グループの代表ID
      name: menuName,
      monthlyTarget: monthlyTargetDisplay,
      annualTarget,
      items
    });
  });

  return result;
});

// 食材（仕入先）別データ算出
const procurementByIngredient = computed(() => {
  const map = {}; // { 'supplier_ingredientName': { ... } }
  
  procurementByMenu.value.forEach(menuItem => {
    menuItem.items.forEach(item => {
      const key = `${item.supplier}_${item.ingredientName}`;
      if (!map[key]) {
        map[key] = {
          supplier: item.supplier,
          ingredientName: item.ingredientName,
          monthly: {},
          total: 0,
          menusUsedIn: new Set()
        };
        months.value.forEach(m => map[key].monthly[m.key] = 0);
      }
      
      months.value.forEach(m => {
        map[key].monthly[m.key] += item.monthly[m.key];
        map[key].total += item.monthly[m.key];
      });
      map[key].menusUsedIn.add(menuItem.name);
    });
  });
  
  const result = Object.values(map).map(row => ({
    ...row,
    menusUsedIn: Array.from(row.menusUsedIn).join(', ')
  }));
  
  // 仕入先順にソート
  return result.sort((a, b) => a.supplier.localeCompare(b.supplier));
});

</script>

<template>
  <div class="procurement-plan-view animate-fade-in print-container">
    <div class="header-section mb-6 no-print">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 class="text-2xl font-bold text-dark flex items-center gap-2 mb-2">
            <CalendarRange :size="24" class="text-accent" />
            有機食材調達計画
          </h2>
          <p class="text-gray" style="font-size: 0.9rem;">
            各メニューの目標食数とレシピ配合に基づき、月別の食材調達量を自動計算します。
          </p>
        </div>
        
        <div class="flex items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
          <div class="flex items-center gap-2">
            <span class="text-sm font-bold text-gray-600">開始年月:</span>
            <select v-model="startYear" class="input-organic select-organic" style="padding: 0.3rem 0.5rem; font-size: 0.9rem; margin-right: 0.2rem;">
              <option v-for="y in availableYears" :key="y" :value="y">{{ y }}年</option>
            </select>
            <select v-model="startMonth" class="input-organic select-organic" style="padding: 0.3rem 0.5rem; font-size: 0.9rem;">
              <option v-for="m in 12" :key="m" :value="m">{{ m }}月</option>
            </select>
          </div>
          
          <div class="border-l pl-3 border-gray-200 flex gap-2">
            <button @click="viewMode = viewMode === 'menu' ? 'ingredient' : 'menu'" class="btn btn-outline btn-sm flex items-center gap-1">
              <ArrowLeftRight :size="14" />
              {{ viewMode === 'menu' ? '食材別に切り替え' : 'メニュー別に切り替え' }}
            </button>
            <button @click="handlePrint" class="btn btn-primary btn-sm flex items-center gap-1">
              <Printer :size="14" />
              印刷 / PDF
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 印刷用ヘッダー -->
    <div class="only-print mb-4">
      <h2 style="font-size: 1.5rem; font-weight: bold; text-align: center; margin-bottom: 1rem;">有機食材調達計画書</h2>
      <div style="display: flex; justify-content: space-between; font-size: 0.9rem;">
        <span>作成日: {{ new Date().toLocaleDateString('ja-JP') }}</span>
        <span>期間: {{ months[0].year }}年{{ months[0].month }}月 〜 {{ months[11].year }}年{{ months[11].month }}月</span>
      </div>
    </div>

    <div v-if="viewMode === 'menu'" class="menu-view">
      <!-- メニューごとの表 -->
      <div v-for="menu in procurementByMenu" :key="menu.id" class="card mb-8 print-avoid-break">
        <div class="card-header-flex mb-2 print-header-bg">
          <h3 class="font-bold text-lg" style="color: #1e293b;">{{ menu.name }}</h3>
          <div class="text-sm" style="background: #f1f5f9; padding: 0.3rem 0.8rem; border-radius: 4px; font-weight: 600;">
            年間目標: <span style="color: #0369a1; font-size: 1.1em;">{{ menu.annualTarget.toLocaleString() }}</span> 食 
            (月間平均: {{ menu.monthlyTarget.toLocaleString() }} 食)
          </div>
        </div>
        
        <div class="table-container">
          <table class="procurement-table">
            <thead>
              <tr>
                <th style="min-width: 140px; text-align: left;">食材名</th>
                <th v-for="m in months" :key="m.key">{{ m.label }}</th>
                <th style="font-weight: bold; background: #fffbeb;">トータル</th>
                <th>仕入れ先</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in menu.items" :key="idx">
                <td style="font-weight: 600;">{{ item.ingredientName }}</td>
                <td v-for="m in months" :key="m.key" class="num-cell">
                  {{ item.monthly[m.key] > 0 ? item.monthly[m.key].toLocaleString() + 'g' : '-' }}
                </td>
                <td class="num-cell" style="font-weight: bold; background: #fffbeb; color: #b45309;">
                  {{ item.total.toLocaleString() }}g
                </td>
                <td>{{ item.supplier }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div v-else class="ingredient-view">
      <!-- 食材ごとの表 -->
      <div class="card print-avoid-break">
        <div class="card-header-flex mb-4">
          <h3 class="font-bold text-lg text-dark">全食材 必要量合算リスト</h3>
        </div>
        
        <div class="table-container">
          <table class="procurement-table">
            <thead>
              <tr>
                <th style="min-width: 140px; text-align: left;">仕入れ先</th>
                <th style="min-width: 140px; text-align: left;">食材名</th>
                <th v-for="m in months" :key="m.key">{{ m.label }}</th>
                <th style="font-weight: bold; background: #fffbeb;">トータル</th>
                <th style="min-width: 180px;">使用メニュー</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(item, idx) in procurementByIngredient" :key="idx">
                <td>
                  <span class="supplier-badge">{{ item.supplier }}</span>
                </td>
                <td style="font-weight: 600;">{{ item.ingredientName }}</td>
                <td v-for="m in months" :key="m.key" class="num-cell">
                  {{ item.monthly[m.key] > 0 ? (item.monthly[m.key] / 1000).toFixed(1) + 'kg' : '-' }}
                </td>
                <td class="num-cell" style="font-weight: bold; background: #fffbeb; color: #b45309;">
                  {{ (item.total / 1000).toFixed(1) }}kg
                </td>
                <td style="font-size: 0.8rem; color: #64748b;">{{ item.menusUsedIn }}</td>
              </tr>
            </tbody>
          </table>
          <p class="mt-2 text-xs text-gray-500" style="text-align: right;">※ 食材別ビューでは、発注しやすいように単位を「kg」で表示しています。</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.procurement-plan-view {
  width: 100%;
}
.table-container {
  overflow-x: auto;
  border-radius: 6px;
  border: 1px solid var(--border);
}
.procurement-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.85rem;
}
.procurement-table th, .procurement-table td {
  border: 1px solid var(--border);
  padding: 0.6rem 0.5rem;
}
.procurement-table th {
  background-color: #f8fafc;
  color: #475569;
  font-weight: 600;
  text-align: center;
  white-space: nowrap;
}
.procurement-table td {
  color: #334155;
}
.num-cell {
  text-align: right;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;
}
.supplier-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background-color: #e0f2fe;
  color: #0369a1;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}
.only-print {
  display: none;
}

/* 印刷用スタイル */
@media print {
  .no-print {
    display: none !important;
  }
  .only-print {
    display: block !important;
  }
  .print-container {
    padding: 0 !important;
    margin: 0 !important;
  }
  .card {
    box-shadow: none !important;
    border: none !important;
    padding: 0 !important;
    margin-bottom: 2rem !important;
  }
  .print-avoid-break {
    page-break-inside: avoid;
  }
  .table-container {
    border: none !important;
    overflow-x: visible !important;
  }
  .procurement-table th, .procurement-table td {
    padding: 0.4rem !important;
    font-size: 0.75rem !important; /* 印刷用に少し小さく */
    border: 1px solid #000 !important;
  }
  .print-header-bg {
    background-color: #f1f5f9 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .procurement-table th {
    background-color: #e2e8f0 !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  /* 背景色を印刷に反映させる */
  td[style*="background: #fffbeb"] {
    background-color: #fffbeb !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  
  
  @page {
    size: A4 landscape; /* A4横向き */
    margin: 10mm;
  }
}

/* Print Overrides for full document rendering */
@media print {
  body, html, #app, .app-container, .main-content, .content-container {
    height: auto !important;
    min-height: auto !important;
    overflow: visible !important;
    overflow-y: visible !important;
    position: static !important;
    display: block !important;
  }
  .sidebar, .header {
    display: none !important;
  }
}
</style>
