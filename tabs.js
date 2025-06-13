// tabs.js

// Show a specific tab by ID
function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.style.display = 'none';
  });

  const selectedTab = document.getElementById(tabId);
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }
}

// Set default tab to "home" on page load
window.addEventListener('DOMContentLoaded', () => {
  showTab('home');
});
