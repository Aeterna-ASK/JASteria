import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\components\MenusView.vue'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

old_str = """onMounted(() => {
  if (state.targetMenuToClone) {"""

new_str = """onMounted(() => {
  // --- FIX BARNYA CAUDA DATA ---
  let modified = false;
  const groups = {};
  restaurantStore.state.menus.forEach(m => {
    const base = m.masterName || m.name;
    if (base && base.includes('バーニャカウダ')) {
      if (!groups[base]) groups[base] = [];
      groups[base].push(m);
    }
  });

  Object.values(groups).forEach(group => {
    let hasActive = false;
    
    // Fix injected version names
    group.forEach(m => {
      if (m.id === 'menu-old-inj-1') { m.versionName = '(前年引継ぎ)'; m.isActiveVersion = false; modified = true; }
      if (m.id === 'menu-old-inj-2') { m.versionName = '第1版'; m.isActiveVersion = false; modified = true; }
      if (m.id === 'menu-old-inj-3') { m.versionName = '第2版'; m.isActiveVersion = false; modified = true; }
      if (m.id === 'menu-old-inj-4') { m.versionName = '第3版'; m.isActiveVersion = false; modified = true; }
      
      if (m.isActiveVersion) hasActive = true;
    });

    if (!hasActive && group.length > 0) {
      console.log("No active version found! Fixing...");
      // Find the newest version
      const getV = m => {
        if (m.versionName) {
          const v = m.versionName.match(/第(\\d+)版/);
          if (v) return parseInt(v[1], 10);
          if (m.versionName.includes('初期') || m.versionName.includes('引継ぎ')) return 0;
        }
        return -1;
      };
      
      group.sort((a, b) => {
        const vA = getV(a);
        const vB = getV(b);
        if (vA !== vB) return vB - vA;
        return (b.updatedAt ? new Date(b.updatedAt).getTime() : 0) - (a.updatedAt ? new Date(a.updatedAt).getTime() : 0);
      });
      
      // The newest one gets isActiveVersion = true
      group[0].isActiveVersion = true;
      modified = true;
    }
  });

  if (modified) {
    restaurantStore.saveStore();
    if (typeof restaurantStore.syncStoreToCloud === 'function') {
      restaurantStore.syncStoreToCloud();
    } else {
      restaurantStore.state.needsMigration = true;
    }
    console.log("Fixed missing active version and names!");
  }
  // --- END FIX ---

  if (state.targetMenuToClone) {"""

if old_str in text:
    text = text.replace(old_str, new_str)
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    print("Injected fix script successfully")
else:
    print("Could not find onMounted")
