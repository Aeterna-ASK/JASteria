import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

new_func = """const openAiRecipeModal = () => {
  console.log("Button clicked! Opening AI Modal.");
  showAiRecipeModal.value = true;
  aiRecipeError.value = '';
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  aiRecipeConfig.value.startDate = form.value.startDate || nextMonth.toISOString().split('T')[0];
  
  const ed = new Date(aiRecipeConfig.value.startDate);
  ed.setMonth(ed.getMonth() + 1);
  ed.setDate(0);
  aiRecipeConfig.value.endDate = ed.toISOString().split('T')[0];
  console.log("Modal state set to:", showAiRecipeModal.value, aiRecipeConfig.value);
};"""

# Replace the existing openAiRecipeModal function
# Use regex to find it
func_pattern = re.compile(r'const openAiRecipeModal = \(\) => \{.*?\n\};', re.DOTALL)
content = func_pattern.sub(new_func, content)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
    
print("Added console.log to openAiRecipeModal")
