import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'
broken_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue.current_broken'

with open(broken_file, 'r', encoding='utf-8') as f:
    old_text = f.read()

# Grab the sample image part
start_idx = old_text.find("<!-- AIスタイル参考用の見本画像")
end_str = "<span>見本なし</span>\n                    </div>\n                  </div>\n                </div>"
end_idx = old_text.find(end_str, start_idx) + len(end_str)

if start_idx != -1 and end_idx != -1 + len(end_str):
    sample_part = old_text[start_idx:end_idx]
    
    with open(file_path, 'r', encoding='utf-8') as f:
        curr_text = f.read()
        
    insert_str = "              </div>\n\n              <!-- セクション2: レシピ構成 -->"
    insert_idx = curr_text.find(insert_str)
    
    if insert_idx != -1:
        new_text = curr_text[:insert_idx] + "\n                " + sample_part + "\n" + curr_text[insert_idx:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("Restored sample image part!")
    else:
        print("Could not find insertion point.")
else:
    print("Could not find sample part in old text.")
