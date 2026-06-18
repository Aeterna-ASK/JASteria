import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update availableIngredientsInPeriod
old_avail = """  const sDate = new Date(startStr);
  const eDate = new Date(endStr);
  sDate.setDate(sDate.getDate() - 10);
  eDate.setDate(eDate.getDate() + 10);"""

new_avail = """  const sDate = new Date(startStr);
  const eDate = new Date(startStr);
  sDate.setDate(sDate.getDate() - 15);"""

content = content.replace(old_avail, new_avail)

# 2. Update logic inside generateRecipeWithAi
old_ai_logic = """    const sDate = new Date(aiRecipeConfig.value.startDate);
    const eDate = new Date(aiRecipeConfig.value.endDate);
    sDate.setDate(sDate.getDate() - 10);
    eDate.setDate(eDate.getDate() + 10);
    
    const receipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= sDate && d <= eDate;
    });
    
    const availableIngredients = [];
    const usedIds = new Set();
    receipts.forEach(r => {
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (id && !usedIds.has(id)) {
          usedIds.add(id);
          const ing = state.ingredients.find(i => i.id === id);
          if (ing) {
            availableIngredients.push({
              id: ing.id,
              name: ing.name,
              type: ing.type
            });
          }
        }
      });
    });
    
    if (availableIngredients.length === 0) {
      throw new Error('持E期閁E±10日)冁E仕Eれられた食材が見つかりませんでした、E);
    }"""

# New logic identifies: Start Ingredients, Ended Ingredients, Substitute Ingredients
new_ai_logic = """    // 1. Start Ingredients
    const sDate = new Date(aiRecipeConfig.value.startDate);
    const eDateStart = new Date(aiRecipeConfig.value.startDate);
    sDate.setDate(sDate.getDate() - 15);
    
    const startReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d >= sDate && d <= eDateStart;
    });
    
    const availableIngredients = [];
    const startUsedIds = new Set();
    startReceipts.forEach(r => {
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (id && !startUsedIds.has(id)) {
          startUsedIds.add(id);
          const ing = state.ingredients.find(i => i.id === id);
          if (ing) availableIngredients.push({ id: ing.id, name: ing.name, type: ing.type });
        }
      });
    });

    if (availableIngredients.length === 0) {
      throw new Error('開始時点(前15日以内)に仕入れられた食材が見つかりませんでした。');
    }

    // 2. Timeline Analysis
    const fullEndDate = new Date(aiRecipeConfig.value.endDate);
    const timelineReceipts = state.receipts.filter(r => {
      if (!r.date) return false;
      const d = new Date(r.date);
      return d > eDateStart && d <= fullEndDate;
    });

    const lastDeliveryMap = {};
    const newIngredientIds = new Set();
    timelineReceipts.forEach(r => {
      const dStr = r.date;
      const itemsToProcess = r.items && Array.isArray(r.items) ? r.items : [r];
      itemsToProcess.forEach(item => {
        const id = item.ingredientId;
        if (!id) return;
        if (!lastDeliveryMap[id] || dStr > lastDeliveryMap[id]) lastDeliveryMap[id] = dStr;
        if (!startUsedIds.has(id)) newIngredientIds.add(id);
      });
    });

    const endedIngredients = [];
    startUsedIds.forEach(id => {
      const lastDel = lastDeliveryMap[id] || eDateStart.toISOString().split('T')[0];
      const lastD = new Date(lastDel);
      // 終了日から14日以上前に終わっている場合
      const daysDiff = (fullEndDate - lastD) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 14) {
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) endedIngredients.push(`${ing.name} (最終納品日: ${lastDel})`);
      }
    });

    const substituteIngredients = [];
    newIngredientIds.forEach(id => {
      const ing = state.ingredients.find(i => i.id === id);
      if (ing) substituteIngredients.push(ing.name);
    });"""

# Because of Mojibake in the terminal read, the actual source text might differ.
# Let's use a simpler replace strategy:
with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Replace availableIngredientsInPeriod
text = text.replace(old_avail, new_avail)

# Replace generateRecipeWithAi logic up to the Error throwing
import re

ai_logic_pattern = re.compile(
    r"const sDate = new Date\(aiRecipeConfig\.value\.startDate\);.*?if \(availableIngredients\.length === 0\) \{\s*throw new Error\([^)]+\);\s*\}",
    re.DOTALL
)

text = ai_logic_pattern.sub(new_ai_logic, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)
print("Updated MenusView.vue logic")
