// tabs.js
function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(tab => {
    tab.style.display = 'none';
  });
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}
