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

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      document.getElementById("userEmail").textContent = user.email;
      document.getElementById("loginForm").style.display = "none";
      document.getElementById("logoutSection").style.display = "block";
    })
    .catch((error) => {
      alert("Login failed: " + error.message);
    });
}

function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then((userCredential) => {
      alert("Account created! You can now log in.");
      showLogin();
    })
    .catch((error) => {
      alert("Sign-up failed: " + error.message);
    });
}

function logout() {
  auth.signOut().then(() => {
    document.getElementById("logoutSection").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  });
}

auth.onAuthStateChanged((user) => {
  if (user) {
    document.getElementById("userEmail").textContent = user.email;
    document.getElementById("loginForm").style.display = "none";
    document.getElementById("signupForm").style.display = "none";
    document.getElementById("logoutSection").style.display = "block";
  } else {
    document.getElementById("logoutSection").style.display = "none";
    document.getElementById("loginForm").style.display = "block";
  }
});

function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

function showLogin() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}
