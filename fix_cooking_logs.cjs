const fs = require('fs');
let code = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

const target = `const decodedCookingLogs = computed(() => {
    return state.cookingLogs.map(log => {
      const menu = state.menus.find(m => m.id === log.menuId);
      return {
        ...log,
        menuName: menu ? menu.name : '不明なメニュー',
        isOrganicClaim: menu ? menu.isOrganicClaim : false,
        hasWarning: !log.isUtensilsClean || !log.isIngredientVerified
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  });`;

const replacement = `const decodedCookingLogs = computed(() => {
    return state.cookingLogs.map(log => {
      const menu = state.menus.find(m => m.id === log.menuId);
      return {
        ...log,
        menuName: menu ? menu.name : '不明なメニュー',
        masterName: menu ? (menu.masterName || menu.name) : '不明なメニュー',
        isOrganicClaim: menu ? menu.isOrganicClaim : false,
        hasWarning: !log.isUtensilsClean || !log.isIngredientVerified
      };
    }).sort((a, b) => b.date.localeCompare(a.date));
  });`;

code = code.replace(target, replacement);
fs.writeFileSync('src/store/restaurantStore.js', code);
console.log('Fixed decodedCookingLogs');
