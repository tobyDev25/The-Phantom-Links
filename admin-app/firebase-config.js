import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDVo7ExBshoVqlblXnFqnAJUFlgDYlkc9I",
  authDomain: "the-phantom-links.firebaseapp.com",
  projectId: "the-phantom-links",
  storageBucket: "the-phantom-links.firebasestorage.app",
  messagingSenderId: "1057641344546",
  appId: "1:1057641344546:web:8bd8080a1da9e2e40a647b"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);