import os

file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

print("Reading file...")
with open(file_path, 'rb') as f:
    data = f.read()

print("Decoding with replace...")
# Replace invalid UTF-8 bytes with the replacement character U+FFFD (which prints as )
text = data.decode('utf-8', errors='replace')

print(f"Decoded length: {len(text)}")

print("Writing clean UTF-8 file back...")
with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Repair completed successfully!")
