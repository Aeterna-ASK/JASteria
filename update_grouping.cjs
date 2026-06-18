const fs = require('fs');

let code = fs.readFileSync('src/components/ProcurementPlanView.vue', 'utf8');

const targetRegex = /const procurementByMenu = computed\(\(\) => \{[\s\S]*?\}\);\n\n\/\/ 食材（仕入先）別データ算出/m;

const replacement = `const procurementByMenu = computed(() => {
  const activeMenus = decodedMenus.value.filter(menu => {
    if (menu.isActiveVersion === false) return false;
    if (menu.category && menu.category.includes('ソース')) return false;
    return true;
  });

  const map = {}; // 料理名(masterName)でグループ化

  activeMenus.forEach(menu => {
    const monthlyTarget = getMenuMonthlyTarget(menu);
    const annualTarget = Math.round(monthlyTarget * 12);
    const menuName = menu.masterName || menu.name;

    if (!map[menuName]) {
      map[menuName] = {
        id: menu.id, // グループの代表ID
        name: menuName,
        monthlyTarget: 0,
        annualTarget: 0,
        itemsMap: {} // key: supplier_ingredientName
      };
    }

    // 目標数は一番大きいものを採用する（全シーズン共通の目標数が入っているケースが多いため）
    if (monthlyTarget > map[menuName].monthlyTarget) {
      map[menuName].monthlyTarget = Math.round(monthlyTarget);
      map[menuName].annualTarget = annualTarget;
    }

    const items = (menu.recipeDetails || []).filter(r => r.type === 'organic');
    
    items.forEach(r => {
      const ingName = r.name || '不明な食材';
      const supplier = r.supplier || '未登録';
      const itemKey = supplier + '_' + ingName;

      if (!map[menuName].itemsMap[itemKey]) {
        map[menuName].itemsMap[itemKey] = {
          ingredientName: ingName,
          supplier: supplier,
          monthly: {},
          total: 0
        };
        months.value.forEach(m => map[menuName].itemsMap[itemKey].monthly[m.key] = 0);
      }

      months.value.forEach(m => {
        let amount = 0;
        if (isMenuTargetMonth(menu, m.year, m.month)) {
          amount = Math.round(monthlyTarget * (r.amount || 0));
        }
        map[menuName].itemsMap[itemKey].monthly[m.key] += amount;
        map[menuName].itemsMap[itemKey].total += amount;
      });
    });
  });

  return Object.values(map).map(group => {
    // itemsMapを配列に戻す
    group.items = Object.values(group.itemsMap);
    delete group.itemsMap;
    return group;
  }).filter(m => {
    if (m.items.length === 0 || m.annualTarget <= 0) return false;
    const totalRequiredInPeriod = m.items.reduce((sum, item) => sum + item.total, 0);
    return totalRequiredInPeriod > 0;
  });
});

// 食材（仕入先）別データ算出`;

code = code.replace(targetRegex, replacement);

fs.writeFileSync('src/components/ProcurementPlanView.vue', code);
console.log('Updated procurementByMenu grouping logic.');
