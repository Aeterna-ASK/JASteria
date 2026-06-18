import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

# Fix form.value.notes to form.value.remarks
old_str = """    if (parsed.notes) {
      form.value.notes = (form.value.notes ? form.value.notes + '\\n\\n' : '') + parsed.notes;
    }"""

new_str = """    if (parsed.notes) {
      form.value.remarks = (form.value.remarks ? form.value.remarks + '\\n\\n' : '') + parsed.notes;
    }"""

if old_str in text:
    text = text.replace(old_str, new_str)
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Fixed form.value.notes -> form.value.remarks")
else:
    print("Could not find the target string to replace.")
