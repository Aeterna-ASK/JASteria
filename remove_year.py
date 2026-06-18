import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">登録年度 <span class="text-red-500 font-bold">*</span></label>
                    <select v-model="form.year" class="input-organic select-organic">
                      <option value="2026">2026年度</option>
                      <option value="2025">2025年度</option>
                      <option value="2024">2024年度</option>
                      <option value="2023">2023年度</option>
                    </select>
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">目標作成日</label>
                    <input type="date" v-model="form.targetCreatedDate" class="input-organic" />
                  </div>
                </div>

                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">開始予定日</label>
                    <input type="date" v-model="form.startDate" class="input-organic" />
                  </div>
                </div>"""

new_str = """                <div class="grid-2-col" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 1rem;">
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">目標作成日</label>
                    <input type="date" v-model="form.targetCreatedDate" class="input-organic" />
                  </div>
                  <div class="form-group">
                    <label style="font-weight: 600; font-size: 0.85rem; margin-bottom: 0.25rem; display: block;">開始予定日</label>
                    <input type="date" v-model="form.startDate" class="input-organic" />
                  </div>
                </div>"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Removed 登録年度 successfully")
else:
    print("Could not find old string to replace.")
