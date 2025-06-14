// Initialize Firebase
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

function signUp() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  auth.createUserWithEmailAndPassword(email, password)
    .then(() => alert("Signed up successfully."))
    .catch(error => alert(error.message));
}

function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  auth.signInWithEmailAndPassword(email, password)
    .then(() => alert("Logged in."))
    .catch(error => alert(error.message));
}

function logout() {
  auth.signOut().then(() => alert("Logged out."));
}

// Auth state listener
auth.onAuthStateChanged(user => {
  const authSection = document.getElementById("auth-section");
  const authStatus = document.getElementById("auth-status");
  if (user) {
    authSection.style.display = "none";
    authStatus.textContent = `Logged in as: ${user.email}`;
  } else {
    authSection.style.display = "block";
    authStatus.textContent = "";
  }
});
