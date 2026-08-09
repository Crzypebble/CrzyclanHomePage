const db = firebase.firestore();
let currentUserId = null;
let userRole = "guest";
let dmTimerInterval;
let currentProfileData = null; // Stores data for toggling likes

// --- HARDCODED SONG DATABASE FOR PROFILE SEARCH ---
// So it can work independently of the music tab
const allSiteSongs = [
  { title: "Thick And The Bad (Ft.BiggieTrev)", file: "Thick_And_The_Bad.mp3" },
  { title: "i just wanna make good music", file: "i_just_wanna_make_good_music.mp3" },
  { title: "WHY (REMAKE) (Ft.BiggieTrev)", file: "WHY_REMAKEFtBiggieTrev.mp3" },
  { title: "Live My Life", file: "Live_My_Life.mp3" },
  { title: "Gold in the Backyard", file: "GoldInTheBackyard.m4a" },
  { title: "These Days (ft.CrzyReaper)", file: "These_DaysftCrzyReaper.mp3" },
  { title: "Lost In Time", file: "Lost_In_Time.mp3" },
  { title: "Welcome To Hell", file: "welcometohellprodblksaturn.mp3" },
  { title: "Smoke Bitches", file: "smokebitchesprodsmxkypete.mp3" },
  { title: "THE BOULDER: Rocks And Pebbles", file: "theboulderrocksandpebblesprodfuckserbab.mp3" },
  { title: "Gas", file: "gas.mp3" },
  { title: "Collide", file: "collideprodmyss.mp3" },
  { title: "Hurt Pebble", file: "hurtpebbleproddimebaggiefeaturingrockandjamma.mp3" },
  { title: "The Fading Light", file: "fadinglight.mp3" },
  { title: "Renaissance (Stoned)", file: "renaissancestoned.mp3" },
  { title: "Straight Ahead", file: "straightahead.mp3" },
  { title: "WHY", file: "why.mp3" },
  { title: "Carry The Fight", file: "carrythefight.mp3" },
  { title: "Kiss Of Death", file: "kissofdeath.mp3" },
  { title: "C3ZYCL4N", file: "c3zycl4n.mp3" },
  { title: "EVERYTHING", file: "everything.m4a" },
  { title: "Trigger Run", file: "triggerrun.mp3" },
  { title: "Down Below", file: "downbelow.mp3" },
  { title: "Days Before Death", file: "daysbeforedeath.mp3" },
  { title: "Dead Weight", file: "deadweight.mp3" },
  { title: "Eye Of The Loop", file: "eyeoftheloop.mp3" },
  { title: "Flesh and Signal", file: "fleshandsignal.mp3" },
  { title: "Mind in Red", file: "mindinred.mp3" },
  { title: "Crimson Code", file: "crimsoncode.mp3" },
  { title: "Cart was full", file: "cartwasfull.mp3" }
];


// --- SIDEBAR NAVIGATION ---
function switchHubView(viewId, btnElement) {
  // Hide all views
  document.querySelectorAll('.hub-view').forEach(view => view.classList.remove('active'));
  // Remove active state from all buttons
  document.querySelectorAll('.sidebar-btn').forEach(btn => btn.classList.remove('active'));
  
  // Show selected view
  document.getElementById(viewId).classList.add('active');
  btnElement.classList.add('active');

  // If opening profile, try playing the song automatically
  if(viewId === 'hub-profile') {
    const audio = document.getElementById('profile-audio');
    if (audio.src && audio.paused) {
      audio.play().catch(e => console.log("User must click to start audio."));
    }
  }
}

// --- EXPAND GAMES ---
function toggleSection(sectionId) {
  const section = document.getElementById(sectionId);
  section.style.display = section.style.display === "block" ? "none" : "block";
}


// --- AUTHENTICATION LISTENER ---
firebase.auth().onAuthStateChanged((user) => {
  if (user) {
    currentUserId = user.uid;
    document.getElementById('logged-out-warning').style.display = 'none';
    
    const displayName = user.displayName || user.email.split('@')[0];
    document.getElementById('profile-name').textContent = displayName;
    
    document.getElementById('edit-bio-btn').style.display = 'inline-block';
    document.getElementById('set-song-btn').style.display = 'inline-block';
    
    loadProfile(currentUserId);
    loadInbox(currentUserId);
  } else {
    document.getElementById('logged-out-warning').style.display = 'block';
  }
});

// --- LOAD PROFILE ---
function loadProfile(uid) {
  db.collection('profiles').doc(uid).onSnapshot((doc) => {
    if (doc.exists) {
      currentProfileData = doc.data();
      userRole = currentProfileData.role || "guest";
      
      document.getElementById('profile-bio').textContent = currentProfileData.bio || "No bio set.";
      
      // Setup Likes (Array length)
      const likedByArray = currentProfileData.likedBy || [];
      document.getElementById('like-count').textContent = likedByArray.length;
      
      const likeBtn = document.getElementById('like-btn-element');
      if (currentUserId && likedByArray.includes(currentUserId)) {
        likeBtn.innerHTML = `👍 Unlike <span id="like-count" style="font-weight:bold; margin-left:5px;">${likedByArray.length}</span>`;
        likeBtn.classList.add('liked');
      } else {
        likeBtn.innerHTML = `👍 Like <span id="like-count" style="font-weight:bold; margin-left:5px;">${likedByArray.length}</span>`;
        likeBtn.classList.remove('liked');
      }

      // Setup Background Image
      if (currentProfileData.profileBg) {
        document.getElementById('profile-bg-container').style.backgroundImage = `url('${currentProfileData.profileBg}')`;
      } else {
        document.getElementById('profile-bg-container').style.backgroundImage = 'none';
      }
      
      updateRoleUI(userRole);
      setupProfileSong(currentProfileData.profileSongTitle, currentProfileData.profileSongFile);
      checkDMLimit(currentProfileData.dmHistory || []);
    } else {
      // First time setup
      db.collection('profiles').doc(uid).set({
        bio: "I just joined the Crzyclan Hub!",
        likedBy: [],
        role: "guest",
        dmHistory: []
      });
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

// --- TOGGLE LIKE SYSTEM ---
window.toggleLike = function() {
  if (!currentUserId) return alert("You must be logged in.");
  if (!currentProfileData) return;

  const userRef = db.collection('profiles').doc(currentUserId); // Replace with target UID in future
  const likedByArray = currentProfileData.likedBy || [];
  
  if (likedByArray.includes(currentUserId)) {
    // Unlike
    userRef.update({
      likedBy: firebase.firestore.FieldValue.arrayRemove(currentUserId)
    });
  } else {
    // Like
    userRef.update({
      likedBy: firebase.firestore.FieldValue.arrayUnion(currentUserId)
    });
  }
};

// --- CUSTOM PROFILE BACKGROUND ---
window.setCustomProfileBG = function() {
  const bgUrl = prompt("Paste an image URL (Imgur, Discord link, etc.) to set as your profile background. Leave blank to clear.");
  if (bgUrl !== null) {
    db.collection('profiles').doc(currentUserId).update({
      profileBg: bgUrl.trim()
    });
  }
};

// --- PROFILE SONG MODAL & SYSTEM ---
function setupProfileSong(title, file) {
  const audioEl = document.getElementById('profile-audio');
  const srcEl = document.getElementById('profile-audio-src');
  const textTitle = document.querySelector('.profile-song-box p');
  
  if (file) {
    srcEl.src = file;
    textTitle.textContent = `🎵 Profile Song: ${title}`;
    audioEl.load();
  }
}

window.openSongModal = function() {
  document.getElementById('song-selector-modal').style.display = 'flex';
  document.getElementById('song-search-input').value = "";
  switchSongTab('all');
};

window.closeModal = function(modalId) {
  document.getElementById(modalId).style.display = 'none';
};

let currentSongTab = 'all';
window.switchSongTab = function(tab) {
  currentSongTab = tab;
  document.getElementById('tab-all-songs').classList.remove('active');
  document.getElementById('tab-liked-songs').classList.remove('active');
  document.getElementById(`tab-${tab}-songs`).classList.add('active');
  filterSongs();
};

window.filterSongs = function() {
  const search = document.getElementById('song-search-input').value.toLowerCase();
  const listEl = document.getElementById('modal-song-list');
  listEl.innerHTML = '';
  
  // If showing liked songs, we would pull from Firestore user profile likes. 
  // Since we are keeping reads low, we will mock this or rely on localStorage if implemented on music.js
  let songsToRender = allSiteSongs;

  if (currentSongTab === 'liked') {
    // Simulating liked songs tab for now until we fully sync Music tab likes
    listEl.innerHTML = '<p style="padding: 10px; color: #888;">Liked songs sync coming soon. Please use All Songs.</p>';
    return;
  }

  songsToRender.forEach(song => {
    if (song.title.toLowerCase().includes(search)) {
      const div = document.createElement('div');
      div.className = 'song-list-item';
      div.innerHTML = `<span>${song.title}</span> <button class="sleek-btn" style="padding: 4px 8px; font-size: 0.8rem;">Select</button>`;
      div.onclick = () => {
        db.collection('profiles').doc(currentUserId).update({
          profileSongTitle: song.title,
          profileSongFile: song.file
        }).then(() => {
          closeModal('song-selector-modal');
        });
      };
      listEl.appendChild(div);
    }
  });
};

// --- PLAYLIST MODAL ---
window.openPlaylistModal = function() {
  if (!currentUserId) return;
  document.getElementById('playlist-selector-modal').style.display = 'flex';
  
  const dropdown = document.getElementById('playlist-dropdown');
  dropdown.innerHTML = '<option value="">-- Select a Playlist --</option>';
  
  // Fetch playlists from Firestore
  db.collection('playlists').where('ownerId', '==', currentUserId).get().then(snapshot => {
    if (snapshot.empty) {
      dropdown.innerHTML = '<option value="">You have no playlists yet.</option>';
    } else {
      snapshot.forEach(doc => {
        const pl = doc.data();
        dropdown.innerHTML += `<option value="${doc.id}">${pl.name} (${pl.tracks ? pl.tracks.length : 0} tracks)</option>`;
      });
    }
  });
};

window.savePublicPlaylist = function() {
  const selected = document.getElementById('playlist-dropdown').value;
  if (!selected) return alert("Select a playlist first.");
  
  db.collection('profiles').doc(currentUserId).update({
    publicPlaylistId: selected
  }).then(() => {
    alert("Public Playlist Updated!");
    closeModal('playlist-selector-modal');
  });
};

window.createNewPlaylistFromHub = function() {
  db.collection('playlists').where('ownerId', '==', currentUserId).get().then(snapshot => {
    if (snapshot.size >= 4) {
      alert("You have reached the maximum limit of 4 playlists per user.");
      return;
    }
    
    const name = prompt("Enter a name for your new playlist:");
    if (name) {
      db.collection('playlists').add({
        name: name,
        ownerId: currentUserId,
        tracks: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Playlist Created! You can add songs to it from the Music tab.");
        openPlaylistModal(); // Refresh dropdown
      });
    }
  });
};

// --- BIO, DM, INBOX & SEARCH LOGIC ---
window.editBio = function() {
  const newBio = prompt("Enter your new bio:");
  if (newBio !== null) db.collection('profiles').doc(currentUserId).update({ bio: newBio });
};

function getDMLimit() { return (userRole === "member" || userRole === "fan") ? 2 : 1; }

function checkDMLimit(dmHistory) {
  clearInterval(dmTimerInterval);
  const limit = getDMLimit();
  const now = Date.now();
  const recentDMs = dmHistory.filter(time => (now - time) < 86400000);
  const dmBtn = document.getElementById('dm-btn');
  
  if (recentDMs.length < limit) {
    dmBtn.textContent = `✉️ Daily DM (${recentDMs.length}/${limit})`;
    dmBtn.style.opacity = "1";
    dmBtn.disabled = false;
  } else {
    const oldestDM = Math.min(...recentDMs);
    const resetTime = oldestDM + 86400000;
    dmBtn.style.opacity = "0.5";
    dmBtn.disabled = true;

    dmTimerInterval = setInterval(() => {
      const timeLeft = resetTime - Date.now();
      if (timeLeft <= 0) {
        clearInterval(dmTimerInterval);
        checkDMLimit(recentDMs);
      } else {
        const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
        dmBtn.textContent = `✉️ Available in ${h}h ${m}m`;
      }
    }, 1000);
  }
}

window.sendDailyDM = function() {
  if (!currentUserId) return alert("Log in to send messages.");
  
  db.collection('profiles').doc(currentUserId).get().then(doc => {
    const data = doc.data();
    const recentDMs = (data.dmHistory || []).filter(time => (Date.now() - time) < 86400000);
    
    if (recentDMs.length >= getDMLimit()) return alert("Daily message limit reached.");

    const messageText = prompt("Type your Daily Message (Currently sends to your own inbox for testing):");
    if (messageText && messageText.trim() !== "") {
      recentDMs.push(Date.now());
      db.collection('profiles').doc(currentUserId).update({ dmHistory: recentDMs });

      db.collection('messages').add({
        toUserId: currentUserId,
        fromName: firebase.auth().currentUser.displayName || "Unknown",
        text: messageText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      }).then(() => {
        alert("Message Sent!");
        checkDMLimit(recentDMs);
      });
    }
  });
};

function loadInbox(uid) {
  const inboxList = document.getElementById('messages-list');
  db.collection('messages').where('toUserId', '==', uid).orderBy('timestamp', 'desc')
    .onSnapshot(snapshot => {
      inboxList.innerHTML = ''; 
      if (snapshot.empty) return inboxList.innerHTML = '<p style="color: #888;">No messages yet.</p>';

      snapshot.forEach(doc => {
        const msg = doc.data();
        const div = document.createElement('div');
        div.className = 'message-item';
        div.innerHTML = `<div class="meta">From: <strong>${msg.fromName}</strong></div><div>${msg.text}</div>`;
        inboxList.appendChild(div);
      });
    });
}

window.searchFriend = function() {
  const input = document.getElementById('friend-search-input').value.trim();
  if(!input) return;
  document.getElementById('friend-search-results').innerHTML = `<p style="color: #aaa;">Searching for ${input}...</p>`;
  
  // Real implementation would query users here.
  setTimeout(() => {
    document.getElementById('friend-search-results').innerHTML = `<p style="color: #ff0000;">User not found. (Database index building required for live search).</p>`;
  }, 1000);
};
