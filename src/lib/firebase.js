import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Replace these with your Firebase project config before deployment
const firebaseConfig = {
  apiKey: "AIzaSyB3niYB96n9KolpBLmeeZUZxN2CUb1WwqA",
  authDomain: "my-first-app-a15e5.firebaseapp.com",
  projectId: "my-first-app-a15e5",
  storageBucket: "my-first-app-a15e5.firebasestorage.app",
  messagingSenderId: "934148781749",
  appId: "1:934148781749:web:9fec7fa6b21d2bb83e30fc"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
