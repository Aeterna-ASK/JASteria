import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """      if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
        const subMenu = state.menus.find(m => m.id === item.ingredientId);
        if (subMenu) {
          return {
            ...item,
            name: `[自家製] ${subMenu.name}`,
            type: 'sub_menu',
            supplier: '自社'
          };
        }
      }"""

new_str = """      if (item.ingredientId && item.ingredientId.startsWith('menu-')) {
        const subMenu = state.menus.find(m => m.id === item.ingredientId);
        if (subMenu) {
          const subCalc = calculateOrganicRatio(subMenu.recipe);
          return {
            ...item,
            name: `[自家製] ${subMenu.name}`,
            type: subCalc.ratio >= 95 ? 'organic' : 'general',
            supplier: '自社',
            isSubMenu: true
          };
        }
      }"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed type resolution for sub_menu")
else:
    print("Could not find target string in restaurantStore.js")
