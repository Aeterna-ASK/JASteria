import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Fix the form apply block
old_form_apply = """    form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;"""

new_form_apply = """    form.value.name = parsed.menuName || form.value.name;
    form.value.cookingInstructions = parsed.cookingInstructions || form.value.cookingInstructions;
    if (parsed.notes) {
      form.value.notes = (form.value.notes ? form.value.notes + '\\n\\n' : '') + parsed.notes;
    }
    
    // 自動で期限日と見直し日を設定
    if (aiRecipeConfig.value.endDate) {
      form.value.deadline = aiRecipeConfig.value.endDate;
      const endD = new Date(aiRecipeConfig.value.endDate);
      endD.setDate(endD.getDate() - 5);
      form.value.reviewDate = endD.toISOString().split('T')[0];
    }"""

if old_form_apply in text:
    text = text.replace(old_form_apply, new_form_apply)
    print("Fixed form apply block")
else:
    print("Could not find old_form_apply block")

# 2. Fix the dropdown
old_vfor = """<option v-for="ing in availableIngredientsInPeriod" :key="ing.id" :value="ing.id">"""
new_vfor = """<option v-for="ing in ingredients" :key="ing.id" :value="ing.id">"""

if old_vfor in text:
    text = text.replace(old_vfor, new_vfor)
    print("Fixed manual dropdown")
else:
    print("Could not find old_vfor block")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
