function updateAuthUI(user) {
  const authSection = document.getElementById("auth-section");
  const authStatus = document.getElementById("auth-status");
  const logoutBtn = document.getElementById("logout-btn");

  if (user) {
    authSection.style.display = "none";
    authStatus.textContent = `Signed in as: ${user.email}`;
    logoutBtn.style.display = "inline-block";
  } else {
    authSection.style.display = "block";
    authStatus.textContent = "Not signed in.";
    logoutBtn.style.display = "none";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", logout);
  }
});
