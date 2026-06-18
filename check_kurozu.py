import json

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# We need to extract the mock data. Since we cannot easily execute it here, let's just search for '黒酢添加料理'
lines = content.split('\n')
for i, line in enumerate(lines):
    if '黒酢添加料理' in line or '黒酢もろみステーキ' in line or '黒酢ランチ' in line:
        print(f"Line {i}: {line}")
