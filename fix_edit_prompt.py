import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\utils\aiImageGen.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_instruction = """  const instruction =
`TASK: Edit the attached photograph. Do NOT generate a new image from scratch — start from the attached photograph and modify only what is specified below.

KEEP IDENTICAL (do not change any of these):
- The exact plate in the photograph (color, material, shape, size, rim, position, every detail)
- The exact table or surface under the plate (wood grain, stone texture, fabric pattern — preserve pixel by pixel)
- Any side bowls, dipping sauces, small dishes, garnishes outside the main plate — keep them at the same position with the same content
- The exact camera angle, framing, perspective, and depth of field
- The exact lighting direction, color temperature, shadows and highlights
- The exact background and any out-of-focus elements

CHANGE ONLY:
- The food that is sitting in the center of the main plate. Replace it with "${dishName}".
- The new food must STRICTLY consist ONLY of these ingredients (no additions, no sauces, no herbs, no garnish beyond this exact list):
  ${ingredientList}
- Plate the new food naturally on the same plate, occupying roughly the same area as the original food.

OUTPUT: a single photorealistic image with the same resolution as the input. The output must look like a minimally-edited version of the input photograph, not a freshly generated image.`;"""

new_instruction = """  const instruction =
`TASK: Generate a new food photograph using the attached image strictly as a REFERENCE for the plate shape, camera angle, and plating atmosphere. Do NOT keep the food or ingredients from the attached image.

STRICT CONSTRAINTS (YOU MUST FOLLOW THESE):
1. REFERENCE ONLY: Use the attached image ONLY to reference the plate shape, camera angle, and plating atmosphere. Do NOT use any ingredients, food, or sauces from the sample image.
2. INGREDIENTS: You must STRICTLY consist ONLY of these ingredients:
   [ ${ingredientList} ]
3. NO HALLUCINATION: Do NOT draw any common ingredients, sauces, herbs, or garnishes associated with "${dishName}" if they are not explicitly listed in the list above. Absolutely no exceptions.
4. DISH NAME: The core concept is "${dishName}", but ONLY constructed using the allowed ingredients.

OUTPUT: a photorealistic food image.`;"""

if old_instruction in content:
    content = content.replace(old_instruction, new_instruction)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully replaced instruction for Gemini Image edit.")
else:
    print("Could not find old instruction text to replace.")
