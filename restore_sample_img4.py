import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'

with open(broken_file, 'r', encoding='utf-8') as f:
    old_lines = f.readlines()

# Extract lines 1459 to 1485 (0-indexed, so 1460 to 1486 in 1-indexed)
sample_part = "".join(old_lines[1459:1486])

with open(file_path, 'r', encoding='utf-8') as f:
    curr_text = f.read()

insert_str = "              </div>\n\n              <!-- セクション2: レシピ構成 -->"
insert_idx = curr_text.find(insert_str)

if insert_idx != -1:
    new_text = curr_text[:insert_idx] + sample_part + curr_text[insert_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(new_text)
    print("Restored sample image part by lines!")
else:
    print("Could not find insertion point.")
