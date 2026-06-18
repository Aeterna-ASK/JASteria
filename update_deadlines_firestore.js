import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';

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

const parseDateString = (dateStr) => {
  if (!dateStr) return null;
  let d = new Date(dateStr);
  if (!isNaN(d.getTime())) return d;
  
  const reiwaMatch = dateStr.match(/令和(\d+|元)年(\d+)月(\d+)日/);
  if (reiwaMatch) {
    const yearStr = reiwaMatch[1];
    const year = yearStr === '元' ? 2019 : 2018 + parseInt(yearStr, 10);
    const month = parseInt(reiwaMatch[2], 10) - 1;
    const day = parseInt(reiwaMatch[3], 10);
    return new Date(year, month, day);
  }
  return null;
};

const formatWareki = (d) => {
    const y = d.getFullYear();
    const m = d.getMonth() + 1;
    const day = d.getDate();
    let reiwa = y - 2018;
    let rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
    return rStr + m + '月' + day + '日';
};

async function update() {
    const docRef = doc(db, 'restaurants', 'default');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        console.log('No data');
        return;
    }
    const data = snap.data();
    if (!data.menus) {
        console.log('No menus');
        return;
    }
    
    let updated = false;
    for (const m of data.menus) {
        if (m.deadline === '一年間') {
            const startD = parseDateString(m.startDate);
            if (startD) {
                startD.setFullYear(startD.getFullYear() + 1);
                const newDeadline = formatWareki(startD);
                console.log('Updating menu ' + m.name + ': 一年間 -> ' + newDeadline);
                m.deadline = newDeadline;
                updated = true;
            } else {
                console.log('Could not parse startDate for menu ' + m.name + ': ' + m.startDate);
            }
        }
    }
    
    if (updated) {
        await updateDoc(docRef, { menus: data.menus });
        console.log('Successfully updated Firestore deadlines!');
    } else {
        console.log('No menus needed updating.');
    }
    process.exit(0);
}

update();
