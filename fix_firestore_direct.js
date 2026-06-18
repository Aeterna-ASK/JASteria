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

const ids1Year = [
  'menu-nukaduke-2', 'menu-orgcourse-1', 'menu-orgcourse-2', 
  'menu-salad-0', 'menu-blueberry-1', 'menu-potage-1', 
  'menu-salsa-0', 'menu-kurozu-defg', 'menu-kurozu-steak', 
  'menu-kurozu-maguro', 'menu-coffee-1'
];
const ids3Months = ['menu-coffee-0'];

async function run() {
    const docRef = doc(db, 'restaurants', 'menus');
    const snap = await getDoc(docRef);
    if (!snap.exists()) {
        console.log('No menus doc');
        process.exit(0);
    }
    const data = snap.data().data;
    if (!data || !Array.isArray(data)) {
        console.log('No data array');
        process.exit(0);
    }
    
    let updated = false;
    for (let m of data) {
        if (ids1Year.includes(m.id) && (!m.deadline || m.deadline === '' || m.deadline === '一年間' || m.deadline === '1年間' || m.deadline === '1年')) {
            const d = parseDateString(m.startDate);
            if (d && !isNaN(d.getTime())) {
                d.setFullYear(d.getFullYear() + 1);
                const y = d.getFullYear();
                const reiwa = y - 2018;
                const rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
                m.deadline = rStr + (d.getMonth() + 1) + '月' + d.getDate() + '日';
                updated = true;
                console.log('Fixed 1 year for', m.name, '->', m.deadline);
            }
        }
        if (ids3Months.includes(m.id) && (!m.deadline || m.deadline === '' || m.deadline === '3か月' || m.deadline === '3ヶ月')) {
            const d = parseDateString(m.startDate);
            if (d && !isNaN(d.getTime())) {
                d.setMonth(d.getMonth() + 3);
                const y = d.getFullYear();
                const reiwa = y - 2018;
                const rStr = reiwa === 1 ? '令和元年' : '令和' + reiwa + '年';
                m.deadline = rStr + (d.getMonth() + 1) + '月' + d.getDate() + '日';
                updated = true;
                console.log('Fixed 3 months for', m.name, '->', m.deadline);
            }
        }
    }
    
    if (updated) {
        await updateDoc(docRef, { data: data });
        console.log('Updated Firestore directly!');
    } else {
        console.log('No menus needed fixing');
    }
    process.exit(0);
}

run();
