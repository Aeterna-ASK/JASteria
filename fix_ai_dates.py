import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_func_start = 'const openAiRecipeModal = () => {'
end_str = '};'
start_idx = content.find(old_func_start)
if start_idx != -1:
    end_idx = content.find(end_str, start_idx) + len(end_str)
    
    new_func = """const openAiRecipeModal = () => {
  showAiRecipeModal.value = true;
  aiRecipeError.value = '';
  
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  aiRecipeConfig.value.startDate = form.value.startDate || nextMonth.toISOString().split('T')[0];
  
  if (form.value.deadline) {
    aiRecipeConfig.value.endDate = form.value.deadline;
  } else {
    const ed = new Date(aiRecipeConfig.value.startDate);
    ed.setMonth(ed.getMonth() + 1);
    ed.setDate(0);
    aiRecipeConfig.value.endDate = ed.toISOString().split('T')[0];
  }
};"""
    
    content = content[:start_idx] + new_func + content[end_idx:]
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed openAiRecipeModal date logic.")
else:
    print("openAiRecipeModal not found")
