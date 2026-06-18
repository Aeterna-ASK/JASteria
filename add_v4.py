import re

file_path_store = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path_store, 'r', encoding='utf-8') as f:
    store_text = f.read()

# We want to add v4_5 for 第4版
inject_point = """  const v5 = {"""

v4_5_code = """  const v4_5 = {
    id: `menu-restored-4-5`,
    name: '有機野菜のバーニャカウダ', masterName: '有機野菜のバーニャカウダ', versionName: '第4版',
    isActiveVersion: false, isOrganicClaim: true, category: '料理',
    targetCreatedDate: '2025-03-25', startDate: '2025-04-01', reviewDate: '2025-05-25', deadline: '2025-05-31', changeReason: '具材の変更', targetGrams: 60,
    recipe: [
      { name: 'たまねぎ', amount: 20 }, { name: 'カブ', amount: 20 }, { name: '人参', amount: 30 },
      { name: 'イタリアンパセリ', amount: 10 }, { name: '有機黒酢', amount: 5 }, { name: 'グラニュー糖', amount: 5 },
      { name: '有機豆乳', amount: 50 }, { name: 'オリーブオイル', amount: 20 }, { name: 'スパイス', amount: 0.2 }
    ],
    description: '1. 有機黒酢・グラニュー糖・有機豆乳・オリーブオイルを混ぜ合わせる\\n2. 有機野菜をカット・ボイルする。\\n3. 皿に盛り付け、ソースを添えて完成',
    updatedAt: '2025-03-25T00:00:00Z'
  };

  const v5 = {"""

if inject_point in store_text:
    store_text = store_text.replace(inject_point, v4_5_code)
    print("Injected v4_5 object")

# Also add to the restored array
array_point = "const restored = [v1, v2, v3, v4, v5];"
new_array = "const restored = [v1, v2, v3, v4, v4_5, v5];"

if array_point in store_text:
    store_text = store_text.replace(array_point, new_array)
    print("Updated restored array")

with open(file_path_store, 'w', encoding='utf-8') as f:
    f.write(store_text)
