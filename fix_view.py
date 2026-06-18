import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. AI Prompt Exclusions
old_prompt_line = "- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）"
new_prompt_line = "- 「利用可能な食材リスト」に含まれる食材以外は絶対に使用しないでください。（水・塩などは例外として使用可ですが極力リストの食材で成立させてください）\n- 【絶対条件】「有機フローラル豆」および「有機テンメンジャン」は料理には使用できないため、絶対にレシピに含めないでください。"
if old_prompt_line in text:
    text = text.replace(old_prompt_line, new_prompt_line)
    print("Added AI prompt exclusions")
else:
    print("Could not find old_prompt_line")

# 2. Dropdown Update
old_select = """<select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                          {{ ing.name }} ({{ ing.type === 'organic' ? '有機JAS適吁E : (ing.type === 'salt_water' ? '水塩(除外対象)' : '一般材料') }})
                        </option>
                      </select>"""

# Since Mojibake happened for '有機JAS適合', let's use regex
select_pattern = re.compile(
    r'<select v-model="item\.ingredientId" class="input-organic select-organic" style="width: 100%;">\s*<option v-for="ing in ingredients" :key="ing\.id" :value="ing\.id">\s*\{\{ ing\.name \}\} \(\{\{ ing\.type === \'organic\' \? \'[^\']+\' : \(ing\.type === \'salt_water\' \? \'[^\']+\' : \'[^\']+\'\) \}\}\)\s*</option>\s*</select>',
    re.DOTALL
)

new_select = """<select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <optgroup label="食材（一般・有機）">
                          <option v-for="ing in ingredients" :key="ing.id" :value="ing.id">
                            {{ ing.name }} ({{ ing.type === 'organic' ? '有機JAS適合' : (ing.type === 'salt_water' ? '水塩(除外対象)' : '一般材料') }})
                          </option>
                        </optgroup>
                        <optgroup label="自家製（登録済みレシピ）">
                          <option v-for="m in menus" :key="m.id" :value="m.id">
                            {{ m.name }}
                          </option>
                        </optgroup>
                      </select>"""

if select_pattern.search(text):
    text = select_pattern.sub(new_select, text)
    print("Updated dropdown select")
else:
    print("Could not find select pattern")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
