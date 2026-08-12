let db; 

document.addEventListener('DOMContentLoaded', () => {
  
  // --- 1. VISUALS & LOCAL STORAGE ---
  const customBgInput = document.getElementById('custom-background');
  const clearBgBtn = document.getElementById('clear-background');
  const bgPreviewBox = document.getElementById('bg-preview');
  const bgUploadText = document.getElementById('bg-upload-text');

  const savedBg = localStorage.getItem('customBackground');
  if (savedBg) {
    if(bgPreviewBox) bgPreviewBox.style.backgroundImage = `url('${savedBg}')`;
    if(bgUploadText) bgUploadText.style.display = 'none';
  }

  // --- 2. FIREBASE SAFETY CHECKS ---
  if (typeof firebase === 'undefined') {
    showStatus("CRITICAL ERROR: Firebase scripts are missing from settings.html!", "#ff0000");
    return; 
  }

  try {
    db = firebase.firestore();
  } catch (err) {
    showStatus("CRITICAL ERROR: Firestore script is missing from settings.html!", "#ff0000");
    return; 
  }

  // --- 3. LOAD THE REST OF THE PAGE ---
  const logoutBtn = document.getElementById('logout-btn');
  const authInputs = document.getElementById('auth-inputs');
  const securitySection = document.getElementById('security-section');

  const changeNameBtn = document.getElementById('change-name-button');
  const changeEmailBtn = document.getElementById('change-email-button');
  const changePasswordBtn = document.getElementById('change-password-button');
  const deleteAccountBtn = document.getElementById('delete-account-button');
  const clearDataBtn = document.getElementById('clear-data-button');

  const displayNameDisplay = document.getElementById('current-display-name');
  const pfpUpload = document.getElementById('pfp-upload');
  const pfpPreview = document.getElementById('pfp-preview');
  const robloxUsernameInput = document.getElementById('roblox-username-input');

  // --- AUTHENTICATION STATE LISTENER ---
  firebase.auth().onAuthStateChanged((user) => {
    
    // --- THE HARD WIPE --- 
    // This forcibly clears the UI the moment the auth state changes, 
    // ensuring no "ghost" profile pictures or names from previous accounts are shown.
    if (pfpPreview) pfpPreview.style.backgroundImage = "none";
    if (robloxUsernameInput) robloxUsernameInput.value = "";
    if (displayNameDisplay) displayNameDisplay.textContent = "Loading...";

    if (user) {
      if (authInputs) authInputs.style.display = 'none';
      if (logoutBtn) logoutBtn.style.display = 'block';
      if (securitySection) securitySection.style.display = 'block';

      const defaultName = user.displayName ? user.displayName : user.email.split('@')[0];
      if (displayNameDisplay) {
        displayNameDisplay.textContent = defaultName;
      }

      // Fetch Profile Data for the logged-in user
      const profileRef = db.collection('profiles').doc(user.uid);
      
      profileRef.get().then(doc => {
        if (doc.exists) {
          const data = doc.data();
          if (data.profilePic) {
            if(pfpPreview) pfpPreview.style.backgroundImage = `url('${data.profilePic}')`;
          }
          if (data.robloxUsername && robloxUsernameInput) {
            robloxUsernameInput.value = data.robloxUsername;
          }
        } else {
          // Backup generator just in case they slipped through
          profileRef.set({
            displayName: defaultName,
            searchName: defaultName.toLowerCase(),
            role: "guest",
            bio: "No bio set.",
            profilePic: "",
            profileBg: "",
            clanCard: "",
            friends: [],
            friendRequests: [],
            outgoingRequests: [],
            likedBy: [],
            dmHistory: [],
            inboxPrivacy: "public",
            profileSongTitle: "",
            profileSongFile: "",
            profileSongSpeed: 1,
            publicPlaylistName: "",
            publicPlaylistTrackCount: 0,
            publicPlaylistIndex: ""
          });
        }
      });

      showStatus(`Logged in securely as ${user.email}`, "#00ff00");
    } else {
      if (authInputs) authInputs.style.display = 'block';
      if (logoutBtn) logoutBtn.style.display = 'none';
      if (securitySection) securitySection.style.display = 'none';
      if (displayNameDisplay) displayNameDisplay.textContent = "Not Set";
    }
  });

  // --- ATTACH EVENT LISTENERS ---
  changeNameBtn?.addEventListener('click', changeName);
  changeEmailBtn?.addEventListener('click', changeEmail);
  changePasswordBtn?.addEventListener('click', changePassword);
  deleteAccountBtn?.addEventListener('click', deleteAccount);
  clearDataBtn?.addEventListener('click', clearLocalData);

  // --- IMAGE COMPRESSOR FUNCTION ---
  function compressImage(file, maxWidth, maxHeight, quality, callback) {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height *= maxWidth / width));
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width *= maxHeight / height));
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
        callback(compressedDataUrl);
      };
    };
  }

  // --- PROFILE PICTURE UPLOADER ---
  pfpUpload?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    showStatus("Compressing profile picture...", "#ffaa00");

    compressImage(file, 400, 400, 0.8, (compressedImageUrl) => {
      if ((compressedImageUrl.length * 0.75) > 1048576) {
        return showStatus("Image is still too large after compression. Try a different image.", "#ff0000");
      }

      const user = firebase.auth().currentUser;
      if (user) {
        db.collection('profiles').doc(user.uid).set({ profilePic: compressedImageUrl }, { merge: true })
          .then(() => {
            if (pfpPreview) pfpPreview.style.backgroundImage = `url('${compressedImageUrl}')`;
            showStatus("Profile picture updated and compressed successfully!", "#00ff00");
          })
          .catch(err => showStatus("Error saving picture: " + err.message, "#ff0000"));
      }
    });
  });

  // --- BACKGROUND IMAGE UPLOADER ---
  customBgInput?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    showStatus("Compressing background image...", "#ffaa00");

    compressImage(file, 1920, 1080, 0.7, (compressedImageUrl) => {
      try {
        localStorage.setItem('customBackground', compressedImageUrl);

        if(bgPreviewBox) bgPreviewBox.style.backgroundImage = `url('${compressedImageUrl}')`;
        if(bgUploadText) bgUploadText.style.display = 'none';

        if (typeof applyBackground === 'function') {
           applyBackground(compressedImageUrl);
        } else {
           document.body.style.backgroundImage = `url('${compressedImageUrl}')`;
           document.body.style.backgroundSize = "cover";
           document.body.style.backgroundRepeat = "no-repeat";
           document.body.style.backgroundPosition = "center center";
           document.body.style.backgroundAttachment = "fixed"; 
        }
        showStatus("Custom background compressed and applied!", "#00ff00");
      } catch (err) {
        showStatus("Error: Image is still too large for local storage.", "#ff0000");
      }
    });
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
  } else {
    alert(msg);
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
    .then((userCredential) => {
      const user = userCredential.user;
      const defaultName = user.email.split('@')[0];
      
      // --- FORCED SCHEMA BUILDER ---
      // This guarantees the database gets built the exact millisecond 
      // the account is successfully created, stopping the race condition.
      db.collection('profiles').doc(user.uid).set({
        displayName: defaultName,
        searchName: defaultName.toLowerCase(),
        role: "guest",
        bio: "No bio set.",
        profilePic: "",
        profileBg: "",
        clanCard: "",
        friends: [],
        friendRequests: [],
        outgoingRequests: [],
        likedBy: [],
        dmHistory: [],
        inboxPrivacy: "public",
        profileSongTitle: "",
        profileSongFile: "",
        profileSongSpeed: 1,
        publicPlaylistName: "",
        publicPlaylistTrackCount: 0,
        publicPlaylistIndex: ""
      }).then(() => {
        showStatus("Account created and profile generated successfully!", "#00ff00");
      });
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
window.updateRobloxUsername = function() {
  const robloxUser = document.getElementById('roblox-username-input').value.trim();
  const user = firebase.auth().currentUser;
  
  if (!user) return showStatus("You must be logged in.", "#ff0000");
  if (!robloxUser) return showStatus("Please enter a valid Roblox Username.", "#ff0000");

  db.collection('profiles').doc(user.uid).set({
    robloxUsername: robloxUser
  }, { merge: true }).then(() => {
    showStatus("Roblox account linked successfully!", "#00ff00");
  }).catch(err => showStatus("Error: " + err.message, "#ff0000"));
};

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

// --- FULL FIREBASE DATA WIPE ADDED ---
function deleteAccount() {
  if (confirm("Are you absolutely sure you want to delete your account? This cannot be undone and you will lose all saved playlists and likes.")) {
    const user = firebase.auth().currentUser;
    if (!user) return;

    // 1. DELETE THE FIREBASE DATABASE PROFILE FIRST
    db.collection('profiles').doc(user.uid).delete().then(() => {
      
      // 2. DELETE THEIR SAVED PLAYLISTS/MUSIC
      return db.collection('userVotes').doc(user.uid).delete();
      
    }).catch(err => {
      console.log("Database wipe issue (or data already gone), proceeding to auth deletion...");
    }).finally(() => {
      
      // 3. FINALLY, DELETE THE ACTUAL LOGIN ACCOUNT
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
    });
  }
}

// --- DATA MANAGEMENT FUNCTIONS ---
function clearLocalData() {
  if(confirm("This will clear your active music queue, custom background image, and site cache. Proceed?")) {
    localStorage.clear();

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
