document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-button');
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
  const resetPasswordBtn = document.getElementById('reset-password-button');
  const customBgInput = document.getElementById('custom-background');
  const clearBgBtn = document.getElementById('clear-background');

  // ✅ Reapply background from localStorage on page load
  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    applyBackground(savedBg);
  }

  logoutBtn?.addEventListener('click', logout);
  changeEmailBtn?.addEventListener('click', changeEmail);
  changePasswordBtn?.addEventListener('click', changePassword);
  resetPasswordBtn?.addEventListener('click', resetPassword);

  customBgInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        localStorage.setItem('customBackground', imageUrl);
        applyBackground(imageUrl);
      };
      reader.readAsDataURL(file);
    }
  });

  clearBgBtn?.addEventListener('click', () => {
    localStorage.removeItem('customBackground');
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundPosition = "";
  });
});

function applyBackground(imageUrl) {
  document.body.style.backgroundImage = `url('${imageUrl}')`;
  document.body.style.backgroundSize = "cover";
  document.body.style.backgroundRepeat = "no-repeat";
  document.body.style.backgroundPosition = "center center";
}

function changeEmail() {
  const newEmail = prompt("Enter your new email:");
  if (!newEmail) return;

  const user = firebase.auth().currentUser;
  user.updateEmail(newEmail)
    .then(() => alert("Email updated."))
    .catch(error => alert(error.message));
}

function changePassword() {
  const newPassword = prompt("Enter your new password:");
  if (!newPassword) return;

  const user = firebase.auth().currentUser;
  user.updatePassword(newPassword)
    .then(() => alert("Password updated."))
    .catch(error => alert(error.message));
}

function resetPassword() {
  const user = firebase.auth().currentUser;
  const emailAddress = user.email;
  firebase.auth().sendPasswordResetEmail(emailAddress)
    .then(() => alert("Reset email sent."))
    .catch(error => alert(error.message));
}
