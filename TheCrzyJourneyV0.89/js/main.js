// js/main.js
// Global setting hook for Nightmare modes
window.GAME_SETTINGS = { nightmareOneLife: false, nightmareTimer: false };

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

  // 2. Inject Nightmare Toggles Dynamically onto Main Menu
  const mainMenu = document.getElementById("main-menu");
  if (mainMenu) {
      const nightmareUI = document.createElement("div");
      nightmareUI.style.cssText = "margin: 20px auto; padding: 15px; border: 2px solid #ff3333; background: #220000; color: #ff3333; width: max-content; text-align: left;";
      nightmareUI.innerHTML = `
          <h3 style="margin-top:0;">Nightmare Modifiers</h3>
          <label style="display:block; cursor:pointer;"><input type="checkbox" id="nm-onelife"> One-Life Challenge</label>
          <label style="display:block; cursor:pointer; margin-top:5px;"><input type="checkbox" id="nm-timer"> 60-Second Time Attack</label>
      `;
      mainMenu.appendChild(nightmareUI);

      document.getElementById("nm-onelife").addEventListener("change", (e) => {
          window.GAME_SETTINGS.nightmareOneLife = e.target.checked;
      });
      document.getElementById("nm-timer").addEventListener("change", (e) => {
          window.GAME_SETTINGS.nightmareTimer = e.target.checked;
      });
  }

  // 3. Handle Disclaimer Accept Button
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

  // 4. Handle all other menu navigation tabs
  document.addEventListener("click", e => {
    const tab = e.target.closest(".menu-tab");
    if (!tab) return;

    const target = tab.dataset.target;
    if (target) showSection(target);
  });
});
