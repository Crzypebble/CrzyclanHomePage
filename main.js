// main.js

// Apply saved theme and background on load
window.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    applyTheme(savedTheme);
    document.getElementById('themeSelect').value = savedTheme;
  }

  const savedBg = localStorage.getItem('customBg');
  if (savedBg) {
    document.body.style.backgroundImage = `url(${savedBg})`;
  }
});

// Theme handling
function applyTheme(theme) {
  document.body.className = ''; // Reset classes
  if (theme === 'Red Mist') {
    document.body.style.backgroundColor = '#1a0000';
    document.body.style.color = '#ffcccc';
  } else if (theme === 'Black & White') {
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#fff';
  } else {
    document.body.style.backgroundColor = '#0a0a0a';
    document.body.style.color = '#e6e6e6';
  }
}

// Save settings
document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
  const selectedTheme = document.getElementById('themeSelect').value;
  localStorage.setItem('theme', selectedTheme);
  applyTheme(selectedTheme);

  const file = document.getElementById('bgUpload').files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function (e) {
      const dataURL = e.target.result;
      document.body.style.backgroundImage = `url(${dataURL})`;
      localStorage.setItem('customBg', dataURL);
    };
    reader.readAsDataURL(file);
  }
});
