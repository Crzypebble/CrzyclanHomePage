// ui.js
document.addEventListener("DOMContentLoaded", () => {
  const bgInput = document.getElementById('custom-background');
  const clearBgBtn = document.getElementById('clear-background');

  if (bgInput) {
    bgInput.addEventListener('change', function () {
      const file = this.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = function (e) {
          document.body.style.backgroundImage = `url('${e.target.result}')`;
          localStorage.setItem('customBackground', e.target.result);
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (clearBgBtn) {
    clearBgBtn.addEventListener('click', () => {
      document.body.style.backgroundImage = '';
      localStorage.removeItem('customBackground');
    });
  }

  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    document.body.style.backgroundImage = `url('${savedBg}')`;
  }
});
