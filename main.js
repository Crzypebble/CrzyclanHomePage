document.addEventListener("DOMContentLoaded", () => {
  const defaultTab = document.getElementById("home");
  if (defaultTab) {
    defaultTab.style.display = "block";
  }

  const customBg = localStorage.getItem("customBackground");
  if (customBg) {
    document.body.style.backgroundImage = `url('${customBg}')`;
  }

  const savedTheme = localStorage.getItem("selectedTheme");
  if (savedTheme) {
    applyTheme(savedTheme);
  }
});
