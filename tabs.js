function showTab(tabId) {
  // Hide all sections
  const sections = document.querySelectorAll('.tab-section');
  sections.forEach(section => {
    section.style.display = 'none';
    section.classList.remove('active');
  });

  // Show the selected section
  const activeSection = document.getElementById(tabId);
  if (activeSection) {
    activeSection.style.display = 'block';
    activeSection.classList.add('active');
  }

  // Update Navigation Bar Highlighting
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.classList.remove('active');
    // If the link has an onclick attribute that contains the tabId, make it active
    if (link.getAttribute('onclick') && link.getAttribute('onclick').includes(tabId)) {
      link.classList.add('active');
    }
  });
}

// Make sure the home tab shows by default when the page loads
document.addEventListener('DOMContentLoaded', () => {
  showTab('home');
});
