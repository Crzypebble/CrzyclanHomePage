function showTab(tabId) {
  const sections = document.querySelectorAll(".tab-section");
  sections.forEach(section => {
    section.style.display = section.id === tabId ? "block" : "none";
  });
}
