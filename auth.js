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
  const logoutBtn = document.getElementById("logout-btn");

  if (user) {
    status.textContent = `Logged in as: ${user.email}`;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    status.textContent = "";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
}

firebase.auth().onAuthStateChanged(updateAuthStatus);
