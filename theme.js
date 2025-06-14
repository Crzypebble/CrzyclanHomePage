function applyTheme(theme) {
  const root = document.documentElement;
  if (theme === 'red') {
    root.style.setProperty('--bg-color', '#0a0a0a');
    root.style.setProperty('--text-color', '#e6e6e6');
    root.style.setProperty('--accent-color', 'crimson');
    root.style.setProperty('--card-hover', '2px solid red');
  } else if (theme === 'bw') {
    root.style.setProperty('--bg-color', '#ffffff');
    root.style.setProperty('--text-color', '#000000');
    root.style.setProperty('--accent-color', '#000000');
    root.style.setProperty('--card-hover', '2px solid #000');
  }
  localStorage.setItem('theme', theme);
}

function loadTheme() {
  const savedTheme = localStorage.getItem('theme') || 'red';
  applyTheme(savedTheme);
}
