document.addEventListener("DOMContentLoaded", () => {
  // Smooth fade effect when switching tabs
  const sections = document.querySelectorAll("main > section");
  sections.forEach(section => {
    section.style.opacity = "0";
    section.style.transition = "opacity 0.4s ease-in-out";
  });

  const observer = new MutationObserver(() => {
    sections.forEach(section => {
      if (section.style.display === "block") {
        section.style.opacity = "1";
      } else {
        section.style.opacity = "0";
      }
    });
  });

  observer.observe(document.body, { attributes: true, childList: true, subtree: true });
});
