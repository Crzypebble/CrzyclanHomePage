// Firebase App & Auth
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.firebasestorage.app",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

window.signUp = () => {
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  createUserWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      document.getElementById('auth-status').innerText = 'Sign up successful!';
    })
    .catch(error => {
      document.getElementById('auth-status').innerText = `Error: ${error.message}`;
    });
};

window.login = () => {
  const email = document.getElementById('email')?.value;
  const password = document.getElementById('password')?.value;

  signInWithEmailAndPassword(auth, email, password)
    .then(userCredential => {
      document.getElementById('auth-status').innerText = 'Login successful!';
    })
    .catch(error => {
      document.getElementById('auth-status').innerText = `Error: ${error.message}`;
    });
};

window.logout = () => {
  signOut(auth).then(() => {
    document.getElementById('auth-status').innerText = 'Logged out.';
  });
};

onAuthStateChanged(auth, user => {
  const status = document.getElementById('auth-status');
  if (user) {
    status.innerText = `Logged in as ${user.email}`;
  } else {
    status.innerText = 'Not logged in';
  }
});
