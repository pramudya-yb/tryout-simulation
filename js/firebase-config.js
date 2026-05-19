// firebase-config.js
// Firebase Web App configuration for Belajar Tryout Gratis

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-app.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.13.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBP7YCoej_tJ2ZbbTZYuUfNrq19yp2LgwE",
  authDomain: "test-123-c4413.firebaseapp.com",
  projectId: "test-123-c4413",
  storageBucket: "test-123-c4413.firebasestorage.app",
  messagingSenderId: "847186336081",
  appId: "1:847186336081:web:e5fd352be7fd8e9e425b70",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
