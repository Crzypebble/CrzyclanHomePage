// auth.js

const auth = firebase.auth();

function login() {
  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(userCredential => {
      updateAuthUI(userCredential.user);
    })
    .catch(error => {
      alert("Login Failed: " + error.message);
    });
}

function signup() {
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(userCredential => {
      updateAuthUI(userCredential.user);
    })
    .catch(error => {
      alert("Signup Failed: " + error.message);
    });
}

function logout() {
  auth.signOut().then(() => {
    updateAuthUI(null);
  });
}

function updateAuthUI(user) {
  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");
  const logoutSection = document.getElementById("logoutSection");

  if (user) {
    loginForm.style.display = "none";
    signupForm.style.display = "none";
    logoutSection.style.display = "block";
    document.getElementById("userEmail").textContent = user.email;
  } else {
    loginForm.style.display = "block";
    signupForm.style.display = "none";
    logoutSection.style.display = "none";
  }
}

function showSignup() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("signupForm").style.display = "block";
}

function showLogin() {
  document.getElementById("signupForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// Listen for auth state changes
auth.onAuthStateChanged(user => {
  updateAuthUI(user);
});
