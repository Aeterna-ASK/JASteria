import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Import `collection`
content = content.replace("import { doc, onSnapshot, setDoc } from 'firebase/firestore';", "import { doc, onSnapshot, setDoc, collection } from 'firebase/firestore';")

# 2. Add menuImagesCache definition
content = content.replace("export function initStore() {", "let menuImagesCache = {};\nexport function initStore() {")

# 3. Add onSnapshot for menuImages
insert_fetch_images = """
    onSnapshot(collection(db, 'menuImages'), (snap) => {
      snap.forEach(docSnap => {
        const mId = docSnap.id;
        const d = docSnap.data();
        menuImagesCache[mId] = d;
        const menu = state.menus.find(m => String(m.id) === mId);
        if (menu) {
           menu.imageUrl = d.imageUrl || '';
           menu.sampleImageUrl = d.sampleImageUrl || '';
        }
      });
    });

    collections.forEach(colName => {"""
content = content.replace("    collections.forEach(colName => {", insert_fetch_images, 1)

# 4. Update fetchFromCloud logic for menus
old_fetch_logic = """          } else {
             if (Array.isArray(data)) {
                 if (colName === 't_inbox_documents') {"""

new_fetch_logic = """          } else if (colName === 'menus') {
             if (Array.isArray(data)) {
                 data.forEach(m => {
                     if (menuImagesCache[m.id]) {
                         m.imageUrl = menuImagesCache[m.id].imageUrl || '';
                         m.sampleImageUrl = menuImagesCache[m.id].sampleImageUrl || '';
                     }
                 });
                 state.menus = data;
             }
          } else {
             if (Array.isArray(data)) {
                 if (colName === 't_inbox_documents') {"""

content = content.replace(old_fetch_logic, new_fetch_logic)

# 5. Update syncStoreToCloud
old_sync = """      const promises = [
        setDoc(doc(db, 'restaurants', 'menus'), { data: JSON.parse(JSON.stringify(state.menus || [])) }, { merge: true }),"""

new_sync = """      const menusNoImg = JSON.parse(JSON.stringify(state.menus || [])).map(m => {
        const m2 = {...m};
        delete m2.imageUrl; delete m2.sampleImageUrl;
        return m2;
      });

      const promises = [
        setDoc(doc(db, 'restaurants', 'menus'), { data: menusNoImg }, { merge: true }),"""

content = content.replace(old_sync, new_sync)

# 6. Add promises.push for menuImages
old_sync_end = """      ];
      await Promise.all(promises);"""

new_sync_end = """      ];
      
      state.menus.forEach(m => {
        if (m.imageUrl || m.sampleImageUrl) {
           promises.push(setDoc(doc(db, 'menuImages', String(m.id)), {
               imageUrl: m.imageUrl || '',
               sampleImageUrl: m.sampleImageUrl || ''
           }, { merge: true }).catch(e => console.warn('Failed to save image for menu', m.id, e)));
        }
      });

      await Promise.all(promises);"""

content = content.replace(old_sync_end, new_sync_end)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Successfully injected Firestore image sharding logic!")
