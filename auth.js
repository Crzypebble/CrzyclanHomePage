// js/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app-compat.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-auth-compat.js";

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

window.login = function () {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;
  signInWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Logged in!");
    })
    .catch(error => alert(error.message));
};

window.signup = function () {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;
  createUserWithEmailAndPassword(auth, email, password)
    .then(() => {
      alert("Account created!");
    })
    .catch(error => alert(error.message));
};

window.logout = function () {
  signOut(auth).then(() => {
    alert("Logged out!");
  });
};

onAuthStateChanged(auth, user => {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const logoutSection = document.getElementById("logoutSection");
  const userEmail = document.getElementById("userEmail");

  if (user) {
    loginForm.style.display = "none";
    signupForm.style.display = "none";
    logoutSection.style.display = "block";
    userEmail.textContent = user.email;
  } else {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    logoutSection.style.display = "none";
  }
});

window.showSignup = function () {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
};

window.showLogin = function () {
  document.getElementById("loginForm").style.display = "block";
  document.getElementById("signupForm").style.display = "none";
};
