import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\utils\aiImageGen.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_val = "compressImageDataUrl(edited.dataUrl, 800, 0.85)"
new_val = "compressImageDataUrl(edited.dataUrl, 300, 0.6)"

if old_val in content:
    content = content.replace(old_val, new_val)
    print("Replaced edited.dataUrl compression")

old_val2 = "compressImageDataUrl(rawDataUrl, 800, 0.85)"
new_val2 = "compressImageDataUrl(rawDataUrl, 300, 0.6)"

if old_val2 in content:
    content = content.replace(old_val2, new_val2)
    print("Replaced rawDataUrl compression")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
