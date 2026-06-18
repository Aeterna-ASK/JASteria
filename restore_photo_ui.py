import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'

with open(broken_file, 'r', encoding='utf-8') as f:
    old_text = f.read()

# Extract the photo generation parts
match_photo = re.search(r'(<!-- 料理写真の登録.*?<\/div>\s*<\/div>\s*<\/div>)', old_text, re.DOTALL)

if match_photo:
    photo_part = match_photo.group(1)
    
    # We need to insert this right after the form.description div and before the closing </div> of basic tab.
    with open(file_path, 'r', encoding='utf-8') as f:
        curr_text = f.read()
        
    # Find where to insert:
    #                 <textarea v-model="form.description" rows="2" class="input-organic" placeholder="メニューの特徴やこだわりを入力してください"></textarea>
    #                 </div>
    #               </div>
    #
    #               <!-- セクション2: レシピ構成 -->
    insert_pattern = re.compile(r'(<textarea v-model="form\.description".*?<\/textarea>\s*<\/div>\s*)<\/div>\s*<!-- セクション2: レシピ構成 -->', re.DOTALL)
    
    match_insert = insert_pattern.search(curr_text)
    if match_insert:
        new_text = curr_text[:match_insert.end(1)] + "\n" + photo_part + "\n              </div>\n\n              <!-- セクション2: レシピ構成 -->" + curr_text[match_insert.end():]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("Restored photo generation part!")
    else:
        print("Could not find insertion point in current file.")
else:
    print("Could not find photo generation part in old file.")
