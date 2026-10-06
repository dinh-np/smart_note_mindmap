import { initializeApp, getApps, getApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyDvVpIBzojM-Am3i4amtz9iPIkwDNg4xbs",
  authDomain: "smartmindmappm.firebaseapp.com",
  projectId: "smartmindmappm",
  storageBucket: "smartmindmappm.firebasestorage.app",
  messagingSenderId: "592654875499",
  appId: "1:592654875499:web:750029b29d71783a66ea2e",
  measurementId: "G-E123FGWDGP",
  databaseURL: "https://smartmindmappm-default-rtdb.firebaseio.com"
};

// Initialize Firebase securely to prevent double initialization in React Strict Mode
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const dbRef = getDatabase(app);

export { app, dbRef };
