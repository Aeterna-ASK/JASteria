import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_logic = """    return {
      ...rec,
      ingredientName: ing ? ing.name : '不明な食材',
      supplier: ing ? ing.supplier : '',
      hasCertificate: ing ? ing.hasCertificate : false,
      certificateExpiry: ing ? ing.certificateExpiry : '',
      // 万が一の確認忘れ、または基準満たさない場合はアラート"""

new_logic = """    return {
      ...rec,
      ingredientName: ing ? ing.name : '不明な食材',
      ingredientType: ing ? ing.type : 'general',
      supplier: ing ? ing.supplier : '',
      hasCertificate: ing ? ing.hasCertificate : false,
      certificateExpiry: ing ? ing.certificateExpiry : '',
      // 万が一の確認忘れ、または基準満たさない場合はアラート"""

if old_logic in content:
    content = content.replace(old_logic, new_logic)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully added ingredientType to decodedReceipts.")
else:
    print("Could not find old logic in restaurantStore.js.")
