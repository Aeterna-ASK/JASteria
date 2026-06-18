import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('class="modal-overlay animate-fade-in"', 'class="modal-backdrop animate-fade-in"')
content = content.replace('class="modal-content animate-slide-up"', 'class="modal animate-slide-up"')

# Remove the test alerts
content = content.replace('alert("【システム通知】ボタンの通信は正常です。\\nもしこのアラートが出てモーダルが開かない場合は、画面の描画エラーです。");\n  ', '')
content = content.replace('alert("【システム通知】AI生成を開始します");\n  ', '')
content = content.replace('alert("【システム通知】ボタンの通信は正常です。\\nもしこのアラートが出てモーダルが開かない場合は、画面の描画エラーです。");\n', '')
content = content.replace('alert("【システム通知】AI生成を開始します");\n', '')

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
print("Fixed modal CSS classes and removed alerts")
