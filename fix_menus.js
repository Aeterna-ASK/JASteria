import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDtW1Xrpf_jcDKd12IyB88AjiVDRe7e0SE",
  authDomain: "organiclog-2f6c7.firebaseapp.com",
  projectId: "organiclog-2f6c7",
  storageBucket: "organiclog-2f6c7.firebasestorage.app",
  messagingSenderId: "267681135810",
  appId: "1:267681135810:web:5e62b67eb2d4145a4b8f5b"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixMenus() {
    try {
        console.log("Fetching menus...");
        const docRef = doc(db, 'restaurants', 'menus');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            const menus = data.data;
            
            let updated = false;
            menus.forEach(m => {
                if (m.ingredients && Array.isArray(m.ingredients)) {
                    console.log(`Fixing menu ${m.name}...`);
                    const oldRecipeString = m.recipe;
                    m.recipe = m.ingredients.map(i => ({
                        ingredientId: i.ingredientId,
                        amount: i.quantity
                    }));
                    m.instructions = oldRecipeString;
                    delete m.ingredients;
                    updated = true;
                }
            });
            
            if (updated) {
                console.log("Updating menus in Firestore...");
                await setDoc(docRef, { data: menus }, { merge: true });
                console.log("Fixed menus data structure in Firestore.");
            } else {
                console.log("No menus needed fixing.");
            }
        }
    } catch (e) {
        console.error("Error fixing menus:", e);
    }
    process.exit(0);
}

fixMenus();
