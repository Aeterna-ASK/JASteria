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
    const docRef = doc(db, 'restaurants', 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
        const data = snap.data();
        console.log("menus exists:", !!data.menus);
        console.log("menus is array:", Array.isArray(data.menus));
        if (Array.isArray(data.menus)) {
            console.log("menus length:", data.menus.length);
        }
        
        console.log("ingredients exists:", !!data.ingredients);
        console.log("ingredients is array:", Array.isArray(data.ingredients));
        if (Array.isArray(data.ingredients)) {
            console.log("ingredients length:", data.ingredients.length);
        }
    } else {
        console.log("Document does not exist.");
    }
    process.exit(0);
}
check();
