let db;
let currentUserId = null;
let userRole = "guest";
let dmTimerInterval;
let currentProfileData = null;

const DEFAULT_PFP = "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true";

document.addEventListener("DOMContentLoaded", () => {
  db = firebase.firestore();

  // --- AUTHENTICATION LISTENER ---
  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById('logged-out-warning').style.display = 'none';
      
      const displayName = user.displayName || user.email.split('@')[0];
      document.getElementById('profile-name').textContent = displayName;
      
      document.getElementById('edit-bio-btn').style.display = 'inline-block';
      document.getElementById('set-song-btn').style.display = 'inline-block';
      
      // Save display name to database so the user becomes searchable in the Add Friend system
      db.collection('profiles').doc(currentUserId).set({
        displayName: displayName,
        searchName: displayName.toLowerCase() // Lowercase makes searching easier
      }, { merge: true });

      loadProfile(currentUserId);
      loadInbox(currentUserId);
    } else {
      document.getElementById('logged-out-warning').style.display = 'block';
    }
  });

  // --- INSTANT DEVICE IMAGE CONVERTER ---
  document.getElementById('bg-uploader').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1048576) {
      alert("Please choose an image smaller than 1MB to keep your profile fast.");
      return;
    }

    const reader = new FileReader();
    reader.onload = function(uploadEvent) {
      const base64Image = uploadEvent.target.result;
      
      db.collection('profiles').doc(currentUserId).update({
        profileBg: base64Image
      }).then(() => {
        alert("Profile background updated successfully!");
      }).catch(err => {
        alert("Error saving background: " + err.message);
      });
    };
    reader.readAsDataURL(file);
  });
});

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

// --- LOAD PROFILE ---
function loadProfile(uid) {
  db.collection('profiles').doc(uid).onSnapshot((doc) => {
    if (doc.exists) {
      currentProfileData = doc.data();
      userRole = currentProfileData.role || "guest";
      
      document.getElementById('profile-bio').textContent = currentProfileData.bio || "No bio set.";
      
      // Load custom profile picture (Settings integration prep)
      const pfp = currentProfileData.profilePic || DEFAULT_PFP;
      document.getElementById('profile-pic').src = pfp;

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

      if (currentProfileData.profileBg) {
        document.getElementById('profile-bg-container').style.backgroundImage = `url('${currentProfileData.profileBg}')`;
      } else {
        document.getElementById('profile-bg-container').style.backgroundImage = 'none';
      }
      
      updateRoleUI(userRole);
      setupProfileSong(currentProfileData.profileSongTitle, currentProfileData.profileSongFile);
      checkDMLimit(currentProfileData.dmHistory || []);
      
      if (currentProfileData.publicPlaylistName) {
        document.getElementById('public-playlist-title').textContent = currentProfileData.publicPlaylistName;
        document.getElementById('public-playlist-info').textContent = `${currentProfileData.publicPlaylistTrackCount} Tracks`;
      } else {
        document.getElementById('public-playlist-title').textContent = "No Public Playlist Set";
        document.getElementById('public-playlist-info').textContent = "Select one of your existing playlists.";
      }

      // Load friends dynamically whenever the profile document changes
      renderFriendsList(currentProfileData.friends || []);

    } else {
      db.collection('profiles').doc(uid).set({
        bio: "I just joined the Crzyclan Hub!",
        likedBy: [],
        role: "guest",
        dmHistory: [],
        friends: []
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

// --- FRIENDS LIST SYSTEM ---

window.searchFriend = function() {
  const input = document.getElementById('friend-search-input').value.trim();
  if(!input) return;
  
  const resultsContainer = document.getElementById('friend-search-results');
  resultsContainer.innerHTML = `<p style="color: #aaa;">Searching for exact match: ${input}...</p>`;

  // Searches database for exact display name (ignoring caps)
  db.collection('profiles').where('searchName', '==', input.toLowerCase()).get()
    .then(snapshot => {
      resultsContainer.innerHTML = '';
      
      if (snapshot.empty) {
        resultsContainer.innerHTML = `<p style="color: #ff0000;">User not found. Check spelling!</p>`;
        return;
      }

      snapshot.forEach(doc => {
        if (doc.id === currentUserId) return; // Hide current user from search
        
        const userData = doc.data();
        const pfp = userData.profilePic || DEFAULT_PFP;
        
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="${pfp}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #555;">
            <strong style="color:#fff;">${userData.displayName || "Unknown User"}</strong>
          </div>
          <button class="sleek-btn" style="background:#ff0000; color:#fff; border:none;" onclick="addFriend('${doc.id}', '${userData.displayName || 'Unknown'}')">Add Friend</button>
        `;
        resultsContainer.appendChild(div);
      });

      if (resultsContainer.innerHTML === '') {
         resultsContainer.innerHTML = `<p style="color: #ff0000;">User not found.</p>`;
      }
    }).catch(err => {
      resultsContainer.innerHTML = `<p style="color: #ff0000;">Error searching: ${err.message}</p>`;
    });
};

window.addFriend = function(friendUid, friendName) {
  if (!currentUserId) return;
  const friendsArray = currentProfileData.friends || [];

  if (friendsArray.includes(friendUid)) {
    return alert(`${friendName} is already in your friends list!`);
  }

  // Hard cap of 20 friends
  if (friendsArray.length >= 20) {
    return alert("You have reached the maximum limit of 20 friends.");
  }

  db.collection('profiles').doc(currentUserId).update({
    friends: firebase.firestore.FieldValue.arrayUnion(friendUid)
  }).then(() => {
    alert(`${friendName} added to your friends list!`);
    document.getElementById('friend-search-results').innerHTML = '';
    document.getElementById('friend-search-input').value = '';
  });
};

function renderFriendsList(friendsArray) {
  const container = document.getElementById('friends-list-container');
  if (!container) return;

  if (friendsArray.length === 0) {
    container.innerHTML = '<p style="color: #888;">Your friends list is empty. Go add some friends!</p>';
    return;
  }

  container.innerHTML = '<p style="color: #aaa;">Loading friends...</p>';

  // Fetch all friend profiles dynamically
  const fetchPromises = friendsArray.map(uid => db.collection('profiles').doc(uid).get());

  Promise.all(fetchPromises).then(snapshots => {
    container.innerHTML = `<p style="color: #aaa; margin-bottom: 15px; border-bottom: 1px solid #333; padding-bottom: 10px;">You have ${friendsArray.length}/20 friends.</p>`;
    
    snapshots.forEach(doc => {
      if (doc.exists) {
        const friendData = doc.data();
        const pfp = friendData.profilePic || DEFAULT_PFP;
        let roleText = 'Community Guest';
        if (friendData.role === 'member') roleText = 'Crzyclan Member';
        if (friendData.role === 'fan') roleText = 'Crzyclan Fan';

        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="${pfp}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #555;">
            <div>
              <strong style="color:#fff; font-size:1.1rem;">${friendData.displayName || "Unknown User"}</strong>
              <div style="font-size:0.8rem; color:#888;">${roleText}</div>
            </div>
          </div>
          <button class="sleek-btn" style="border-color:#ff0000; color:#ff0000;" onclick="removeFriend('${doc.id}', '${friendData.displayName || 'Unknown'}')">Remove</button>
        `;
        container.appendChild(div);
      }
    });
  });
}

window.removeFriend = function(friendUid, friendName) {
  if (!confirm(`Are you sure you want to remove ${friendName} from your friends list?`)) return;

  db.collection('profiles').doc(currentUserId).update({
    friends: firebase.firestore.FieldValue.arrayRemove(friendUid)
  }).then(() => {
     // UI automatically refreshes due to the realtime onSnapshot in loadProfile
     console.log("Friend removed");
  });
}

window.toggleLike = function() {
  if (!currentUserId) return alert("You must be logged in.");
  if (!currentProfileData) return;

  const userRef = db.collection('profiles').doc(currentUserId); 
  const likedByArray = currentProfileData.likedBy || [];
  
  if (likedByArray.includes(currentUserId)) {
    userRef.update({ likedBy: firebase.firestore.FieldValue.arrayRemove(currentUserId) });
  } else {
    userRef.update({ likedBy: firebase.firestore.FieldValue.arrayUnion(currentUserId) });
  }
};

window.setCustomProfileBG = function() {
  document.getElementById('bg-uploader').click();
};

function setupProfileSong(title, file) {
  const audioEl = document.getElementById('profile-audio');
  const srcEl = document.getElementById('profile-audio-src');
  const textTitle = document.querySelector('.profile-song-box p');
  
  if (srcEl.getAttribute('src') === file) return;
  
  if (file) {
    srcEl.src = file;
    textTitle.textContent = `🎵 Profile Song: ${title}`;
    audioEl.load();
  }
}

window.openSongModal = function() {
  document.getElementById('song-selector-modal').style.display = 'flex';
  document.getElementById('song-search-input').value = "";
  window.switchSongTab('all');
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
  window.filterSongs();
};

window.filterSongs = function() {
  const search = document.getElementById('song-search-input').value.toLowerCase();
  const listEl = document.getElementById('modal-song-list');
  listEl.innerHTML = '';
  
  let songsToRender = allSiteSongs;

  if (currentSongTab === 'liked') {
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
          window.closeModal('song-selector-modal');
        });
      };
      listEl.appendChild(div);
    }
  });
};

window.openPlaylistModal = function() {
  if (!currentUserId) return;
  document.getElementById('playlist-selector-modal').style.display = 'flex';
  
  const dropdown = document.getElementById('playlist-dropdown');
  dropdown.innerHTML = '<option value="">-- Loading your playlists... --</option>';
  
  db.collection('userVotes').doc(currentUserId).get().then(doc => {
    if (!doc.exists || !doc.data().playlists || doc.data().playlists.length === 0) {
      dropdown.innerHTML = '<option value="">You have no playlists yet.</option>';
    } else {
      dropdown.innerHTML = '<option value="">-- Select a Playlist --</option>';
      const playlists = doc.data().playlists;
      
      playlists.forEach((pl, index) => {
        dropdown.innerHTML += `<option value="${index}">${pl.name} (${pl.songs ? pl.songs.length : 0} tracks)</option>`;
      });
    }
  });
};

window.savePublicPlaylist = function() {
  const selectedIndex = document.getElementById('playlist-dropdown').value;
  if (selectedIndex === "") return alert("Select a playlist first.");
  
  db.collection('userVotes').doc(currentUserId).get().then(doc => {
    const playlists = doc.data().playlists || [];
    const selectedPl = playlists[selectedIndex];
    
    db.collection('profiles').doc(currentUserId).update({
      publicPlaylistName: selectedPl.name,
      publicPlaylistTrackCount: selectedPl.songs ? selectedPl.songs.length : 0
    }).then(() => {
      alert("Public Playlist Updated!");
      window.closeModal('playlist-selector-modal');
    });
  });
};

window.createNewPlaylistFromHub = function() {
  if (!currentUserId) return;
  
  const name = prompt("Enter a name for your new playlist:");
  if (name) {
    const newPlaylist = { name: name, cover: null, songs: [] };
    
    db.collection('userVotes').doc(currentUserId).set({
      playlists: firebase.firestore.FieldValue.arrayUnion(newPlaylist)
    }, { merge: true }).then(() => {
      alert("Playlist Created! It is now synced with your Music tab.");
      window.openPlaylistModal(); 
    }).catch(err => alert("Error: " + err.message));
  }
};

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
