import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Extract all names from seedMenus
names = re.findall(r"name:\s*'([^']+)'", text)
for n in names:
    if '有機野菜' in n:
        print(f"NAME: '{n}'")
    if '黒酢' in n:
        print(f"NAME: '{n}'")
