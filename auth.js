// auth.js
function signUp() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => updateAuthStatus())
    .catch(error => alert(error.message));
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => updateAuthStatus())
    .catch(error => alert(error.message));
}

function logout() {
  firebase.auth().signOut()
    .then(() => updateAuthStatus())
    .catch(error => alert(error.message));
}

function updateAuthStatus() {
  const user = firebase.auth().currentUser;
  const status = document.getElementById("auth-status");

  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const signUpBtn = document.querySelector("button[onclick='signUp()']");
  const loginBtn = document.querySelector("button[onclick='login()']");
  const logoutBtn = document.getElementById("logout-btn");

  const changeEmailBtn = document.getElementById("change-email-button");
  const changePasswordBtn = document.getElementById("change-password-button");
  const resetPasswordBtn = document.getElementById("reset-password-button");

  if (user) {
    status.textContent = `Logged in as: ${user.email}`;
    emailInput.style.display = "none";
    passwordInput.style.display = "none";
    signUpBtn.style.display = "none";
    loginBtn.style.display = "none";
    logoutBtn.style.display = "inline-block";

    changeEmailBtn.style.display = "inline-block";
    changePasswordBtn.style.display = "inline-block";
    resetPasswordBtn.style.display = "inline-block";
  } else {
    status.textContent = "";
    emailInput.style.display = "inline-block";
    passwordInput.style.display = "inline-block";
    signUpBtn.style.display = "inline-block";
    loginBtn.style.display = "inline-block";
    logoutBtn.style.display = "none";

    changeEmailBtn.style.display = "none";
    changePasswordBtn.style.display = "none";
    resetPasswordBtn.style.display = "none";
  }
}

firebase.auth().onAuthStateChanged(updateAuthStatus);
