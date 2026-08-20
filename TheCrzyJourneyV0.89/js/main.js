// js/main.js
document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".menu-section");
  const menuMusic = document.getElementById("menu-music");

  function showSection(id) {
    sections.forEach(section => {
      section.style.display = section.id === id ? "block" : "none";
    });
  }

  // 1. Initial State: Show Disclaimer
  showSection("disclaimer-screen");

  // 2. Handle Disclaimer Accept Button
  const acceptBtn = document.getElementById("accept-btn");
  if (acceptBtn) {
    acceptBtn.addEventListener("click", () => {
      
      // Play background music now that the browser has a click interaction
      if (menuMusic) {
        menuMusic.volume = 0.5; // Set default volume to 50%
        menuMusic.play().catch(e => console.log("Audio block error:", e));
      }

      // Add class to body to load LoafImage.webp
      document.body.classList.add("show-bg");

      // Switch view to main menu
      showSection("main-menu");
    });
  }

  // 3. Handle all other menu navigation tabs
  document.addEventListener("click", e => {
    const tab = e.target.closest(".menu-tab");
    if (!tab) return;

    const target = tab.dataset.target;
    if (target) showSection(target);
  });
});