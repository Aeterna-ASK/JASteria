import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_code = "        loadedCount++;"
new_code = """        // --- INJECT MISSING MENUS ---
        if (colName === 'menus' && state.menus && !state.menus.some(m => m.versionName === '初期版' && m.name && m.name.includes('バーニャカウダ'))) {
          console.log("Injecting missing menus...");
          const missingMenus = [
            {
              id: `menu-${Date.now().toString().slice(-3)}-old1`,
              name: '有機野菜のバーニャカウダ',
              masterName: '有機野菜のバーニャカウダ',
              versionName: '初期版',
              isActiveVersion: false,
              isOrganicClaim: true,
              category: '料理',
              targetCreatedDate: '2024-07-25',
              startDate: '2024-08-01',
              reviewDate: '2024-09-25',
              deadline: '2024-09-30',
              changeReason: '具材の変更',
              targetGrams: 60,
              recipe: [
                { name: 'コリンキー', amount: 20 },
                { name: '人参', amount: 20 },
                { name: 'キュウリ', amount: 30 },
                { name: 'SO有機オリーブ', amount: 10 },
                { name: '有機黒酢', amount: 5 },
                { name: 'グラニュー糖', amount: 5 },
                { name: '有機豆乳', amount: 50 },
                { name: 'オリーブオイル', amount: 20 },
                { name: 'スパイス', amount: 0.2 }
              ],
              description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
              updatedAt: '2024-07-25T00:00:00Z'
            },
            {
              id: `menu-${Date.now().toString().slice(-3)}-old2`,
              name: '有機野菜のバーニャカウダ',
              masterName: '有機野菜のバーニャカウダ',
              versionName: '第2版',
              isActiveVersion: false,
              isOrganicClaim: true,
              category: '料理',
              targetCreatedDate: '2024-09-25',
              startDate: '2024-10-01',
              reviewDate: '2024-11-25',
              deadline: '2024-11-30',
              changeReason: '具材の変更',
              targetGrams: 60,
              recipe: [
                { name: 'ナス', amount: 20 },
                { name: '人参', amount: 20 },
                { name: 'ピーマン', amount: 30 },
                { name: '里芋', amount: 10 },
                { name: '有機黒酢', amount: 5 },
                { name: 'グラニュー糖', amount: 5 },
                { name: '有機豆乳', amount: 50 },
                { name: 'オリーブオイル', amount: 20 },
                { name: 'スパイス', amount: 0.2 }
              ],
              description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
              updatedAt: '2024-09-25T00:00:00Z'
            },
            {
              id: `menu-${Date.now().toString().slice(-3)}-old3`,
              name: '有機野菜のバーニャカウダ',
              masterName: '有機野菜のバーニャカウダ',
              versionName: '第3版',
              isActiveVersion: false,
              isOrganicClaim: true,
              category: '料理',
              targetCreatedDate: '2024-11-25',
              startDate: '2024-12-01',
              reviewDate: '2025-01-25',
              deadline: '2025-01-31',
              changeReason: '具材の変更',
              targetGrams: 60,
              recipe: [
                { name: 'カリフラワー', amount: 20 },
                { name: 'カブ', amount: 20 },
                { name: 'はつか大根', amount: 30 },
                { name: 'カラシナ', amount: 10 },
                { name: '有機黒酢', amount: 5 },
                { name: 'グラニュー糖', amount: 5 },
                { name: '有機豆乳', amount: 50 },
                { name: 'オリーブオイル', amount: 20 },
                { name: 'スパイス', amount: 0.2 },
                { name: '人参', amount: 10 }
              ],
              description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
              updatedAt: '2024-11-25T00:00:00Z'
            },
            {
              id: `menu-${Date.now().toString().slice(-3)}-old4`,
              name: '有機野菜のバーニャカウダ',
              masterName: '有機野菜のバーニャカウダ',
              versionName: '第4版',
              isActiveVersion: false,
              isOrganicClaim: true,
              category: '料理',
              targetCreatedDate: '2025-01-25',
              startDate: '2025-02-01',
              reviewDate: '2025-03-25',
              deadline: '2025-03-31',
              changeReason: '具材の変更',
              targetGrams: 60,
              recipe: [
                { name: 'カリフラワー', amount: 20 },
                { name: 'カブ', amount: 20 },
                { name: '人参', amount: 30 },
                { name: '菜花', amount: 10 },
                { name: '有機黒酢', amount: 5 },
                { name: 'グラニュー糖', amount: 5 },
                { name: '有機豆乳', amount: 50 },
                { name: 'オリーブオイル', amount: 20 },
                { name: 'スパイス', amount: 0.2 }
              ],
              description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
              updatedAt: '2025-01-25T00:00:00Z'
            }
          ];

          missingMenus.forEach(m => {
            m.recipe.forEach(ri => {
              const ing = state.ingredients.find(i => i.name === ri.name || i.name.includes(ri.name));
              if (ing) {
                 ri.ingredientId = ing.id;
              } else {
                 ri.ingredientId = 'temp_' + Date.now(); // fallback
              }
            });
          });

          state.menus.push(...missingMenus);
          needsMigration = true; // Trigger sync
        }
        // --- END INJECT ---
        loadedCount++;"""

if old_code in text:
    text = text.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Injected successfully")
else:
    print("Could not find insertion point")
