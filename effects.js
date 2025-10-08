// effects.js
document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('mouseenter', () => card.classList.add('hovered'));
    card.addEventListener('mouseleave', () => card.classList.remove('hovered'));
  });
});
