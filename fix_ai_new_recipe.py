import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_code = """    } else {
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g';
    }"""

new_code = """    } else {
      const dishConcept = form.value.name || form.value.masterName;
      const conceptText = dishConcept ? `\\n- 【重要】作成する料理のコンセプト（メニュー名）は「${dishConcept}」です。この料理の種類から大幅にずれたレシピ（無関係な食材の混ぜ合わせなど）にならないようにしてください。` : '';
      conditionText = '- 1食あたりの目標総重量: 約' + aiRecipeConfig.value.targetGrams + 'g' + conceptText;
    }"""

if old_code in content:
    content = content.replace(old_code, new_code)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully updated else block for new recipes")
else:
    print("Could not find old code")
