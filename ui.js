// Show a specific tab and hide the others
function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.style.display = 'none';
  });

  const target = document.getElementById(tabId);
  if (target) {
    target.style.display = 'block';
  }
}

// Show home tab on first load
window.addEventListener("DOMContentLoaded", () => {
  showTab('home');
});
