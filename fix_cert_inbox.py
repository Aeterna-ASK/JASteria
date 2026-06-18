import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Filter out CERT-INBOX in decodedReceipts
old_decoded = """const decodedReceipts = computed(() => {
  return state.receipts.map(rec => {"""

new_decoded = """const decodedReceipts = computed(() => {
  return state.receipts.filter(rec => rec.lotNumber !== 'CERT-INBOX').map(rec => {"""

if old_decoded in content:
    content = content.replace(old_decoded, new_decoded)
    print("Successfully added filter for CERT-INBOX to decodedReceipts.")
else:
    print("Could not find decodedReceipts definition.")

# 2. Remove addReceipt in master_cert block
# I will use regex to find the addReceipt block under master_cert.
# The block looks like:
#       addReceipt({
#         date: data.date ...
#         ...
#         jasPhoto: data.fileUrl || ''
#       });

pattern = r"(addReceipt\(\{[\s\S]*?lotNumber:\s*'CERT-INBOX'[\s\S]*?\}\);)"
match = re.search(pattern, content)
if match:
    content = content.replace(match.group(1), "")
    print("Successfully removed addReceipt for CERT-INBOX.")
else:
    print("Could not find addReceipt block for CERT-INBOX.")

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)
