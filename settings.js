// settings.js
document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-button');
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
  const resetPasswordBtn = document.getElementById('reset-password-button');

  logoutBtn?.addEventListener('click', logout);
  changeEmailBtn?.addEventListener('click', changeEmail);
  changePasswordBtn?.addEventListener('click', changePassword);
  resetPasswordBtn?.addEventListener('click', resetPassword);
});

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
