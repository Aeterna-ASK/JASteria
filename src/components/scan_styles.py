file_path = 'c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/src/components/MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print("Scanning template image upload region...")

# Let's search lines containing 'menu-image-upload' and print their context
for idx, line in enumerate(lines):
    if 'menu-image-upload' in line:
        start = max(0, idx - 4)
        end = min(len(lines), idx + 8)
        print(f"Context around line {idx + 1}:")
        for i in range(start, end):
            print(f"{i + 1}: {lines[i]}", end='')
