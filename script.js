// Tab navigation logic
function showTab(tabId) {
  const sections = document.querySelectorAll("section");
  sections.forEach((section) => {
    section.style.display = "none";
  });

  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = "block";
  }

  // Reapply background after switching tabs
  const customBg = localStorage.getItem("customBackground");
  if (customBg) {
    document.body.style.backgroundImage = `url(${customBg})`;
  }
}

// Save settings button logic
document.addEventListener("DOMContentLoaded", () => {
  showTab("home"); // Show home by default

  const bgUpload = document.getElementById("bgUpload");
  const saveBtn = document.getElementById("saveSettingsBtn");

  if (bgUpload && saveBtn) {
    saveBtn.addEventListener("click", () => {
      const file = bgUpload.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          const imageUrl = reader.result;
          localStorage.setItem("customBackground", imageUrl);
          document.body.style.backgroundImage = `url(${imageUrl})`;
        };
        reader.readAsDataURL(file);
      } else {
        localStorage.removeItem("customBackground");
        document.body.style.backgroundImage = "none";
      }

      // Save theme selection
      const theme = document.getElementById("themeSelect").value;
      localStorage.setItem("selectedTheme", theme);
      applyTheme(theme);
    });

    // Theme dropdown change
    document.getElementById("themeSelect").addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });

    // Reapply saved theme and bg
    const savedTheme = localStorage.getItem("selectedTheme");
    if (savedTheme) {
      document.getElementById("themeSelect").value = savedTheme;
      applyTheme(savedTheme);
    }

    const savedBg = localStorage.getItem("customBackground");
    if (savedBg) {
      document.body.style.backgroundImage = `url(${savedBg})`;
    }
  }
});
