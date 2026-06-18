import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\utils\aiImageGen.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_rule = '2. The dish: "${dishName}". Ingredients to include only: "${ingredientList}". Do NOT add any unlisted ingredient or garnish.'
new_rule = '2. The dish: "${dishName}". CRITICAL: You MUST ONLY depict the exact ingredients listed here: "${ingredientList}". Do NOT draw any other ingredients, sauces, herbs, or garnishes even if they are traditionally part of the dish.'

content = content.replace(old_rule, new_rule)

old_edit_rule = '- The new food must consist ONLY of these ingredients (no additions, no garnish beyond this list):\n  ${ingredientList}'
new_edit_rule = '- The new food must STRICTLY consist ONLY of these ingredients (no additions, no sauces, no herbs, no garnish beyond this exact list):\n  ${ingredientList}'

content = content.replace(old_edit_rule, new_edit_rule)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Updated prompts for strict ingredient limitations")
