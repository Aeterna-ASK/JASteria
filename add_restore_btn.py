import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# I will inject a button at the top of the template
template_inject = """<div class="px-6 py-4 flex items-center justify-between no-print" style="background-color: #faf8f5; border-bottom: 1.5px solid #dcd1be;">"""
new_template = """<div class="px-6 py-4 flex items-center justify-between no-print" style="background-color: #faf8f5; border-bottom: 1.5px solid #dcd1be;">
      <button @click="forceRestoreBagnaCauda" style="background: red; color: white; padding: 10px; border-radius: 5px; font-weight: bold; margin-right: 10px;">
        【緊急】バーニャカウダ完全復旧を実行
      </button>"""

if template_inject in text:
    text = text.replace(template_inject, new_template)

# Now I'll inject the function
script_inject = """const saveMenu = async () => {"""
new_script = """const forceRestoreBagnaCauda = async () => {
  if (!confirm("バーニャカウダの全データを画像通りに完全復元します。よろしいですか？")) return;
  
  // 1. Delete all existing menus that match "バーニャカウダ"
  restaurantStore.state.menus = restaurantStore.state.menus.filter(m => {
    const baseName = m.masterName || m.name || '';
    return !baseName.includes('バーニャカウダ');
  });

  // 2. Generate the 5 versions
  const v1 = {
    id: `menu-restored-1`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '(前年引継ぎ)',
    isActiveVersion: false, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2024-07-25', startDate: '2024-08-01', reviewDate: '2024-09-25', deadline: '2024-09-30', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'コリンキー', amount: 20 }, { name: '人参', amount: 20 }, { name: 'キュウリ', amount: 30 },
      { name: 'SO有機オリーブ', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2024-07-25T00:00:00Z'
  };

  const v2 = {
    id: `menu-restored-2`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '第1版',
    isActiveVersion: false, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2024-09-25', startDate: '2024-10-01', reviewDate: '2024-11-25', deadline: '2024-11-30', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'ナス', amount: 20 }, { name: '人参', amount: 20 }, { name: 'ピーマン', amount: 30 },
      { name: '里芋', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2024-09-25T00:00:00Z'
  };

  const v3 = {
    id: `menu-restored-3`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '第2版',
    isActiveVersion: false, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2024-11-25', startDate: '2024-12-01', reviewDate: '2025-01-25', deadline: '2025-01-31', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'カリフラワー', amount: 20 }, { name: 'カブ', amount: 20 }, { name: 'はつか大根', amount: 30 },
      { name: 'カラシナ', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }, { name: '人参', amount: 10 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2024-11-25T00:00:00Z'
  };

  const v4 = {
    id: `menu-restored-4`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '第3版',
    isActiveVersion: false, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2025-01-25', startDate: '2025-02-01', reviewDate: '2025-03-25', deadline: '2025-03-31', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'カリフラワー', amount: 20 }, { name: 'カブ', amount: 20 }, { name: '人参', amount: 30 },
      { name: '菜花', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2025-01-25T00:00:00Z'
  };

  const v5 = {
    id: `menu-restored-5`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '第5版',
    isActiveVersion: true, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2025-05-25', startDate: '2025-06-01', reviewDate: '2025-07-25', deadline: '2025-07-31', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'たまねぎ', amount: 20 }, { name: 'カブ', amount: 20 }, { name: 'ジャガイモ', amount: 30 },
      { name: 'ズッキーニ', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }, { name: 'イタリアンパセリ', amount: 10 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2025-05-25T00:00:00Z'
  };

  const restored = [v1, v2, v3, v4, v5];
  
  restored.forEach(m => {
    m.recipe.forEach(ri => {
      const ing = restaurantStore.state.ingredients.find(i => i.name === ri.name || i.name.includes(ri.name));
      if (ing) ri.ingredientId = ing.id;
      else ri.ingredientId = 'temp_' + Date.now() + Math.random();
    });
  });

  restaurantStore.state.menus.push(...restored);
  
  // Force sync
  restaurantStore.saveStore();
  if (typeof restaurantStore.syncStoreToCloud === 'function') {
    await restaurantStore.syncStoreToCloud();
  } else {
    restaurantStore.state.needsMigration = true;
  }

  alert("データの完全復元に成功しました！");
  window.location.reload();
};

const saveMenu = async () => {"""

if script_inject in text:
    text = text.replace(script_inject, new_script)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Added restore button successfully")
