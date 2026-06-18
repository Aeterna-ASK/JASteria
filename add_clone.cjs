const fs = require('fs');
let code = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

const newCode = `  function setTargetMenuToClone(menu) {
    state.targetMenuToClone = menu;
    saveStore();
  }

  function resetToSeeds() {`;

code = code.replace(/function resetToSeeds\(\) \{/, newCode);

const exportCode = `  setTargetMenuToClone,
  updateRestaurantInfo,`;

code = code.replace(/updateRestaurantInfo,/, exportCode);

fs.writeFileSync('src/store/restaurantStore.js', code);
console.log('Added setTargetMenuToClone');
