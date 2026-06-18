import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Remove the version check completely
old_line = "if (parsed && parsed.excelDataMenuVersionsV5) return;"
store_text = store_text.replace(old_line, "")

with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

print("Removed V5 check.")
