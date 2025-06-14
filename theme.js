function applyTheme(theme) {
  const root = document.documentElement;
  const header = document.querySelector("header");

  if (theme === "redmist") {
    root.style.setProperty("--bg-color", "#0a0a0a");
    root.style.setProperty("--text-color", "#e6e6e6");
    header.style.backgroundColor = "#111";
    header.style.color = "crimson";
  } else if (theme === "blackwhite") {
    root.style.setProperty("--bg-color", "#ffffff");
    root.style.setProperty("--text-color", "#000000");
    header.style.backgroundColor = "#ddd";
    header.style.color = "#000";
  }

  localStorage.setItem("selectedTheme", theme);
}

document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("selectedTheme");
  if (savedTheme) {
    applyTheme(savedTheme);
    document.querySelectorAll('input[name="theme"]').forEach(radio => {
      if (radio.value === savedTheme) {
        radio.checked = true;
      }
    });
  }

  document.querySelectorAll('input[name="theme"]').forEach(radio => {
    radio.addEventListener("change", e => {
      applyTheme(e.target.value);
    });
  });
});
