import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix the newline in join
bad_join = ".join('\n');"
good_join = ".join('\\n');"
text = text.replace(bad_join, good_join)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed syntax error")
