import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyBuOstFD6-UoZlqzWtnHGmmaNCLpXlq3us",
  authDomain: "whatsapp-widget-admin.firebaseapp.com",
  projectId: "whatsapp-widget-admin",
  storageBucket: "whatsapp-widget-admin.firebasestorage.app",
  messagingSenderId: "293950188828",
  appId: "1:293950188828:web:43ccd14c23490cff629ed9"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
