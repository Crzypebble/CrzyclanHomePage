// auth.js

firebase.auth().onAuthStateChanged((user) => {
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const signInBtn = document.getElementById("sign-in-button");
  const signUpBtn = document.getElementById("sign-up-button");
  const logoutBtn = document.getElementById("logout-button");

  if (user) {
    // Hide login form
    if (emailInput) emailInput.style.display = "none";
    if (passwordInput) passwordInput.style.display = "none";
    if (signInBtn) signInBtn.style.display = "none";
    if (signUpBtn) signUpBtn.style.display = "none";
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    // Show login form
    if (emailInput) emailInput.style.display = "block";
    if (passwordInput) passwordInput.style.display = "block";
    if (signInBtn) signInBtn.style.display = "inline-block";
    if (signUpBtn) signUpBtn.style.display = "inline-block";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .catch((error) => alert("Login error: " + error.message));
}

function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .catch((error) => alert("Sign up error: " + error.message));
}
