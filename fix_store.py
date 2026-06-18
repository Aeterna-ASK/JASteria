import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace calculateOrganicRatio
old_calc_pattern = re.compile(r"function calculateOrganicRatio\(recipeItems\) \{.*?return \{\n    organicWeight,\n    totalWeight,\n    ratio: roundedRatio,\n    isValidOrganicMenu,\n    auditWarnings\n  \};\n\}", re.DOTALL)

new_calc = """function calculateOrganicRatio(recipeItems, visited = new Set()) {
  if (!recipeItems || recipeItems.length === 0) {
    return { organicWeight: 0, totalWeight: 0, ratio: 0, isValidOrganicMenu: false, auditWarnings: [] };
  }

  let totalWeight = 0;      // 水・食塩を除く全重量
  let organicWeight = 0;    // 有機原材料の総重量
  const auditWarnings = []; // 監査への適合・経過措置に関する警告

  recipeItems.forEach(item => {
    const amount = Number(item.amount) || 0;

    // 自家製ソース（サブ・レシピ）の処理
    if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
      if (visited.has(item.ingredientId)) return; // 循環参照防止
      const subMenu = state.menus.find(m => m.id === item.ingredientId);
      if (subMenu) {
        visited.add(item.ingredientId);
        const subCalc = calculateOrganicRatio(subMenu.recipe, visited);
        visited.delete(item.ingredientId);
        
        totalWeight += amount;
        organicWeight += amount * (subCalc.ratio / 100);
      }
      return;
    }

    const ing = ingredientsMap.value[item.ingredientId];
    if (!ing) return;

    // 料理酒に関する令和7年10月1日義務化警告
    if (ing.name.includes('酒') && ing.type === 'general') {
      auditWarnings.push({
        id: 'warning-alcohol-jas',
        title: '料理酒JAS適合アラート',
        message: '令和7年10月1日以降、有機料理を謳うメニュー等に配合する料理酒には「格付JASマーク（有機）」が完全に義務化されます。現行の一般料理酒から、有機JAS認定品への切り替えをご準備ください。'
      });
    }

    if (ing.type === 'salt_water') {
      // 水・食塩は分母・分子ともに計算から除外
      return;
    }

    totalWeight += amount;

    if (ing.type === 'organic') {
      organicWeight += amount;
    }
  });

  const ratio = totalWeight > 0 ? (organicWeight / totalWeight) * 100 : 0;
  // 小数第2位を四捨五入して第1位まで表示
  const roundedRatio = Math.round(ratio * 10) / 10;
  
  // 有機料理の基準は80%以上、マーク3つから有機適合
  const isValidOrganicMenu = roundedRatio >= 80.0;

  return {
    organicWeight,
    totalWeight,
    ratio: roundedRatio,
    isValidOrganicMenu,
    auditWarnings
  };
}"""

if old_calc_pattern.search(text):
    text = old_calc_pattern.sub(new_calc, text)
    print("Replaced calculateOrganicRatio")
else:
    print("Could not find calculateOrganicRatio")

# Replace decodedMenus fullRecipe logic
old_full_recipe_pattern = re.compile(r"const fullRecipe = menu\.recipe\.map\(item => \{.*?return \{.*?\};\n    \}\);", re.DOTALL)

new_full_recipe = """const fullRecipe = menu.recipe.map(item => {
      if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
        const subMenu = state.menus.find(m => m.id === item.ingredientId);
        if (subMenu) {
          return {
            ...item,
            name: `[自家製] ${subMenu.name}`,
            type: 'sub_menu',
            supplier: '自社'
          };
        }
      }

      const ing = ingredientsMap.value[item.ingredientId];
      return {
        ...item,
        name: ing ? ing.name : '不明な原材料',
        type: ing ? ing.type : 'general',
        supplier: ing ? ing.supplier : ''
      };
    });"""

if old_full_recipe_pattern.search(text):
    text = old_full_recipe_pattern.sub(new_full_recipe, text)
    print("Replaced fullRecipe mapping")
else:
    print("Could not find fullRecipe mapping")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
