import { initializeApp, getApps } from "firebase/app";
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

let app, db, auth;

if (typeof window !== "undefined" && !getApps().length) {
  app = initializeApp(firebaseConfig);
  db = getFirestore(app);
  auth = getAuth(app);
  signInAnonymously(auth);
}

export { db, auth };
