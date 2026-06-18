import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

target = "const simulationResult = computed(() => {"
replacement = """const addRecipeRow = () => {
  form.value.recipe.push({ ingredientId: state.ingredients[0]?.id || '', amount: 0 });
};

const removeRecipeRow = (index) => {
  form.value.recipe.splice(index, 1);
};

const simulationResult = computed(() => {"""

if target in content:
    content = content.replace(target, replacement)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully injected missing row functions")
else:
    print("Could not find target string to inject row functions")
