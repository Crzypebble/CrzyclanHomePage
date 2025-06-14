document.addEventListener("DOMContentLoaded", () => {
  const authSection = document.getElementById("auth-section");
  const authStatus = document.getElementById("auth-status");
  const logoutBtn = document.getElementById("logout-btn");
  const emailInput = document.getElementById("email");
  const passwordInput = document.getElementById("password");
  const loginBtn = document.getElementById("login-btn");
  const signupBtn = document.getElementById("signup-btn");

  function updateUIForUser(user) {
    if (user) {
      authStatus.textContent = `Logged in as: ${user.email}`;
      if (authSection) authSection.style.display = "none";
      if (logoutBtn) logoutBtn.style.display = "block";
    } else {
      authStatus.textContent = "";
      if (authSection) authSection.style.display = "block";
      if (logoutBtn) logoutBtn.style.display = "none";
    }
  }

  // Show logout button on load if already signed in
  firebase.auth().onAuthStateChanged((user) => {
    updateUIForUser(user);
  });

  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      firebase.auth().signOut().then(() => {
        updateUIForUser(null);
      });
    });
  }

  if (loginBtn) {
    loginBtn.addEventListener("click", () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredential) => {
          updateUIForUser(userCredential.user);
        })
        .catch((error) => {
          authStatus.textContent = error.message;
        });
    });
  }

  if (signupBtn) {
    signupBtn.addEventListener("click", () => {
      const email = emailInput.value.trim();
      const password = passwordInput.value.trim();
      firebase.auth().createUserWithEmailAndPassword(email, password)
        .then((userCredential) => {
          updateUIForUser(userCredential.user);
        })
        .catch((error) => {
          authStatus.textContent = error.message;
        });
    });
  }
});
