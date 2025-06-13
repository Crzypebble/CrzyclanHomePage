// js/themes.js
window.applyTheme = function () {
  const theme = localStorage.getItem("theme") || "Default";
  const body = document.body;
  const header = document.querySelector("header");
  const footer = document.querySelector("footer");

  if (theme === "Red Mist") {
    body.style.backgroundColor = "#1a0000";
    body.style.color = "#ffcccc";
    header.style.backgroundColor = "#330000";
    footer.style.backgroundColor = "#330000";
  } else if (theme === "Black & White") {
    body.style.backgroundColor = "#fff";
    body.style.color = "#000";
    header.style.backgroundColor = "#f0f0f0";
    footer.style.backgroundColor = "#f0f0f0";
  } else {
    body.style.backgroundColor = "#0a0a0a";
    body.style.color = "#e6e6e6";
    header.style.backgroundColor = "#111";
    footer.style.backgroundColor = "#111";
  }
};

document.addEventListener("DOMContentLoaded", () => {
  applyTheme();

  const themeSelect = document.getElementById("themeSelect");
  if (themeSelect) {
    themeSelect.value = localStorage.getItem("theme") || "Default";
    themeSelect.addEventListener("change", () => {
      localStorage.setItem("theme", themeSelect.value);
      applyTheme();
    });
  }

  const bgUpload = document.getElementById("bgUpload");
  if (bgUpload) {
    bgUpload.addEventListener("change", (event) => {
      const file = event.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.body.style.backgroundImage = `url(${e.target.result})`;
          document.body.style.backgroundSize = "cover";
          document.body.style.backgroundRepeat = "no-repeat";
        };
        reader.readAsDataURL(file);
      }
    });
  }
});
