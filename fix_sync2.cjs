const fs = require('fs');
let code = fs.readFileSync('src/store/restaurantStore.js', 'utf8');

const regex = /function initFirestoreSync\(\) \{[\s\S]*?    \}\);\n  \}/;

const replacement = `function initFirestoreSync() {
    if (isFirestoreSyncInitialized) return;
    isFirestoreSyncInitialized = true;
    const docRef = doc(db, 'restaurants', 'default');
    onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.t_inbox_documents) state.t_inbox_documents = data.t_inbox_documents;
      }
    });
  }`;

if (regex.test(code)) {
    code = code.replace(regex, replacement);
    fs.writeFileSync('src/store/restaurantStore.js', code);
    console.log('Successfully replaced initFirestoreSync');
} else {
    console.log('Regex did not match');
}
