document.getElementById('bg-upload')?.addEventListener('change', function () {
  const file = this.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const imageUrl = e.target.result;
    document.body.style.backgroundImage = `url(${imageUrl})`;
    localStorage.setItem('customBackground', imageUrl);
  };
  reader.readAsDataURL(file);
});

document.getElementById('clear-bg')?.addEventListener('click', clearBackgroundImage);

document.getElementById('theme-select')?.addEventListener('change', function () {
  applyTheme(this.value);
});
