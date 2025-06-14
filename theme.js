document.addEventListener("DOMContentLoaded", () => {
  const savedTheme = localStorage.getItem("selectedTheme");

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

  if (savedTheme) {
    applyTheme(savedTheme);
  }
});
