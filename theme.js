function applyTheme(themeName) {
  document.body.className = '';
  document.body.classList.add(themeName);

  const header = document.querySelector('header');
  const footer = document.querySelector('footer');
  const nav = document.querySelector('nav');
  const h1 = document.querySelector('header h1');

  if (themeName === 'red-mist') {
    header.style.backgroundColor = '#111';
    footer.style.backgroundColor = '#111';
    nav.style.backgroundColor = 'transparent';
    h1.style.color = 'crimson';
  } else if (themeName === 'black-white') {
    header.style.backgroundColor = '#f0f0f0';
    footer.style.backgroundColor = '#f0f0f0';
    nav.style.backgroundColor = 'transparent';
    h1.style.color = '#111';
  }

  localStorage.setItem('selectedTheme', themeName);
}

function loadSavedTheme() {
  const savedTheme = localStorage.getItem('selectedTheme') || 'red-mist';
  applyTheme(savedTheme);
}

document.addEventListener('DOMContentLoaded', loadSavedTheme);
