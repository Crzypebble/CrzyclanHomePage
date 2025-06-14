document.addEventListener('DOMContentLoaded', () => {
  const themeButtons = document.querySelectorAll('[data-theme]');
  themeButtons.forEach(button => {
    button.addEventListener('click', () => {
      const selectedTheme = button.getAttribute('data-theme');
      applyTheme(selectedTheme);
    });
  });

  const backgroundInput = document.getElementById('background-file');
  const clearBtn = document.getElementById('clear-background');

  backgroundInput.addEventListener('change', (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      document.body.style.backgroundImage = `url(${reader.result})`;
      localStorage.setItem('customBackground', reader.result);
    };
    reader.readAsDataURL(file);
  });

  clearBtn.addEventListener('click', () => {
    document.body.style.backgroundImage = '';
    localStorage.removeItem('customBackground');
  });

  const savedBackground = localStorage.getItem('customBackground');
  if (savedBackground) {
    document.body.style.backgroundImage = `url(${savedBackground})`;
  }
});
