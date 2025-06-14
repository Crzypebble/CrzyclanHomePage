function setCustomBackground(url) {
  document.body.style.backgroundImage = `url('${url}')`;
  localStorage.setItem('customBackground', url);
}

function clearCustomBackground() {
  document.body.style.backgroundImage = '';
  localStorage.removeItem('customBackground');
}

function loadCustomBackground() {
  const url = localStorage.getItem('customBackground');
  if (url) {
    document.body.style.backgroundImage = `url('${url}')`;
  }
}
