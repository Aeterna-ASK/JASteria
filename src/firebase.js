import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// organiclog (organiclog-2f6c7) の Firebase 接続構成
const firebaseConfig = {
  apiKey: "AIzaSyDtW1Xrpf_jcDKd12IyB88AjiVDRe7e0SE",
  authDomain: "organiclog-2f6c7.firebaseapp.com",
  projectId: "organiclog-2f6c7",
  storageBucket: "organiclog-2f6c7.firebasestorage.app",
  messagingSenderId: "267681135810",
  appId: "1:267681135810:web:5e62b67eb2d4145a4b8f5b",
  measurementId: "G-2XPB55PB0H"
};

// 重複初期化防止
const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
