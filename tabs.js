function showTab(tabId) {
  document.querySelectorAll("main > section").forEach(section => {
    section.style.display = "none";
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = "block";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("nav a[data-tab]").forEach(link => {
    link.addEventListener("click", e => {
      e.preventDefault();
      const tabId = e.target.getAttribute("data-tab");
      showTab(tabId);
    });
  });

  // Show home tab by default
  showTab("home");
});
