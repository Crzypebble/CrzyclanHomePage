document.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const authInputs = document.getElementById('auth-inputs');
  const securitySection = document.getElementById('security-section');
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
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

  // --- AUTHENTICATION STATE LISTENER ---
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      if (authInputs) authInputs.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (securitySection) securitySection.style.display = 'block';
      showStatus(`Logged in securely as ${user.email}`, "#00ff00");
    } else {
      if (authInputs) authInputs.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (securitySection) securitySection.style.display = 'none';
    }
  });

  // Attach button event listeners
  changeEmailBtn?.addEventListener('click', changeEmail);
  changePasswordBtn?.addEventListener('click', changePassword);

  // Background Image Uploader Logic
  customBgInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        
        localStorage.setItem('customBackground', imageUrl);
        
        if(bgPreviewBox) bgPreviewBox.style.backgroundImage = `url('${imageUrl}')`;
        if(bgUploadText) bgUploadText.style.display = 'none';
        
        if (typeof applyBackground === 'function') {
           applyBackground(imageUrl);
        } else {
           document.body.style.backgroundImage = `url('${imageUrl}')`;
           document.body.style.backgroundSize = "cover";
           document.body.style.backgroundRepeat = "no-repeat";
           document.body.style.backgroundPosition = "center center";
           document.body.style.backgroundAttachment = "fixed"; 
        }
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

// --- HELPER FUNCTIONS ---

function showStatus(msg, color) {
  const statusEl = document.getElementById('status-msg');
  if (statusEl) {
    statusEl.textContent = msg;
    statusEl.style.color = color;
    setTimeout(() => statusEl.textContent = "", 4000);
  }
}

// --- AUTHENTICATION FUNCTIONS ---

window.login = function() {
  const emailInput = document.getElementById('email').value.trim();
  const passwordInput = document.getElementById('password').value;
  if (!emailInput || !passwordInput) {
    return showStatus("Please enter both email and password.", "#ff0000");
  }
  
  firebase.auth().signInWithEmailAndPassword(emailInput, passwordInput)
    .then(() => {
      showStatus("Logged in successfully!", "#00ff00");
    })
    .catch((error) => {
      showStatus(error.message, "#ff0000");
    });
};

window.signUp = function() {
  const emailInput = document.getElementById('email').value.trim();
  const passwordInput = document.getElementById('password').value;
  if (!emailInput || !passwordInput) {
    return showStatus("Please enter both email and password.", "#ff0000");
  }

  firebase.auth().createUserWithEmailAndPassword(emailInput, passwordInput)
    .then(() => {
      showStatus("Account created successfully!", "#00ff00");
    })
    .catch((error) => {
      showStatus(error.message, "#ff0000");
    });
};

window.logout = function() {
  firebase.auth().signOut()
    .then(() => {
      showStatus("Logged out.", "#00ff00");
      document.getElementById('email').value = "";
      document.getElementById('password').value = "";
    })
    .catch((error) => {
      showStatus(error.message, "#ff0000");
    });
};

// --- SECURITY FUNCTIONS ---

window.resetPassword = function() {
  let targetEmail = "";
  const user = firebase.auth().currentUser;
  
  // If logged in, use their account email. If logged out, grab it from the text box.
  if (user) {
    targetEmail = user.email;
  } else {
    targetEmail = document.getElementById('email').value.trim();
  }

  if (!targetEmail) {
    showStatus("Please enter your email in the box to reset your password.", "#ff0000");
    return;
  }

  firebase.auth().sendPasswordResetEmail(targetEmail)
    .then(() => showStatus("Password reset email sent. Check your inbox.", "#00ff00"))
    .catch(error => showStatus(error.message, "#ff0000"));
};

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
