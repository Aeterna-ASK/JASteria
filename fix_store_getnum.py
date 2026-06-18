import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

old_getnum = '''        const getNum = (name) => {
          const match = name.match(/第(\\d+)版|No\\.?\\s*(\\d+)/i);
          if (match) return parseInt(match[1] || match[2], 10);
          return 1; // Base version is 1
        };'''

new_getnum = '''        const getNum = (name) => {
          if (!name) return 1;
          try {
            const match = name.match(/第(\\d+)版|No\\.?\\s*(\\d+)/i);
            if (match) return parseInt(match[1] || match[2], 10);
          } catch(e) {
            console.error("getNum error on name:", name, e);
          }
          return 1; // Base version is 1
        };'''

if old_getnum in store_text:
    store_text = store_text.replace(old_getnum, new_getnum)
    with open(store_file, 'w', encoding='utf-8') as f:
        f.write(store_text)
    print("Fixed getNum successfully.")
else:
    print("Could not find getNum block.")
