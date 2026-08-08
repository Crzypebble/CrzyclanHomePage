document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn'); // Fixed ID mismatch
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
  const resetPasswordBtn = document.getElementById('reset-password-button');
  const customBgInput = document.getElementById('custom-background');
  const clearBgBtn = document.getElementById('clear-background');
  const bgPreviewBox = document.getElementById('bg-preview');
  const bgUploadText = document.getElementById('bg-upload-text');

  // Load visual preview in settings if background exists
  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    if(bgPreviewBox) bgPreviewBox.style.backgroundImage = `url('${savedBg}')`;
    if(bgUploadText) bgUploadText.style.display = 'none';
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
        
        // Save globally
        localStorage.setItem('customBackground', imageUrl);
        
        // Update the visual preview box
        if(bgPreviewBox) bgPreviewBox.style.backgroundImage = `url('${imageUrl}')`;
        if(bgUploadText) bgUploadText.style.display = 'none';
        
        // Apply immediately to current page
        applyBackground(imageUrl);
        showStatus("Custom background applied site-wide!", "#00ff00");
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
    document.body.style.backgroundAttachment = "";
    
    if(bgPreviewBox) bgPreviewBox.style.backgroundImage = "none";
    if(bgUploadText) bgUploadText.style.display = 'block';
    showStatus("Background reverted to default.", "#ff0000");
  });
});

function showStatus(msg, color) {
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    setTimeout(() => statusEl.textContent = "", 3000);
  }
}

function changeEmail() {
  const newEmail = prompt("Enter your new email:");
  if (!newEmail) return;

  const user = firebase.auth().currentUser;
  user.updateEmail(newEmail)
    .then(() => showStatus("Email successfully updated.", "#00ff00"))
    .catch(error => showStatus(error.message, "#ff0000"));
}

function changePassword() {
  const newPassword = prompt("Enter your new password:");
  if (!newPassword) return;

  const user = firebase.auth().currentUser;
  user.updatePassword(newPassword)
    .then(() => showStatus("Password successfully updated.", "#00ff00"))
    .catch(error => showStatus(error.message, "#ff0000"));
}

function resetPassword() {
  const user = firebase.auth().currentUser;
  if (!user) {
    showStatus("You must be logged in to do this.", "#ff0000");
    return;
  }
  const emailAddress = user.email;
  firebase.auth().sendPasswordResetEmail(emailAddress)
    .then(() => showStatus("Password reset email sent. Check your inbox.", "#00ff00"))
    .catch(error => showStatus(error.message, "#ff0000"));
}
