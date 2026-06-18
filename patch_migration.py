import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Update version
content = content.replace("const MENU_IMG_COMPRESS_VERSION = 'compress-800-2025.05';", "const MENU_IMG_COMPRESS_VERSION = 'compress-300-2026.06-v2';")

# Update compression params
old_logic1 = "m.imageUrl = await compressImageDataUrl(m.imageUrl, 800, 0.8);"
new_logic1 = "m.imageUrl = await compressImageDataUrl(m.imageUrl, 300, 0.6);"
content = content.replace(old_logic1, new_logic1)

old_logic2 = "m.sampleImageUrl = await compressImageDataUrl(m.sampleImageUrl, 640, 0.75);"
new_logic2 = "m.sampleImageUrl = await compressImageDataUrl(m.sampleImageUrl, 300, 0.6);"
content = content.replace(old_logic2, new_logic2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Successfully patched restaurantStore.js compression migration")
