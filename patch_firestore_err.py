import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

old_err_check = "if (error.message && error.message.includes('longer than 1048487 bytes')) {"
new_err_check = "if (error.message && (error.message.includes('longer than 1048487 bytes') || error.message.includes('exceeds the maximum allowed size') || error.message.includes('1,048,576'))) {"

if old_err_check in content:
    content = content.replace(old_err_check, new_err_check)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(content)
    print("Successfully patched Firestore size error check")
else:
    print("Could not find old error check in restaurantStore.js")
