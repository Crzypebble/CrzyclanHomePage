// settings.js

document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("custom-background");
  const logoutBtn = document.getElementById("logout-button");
  const changeEmailBtn = document.getElementById("change-email-button");
  const changePasswordBtn = document.getElementById("change-password-button");
  const resetPasswordBtn = document.getElementById("reset-password-button");
  const clearBgBtn = document.getElementById("clear-background");

  // Upload background
  uploadInput?.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const bgURL = event.target.result;
        localStorage.setItem("customBackground", bgURL);
        document.body.style.backgroundImage = `url('${bgURL}')`;
      };
      reader.readAsDataURL(file);
    }
  });

  // Clear background
  clearBgBtn?.addEventListener("click", () => {
    localStorage.removeItem("customBackground");
    document.body.style.backgroundImage = "";
  });

  // Logout
  logoutBtn?.addEventListener("click", () => {
    firebase.auth().signOut().then(() => {
      location.reload();
    });
  });

  // Change email
  changeEmailBtn?.addEventListener("click", () => {
    const newEmail = prompt("Enter your new email:");
    if (newEmail) {
      firebase.auth().currentUser.updateEmail(newEmail)
        .then(() => alert("Email updated."))
        .catch((error) => alert("Error: " + error.message));
    }
  });

  // Change password
  changePasswordBtn?.addEventListener("click", () => {
    const newPassword = prompt("Enter your new password:");
    if (newPassword) {
      firebase.auth().currentUser.updatePassword(newPassword)
        .then(() => alert("Password updated."))
        .catch((error) => alert("Error: " + error.message));
    }
  });

  // Reset password by email
  resetPasswordBtn?.addEventListener("click", () => {
    const email = firebase.auth().currentUser?.email;
    if (email) {
      firebase.auth().sendPasswordResetEmail(email)
        .then(() => alert("Password reset email sent."))
        .catch((error) => alert("Error: " + error.message));
    }
  });
});
