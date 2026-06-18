import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Find the end of computed properties
insert_target = "const ingredients = computed(() => state.ingredients);"
new_computed = """const ingredients = computed(() => state.ingredients);

// AIや指定期間の納品履歴に基づく利用可能な食材を算出
const availableIngredientsInPeriod = computed(() => {
  let startStr = form.value.startDate || aiRecipeConfig.value.startDate;
  let endStr = form.value.deadline || aiRecipeConfig.value.endDate;
  
  if (!startStr) {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    startStr = nextMonth.toISOString().split('T')[0];
  }
  if (!endStr) {
    const sDate = new Date(startStr);
    sDate.setMonth(sDate.getMonth() + 1);
    sDate.setDate(0);
    endStr = sDate.toISOString().split('T')[0];
  }

  const sDate = new Date(startStr);
  const eDate = new Date(endStr);
  sDate.setDate(sDate.getDate() - 10);
  eDate.setDate(eDate.getDate() + 10);
  
  const receipts = state.receipts.filter(r => {
    if (!r.date) return false;
    const d = new Date(r.date);
    return d >= sDate && d <= eDate;
  });
  
  const usedIds = new Set();
  const available = [];
  receipts.forEach(r => {
    const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
    itemsToProcess.forEach(item => {
      const id = item.ingredientId;
      if (id && !usedIds.has(id)) {
        usedIds.add(id);
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) {
          available.push(ing);
        }
      }
    });
  });

  state.ingredients.forEach(ing => {
    if (ing.type === 'salt_water' && !usedIds.has(ing.id)) {
      available.push(ing);
    }
  });

  return available.length > 0 ? available : state.ingredients;
});"""

if insert_target in content:
    content = content.replace(insert_target, new_computed)
    print("Inserted availableIngredientsInPeriod")
else:
    print("Could not find insert target")

# Now replace the v-for in the dropdown
old_select = """<select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <option v-for="ing in state.ingredients" :key="ing.id" :value="ing.id">"""
new_select = """<select v-model="item.ingredientId" class="input-organic select-organic" style="width: 100%;">
                        <option v-for="ing in availableIngredientsInPeriod" :key="ing.id" :value="ing.id">"""

if old_select in content:
    content = content.replace(old_select, new_select)
    print("Replaced dropdown v-for")
else:
    print("Could not find select element to replace")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
