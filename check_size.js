import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

// Mock some large data
const largeString = "A".repeat(1.5 * 1024 * 1024); // 1.5MB

async function testLargeData() {
    try {
        const docRef = doc(db, 'restaurants', 'test_size');
        await setDoc(docRef, { data: largeString });
        console.log("Success");
    } catch (e) {
        console.error("Error:", e.message);
    }
    process.exit(0);
}
testLargeData();
