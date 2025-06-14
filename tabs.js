function showTab(tabId) {
  const sections = document.querySelectorAll('.tab-section');
  sections.forEach(section => {
    section.style.display = (section.id === tabId) ? 'block' : 'none';
  });

  // Update the hash without scrolling
  history.replaceState(null, null, '#' + tabId);
}

// On initial load, show the tab from the hash or default to 'home'
window.addEventListener('DOMContentLoaded', () => {
  const hash = window.location.hash.replace('#', '');
  showTab(hash || 'home');
});
