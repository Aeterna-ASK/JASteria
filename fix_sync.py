import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

replacement = """  let syncStoreTimeout = null;
  async function syncStoreToCloud() {
    if (syncStoreTimeout) {
      clearTimeout(syncStoreTimeout);
    }
    syncStoreTimeout = setTimeout(async () => {
      try {
        console.log('[Firestore Sync] クラウドへの同期開始...');
        const menusNoImg = JSON.parse(JSON.stringify(state.menus || [])).map(m => {
          const m2 = {...m};
          delete m2.imageUrl; delete m2.sampleImageUrl;
          return m2;
        });

        const promises = [
          setDoc(doc(db, 'restaurants', 'menus'), { data: menusNoImg }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'ingredients'), { data: JSON.parse(JSON.stringify(state.ingredients || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'receipts'), { data: JSON.parse(JSON.stringify(state.receipts || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'cookingLogs'), { data: JSON.parse(JSON.stringify(state.cookingLogs || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'cleaningLogs'), { data: JSON.parse(JSON.stringify(state.cleaningLogs || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'manualChapters'), { data: JSON.parse(JSON.stringify(state.manualChapters || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'auditDocuments'), { data: JSON.parse(JSON.stringify(state.auditDocuments || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 't_inbox_documents'), { data: JSON.parse(JSON.stringify(state.t_inbox_documents || [])) }, { merge: true }),
          setDoc(doc(db, 'restaurants', 'meta'), { 
            data: {
              auditCategories: JSON.parse(JSON.stringify(state.auditCategories || {})),
              documents: JSON.parse(JSON.stringify(state.documents || [])),
              externalRegInfo: JSON.parse(JSON.stringify(state.externalRegInfo || {}))
            }
          }, { merge: true })
        ];
        
        await Promise.all(promises); // Wait for the main collections first
        
        // Batch the images to prevent write stream exhaustion
        const imagePromises = [];
        state.menus.forEach(m => {
          if (m.imageUrl || m.sampleImageUrl) {
             imagePromises.push(setDoc(doc(db, 'menuImages', String(m.id)), {
                 imageUrl: m.imageUrl || '',
                 sampleImageUrl: m.sampleImageUrl || ''
             }, { merge: true }).catch(e => console.warn('Failed to save image', m.id, e)));
          }
        });
        
        // Process images in small chunks
        for (let i = 0; i < imagePromises.length; i += 10) {
            await Promise.all(imagePromises.slice(i, i + 10));
        }

        console.log('[Firestore Sync] 全データの同期保存完了');
      } catch (error) {
        console.error('[Firestore Sync] 保存失敗', error);
      }
    }, 2000);
  }"""

# Find the start and end of syncStoreToCloud
pattern = re.compile(r'\s*async function syncStoreToCloud\(\) \{.*?(?=  async function|\Z|\s+export|\s*function)', re.DOTALL)

# Let's be safer and manually replace it since regex might match too much.
match = pattern.search(text)
if match:
    pass # we might need to be more precise

# Better to use string manipulation
start_index = text.find('  async function syncStoreToCloud() {')
if start_index != -1:
    end_index = text.find('  async function ', start_index + 1)
    if end_index == -1:
        end_index = text.find('function ', start_index + 1)
    if end_index == -1:
        end_index = text.find('export ', start_index + 1)
    
    # Actually just replacing the function block by finding the balanced braces.
    def get_balanced(s, start):
        count = 0
        for i in range(start, len(s)):
            if s[i] == '{': count += 1
            elif s[i] == '}':
                count -= 1
                if count == 0:
                    return i
        return -1
    
    brace_start = text.find('{', start_index)
    brace_end = get_balanced(text, brace_start)
    
    if brace_end != -1:
        new_text = text[:start_index] + replacement + text[brace_end+1:]
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_text)
        print("Successfully updated syncStoreToCloud with debounce and chunking.")
    else:
        print("Could not find matching brace.")
else:
    print("Could not find syncStoreToCloud start.")
