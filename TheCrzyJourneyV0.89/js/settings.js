// js/settings.js
document.addEventListener("DOMContentLoaded", () => {
  const defaults = {
    master: 100,
    music: 100,
    sfx: 100,
    menuMusic: 100,
    brightness: 100,
    difficulty: "Normal"
  };

  function get(key) {
    const value = localStorage.getItem("setting_" + key);
    return value === null ? defaults[key] : value;
  }

  function bindRange(id, key) {
    const el = document.getElementById(id);
    if (!el) return;
    el.value = get(key);
    el.addEventListener("input", () => {
      localStorage.setItem("setting_" + key, el.value);
    });
  }

  bindRange("master-volume", "master");
  bindRange("music-volume", "music");
  bindRange("sfx-volume", "sfx");
  bindRange("menu-music-volume", "menuMusic");
  bindRange("brightness-slider", "brightness");

  const difficulty = document.getElementById("difficulty-select");
  if (difficulty) {
    difficulty.value = get("difficulty");
    difficulty.addEventListener("change", () => {
      localStorage.setItem("setting_difficulty", difficulty.value);
    });
  }

  const fullscreen = document.getElementById("fullscreen-toggle");
  if (fullscreen) {
    fullscreen.checked = localStorage.getItem("fullscreen") === "true";
    fullscreen.addEventListener("change", async () => {
      localStorage.setItem("fullscreen", fullscreen.checked);
      if (fullscreen.checked) {
        try { await document.documentElement.requestFullscreen(); } catch (_) {}
      } else if (document.fullscreenElement) {
        try { await document.exitFullscreen(); } catch (_) {}
      }
    });
  }
});
