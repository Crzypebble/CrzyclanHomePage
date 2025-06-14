firebase.initializeApp({
  apiKey: "AIzaSyBITxQnQLRlKD6fBtGuPq922F7vIJGzhR8",
  authDomain: "crzyclansite.firebaseapp.com",
  projectId: "crzyclansite",
  storageBucket: "crzyclansite.firebasestorage.app",
  messagingSenderId: "534485925500",
  appId: "1:534485925500:web:56c7c798780e477e7e13f9"
});

const auth = firebase.auth();

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .catch(error => alert(error.message));
}

function logout() {
  auth.signOut();
}

auth.onAuthStateChanged(user => {
  updateAuthUI();
});

function updateAuthUI() {
  const authSection = document.getElementById('auth-section');
  const authStatus = document.getElementById('auth-status');
  if (auth.currentUser) {
    authSection.style.display = 'none';
    authStatus.textContent = `Signed in as: ${auth.currentUser.email}`;
  } else {
    authSection.style.display = 'block';
    authStatus.textContent = 'Not signed in.';
  }
}
