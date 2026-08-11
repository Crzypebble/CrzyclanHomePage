let db; // Added global variable for Firestore

document.addEventListener('DOMContentLoaded', () => {
  db = firebase.firestore(); // Initialize Firestore

  const logoutBtn = document.getElementById('logout-btn');
  const authInputs = document.getElementById('auth-inputs');
  const securitySection = document.getElementById('security-section');

  // Buttons
  const changeNameBtn = document.getElementById('change-name-button');
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
  const deleteAccountBtn = document.getElementById('delete-account-button');
  const clearDataBtn = document.getElementById('clear-data-button');

  // Background Elements
  const customBgInput = document.getElementById('custom-background');
  const clearBgBtn = document.getElementById('clear-background');
  const bgPreviewBox = document.getElementById('bg-preview');
  const bgUploadText = document.getElementById('bg-upload-text');

  // Profile Elements
  const displayNameDisplay = document.getElementById('current-display-name');
  const pfpUpload = document.getElementById('pfp-upload');
  const pfpPreview = document.getElementById('pfp-preview');

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

      // Load current Display Name
      if (displayNameDisplay) {
        displayNameDisplay.textContent = user.displayName ? user.displayName : "Not Set";
      }

      // Fetch Profile Picture from Firestore
      db.collection('profiles').doc(user.uid).get().then(doc => {
        if (doc.exists && doc.data().profilePic) {
          pfpPreview.style.backgroundImage = `url('${doc.data().profilePic}')`;
        } else {
          pfpPreview.style.backgroundImage = "none"; // Defaults to solid black
        }
      });

      showStatus(`Logged in securely as ${user.email}`, "#00ff00");
    } else {
      if (authInputs) authInputs.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (securitySection) securitySection.style.display = 'none';
    }
  });

  // --- ATTACH EVENT LISTENERS ---
  changeNameBtn?.addEventListener('click', changeName);
  changeEmailBtn?.addEventListener('click', changeEmail);
  changePasswordBtn?.addEventListener('click', changePassword);
  deleteAccountBtn?.addEventListener('click', deleteAccount);
  clearDataBtn?.addEventListener('click', clearLocalData);

  // --- PROFILE PICTURE UPLOADER ---
  pfpUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Optional: Prevent absolutely massive files from crashing the mobile browser (e.g., > 15MB)
    // But easily allows standard 3-8MB phone camera photos
    if (file.size > 15 * 1024 * 1024) return alert("File is too large! Please choose an image under 15MB.");

    const reader = new FileReader();
    reader.onload = (event) => {
      // Create an image object to get the original dimensions
      const img = new Image();
      img.onload = () => {
        // Set maximum dimensions for the profile picture (400x400 is plenty for a PFP)
        const MAX_WIDTH = 400;
        const MAX_HEIGHT = 400;
        let width = img.width;
        let height = img.height;

        // Calculate new dimensions while maintaining aspect ratio
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        // Create a canvas to resize the image
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        // Draw the resized image onto the canvas
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        // Compress to JPEG with 70% quality to save database space
        // This takes a 4MB phone pic and turns it into a ~30KB string
        const compressedImageUrl = canvas.toDataURL('image/jpeg', 0.7);
        const user = firebase.auth().currentUser;

        if (user) {
          // Save the much smaller compressed image to Firestore
          db.collection('profiles').doc(user.uid).set({ profilePic: compressedImageUrl }, { merge: true })
            .then(() => {
              if (pfpPreview) pfpPreview.style.backgroundImage = `url('${compressedImageUrl}')`;
              showStatus("Profile picture updated!", "#00ff00");
            })
            .catch(err => showStatus("Error saving picture: " + err.message, "#ff0000"));
        }
      };
      
      // Load the original image file into the Image object
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });

  // --- BACKGROUND IMAGE UPLOADER ---
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

// --- SECURITY & ACCOUNT FUNCTIONS ---

window.resetPassword = function() {
  let targetEmail = "";
  const user = firebase.auth().currentUser;

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

function changeName() {
  const newName = prompt("Enter your new Display Name:");
  if (!newName || newName.trim() === "") return;

  const user = firebase.auth().currentUser;
  user.updateProfile({
    displayName: newName.trim()
  }).then(() => {
    document.getElementById('current-display-name').textContent = newName.trim();
    showStatus("Display name successfully updated.", "#00ff00");
  }).catch(error => showStatus(error.message, "#ff0000"));
}

function changeEmail() {
  const newEmail = prompt("Enter your new email:");
  if (!newEmail) return;

  const user = firebase.auth().currentUser;
  user.updateEmail(newEmail)
    .then(() => showStatus("Email successfully updated.", "#00ff00"))
    .catch(error => {
      if(error.code === 'auth/requires-recent-login') {
        showStatus("Security requirement: Please log out and log back in before changing your email.", "#ff0000");
      } else {
        showStatus(error.message, "#ff0000");
      }
    });
}

function changePassword() {
  const newPassword = prompt("Enter your new password:");
  if (!newPassword) return;

  const user = firebase.auth().currentUser;
  user.updatePassword(newPassword)
    .then(() => showStatus("Password successfully updated.", "#00ff00"))
    .catch(error => {
      if(error.code === 'auth/requires-recent-login') {
        showStatus("Security requirement: Please log out and log back in before changing your password.", "#ff0000");
      } else {
        showStatus(error.message, "#ff0000");
      }
    });
}

function deleteAccount() {
  if (confirm("Are you absolutely sure you want to delete your account? This cannot be undone and you will lose all saved playlists and likes.")) {
    const user = firebase.auth().currentUser;
    user.delete()
      .then(() => {
        showStatus("Account deleted successfully.", "#00ff00");
      })
      .catch(error => {
        if(error.code === 'auth/requires-recent-login') {
          showStatus("Security requirement: Please log out and log back in before deleting your account.", "#ff0000");
        } else {
          showStatus(error.message, "#ff0000");
        }
      });
  }
}

// --- DATA MANAGEMENT FUNCTIONS ---

function clearLocalData() {
  if(confirm("This will clear your active music queue, custom background image, and site cache. Proceed?")) {
    localStorage.clear();

    // Visually reset background elements
    document.body.style.backgroundImage = "";
    document.body.style.backgroundSize = "";
    document.body.style.backgroundRepeat = "";
    document.body.style.backgroundPosition = "";
    document.body.style.backgroundAttachment = "";

    const bgPreviewBox = document.getElementById('bg-preview');
    const bgUploadText = document.getElementById('bg-upload-text');
    if(bgPreviewBox) bgPreviewBox.style.backgroundImage = "none";
    if(bgUploadText) bgUploadText.style.display = 'block';

    showStatus("Local site data cleared.", "#00ff00");
  }
}
