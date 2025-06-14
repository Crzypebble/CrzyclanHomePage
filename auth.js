// Firebase config (make sure this matches your actual config)
const firebaseConfig = {
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.appspot.com",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Auth Functions
window.signUp = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
};

window.login = function () {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
};

window.logout = function () {
  auth.signOut();
};

// UI Updates
auth.onAuthStateChanged(user => {
  updateUI(user);
});

function updateUI(user) {
  const emailInput = document.getElementById('email');
  const passwordInput = document.getElementById('password');
  const logoutBtn = document.getElementById('logoutBtn');
  const status = document.getElementById('auth-status');

  if (user) {
    emailInput.style.display = 'none';
    passwordInput.style.display = 'none';
    document.querySelectorAll('#auth-section button').forEach(btn => {
      if (btn.textContent !== 'Logout') btn.style.display = 'none';
    });
    logoutBtn.style.display = 'inline-block';
    status.textContent = `Signed in as ${user.email}`;
  } else {
    emailInput.style.display = 'inline-block';
    passwordInput.style.display = 'inline-block';
    document.querySelectorAll('#auth-section button').forEach(btn => {
      btn.style.display = 'inline-block';
    });
    logoutBtn.style.display = 'none';
    status.textContent = '';
  }
}
