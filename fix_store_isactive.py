import sys

store_file = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'
with open(store_file, 'r', encoding='utf-8') as f:
    store_text = f.read()

# Change flag to V5
store_text = store_text.replace('excelDataMenuVersionsV4', 'excelDataMenuVersionsV5')

# We need to replace the logic inside Object.values(groups).forEach
# We'll just replace the whole block

old_block = '''  Object.values(groups).forEach(group => {
    if (group.length === 1) {
      // Only one version
      const m = group[0];
      if (m.isActiveVersion === undefined) {
        m.isActiveVersion = true;
        m.versionName = '初期版';
        modified = true;
      }
    } else {
      // Multiple versions, need to sort to find the newest.
      // Usually "№2" is newer than "no number", "№3" is newer than "№2".
      // Let's sort by checking if name has "№" and parsing the number.
      group.sort((a, b) => {
        const getNum = (name) => {
          const match = name.match(/№(\\d+)/);
          return match ? parseInt(match[1], 10) : 1;
        };
        const numA = getNum(a.name);
        const numB = getNum(b.name);
        if (numA !== numB) return numB - numA; // higher number first
        // fallback to creation date or just id if everything else fails
        return b.id.localeCompare(a.id);
      });
      
      group.forEach((m, index) => {
        if (m.isActiveVersion === undefined) {
          m.isActiveVersion = (index === 0); // newest is active
          
          // Generate a version name based on the name suffix if not set
          if (!m.versionName) {
            const match = m.name.match(/№(\\d+)/);
            if (match) {
              m.versionName = `第${match[1]}版`;
              // We could also strip the № from the actual name, but maybe keep it for now so users recognize it
            } else {
              m.versionName = '初期版';
            }
          }
          modified = true;
        }
      });
    }
  });'''

new_block = '''  Object.values(groups).forEach(group => {
    if (group.length === 1) {
      // Only one version
      const m = group[0];
      if (m.isActiveVersion !== true) {
        m.isActiveVersion = true;
        modified = true;
      }
      if (!m.versionName) {
        m.versionName = '初期版';
        modified = true;
      }
    } else {
      // Multiple versions, need to sort to find the newest.
      group.sort((a, b) => {
        const getNum = (name) => {
          const match = name.match(/第(\\d+)版|No\\.?\\s*(\\d+)/i);
          if (match) return parseInt(match[1] || match[2], 10);
          return 1; // Base version is 1
        };
        const numA = getNum(a.name);
        const numB = getNum(b.name);
        if (numA !== numB) return numB - numA; // higher number first
        // fallback to creation date or just id if everything else fails
        return b.id.localeCompare(a.id);
      });
      
      group.forEach((m, index) => {
        const shouldBeActive = (index === 0);
        if (m.isActiveVersion !== shouldBeActive) {
          m.isActiveVersion = shouldBeActive;
          modified = true;
        }
        
        // Generate a version name based on the name suffix if not set
        if (!m.versionName) {
          const match = m.name.match(/第(\\d+)版|No\\.?\\s*(\\d+)/i);
          if (match) {
            m.versionName = `第${match[1] || match[2]}版`;
          } else {
            m.versionName = '初期版';
          }
          modified = true;
        }
      });
    }
  });'''

if old_block in store_text:
    store_text = store_text.replace(old_block, new_block)
else:
    print("WARNING: Could not find old block to replace!")

with open(store_file, 'w', encoding='utf-8') as f:
    f.write(store_text)

print("Updated isActiveVersion logic successfully.")
