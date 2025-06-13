// Initialize Firebase App (make sure Firebase SDKs are included in HTML)
firebase.initializeApp({
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.appspot.com",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
});

const auth = firebase.auth();

function updateAuthStatus(user) {
  const status = document.getElementById('auth-status');
  if (user) {
    status.textContent = `Logged in as ${user.email}`;
  } else {
    status.textContent = 'Not logged in.';
  }
}

function signUp() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Sign up successful!"))
    .catch(error => alert(error.message));
}

function login() {
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Login successful!"))
    .catch(error => alert(error.message));
}

function logout() {
  auth.signOut()
    .then(() => alert("Logged out successfully!"))
    .catch(error => alert(error.message));
}

auth.onAuthStateChanged(updateAuthStatus);
