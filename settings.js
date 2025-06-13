// settings.js

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.firebasestorage.app",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// DOM references
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const authStatus = document.getElementById('auth-status');

// Auth functions
function signUp() {
  const email = emailInput.value;
  const password = passwordInput.value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      authStatus.textContent = `Signed up as ${userCredential.user.email}`;
    })
    .catch(error => {
      authStatus.textContent = `Error: ${error.message}`;
    });
}

function login() {
  const email = emailInput.value;
  const password = passwordInput.value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      authStatus.textContent = `Logged in as ${userCredential.user.email}`;
    })
    .catch(error => {
      authStatus.textContent = `Error: ${error.message}`;
    });
}

function logout() {
  auth.signOut()
    .then(() => {
      authStatus.textContent = 'Logged out.';
    })
    .catch(error => {
      authStatus.textContent = `Error: ${error.message}`;
    });
}

// Track auth status
auth.onAuthStateChanged(user => {
  if (user) {
    authStatus.textContent = `Logged in as ${user.email}`;
  } else {
    authStatus.textContent = 'Not logged in.';
  }
});

// Expose to global scope
window.signUp = signUp;
window.login = login;
window.logout = logout;
