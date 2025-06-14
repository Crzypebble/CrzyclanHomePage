function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.style.display = 'none';
  });
  const target = document.getElementById(tabId);
  if (target) target.style.display = 'block';
}
