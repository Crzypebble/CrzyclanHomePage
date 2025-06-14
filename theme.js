window.applyTheme = function (themeName) {
  const root = document.documentElement;

  if (themeName === 'red') {
    root.style.setProperty('--bg-color', '#0a0a0a');
    root.style.setProperty('--text-color', '#e6e6e6');
    root.style.setProperty('--accent-color', 'crimson');
    root.style.setProperty('--card-bg', '#111');
    root.style.setProperty('--border-color', 'crimson');
  } else if (themeName === 'bw') {
    root.style.setProperty('--bg-color', '#fff');
    root.style.setProperty('--text-color', '#111');
    root.style.setProperty('--accent-color', '#000');
    root.style.setProperty('--card-bg', '#eee');
    root.style.setProperty('--border-color', '#000');
  }

  localStorage.setItem('selectedTheme', themeName);
};

(function restoreTheme() {
  const saved = localStorage.getItem('selectedTheme');
  if (saved) applyTheme(saved);

  const customBg = localStorage.getItem('customBackground');
  if (customBg) document.body.style.backgroundImage = `url('${customBg}')`;
})();
