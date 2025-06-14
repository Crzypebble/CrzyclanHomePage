// Firebase Setup
const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.appspot.com",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Authentication Functions
function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => updateUI(auth.currentUser))
    .catch(err => alert(err.message));
}

function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => updateUI(auth.currentUser))
    .catch(err => alert(err.message));
}

function logout() {
  auth.signOut().then(() => updateUI(null));
}

function updateUI(user) {
  const status = document.getElementById('auth-status');
  const emailInput = document.getElementById('email');
  const passInput = document.getElementById('password');
  const logoutBtn = document.getElementById('logout-btn');

  if (user) {
    status.textContent = `Signed in as: ${user.email}`;
    emailInput.style.display = 'none';
    passInput.style.display = 'none';
    logoutBtn.style.display = 'inline-block';
  } else {
    status.textContent = 'Not signed in';
    emailInput.style.display = 'block';
    passInput.style.display = 'block';
    logoutBtn.style.display = 'none';
  }
}

// Auto update on login state change
auth.onAuthStateChanged(updateUI);
