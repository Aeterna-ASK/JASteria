import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Let's replace the whole block based on line context
# from "const sDate = new Date(aiRecipeConfig.value.startDate);"
# up to "if (availableIngredients.length === 0)" inclusive of its throw block.

pattern = re.compile(
    r"const sDate = new Date\(aiRecipeConfig\.value\.startDate\);.*?throw new Error\([^)]+\);\s*\}",
    re.DOTALL
)

new_ai_logic = """// 1. Start Ingredients
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
    const substituteIngredients = [];
    
    startUsedIds.forEach(id => {
      const lastDel = lastDeliveryMap[id] || eDateStart.toISOString().split('T')[0];
      const lastD = new Date(lastDel);
      const daysDiff = (fullEndDate - lastD) / (1000 * 60 * 60 * 24);
      if (daysDiff >= 14) {
        const ing = state.ingredients.find(i => i.id === id);
        if (ing) endedIngredients.push(`${ing.name}`);
      }
    });

    newIngredientIds.forEach(id => {
      const ing = state.ingredients.find(i => i.id === id);
      if (ing) substituteIngredients.push(ing.name);
    });"""

text = pattern.sub(new_ai_logic, text)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed missing definitions")
