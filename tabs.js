function showTab(tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.style.display = 'none';
  });

  const activeTab = document.getElementById(tabId);
  if (activeTab) {
    activeTab.style.display = 'block';
  }
}
