const fs = require('fs');
const path = require('path');

const targetPath = path.join('c:', 'Users', 'dai72', 'OneDrive', 'デスクトップ', 'WebApp', 'JASAGRI_RESTAURANT', 'restaurant', 'src', 'components', 'ProcurementPlanView.vue');
let c = fs.readFileSync(targetPath, 'utf8');

// 1. Fix parseTarget to always divide by 12
const parseSearch = `const parseTarget = (str) => {
  if (!str) return 0;
  // 文字列から数値を抽出（例："年間3600食" -> 3600）
  // 全角数字も半角に変換して対応
  const normalizedStr = str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  const match = normalizedStr.match(/\\d+/);
  if (!match) return 0;
  const num = parseInt(match[0], 10);
  
  if (normalizedStr.includes('年間') || normalizedStr.includes('年')) {
    return num / 12; // 1ヶ月あたりの目標食数
  }
  return num; // 明記がない場合はとりあえず月間とみなす（運用次第）
};`;
const parseReplace = `const parseTarget = (str) => {
  if (!str) return 0;
  // 全角数字も半角に変換して対応
  const normalizedStr = str.replace(/[０-９]/g, s => String.fromCharCode(s.charCodeAt(0) - 0xFEE0));
  const match = normalizedStr.match(/\\d+/);
  if (!match) return 0;
  const num = parseInt(match[0], 10);
  
  // レシピ登録のある目標数はすべて「年間目標」であるため、必ず12で割って月間目標にする
  return num / 12; 
};`;
if (c.includes(parseSearch)) {
  c = c.replace(parseSearch, parseReplace);
}

// 2. Fix isMenuTargetMonth
const isMenuTargetMonthSearch = `// 対象月かどうかを判定する（案A: 期間や開始・終了日から）
const isMenuTargetMonth = (menu, month) => {
  let isActive = true;
  
  // 開始・終了日が設定されている場合
  if (menu.startDate || menu.deadline) {
    const parseMonth = (dateStr) => {
      if (!dateStr) return null;
      const parts = dateStr.split('-');
      if (parts.length >= 2) return parseInt(parts[1], 10);
      return null;
    };
    
    const startM = parseMonth(menu.startDate);
    const endM = parseMonth(menu.deadline);
    
    if (startM !== null && endM !== null) {
      if (startM <= endM) {
        isActive = (month >= startM && month <= endM);
      } else {
        // 年またぎ（例：11月〜2月）
        isActive = (month >= startM || month <= endM);
      }
    } else if (startM !== null) {
      isActive = (month >= startM); // 開始日以降ずっと
    } else if (endM !== null) {
      isActive = (month <= endM); // 終了日まで
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
};`;

const isMenuTargetMonthReplace = `// 対象年月かどうかを判定する
const isMenuTargetMonth = (menu, year, month) => {
  let isActive = true;
  
  // その月の1日を生成
  const targetDateStr = \`\${year}-\${String(month).padStart(2, '0')}-01\`;
  const targetTime = new Date(\`\${year}/\${month}/01\`).getTime();
  
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
};`;

if (c.includes(isMenuTargetMonthSearch)) {
  c = c.replace(isMenuTargetMonthSearch, isMenuTargetMonthReplace);
}

// 3. Fix the caller in procurementByMenu
const callerSearch = `        if (isMenuTargetMonth(menu, m.month)) {
          amount = Math.round(monthlyTarget * (r.amount || 0));
        }`;
const callerReplace = `        if (isMenuTargetMonth(menu, m.year, m.month)) {
          amount = Math.round(monthlyTarget * (r.amount || 0));
        }`;

if (c.includes(callerSearch)) {
  c = c.replace(callerSearch, callerReplace);
}

fs.writeFileSync(targetPath, c, 'utf8');
console.log('ProcurementPlanView patched for date logic and target parsing.');
