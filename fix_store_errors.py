import re

file_path = r'c:\Users\dai72\OneDrive\デスクトップ\WebApp\JASAGRI_RESTAURANT\restaurant\src\store\restaurantStore.js'

with open(file_path, 'r', encoding='utf-8') as f:
    text = f.read()

sync_pattern = r'const menusNoImg = JSON\.parse\(JSON\.stringify\(state\.menus \|\| \[\]\)\)\.map\(m => \{\s*const m2 = \{\.\.\.m\};\s*delete m2\.imageUrl; delete m2\.sampleImageUrl;\s*return m2;\s*\}\);.*?await Promise\.all\(promises\); // Wait for the main collections first\s*// Batch the images to prevent write stream exhaustion\s*const menusWithImages = state\.menus\.filter\(m => m\.imageUrl \|\| m\.sampleImageUrl\);'

sync_replacement = """// Capture images before await to avoid them being wiped out by concurrent onSnapshot updates
        const menusWithImages = state.menus.filter(m => m.imageUrl || m.sampleImageUrl).map(m => ({
            id: m.id,
            imageUrl: m.imageUrl,
            sampleImageUrl: m.sampleImageUrl
        }));
        
        // Update local cache immediately so onSnapshot can restore them
        menusWithImages.forEach(m => {
            menuImagesCache[m.id] = {
                imageUrl: m.imageUrl || '',
                sampleImageUrl: m.sampleImageUrl || ''
            };
        });

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
        
        await Promise.all(promises); // Wait for the main collections first"""

text = re.sub(sync_pattern, sync_replacement, text, flags=re.DOTALL)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(text)

print("Fixed state.menus being overwritten during syncStoreToCloud.")
