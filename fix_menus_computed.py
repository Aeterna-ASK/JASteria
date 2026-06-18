import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Add `menus` computed property
old_computed = "const ingredients = computed(() => state.ingredients);"
new_computed = "const ingredients = computed(() => state.ingredients);\nconst menus = computed(() => state.menus.filter(m => m.id !== currentId.value)); // 自分自身を親に選べないようにする"

if old_computed in text:
    text = text.replace(old_computed, new_computed)
    print("Added menus computed property")
else:
    print("Could not find old_computed")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
