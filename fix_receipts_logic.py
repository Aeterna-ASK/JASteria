import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """    const availableIngredients = [];
    const usedIds = new Set();
    receipts.forEach(r => {
      if (r.items) {
        r.items.forEach(item => {
          if (item.ingredientId && !usedIds.has(item.ingredientId)) {
            usedIds.add(item.ingredientId);
            const ing = state.ingredients.find(i => i.id === item.ingredientId);
            if (ing) {
              availableIngredients.push({
                id: ing.id,
                name: ing.name,
                type: ing.type
              });
            }
          }
        });
      }
    });"""

new_logic = """    const availableIngredients = [];
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
    });"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Logic replaced successfully.")
else:
    print("Could not find the old logic.")
