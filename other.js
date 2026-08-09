const db = firebase.firestore();
let currentUserId = null;
let userRole = "guest";
let dmTimerInterval;

// --- AUTHENTICATION LISTENER ---
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    document.getElementById('logged-out-warning').style.display = 'none';
    
    const displayName = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-name').textContent = displayName;
    
    // Show edit buttons for "My Profile"
    document.getElementById('edit-bio-btn').style.display = 'inline-block';
    document.getElementById('set-song-btn').style.display = 'inline-block';
    document.getElementById('inbox-container').style.display = 'block';
    
    loadProfile(currentUserId);
    loadInbox(currentUserId);
  } else {
    document.getElementById('logged-out-warning').style.display = 'block';
    document.getElementById('profile-name').textContent = "Unknown Guest";
    document.getElementById('profile-bio').textContent = "Please log in to view and edit your profile.";
    document.getElementById('role-badge').textContent = "Not Logged In";
    document.getElementById('role-badge').className = "role-title role-guest";
    document.getElementById('dm-btn').textContent = "✉️ Log in to DM";
  }
});

// --- LOAD PROFILE DATA ---
function loadProfile(uid) {
  const userRef = db.collection('profiles').doc(uid);
  
  userRef.get().then((doc) => {
    if (doc.exists) {
      const data = doc.data();
      userRole = data.role || "guest";
      
      document.getElementById('profile-bio').textContent = data.bio || "This user hasn't written a bio yet.";
      document.getElementById('like-count').textContent = data.likes || 0;
      
      updateRoleUI(userRole);
      setupProfileSong(data.profileSong);
      checkDMLimit(data.dmHistory || []);
    } else {
      userRef.set({
        bio: "I just joined the Crzyclan Hub!",
        likes: 0,
        role: "guest",
        dmHistory: [],
        profileSong: ""
      });
      document.getElementById('profile-bio').textContent = "I just joined the Crzyclan Hub!";
      document.getElementById('like-count').textContent = 0;
      updateRoleUI("guest");
      checkDMLimit([]);
    }
  });
}

function updateRoleUI(role) {
  const badge = document.getElementById('role-badge');
  const profilePic = document.getElementById('profile-pic');
  badge.className = "role-title"; 
  
  if (role === "member") {
    badge.textContent = "Crzyclan Member";
    badge.classList.add("role-member");
    profilePic.style.borderColor = "#ff0000";
  } else if (role === "fan") {
    badge.textContent = "Crzyclan Fan";
    badge.classList.add("role-fan");
    profilePic.style.borderColor = "#0055ff";
  } else {
    badge.textContent = "Community Guest";
    badge.classList.add("role-guest");
    profilePic.style.borderColor = "#555";
  }
}

// --- PROFILE SONG LOGIC ---
function setupProfileSong(songUrl) {
  const audioEl = document.getElementById('profile-audio');
  const srcEl = document.getElementById('profile-audio-src');
  
  if (songUrl) {
    srcEl.src = songUrl;
    audioEl.load();
    
    // Attempt auto-play (Browser might block this until user clicks)
    const playPromise = audioEl.play();
    if (playPromise !== undefined) {
      playPromise.catch(error => {
        console.log("Browser blocked auto-play. User must click play manually.");
      });
    }
  }
}

window.setProfileSong = function() {
  const songUrl = prompt("Paste the file name (e.g., fadinglight.mp3) or a direct URL to your profile song:");
  if (songUrl) {
    db.collection('profiles').doc(currentUserId).update({
      profileSong: songUrl
    }).then(() => {
      setupProfileSong(songUrl);
    });
  }
};

window.editBio = function() {
  const newBio = prompt("Enter your new bio:");
  if (newBio !== null) {
    db.collection('profiles').doc(currentUserId).update({ bio: newBio }).then(() => {
      document.getElementById('profile-bio').textContent = newBio;
    });
  }
};

window.likeProfile = function() {
  if (!currentUserId) return alert("You must be logged in.");
  db.collection('profiles').doc(currentUserId).update({
    likes: firebase.firestore.FieldValue.increment(1)
  }).then(() => {
    const countSpan = document.getElementById('like-count');
    countSpan.textContent = parseInt(countSpan.textContent) + 1;
  });
};

// --- DAILY DM SYSTEM WITH TIMERS & LIMITS ---
function getDMLimit() {
  // Members and Fans get 2 DMs a day. Guests get 1.
  return (userRole === "member" || userRole === "fan") ? 2 : 1;
}

function checkDMLimit(dmHistory) {
  clearInterval(dmTimerInterval);
  const limit = getDMLimit();
  const now = Date.now();
  const twentyFourHours = 86400000;
  
  // Filter history to only include messages sent in the last 24 hours
  const recentDMs = dmHistory.filter(time => (now - time) < twentyFourHours);
  
  const dmBtn = document.getElementById('dm-btn');
  
  if (recentDMs.length < limit) {
    dmBtn.textContent = `✉️ Send Daily DM (${recentDMs.length}/${limit})`;
    dmBtn.style.opacity = "1";
    dmBtn.style.cursor = "pointer";
    dmBtn.disabled = false;
  } else {
    // Limit reached. Find out when the oldest message in the 24h window expires.
    const oldestDM = Math.min(...recentDMs);
    const resetTime = oldestDM + twentyFourHours;
    
    dmBtn.style.opacity = "0.5";
    dmBtn.style.cursor = "not-allowed";
    dmBtn.disabled = true;

    // Start live countdown timer
    dmTimerInterval = setInterval(() => {
      const timeLeft = resetTime - Date.now();
      if (timeLeft <= 0) {
        clearInterval(dmTimerInterval);
        checkDMLimit(recentDMs); // Re-run check to unlock
      } else {
        const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        dmBtn.textContent = `✉️ Available in ${hours}h ${minutes}m`;
      }
    }, 1000);
  }
}

window.sendDailyDM = function() {
  if (!currentUserId) return alert("You must be logged in to send a message.");
  
  db.collection('profiles').doc(currentUserId).get().then(doc => {
    const data = doc.data();
    const now = Date.now();
    const recentDMs = (data.dmHistory || []).filter(time => (now - time) < 86400000);
    
    if (recentDMs.length >= getDMLimit()) {
      return alert("You have reached your daily message limit.");
    }

    const messageText = prompt("Type your Daily Message (Sending to Yourself for testing):");
    if (messageText && messageText.trim() !== "") {
      
      recentDMs.push(now);
      
      // 1. Update sender's history to trigger timer
      db.collection('profiles').doc(currentUserId).update({
        dmHistory: recentDMs
      });

      // 2. Actually save the message to the database
      db.collection('messages').add({
        toUserId: currentUserId, // Currently sends to yourself
        fromName: firebase.auth().currentUser.displayName || "Unknown",
        text: messageText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Message Sent successfully!");
        checkDMLimit(recentDMs);
      });
    }
  });
};

// --- INBOX SYSTEM ---
function loadInbox(uid) {
  const inboxList = document.getElementById('messages-list');
  
  db.collection('messages')
    .where('toUserId', '==', uid)
    .orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      inboxList.innerHTML = ''; // Clear loading text
      
      if (snapshot.empty) {
        inboxList.innerHTML = '<p style="color: #888;">No messages yet.</p>';
        return;
      }

      snapshot.forEach(doc => {
        const msg = doc.data();
        const div = document.createElement('div');
        div.className = 'message-item';
        div.innerHTML = `
          <div class="meta">From: <strong>${msg.fromName}</strong></div>
          <div>${msg.text}</div>
        `;
        inboxList.appendChild(div);
      });
    });
}

// Placeholder for next step
window.setupPublicPlaylist = function() {
  alert("To link this to your music tab playlists, we need to decide if they select from a dropdown of their existing playlists, or build a new one here. Which do you prefer?");
};
