// global.js - Applies settings globally across all CRZYCLAN pages

function applyBackground(imageUrl) {
  document.body.style.backgroundImage = `url('${imageUrl}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center center";
  document.body.style.backgroundAttachment = "fixed"; 
}

document.addEventListener('DOMContentLoaded', () => {
  // Apply Custom Background if it exists in local storage
  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    applyBackground(savedBg);
  }
});
