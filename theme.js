// Apply theme styles
function applyTheme(theme) {
  const body = document.body;
  const header = document.querySelector("header");
  const navLinks = document.querySelectorAll("nav a");
  const h1 = document.querySelector("header h1");
  const p = document.querySelector("header p");

  if (theme === "Red Mist") {
    body.style.backgroundColor = "#1a0000";
    body.style.color = "#ff4444";
    header.style.backgroundColor = "#330000";
    h1.style.color = "#ff4444";
    p.style.color = "#ff9999";
    navLinks.forEach(link => link.style.color = "#ff6666");
  } else if (theme === "Black & White") {
    body.style.backgroundColor = "#fff";
    body.style.color = "#000";
    header.style.backgroundColor = "#eee";
    h1.style.color = "#000";
    p.style.color = "#444";
    navLinks.forEach(link => link.style.color = "#111");
  } else {
    // Default
    body.style.backgroundColor = "";
    body.style.color = "";
    header.style.backgroundColor = "";
    h1.style.color = "";
    p.style.color = "";
    navLinks.forEach(link => link.style.color = "");
  }
}

// Save settings to localStorage
function saveSettings() {
  const theme = document.getElementById("themeSelect").value;
  const bgUpload = document.getElementById("bgUpload").files[0];

  localStorage.setItem("selectedTheme", theme);
  applyTheme(theme);

  if (bgUpload) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const imageUrl = e.target.result;
      document.body.style.backgroundImage = `url('${imageUrl}')`;
      localStorage.setItem("customBackground", imageUrl);
    };
    reader.readAsDataURL(bgUpload);
  }
}

// Clear custom background image
function clearBackground() {
  localStorage.removeItem("customBackground");
  document.body.style.backgroundImage = "";
}

// Load saved theme and background on page load
window.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("selectedTheme");
  const savedBackground = localStorage.getItem("customBackground");

  if (savedTheme) {
    document.getElementById("themeSelect").value = savedTheme;
    applyTheme(savedTheme);
  }

  if (savedBackground) {
    document.body.style.backgroundImage = `url('${savedBackground}')`;
  }
});
