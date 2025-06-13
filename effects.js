// effects.js

// Add hover effect to member cards
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.member-card');

  cards.forEach(card => {
    card.addEventListener('mouseenter', () => {
      card.style.border = '2px solid crimson';
      card.style.transition = 'border 0.3s';
    });

    card.addEventListener('mouseleave', () => {
      card.style.border = '2px solid #444';
    });
  });
});
