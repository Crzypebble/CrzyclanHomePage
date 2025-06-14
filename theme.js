function applyTheme(theme) {
  const root = document.documentElement;
  const body = document.body;
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");
  const navLinks = document.querySelectorAll("nav a");

  if (theme === "red-mist") {
    root.style.setProperty("--bg-color", "#0a0a0a");
    root.style.setProperty("--text-color", "#e6e6e6");
    root.style.setProperty("--accent-color", "crimson");
    body.style.backgroundColor = "#0a0a0a";
    header.style.backgroundColor = "#111";
    footer.style.backgroundColor = "#111";
    navLinks.forEach(link => (link.style.color = "#ccc"));
  } else if (theme === "black-white") {
    root.style.setProperty("--bg-color", "#ffffff");
    root.style.setProperty("--text-color", "#000000");
    root.style.setProperty("--accent-color", "#333333");
    body.style.backgroundColor = "#ffffff";
    header.style.backgroundColor = "#000000";
    footer.style.backgroundColor = "#000000";
    navLinks.forEach(link => (link.style.color = "#ffffff"));
  }

  localStorage.setItem("selectedTheme", theme);
}

function setCustomBackground(file) {
  const reader = new FileReader();
  reader.onload = function (e) {
    document.body.style.backgroundImage = `url(${e.target.result})`;
    document.body.style.backgroundSize = "cover";
    localStorage.setItem("customBackground", e.target.result);
  };
  reader.readAsDataURL(file);
}

function clearCustomBackground() {
  document.body.style.backgroundImage = "none";
  localStorage.removeItem("customBackground");
}

document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("theme-select");
  const bgInput = document.getElementById("custom-bg");
  const clearBtn = document.getElementById("clear-bg");

  const savedTheme = localStorage.getItem("selectedTheme");
  const savedBg = localStorage.getItem("customBackground");

  if (savedTheme) applyTheme(savedTheme);
  if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
    document.body.style.backgroundSize = "cover";
  }

  if (themeSelect) {
    themeSelect.addEventListener("change", (e) => {
      applyTheme(e.target.value);
    });
  }

  if (bgInput) {
    bgInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) setCustomBackground(file);
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", clearCustomBackground);
  }
});
