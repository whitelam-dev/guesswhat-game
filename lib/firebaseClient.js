import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, signInAnonymously } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyDP8vaVzQuHoNaIJdahgPI_JiAe8oqo8Io",
    authDomain: "guess-what-b78cb.firebaseapp.com",
    projectId: "guess-what-b78cb",
    storageBucket: "guess-what-b78cb.appspot.com",
    messagingSenderId: "345208721914",
    appId: "1:345208721914:web:cae2c9f2295eafaf605443",
    measurementId: "G-5M669S2510"
};

// Initialize Firebase app safely (server & client)
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

// Anonymous sign-in should only run in the browser
if (typeof window !== "undefined") {
    signInAnonymously(auth).catch(console.error);
}

export { db, auth };
