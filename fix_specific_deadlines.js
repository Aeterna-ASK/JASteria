import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import fs from 'fs';

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

// Extracted from restore_data.js
const idsToUpdate1Year = [
  'menu-orgcourse-2',
  'menu-nukaduke-2',
  // wait, I don't know the IDs off the top of my head! I should regex it.
];

async function run() {
    const content = fs.readFileSync('c:/Users/dai72/OneDrive/デスクトップ/WebApp/JASAGRI_RESTAURANT/restaurant/restore_data.js', 'utf8');
    const menus = [];
    let currentId = null;
    const lines = content.split('\\n');
    for (let l of lines) {
        let m = l.match(/id:\s*'([^']+)'/);
        if (m) currentId = m[1];
        if (l.includes("deadline: '一年間'") || l.includes('deadline: "一年間"')) {
            if (currentId) menus.push({ id: currentId, type: '1year' });
        }
        if (l.includes("deadline: '3か月'") || l.includes('deadline: "3か月"')) {
            if (currentId) menus.push({ id: currentId, type: '3months' });
        }
    }
    
    console.log('Target menus from restore_data:', menus);

    // Now fetch from firestore chunk 1 to 5
    let updatedAny = false;
    for (let i = 1; i <= 5; i++) {
        const docRef = doc(db, 'restaurants', 'default', 'collections', 'menus_chunk_' + i);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            const data = snap.data();
            let chunkUpdated = false;
            for (const menu of data.items) {
                const target = menus.find(x => x.id === menu.id);
                if (target) {
                    const startD = parseDateString(menu.startDate);
                    if (startD) {
                        if (target.type === '1year') {
                            startD.setFullYear(startD.getFullYear() + 1);
                        } else if (target.type === '3months') {
                            startD.setMonth(startD.getMonth() + 3);
                        }
                        const newDeadline = formatWareki(startD);
                        console.log('Updating menu ' + menu.name + ' (' + target.type + '): -> ' + newDeadline);
                        menu.deadline = newDeadline;
                        chunkUpdated = true;
                        updatedAny = true;
                    }
                }
            }
            if (chunkUpdated) {
                await updateDoc(docRef, { items: data.items });
                console.log('Updated chunk ' + i);
            }
        }
    }
    console.log(updatedAny ? 'Done updating Firestore!' : 'No menus needed updates.');
    process.exit(0);
}

run();
