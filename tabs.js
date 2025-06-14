window.showTab = function (tabId) {
  document.querySelectorAll('.tab-section').forEach(section => {
    section.style.display = 'none';
  });
  const tab = document.getElementById(tabId);
  if (tab) tab.style.display = 'block';
};
