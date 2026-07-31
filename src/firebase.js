import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";
const firebaseConfig = {
  apiKey: "AIzaSyC7NvuxpLtsNkH40S07-pPa2LHmlMxKlUw",
  authDomain: "rboard-f06b0.firebaseapp.com",
  projectId: "rboard-f06b0",
  storageBucket: "rboard-f06b0.firebasestorage.app",
  messagingSenderId: "763581356708",
  appId: "1:763581356708:web:f5b8fca10f6fb604956431"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(
    app,
    "europe-west1"
);
