import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'

with open(broken_file, 'r', encoding='utf-8') as f:
    old_text = f.read()

# Extract the sample image part
match_sample = re.search(r'(<!-- AIスタイル参考用の見本画像.*?<\/div>\s*<\/div>\s*<\/div>)', old_text, re.DOTALL)

if match_sample:
    sample_part = match_sample.group(1)
    
    # We need to insert this right before the closing </div> of basic tab, which is right before <!-- セクション2: レシピ構成 -->
    with open(file_path, 'r', encoding='utf-8') as f:
        curr_text = f.read()
        
    insert_pattern = re.compile(r'(<\/div>\s*)<!-- セクション2: レシピ構成 -->', re.DOTALL)
    
    match_insert = insert_pattern.search(curr_text)
    if match_insert:
        new_text = curr_text[:match_insert.start(1)] + "\n\n" + sample_part + curr_text[match_insert.start(1):]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("Restored sample image part!")
    else:
        print("Could not find insertion point in current file.")
else:
    print("Could not find sample image part in old file.")
