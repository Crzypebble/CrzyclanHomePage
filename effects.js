document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.member-card').forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.border = '2px solid red';
    });
    card.addEventListener('mouseleave', () => {
      card.style.border = '2px solid var(--accent)';
    });
  });
});
