document.addEventListener("DOMContentLoaded", () => {
  const themeSelect = document.getElementById("theme-select");
  const bgInput = document.getElementById("bg-input");
  const clearBgBtn = document.getElementById("clear-bg-btn");

  // Apply theme
  function applyTheme(theme) {
    document.body.classList.remove("red-mist", "black-white");
    if (theme) {
      document.body.classList.add(theme);
    }

    const header = document.querySelector("header");
    const nav = document.querySelector("nav");

    if (theme === "red-mist") {
      header.style.backgroundColor = "#8B0000";
      nav.style.backgroundColor = "#8B0000";
      document.body.style.color = "#fff";
    } else if (theme === "black-white") {
      header.style.backgroundColor = "#000";
      nav.style.backgroundColor = "#000";
      document.body.style.color = "#fff";
    } else {
      header.style.backgroundColor = "";
      nav.style.backgroundColor = "";
      document.body.style.color = "";
    }
  }

  // Load stored settings
  const savedTheme = localStorage.getItem("selectedTheme");
  const savedBg = localStorage.getItem("customBg");

  if (savedTheme) {
    themeSelect.value = savedTheme;
    applyTheme(savedTheme);
  }

  if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
  }

  // Event listeners
  if (themeSelect) {
    themeSelect.addEventListener("change", () => {
      const selectedTheme = themeSelect.value;
      localStorage.setItem("selectedTheme", selectedTheme);
      applyTheme(selectedTheme);
    });
  }

  if (bgInput) {
    bgInput.addEventListener("change", () => {
      const file = bgInput.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          const imageUrl = e.target.result;
          document.body.style.backgroundImage = `url(${imageUrl})`;
          localStorage.setItem("customBg", imageUrl);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (clearBgBtn) {
    clearBgBtn.addEventListener("click", () => {
      localStorage.removeItem("customBg");
      document.body.style.backgroundImage = "";
      if (bgInput) {
        bgInput.value = "";
      }
    });
  }
});
