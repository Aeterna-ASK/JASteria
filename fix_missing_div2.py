import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# I am missing a </div> for the form-group of the sample image part!
old_str = """                    <div v-else style="width: 80px; height: 80px; border-radius: 6px; border: 2px dashed #bbf7d0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0fdf4; color: #166534; font-size: 0.65rem;">
                      <span>見本なし</span>
                    </div>
                  </div>
              </div>

              <!-- セクション2: レシピ構成 -->"""

new_str = """                    <div v-else style="width: 80px; height: 80px; border-radius: 6px; border: 2px dashed #bbf7d0; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #f0fdf4; color: #166534; font-size: 0.65rem;">
                      <span>見本なし</span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- セクション2: レシピ構成 -->"""

if old_str in text:
    text = text.replace(old_str, new_str)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed missing div for sample image part!")
else:
    print("Could not find the target string to replace.")
