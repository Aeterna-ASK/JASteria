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

async function fixOrganicClaim() {
  console.log('Fetching menus...');
  const docRef = doc(db, 'restaurants', 'menus');
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    const data = docSnap.data();
    if (data && data.data && Array.isArray(data.data)) {
      let updatedCount = 0;
      data.data.forEach(menu => {
        if (!menu.isOrganicClaim) {
          menu.isOrganicClaim = true;
          updatedCount++;
        }
      });
      
      if (updatedCount > 0) {
        console.log(`Updating ${updatedCount} menus to isOrganicClaim = true...`);
        await setDoc(docRef, { data: data.data });
        console.log('Update successful!');
      } else {
        console.log('All menus are already organic claim.');
      }
    }
  } else {
    console.log('Menus document not found!');
  }
  process.exit(0);
}

fixOrganicClaim().catch(e => {
  console.error('Error:', e);
  process.exit(1);
});
