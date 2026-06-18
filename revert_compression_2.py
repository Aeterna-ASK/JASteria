import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("const MENU_IMG_COMPRESS_VERSION = 'compress-300-2026.06-v2';", "const MENU_IMG_COMPRESS_VERSION = 'compress-800-2025.05';")
content = content.replace("m.imageUrl = await compressImageDataUrl(m.imageUrl, 300, 0.6);", "m.imageUrl = await compressImageDataUrl(m.imageUrl, 800, 0.8);")
content = content.replace("m.sampleImageUrl = await compressImageDataUrl(m.sampleImageUrl, 300, 0.6);", "m.sampleImageUrl = await compressImageDataUrl(m.sampleImageUrl, 640, 0.75);")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted compression in restaurantStore.js")
