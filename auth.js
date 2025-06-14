// Firebase setup should already be in your HTML <head> before this script is loaded

// Sign Up
function signUp() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  firebase.auth().createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Sign-up successful!");
    })
    .catch((error) => {
      alert("Error signing up: " + error.message);
    });
}

// Login
function login() {
  const email = document.getElementById("email")?.value;
  const password = document.getElementById("password")?.value;
  if (!email || !password) {
    alert("Please enter email and password");
    return;
  }

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Logged in successfully!");
    })
    .catch((error) => {
      alert("Error logging in: " + error.message);
    });
}

// Logout
function logout() {
  firebase.auth().signOut()
    .then(() => {
      alert("Logged out successfully.");
    })
    .catch((error) => {
      alert("Error logging out: " + error.message);
    });
}

// Handle auth state changes
firebase.auth().onAuthStateChanged((user) => {
  const authSection = document.getElementById("auth-section");
  const authStatus = document.getElementById("auth-status");
  const logoutBtn = document.getElementById("logout-btn");

  if (user) {
    if (authSection) authSection.style.display = "none";
    if (authStatus) authStatus.textContent = `Signed in as: ${user.email}`;
    if (logoutBtn) logoutBtn.style.display = "inline-block";
  } else {
    if (authSection) authSection.style.display = "block";
    if (authStatus) authStatus.textContent = "Not signed in.";
    if (logoutBtn) logoutBtn.style.display = "none";
  }
});
