const fs = require('fs');
let code = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

const syncCode = `  const syncFromRiRyLink = async (email, password) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (!email || !password) {
          resolve({ requiresAuth: true });
        } else {
          // 有機JASの原材料を探す
          const organicIng = state.ingredients.find(i => i.isOrganicJAS);
          if (organicIng) {
            const newReceipt = {
              id: 'rirylink_' + Date.now(),
              date: new Date().toISOString().substring(0, 10),
              ingredientId: organicIng.id,
              quantity: Math.floor(Math.random() * 10) + 1,
              lotNumber: 'RL-' + Math.floor(Math.random() * 10000),
              checkedBy: 'Ri-Ry-Link連携',
              isSeparated: true,
              isClean: true,
              notes: 'Ri-Ry-Linkから自動同期された受入記録です',
              supplier: organicIng.supplier || '連携業者'
            };
            state.receipts.unshift(newReceipt);
            saveStore();
            resolve({ requiresAuth: false, message: 'Ri-Ry-Linkと同期しました。新着の受入記録が追加されました。' });
          } else {
            resolve({ requiresAuth: false, message: 'Ri-Ry-Linkと同期しましたが、新着の有機JAS受入記録はありませんでした。' });
          }
        }
      }, 800);
    });
  };

  function updateRestaurantInfo(info) {`;

code = code.replace(/function updateRestaurantInfo\(info\) {/, syncCode);

const exportCode = `  updateRestaurantInfo,
  resetToSeeds,
  syncFromRiRyLink,`;

code = code.replace(/updateRestaurantInfo,\n  resetToSeeds,/, exportCode);

fs.writeFileSync('src/store/restaurantStore.js', code);
console.log('Added syncFromRiRyLink');
