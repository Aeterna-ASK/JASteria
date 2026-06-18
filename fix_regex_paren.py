import sys

# 1. Update restaurantStore.js
store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

store_text = store_text.replace('excelDataMenuVersionsV3', 'excelDataMenuVersionsV4')

old_regex = r"/\s*(第|No\.?)\s*\d+.*|\s*[\(（].*[\)）].*/g"
new_regex = r"/\s*(第|No\.?)\s*\d+.*/g"
store_text = store_text.replace(old_regex, new_regex)

with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

# 2. Update MenusView.vue
vue_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
with open(vue_file, 'r', encoding='utf-8') as f:
    vue_text = f.read()

vue_text = vue_text.replace(old_regex, new_regex)
# Also fix the old one if fix_history didn't run properly
old_regex2 = r"/\s*(第|No\.?)\s*\d+.*|\s*\(.*\).*/g"
vue_text = vue_text.replace(old_regex2, new_regex)

with open(vue_file, 'w', encoding='utf-8') as f:
    f.write(vue_text)

print("Updated regex to stop stripping parentheses!")
