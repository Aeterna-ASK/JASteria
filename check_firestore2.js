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
    const cols = ['menus', 'ingredients', 'receipts'];
    for (const c of cols) {
        const docRef = doc(db, 'restaurants', c);
        const snap = await getDoc(docRef);
        console.log(`--- ${c} ---`);
        if (snap.exists()) {
            const data = snap.data();
            console.log("has data:", !!data.data);
            if (data.data) {
               console.log("is array:", Array.isArray(data.data));
               if (Array.isArray(data.data)) console.log("length:", data.data.length);
            }
        } else {
            console.log("Not exists");
        }
    }
    process.exit(0);
}
check();
