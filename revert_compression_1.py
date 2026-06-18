import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\utils\aiImageGen.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Revert compression
content = content.replace("compressImageDataUrl(edited.dataUrl, 300, 0.6)", "compressImageDataUrl(edited.dataUrl, 800, 0.85)")
content = content.replace("compressImageDataUrl(rawDataUrl, 300, 0.6)", "compressImageDataUrl(rawDataUrl, 800, 0.85)")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Reverted compression in aiImageGen.js")
