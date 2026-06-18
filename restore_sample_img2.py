import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'

with open(broken_file, 'r', encoding='utf-8') as f:
    old_text = f.read()

# Grab everything from <!-- AIスタイル参考用 to the div before <!-- セクション2
match = re.search(r'(<!-- AIスタイル参考用の見本画像.*?<\/div>\s*<\/div>\s*<\/div>\s*)<\/div>\s*<!-- セクション2: レシピ構成 -->', old_text, re.DOTALL)

if match:
    sample_part = match.group(1)
    
    with open(file_path, 'r', encoding='utf-8') as f:
        curr_text = f.read()
        
    insert_pattern = re.compile(r'(<\/div>\s*)<!-- セクション2: レシピ構成 -->', re.DOTALL)
    match_insert = insert_pattern.search(curr_text)
    
    if match_insert:
        new_text = curr_text[:match_insert.start(1)] + "\n\n" + sample_part + "\n" + curr_text[match_insert.start(1):]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("Restored sample image part!")
    else:
        print("Could not find insertion point.")
else:
    print("Could not find sample part in old text.")
