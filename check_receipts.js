import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc } from 'firebase/firestore';

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

async function check() {
    const docRef = doc(db, 'restaurants', 'receipts');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        if (data.data && data.data.length > 0) {
            console.log(JSON.stringify(data.data.slice(0, 5), null, 2));
            
            // Check all unique ingredients in receipts
            const ingredientsMap = new Map();
            data.data.forEach(r => {
                if(r.items && Array.isArray(r.items)) {
                    r.items.forEach(i => {
                        ingredientsMap.set(i.name || i.ingredientName, i);
                    });
                }
            });
            console.log("Found unique ingredients:", ingredientsMap.size);
            console.log(Array.from(ingredientsMap.keys()).slice(0, 20));
        }
    }
    
    // Check t_inbox_documents
    const docRef2 = doc(db, 'restaurants', 't_inbox_documents');
    const snap2 = await getDoc(docRef2);
    if (snap2.exists()) {
        const data2 = snap2.data();
        if (data2.data) console.log("t_inbox_documents length:", data2.data.length);
    }
    
    process.exit(0);
}
check();
