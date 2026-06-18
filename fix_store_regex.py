import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Change flag from excelDataMenuVersionsV2 to V3 to force it to run again!
store_text = store_text.replace('excelDataMenuVersionsV2', 'excelDataMenuVersionsV3')

# We can just search and replace the exact line
old_line = "const baseName = (menu.name || '').replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*\\(.*\\).*/g, '').trim();"
new_line = "const baseName = (menu.name || '').replace(/\\s*(第|No\\.?)\\s*\\d+.*|\\s*[\\(（].*[\\)）].*/g, '').trim();"

if old_line in store_text:
    store_text = store_text.replace(old_line, new_line)
else:
    print("WARNING: old_line not found")

with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

print("Updated restaurantStore.js grouping regex and flag successfully.")
