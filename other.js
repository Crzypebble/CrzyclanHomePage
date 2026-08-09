const db = firebase.firestore();
let currentUserId = null;

// --- AUTHENTICATION LISTENER ---
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    document.getElementById('logged-out-warning').style.display = 'none';
    
    // Display their chosen username or fallback to email prefix
    const displayName = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-name').textContent = displayName;
    
    // Since this acts as "My Profile" right now, show the edit button
    document.getElementById('edit-bio-btn').style.display = 'inline-block';
    
    // Fetch or create their database profile
    loadProfile(currentUserId);
  } else {
    // What shows if they aren't logged in
    document.getElementById('logged-out-warning').style.display = 'block';
    document.getElementById('profile-name').textContent = "Unknown Guest";
    document.getElementById('profile-bio').textContent = "Please log in to view and edit your profile.";
    document.getElementById('role-badge').textContent = "Not Logged In";
    document.getElementById('role-badge').className = "role-title role-guest";
  }
});

// --- LOAD PROFILE DATA ---
function loadProfile(uid) {
  const userRef = db.collection('profiles').doc(uid);
  
  userRef.get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      
      // Load Bio
      document.getElementById('profile-bio').textContent = data.bio || "This user hasn't written a bio yet.";
      
      // Load Likes
      document.getElementById('like-count').textContent = data.likes || 0;
      
      // Load and Style Role Badge
      updateRoleUI(data.role || "guest");
      
      // Check DM status to update button text
      checkDMLimit(data.lastDMSent);

    } else {
      // Create a fresh profile if this is their first time on the hub
      userRef.set({
        bio: "I just joined the Crzyclan Hub!",
        likes: 0,
        role: "guest",
        lastDMSent: null
      });
      document.getElementById('profile-bio').textContent = "I just joined the Crzyclan Hub!";
      document.getElementById('like-count').textContent = 0;
      updateRoleUI("guest");
    }
  }).catch((error) => {
    console.error("Error fetching profile:", error);
  });
}

// --- ROLE STYLING ---
function updateRoleUI(role) {
  const badge = document.getElementById('role-badge');
  const profilePic = document.getElementById('profile-pic');
  
  // Strip previous classes
  badge.className = "role-title"; 
  
  if (role === "member") {
    badge.textContent = "Crzyclan Member";
    badge.classList.add("role-member");
    profilePic.style.borderColor = "#ff0000"; // Red border for official members
  } else if (role === "fan") {
    badge.textContent = "Crzyclan Fan";
    badge.classList.add("role-fan");
    profilePic.style.borderColor = "#0055ff"; // Blue border for fans
  } else {
    badge.textContent = "Community Guest";
    badge.classList.add("role-guest");
    profilePic.style.borderColor = "#555"; // Gray border for guests
  }
}

// --- UPDATE BIO ---
window.editBio = function() {
  if (!currentUserId) return;
  
  const newBio = prompt("Enter your new bio:");
  if (newBio !== null) {
    db.collection('profiles').doc(currentUserId).update({
      bio: newBio
    }).then(() => {
      document.getElementById('profile-bio').textContent = newBio;
    }).catch(error => {
      alert("Error updating bio: " + error.message);
    });
  }
};

// --- LIKE PROFILE ---
window.likeProfile = function() {
  // If we had a friend search, currentUserId here would be the ID of the friend you are viewing.
  // For now, it just likes the currently loaded profile.
  if (!currentUserId) {
    alert("You must be logged in to like a profile.");
    return;
  }
  
  const userRef = db.collection('profiles').doc(currentUserId);
  userRef.update({
    likes: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    // Manually update the number on screen so we don't have to reload the whole page
    const countSpan = document.getElementById('like-count');
    countSpan.textContent = parseInt(countSpan.textContent) + 1;
  });
};

// --- DAILY DM SYSTEM ---
function checkDMLimit(lastSentTimestamp) {
  const dmBtn = document.getElementById('dm-btn');
  
  if (!lastSentTimestamp) {
    dmBtn.textContent = "✉️ Send Daily DM (1/1)";
    dmBtn.style.opacity = "1";
    dmBtn.style.cursor = "pointer";
    return;
  }
  
  // Check if 24 hours (86400000 ms) have passed
  const now = Date.now();
  const timePassed = now - lastSentTimestamp;
  
  if (timePassed < 86400000) {
    // Less than 24 hours
    dmBtn.textContent = "✉️ Daily DM Used (0/1)";
    dmBtn.style.opacity = "0.5";
    dmBtn.style.cursor = "not-allowed";
  } else {
    // 24 hours have passed, reset button
    dmBtn.textContent = "✉️ Send Daily DM (1/1)";
    dmBtn.style.opacity = "1";
    dmBtn.style.cursor = "pointer";
  }
}

window.sendDailyDM = function() {
  if (!currentUserId) {
    alert("You must be logged in to send a message.");
    return;
  }

  const dmBtn = document.getElementById('dm-btn');
  if (dmBtn.textContent.includes("(0/1)")) {
    alert("You have already sent your daily DM! Check back tomorrow.");
    return;
  }

  const messageText = prompt("Type your Daily Message:");
  if (messageText && messageText.trim() !== "") {
    
    // 1. In a real app, you would save the message to a "messages" collection here.
    
    // 2. Update the user's profile to lock their DM button for 24 hours
    const now = Date.now();
    db.collection('profiles').doc(currentUserId).update({
      lastDMSent: now
    }).then(() => {
      alert("Message Sent!");
      checkDMLimit(now); // Instantly update the button to lock it
    });
  }
};
