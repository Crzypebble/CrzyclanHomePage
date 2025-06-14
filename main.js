document.addEventListener("DOMContentLoaded", () => {
  // Show home tab by default
  const defaultTab = document.getElementById("home");
  if (defaultTab) defaultTab.style.display = "block";

  // Hide logout button initially
  const logoutBtn = document.getElementById("logout-btn");
  if (logoutBtn) logoutBtn.style.display = "none";
});
