document.addEventListener("DOMContentLoaded", () => {
  const cards = document.querySelectorAll(".member-card");

  cards.forEach(card => {
    card.addEventListener("mouseenter", () => {
      card.style.borderColor = "crimson";
    });
    card.addEventListener("mouseleave", () => {
      card.style.borderColor = "#444";
    });
  });
});
