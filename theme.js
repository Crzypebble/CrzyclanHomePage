const root = document.documentElement;

function applyTheme(theme) {
  document.body.className = theme;
  localStorage.setItem('theme', theme);

  if (theme === 'dark') {
    root.style.setProperty('--main-bg', '#0a0a0a');
    root.style.setProperty('--text-color', '#e6e6e6');
    root.style.setProperty('--accent', 'crimson');
    root.style.setProperty('--header-bg', '#111');
  } else {
    root.style.setProperty('--main-bg', '#f4f4f4');
    root.style.setProperty('--text-color', '#111');
    root.style.setProperty('--accent', '#cc0000');
    root.style.setProperty('--header-bg', '#fff');
  }
}

function clearBackgroundImage() {
  document.body.style.backgroundImage = '';
  localStorage.removeItem('customBackground');
}

function applySavedSettings() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  applyTheme(savedTheme);

  const bg = localStorage.getItem('customBackground');
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`;
  }
}
