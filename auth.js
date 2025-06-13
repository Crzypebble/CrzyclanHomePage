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

// Auth state changes
auth.onAuthStateChanged(user => {
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

// Login
function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("auth-status").textContent = "Logged in successfully.";
    })
    .catch(error => {
      document.getElementById("auth-status").textContent = error.message;
    });
}

// Signup
function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      document.getElementById("auth-status").textContent = "Account created successfully.";
    })
    .catch(error => {
      document.getElementById("auth-status").textContent = error.message;
    });
}

// Logout
function logout() {
  auth.signOut()
    .then(() => {
      document.getElementById("auth-status").textContent = "Logged out.";
    })
    .catch(error => {
      document.getElementById("auth-status").textContent = error.message;
    });
}

// Switch to Signup form
function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

// Switch to Login form
function showLogin() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}
