let db;
let currentUserId = null;
let currentViewedProfileId = null; 
let dmTimerInterval;
let myProfileData = null; 
let viewedProfileData = null;
let profileListenerUnsubscribe = null;
let inboxListenerUnsubscribe = null;
let previousRequestCount = null; 

// Replaced with a 1x1 black pixel data URI to perfectly create a black circle without broken image icons
const DEFAULT_PFP = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

document.addEventListener("DOMContentLoaded", () => {
  db = firebase.firestore();

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      currentUserId = user.uid;
      document.getElementById('logged-out-warning').style.display = 'none';
      
      const displayName = user.displayName || user.email.split('@')[0];
      
      db.collection('profiles').doc(currentUserId).set({
        displayName: displayName,
        searchName: displayName.toLowerCase() 
      }, { merge: true });

      listenToMyData(currentUserId);
      viewProfile(currentUserId);

      // --- NEW: URL PARAMETER PROFILE LOADER ---
      // Checks if the URL is something like other.html?viewUser=crzypebble
      const urlParams = new URLSearchParams(window.location.search);
      const targetUser = urlParams.get('viewUser');
      if (targetUser) {
        db.collection('profiles').where('searchName', '==', targetUser.toLowerCase()).get()
          .then(snapshot => {
            if (!snapshot.empty) {
              const targetUid = snapshot.docs[0].id;
              viewProfile(targetUid);
              
              // Automatically switch to the profile view if the function exists
              if (typeof switchHubView === 'function') {
                switchHubView('hub-profile');
              }
            }
          });
      }

    } else {
      document.getElementById('logged-out-warning').style.display = 'block';
    }
  });

  // --- COMPRESSOR FOR PROFILE BACKGROUND UPLOADER ---
  document.getElementById('bg-uploader').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        let width = img.width;
        let height = img.height;
        let maxWidth = 1920;
        let maxHeight = 1080;

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

        const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

        db.collection('profiles').doc(currentUserId).update({ profileBg: compressedDataUrl })
          .then(() => alert("Background updated and compressed successfully!"))
          .catch(err => alert("Error: " + err.message));
      };
    };
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
  { title: "THE BOULDER", file: "theboulderrocksandpebblesprodfuckserbab.mp3" },
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

// --- SILENT IN-APP NOTIFICATION BANNER ---
function showNotificationBanner(msg) {
  let banner = document.getElementById('toast-notification');
  if (!banner) {
    banner = document.createElement('div');
    banner.id = 'toast-notification';
    banner.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #ff0000;
      color: #ffffff;
      padding: 15px 25px;
      border-radius: 8px;
      box-shadow: 0 5px 20px rgba(0,0,0,0.8);
      font-weight: bold;
      z-index: 9999;
      display: flex;
      align-items: center;
      gap: 10px;
      animation: slideIn 0.3s ease-out;
      border: 1px solid #ffffff;
    `;
    document.body.appendChild(banner);
  }

  banner.textContent = msg;
  banner.style.display = 'flex';

  // Automatically hide after 4 seconds
  setTimeout(() => {
    if (banner) banner.style.display = 'none';
  }, 4000);
}

function listenToMyData(uid) {
  db.collection('profiles').doc(uid).onSnapshot(doc => {
    if (doc.exists) {
      myProfileData = doc.data();
      renderFriendsList(myProfileData.friends || []);
      
      const requests = myProfileData.friendRequests || [];
      renderFriendRequests(requests);
      
      const badge = document.getElementById('request-badge');
      if (requests.length > 0) {
        badge.style.display = 'inline-block';
        badge.textContent = requests.length;
      } else {
        badge.style.display = 'none';
      }

      if (previousRequestCount !== null && requests.length > previousRequestCount) {
        showNotificationBanner("⚡ You received a new friend request!");
      }
      
      previousRequestCount = requests.length;
    }
  });
}

window.viewMyProfile = function(btn) {
  if(!currentUserId) return;
  viewProfile(currentUserId);
  switchHubView('hub-profile', btn);
};

window.viewProfile = function(targetUid) {
  if(!currentUserId) return;
  
  if(profileListenerUnsubscribe) profileListenerUnsubscribe();
  if(inboxListenerUnsubscribe) inboxListenerUnsubscribe();

  currentViewedProfileId = targetUid;
  const isOwner = (currentUserId === targetUid);

  document.getElementById('owner-controls-sidebar').style.display = isOwner ? "flex" : "none";
  document.getElementById('edit-bio-btn').style.display = isOwner ? "inline-block" : "none";
  document.getElementById('setup-playlist-btn').style.display = isOwner ? "inline-block" : "none";
  document.getElementById('song-speed-select').style.display = isOwner ? "inline-block" : "none";
  
  document.getElementById('visitor-controls-sidebar').style.display = isOwner ? "none" : "flex";
  
  document.getElementById('profile-view-header').textContent = isOwner ? "My Profile" : "Viewing Profile";
  document.getElementById('inbox-header-title').textContent = isOwner ? "📬 Your Inbox" : "📬 Leave a Message";
  
  const audioEl = document.getElementById('profile-audio');
  audioEl.pause();
  document.getElementById('mini-play-btn').textContent = "▶";

  profileListenerUnsubscribe = db.collection('profiles').doc(targetUid).onSnapshot((doc) => {
    if (doc.exists) {
      viewedProfileData = doc.data();
      
      document.getElementById('profile-name').textContent = viewedProfileData.displayName || "Unknown User";
      document.getElementById('profile-pic').src = viewedProfileData.profilePic || DEFAULT_PFP;
      document.getElementById('profile-bio').textContent = viewedProfileData.bio || "No bio set.";
      
      const role = viewedProfileData.role || "guest";
      updateRoleUI(role);

      if (isOwner) {
        const priv = viewedProfileData.inboxPrivacy || 'public';
        document.getElementById('privacy-toggle-btn').textContent = `🔒 Inbox: ${priv === 'private' ? 'Private' : 'Public'}`;
      }

      if (viewedProfileData.profileBg) {
        document.getElementById('profile-bg-container').style.backgroundImage = `url('${viewedProfileData.profileBg}')`;
      } else {
        document.getElementById('profile-bg-container').style.backgroundImage = 'none';
      }

      const likedBy = viewedProfileData.likedBy || [];
      const likeBtn = document.getElementById('like-btn-element');
      likeBtn.innerHTML = `👍 ${likedBy.includes(currentUserId) ? 'Unlike' : 'Like'} <span id="like-count" style="font-weight:bold; margin-left:5px;">${likedBy.length}</span>`;
      if(likedBy.includes(currentUserId)) likeBtn.classList.add('liked');
      else likeBtn.classList.remove('liked');

      const title = viewedProfileData.profileSongTitle || "No song set";
      const file = viewedProfileData.profileSongFile || "";
      let speed = viewedProfileData.profileSongSpeed || 1.0;
      
      if (speed < 0.7) speed = 0.7;
      if (speed > 1.3) speed = 1.3;
      
      document.getElementById('mini-song-title').textContent = title;
      
      if (audioEl.getAttribute('src') !== file && file !== "") {
        audioEl.src = file; 
        audioEl.load();
      }
      
      audioEl.playbackRate = speed;
      if (isOwner) document.getElementById('song-speed-select').value = speed;

      if (viewedProfileData.publicPlaylistName) {
        document.getElementById('public-playlist-title').textContent = viewedProfileData.publicPlaylistName;
        document.getElementById('public-playlist-info').textContent = `${viewedProfileData.publicPlaylistTrackCount} Tracks`;
        document.getElementById('view-playlist-btn').style.display = "inline-block";
      } else {
        document.getElementById('public-playlist-title').textContent = "No Public Playlist Set";
        document.getElementById('public-playlist-info').textContent = "Empty";
        document.getElementById('view-playlist-btn').style.display = "none";
      }

      if (!isOwner && myProfileData) {
        const btn = document.getElementById('friend-action-btn');
        const friends = myProfileData.friends || [];
        const outgoing = myProfileData.outgoingRequests || [];
        
        if (friends.includes(targetUid)) {
          btn.textContent = "Remove Friend";
          btn.style.background = "#333";
          btn.onclick = () => removeFriend(targetUid, viewedProfileData.displayName);
        } else if (outgoing.includes(targetUid)) {
          btn.textContent = "Request Sent";
          btn.style.background = "#555";
          btn.onclick = null; 
        } else {
          btn.textContent = "Add Friend";
          btn.style.background = "#ff0000";
          btn.onclick = () => sendFriendRequest(targetUid, viewedProfileData.displayName);
        }
      }

      if (!isOwner) {
        checkDMLimit();
      }
    }
  });

  // --- MESSAGE LISTENER & EXPIRATION LOGIC ---
  inboxListenerUnsubscribe = db.collection('messages').where('toUserId', '==', targetUid).onSnapshot(snapshot => {
      const inboxList = document.getElementById('messages-list');
      inboxList.innerHTML = ''; 
      
      const priv = viewedProfileData?.inboxPrivacy || 'public';
      if (!isOwner && priv === 'private') {
         inboxList.innerHTML = '<p style="color: #888;">🔒 This user has set their inbox to private.</p>';
         return;
      }

      if (snapshot.empty) return inboxList.innerHTML = '<p style="color: #888;">No messages yet.</p>';

      let messagesArray = [];
      const now = Date.now();

      snapshot.forEach(doc => {
        let msg = doc.data();
        msg.id = doc.id;

        if (!msg.expiresAt) {
            msg.expiresAt = (msg.timestamp ? msg.timestamp.toMillis() : now) + 86400000;
            msg.isPinned = false;
            db.collection('messages').doc(msg.id).update({ expiresAt: msg.expiresAt, isPinned: false });
        }

        if (!msg.isPinned && msg.expiresAt < now) {
            db.collection('messages').doc(msg.id).delete();
        } else {
            messagesArray.push(msg);
        }
      });

      if (messagesArray.length === 0) return inboxList.innerHTML = '<p style="color: #888;">No messages yet.</p>';
      
      messagesArray.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        const timeA = a.timestamp ? a.timestamp.toMillis() : now;
        const timeB = b.timestamp ? b.timestamp.toMillis() : now;
        return timeB - timeA;
      });

      messagesArray.forEach(msg => {
        let timeText = "";
        
        if (msg.isPinned) {
            timeText = `<span style="color:#ffd700; font-size:0.75rem;">📌 Pinned</span>`;
        } else {
            const timeLeft = msg.expiresAt - now;
            const h = Math.floor(timeLeft / (1000 * 60 * 60));
            const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            timeText = `<span style="color:#ffaa00; font-size:0.75rem;">⏳ ${h}h ${m}m left</span>`;
        }

        let pinBtnHTML = "";
        if (isOwner) {
            const pinClass = msg.isPinned ? "pin-btn active" : "pin-btn";
            const pinText = msg.isPinned ? "Unpin" : "Pin";
            pinBtnHTML = `<button class="${pinClass}" onclick="togglePinMessage('${msg.id}', ${msg.isPinned})">${pinText}</button>`;
        }

        const div = document.createElement('div');
        div.className = 'message-item';
        div.innerHTML = `
          <div style="width: 100%;">
            <div class="meta" style="display:flex; justify-content:space-between; align-items:center;">
              <div>From: <strong>${msg.fromName}</strong> ${pinBtnHTML}</div>
              ${timeText}
            </div>
            <div style="margin-top:5px; color:#ddd;">${msg.text}</div>
          </div>
        `;
        inboxList.appendChild(div);
      });
    });
};

// --- PIN LOGIC ---
window.togglePinMessage = function(msgId, currentlyPinned) {
    if (!currentUserId) return;
    
    if (currentlyPinned) {
        db.collection('messages').doc(msgId).update({ isPinned: false });
    } else {
        db.collection('messages').where('toUserId', '==', currentUserId).where('isPinned', '==', true).get().then(snap => {
            const role = myProfileData?.role || "guest";
            let limit = 1;
            if (role === "fan") limit = 2;
            if (role === "vip") limit = 5;
            if (role === "member") limit = 10;
            
            if (snap.size >= limit) {
                alert(`You can only pin up to ${limit} message(s). Unpin another message first.`);
            } else {
                db.collection('messages').doc(msgId).update({ isPinned: true });
            }
        });
    }
};

window.toggleInboxPrivacy = function() {
  if(!currentUserId || !myProfileData) return;
  const currentPrivacy = myProfileData.inboxPrivacy || 'public';
  const newPrivacy = currentPrivacy === 'public' ? 'private' : 'public';
  
  db.collection('profiles').doc(currentUserId).update({
    inboxPrivacy: newPrivacy
  }).then(() => {
    alert(`Your inbox is now ${newPrivacy}!`);
    document.getElementById('privacy-toggle-btn').textContent = `🔒 Inbox: ${newPrivacy === 'private' ? 'Private' : 'Public'}`;
  });
};

function updateRoleUI(role) {
  const badge = document.getElementById('role-badge');
  const profilePic = document.getElementById('profile-pic');
  
  badge.className = "role-title"; 
  
  if (role === "member") { 
    badge.textContent = "Crzyclan Member"; 
    badge.classList.add("role-member"); 
    profilePic.style.borderColor = "#ff0000"; 
  } else if (role === "vip") { 
    badge.textContent = "VIP Supporter"; 
    badge.classList.add("role-vip"); 
    profilePic.style.borderColor = "#ffaa00"; 
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

window.toggleProfileAudio = function() {
  const audio = document.getElementById('profile-audio');
  const btn = document.getElementById('mini-play-btn');
  
  if(!audio.getAttribute('src') || audio.getAttribute('src') === "") return;
  
  if(audio.paused) {
    audio.play().then(() => {
      btn.textContent = "⏸";
    }).catch(e => alert("Please interact with the page before playing audio!"));
  } else {
    audio.pause();
    btn.textContent = "▶";
  }
};

window.resetMiniPlayer = function() {
  document.getElementById('mini-play-btn').textContent = "▶";
};

window.saveSongSpeed = function(speedVal) {
  if(currentUserId !== currentViewedProfileId) return; 
  const audio = document.getElementById('profile-audio');
  let numSpeed = parseFloat(speedVal);
  if (numSpeed < 0.7) numSpeed = 0.7;
  if (numSpeed > 1.3) numSpeed = 1.3;
  audio.playbackRate = numSpeed;
  
  db.collection('profiles').doc(currentUserId).update({
    profileSongSpeed: numSpeed
  }).then(() => console.log("Speed saved"));
};


// --- FRIEND REQUEST SYSTEM ---
window.searchFriend = function() {
  const input = document.getElementById('friend-search-input').value.trim();
  if(!input) return;
  const resultsContainer = document.getElementById('friend-search-results');
  resultsContainer.innerHTML = `<p style="color: #aaa;">Searching...</p>`;

  db.collection('profiles').where('searchName', '==', input.toLowerCase()).get()
    .then(snapshot => {
      resultsContainer.innerHTML = '';
      if (snapshot.empty) return resultsContainer.innerHTML = `<p style="color: #ff0000;">User not found.</p>`;

      snapshot.forEach(doc => {
        if (doc.id === currentUserId) return; 
        const userData = doc.data();
        
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:15px;" onclick="viewProfileFromSearch('${doc.id}')">
            <img src="${userData.profilePic || DEFAULT_PFP}" style="width:40px; height:40px; border-radius:50%; object-fit:cover; border:2px solid #555;">
            <strong style="color:#fff;">${userData.displayName || "Unknown User"}</strong>
          </div>
          <button class="sleek-btn" style="background:#ff0000; border:none;" onclick="sendFriendRequest('${doc.id}', '${userData.displayName}')">Send Request</button>
        `;
        resultsContainer.appendChild(div);
      });
      if (resultsContainer.innerHTML === '') resultsContainer.innerHTML = `<p style="color: #ff0000;">User not found.</p>`;
    });
};

window.viewProfileFromSearch = function(uid) {
  viewProfile(uid);
  switchHubView('hub-profile');
};

window.sendFriendRequest = function(targetUid, targetName) {
  if (!currentUserId || !myProfileData) return;
  const friends = myProfileData.friends || [];
  const outgoing = myProfileData.outgoingRequests || [];

  if (friends.includes(targetUid)) return alert("Already friends!");
  if (outgoing.includes(targetUid)) return alert("Request already sent!");
  if (friends.length >= 20) return alert("You have reached the limit of 20 friends.");

  db.collection('profiles').doc(targetUid).update({
    friendRequests: firebase.firestore.FieldValue.arrayUnion(currentUserId)
  });
  db.collection('profiles').doc(currentUserId).update({
    outgoingRequests: firebase.firestore.FieldValue.arrayUnion(targetUid)
  }).then(() => alert(`Request sent to ${targetName}!`));
};

function renderFriendRequests(requestUids) {
  const container = document.getElementById('friend-requests-container');
  if (requestUids.length === 0) {
    container.innerHTML = '<p style="color: #888;">No pending requests.</p>';
    return;
  }
  container.innerHTML = '';
  requestUids.forEach(uid => {
    db.collection('profiles').doc(uid).get().then(doc => {
      if(doc.exists) {
        const d = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:15px;" onclick="viewProfileFromSearch('${doc.id}')">
            <img src="${d.profilePic || DEFAULT_PFP}" style="width:40px; height:40px; border-radius:50%;">
            <strong style="color:#fff;">${d.displayName || "Unknown"}</strong>
          </div>
          <div style="display:flex; gap:10px;">
            <button class="sleek-btn" style="background:#00b300; border:none;" onclick="acceptRequest('${doc.id}')">Accept</button>
            <button class="sleek-btn" style="background:#cc0000; border:none;" onclick="declineRequest('${doc.id}')">Decline</button>
          </div>
        `;
        container.appendChild(div);
      }
    });
  });
}

window.acceptRequest = function(requesterUid) {
  if((myProfileData.friends || []).length >= 20) return alert("You have reached the 20 friend limit.");
  
  db.collection('profiles').doc(currentUserId).update({
    friendRequests: firebase.firestore.FieldValue.arrayRemove(requesterUid),
    friends: firebase.firestore.FieldValue.arrayUnion(requesterUid)
  });
  db.collection('profiles').doc(requesterUid).update({
    outgoingRequests: firebase.firestore.FieldValue.arrayRemove(currentUserId),
    friends: firebase.firestore.FieldValue.arrayUnion(currentUserId)
  });
};

window.declineRequest = function(requesterUid) {
  db.collection('profiles').doc(currentUserId).update({
    friendRequests: firebase.firestore.FieldValue.arrayRemove(requesterUid)
  });
  db.collection('profiles').doc(requesterUid).update({
    outgoingRequests: firebase.firestore.FieldValue.arrayRemove(currentUserId)
  });
};

function renderFriendsList(friendsArray) {
  const container = document.getElementById('friends-list-container');
  if (friendsArray.length === 0) return container.innerHTML = '<p style="color: #888;">Your friends list is empty.</p>';

  container.innerHTML = `<p style="color: #aaa; border-bottom: 1px solid #333; padding-bottom: 10px;">You have ${friendsArray.length}/20 friends.</p>`;
  
  friendsArray.forEach(uid => {
    db.collection('profiles').doc(uid).get().then(doc => {
      if (doc.exists) {
        const fd = doc.data();
        const div = document.createElement('div');
        div.className = 'friend-item';
        div.onclick = () => viewProfileFromSearch(doc.id);
        div.innerHTML = `
          <div style="display:flex; align-items:center; gap:15px;">
            <img src="${fd.profilePic || DEFAULT_PFP}" style="width:50px; height:50px; border-radius:50%; object-fit:cover; border:2px solid #555;">
            <div>
              <strong style="color:#fff; font-size:1.1rem;">${fd.displayName || "Unknown User"}</strong>
            </div>
          </div>
          <button class="sleek-btn" style="border-color:#ff0000; color:#ff0000;" onclick="event.stopPropagation(); removeFriend('${doc.id}', '${fd.displayName || 'Unknown'}')">Remove</button>
        `;
        container.appendChild(div);
      }
    });
  });
}

window.removeFriend = function(friendUid, friendName) {
  if (!confirm(`Remove ${friendName}?`)) return;
  db.collection('profiles').doc(currentUserId).update({ friends: firebase.firestore.FieldValue.arrayRemove(friendUid) });
  db.collection('profiles').doc(friendUid).update({ friends: firebase.firestore.FieldValue.arrayRemove(currentUserId) });
  
  if (currentViewedProfileId === friendUid) {
     document.getElementById('friend-action-btn').textContent = "Add Friend";
     document.getElementById('friend-action-btn').style.background = "#ff0000";
     document.getElementById('friend-action-btn').onclick = () => sendFriendRequest(friendUid, friendName);
  }
};

// --- DIRECT MESSAGING ---
function getDMLimit() { 
  let role = "guest";
  if(myProfileData && myProfileData.role) role = myProfileData.role;
  
  if (role === "member") return 4; 
  if (role === "vip") return 15;
  if (role === "fan") return 5;
  return 1; 
}

function checkDMLimit() {
  clearInterval(dmTimerInterval);
  const dmBtn = document.getElementById('dm-btn');
  if(!dmBtn || !currentUserId) return;

  db.collection('profiles').doc(currentUserId).get().then(doc => {
    if(doc.exists) {
      const limit = getDMLimit();
      const history = doc.data().dmHistory || [];
      const now = Date.now();
      const recentDMs = history.filter(time => (now - time) < 86400000);
      
      if (recentDMs.length < limit) {
        dmBtn.textContent = `✉️ Send Message (Sent: ${recentDMs.length} / Limit: ${limit})`;
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
            checkDMLimit();
          } else {
            const h = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const m = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
            dmBtn.textContent = `✉️ Available in ${h}h ${m}m`;
          }
        }, 1000);
      }
    }
  });
}

window.sendDirectMessage = function() {
  if (!currentUserId || !currentViewedProfileId) return;

  db.collection('profiles').doc(currentUserId).get().then(doc => {
    const data = doc.data();
    const limit = getDMLimit();
    const recentDMs = (data.dmHistory || []).filter(time => (Date.now() - time) < 86400000);
    
    if (recentDMs.length >= limit) return alert("Daily message limit reached.");

    const messageText = prompt(`Type your message to ${viewedProfileData.displayName}:`);
    if (messageText && messageText.trim() !== "") {
      
      recentDMs.push(Date.now());
      db.collection('profiles').doc(currentUserId).update({ dmHistory: recentDMs });

      db.collection('messages').add({
        toUserId: currentViewedProfileId, 
        fromName: firebase.auth().currentUser.displayName || "Unknown",
        text: messageText,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        expiresAt: Date.now() + 86400000, 
        isPinned: false
      }).then(() => {
        alert("Message Delivered!");
        checkDMLimit(); 
      });
    }
  });
};

// --- MODALS & PLAYLISTS ---
window.toggleLike = function() {
  if (!currentUserId || !currentViewedProfileId) return;
  const ref = db.collection('profiles').doc(currentViewedProfileId); 
  const likedByArray = viewedProfileData.likedBy || [];
  if (likedByArray.includes(currentUserId)) ref.update({ likedBy: firebase.firestore.FieldValue.arrayRemove(currentUserId) });
  else ref.update({ likedBy: firebase.firestore.FieldValue.arrayUnion(currentUserId) });
};

window.openSongModal = function() { document.getElementById('song-selector-modal').style.display = 'flex'; window.switchSongTab('all'); };
window.closeModal = function(id) { document.getElementById(id).style.display = 'none'; };

window.switchSongTab = function() {
  const listEl = document.getElementById('modal-song-list');
  listEl.innerHTML = '';
  allSiteSongs.forEach(song => {
    const div = document.createElement('div');
    div.className = 'song-list-item';
    div.innerHTML = `<span>${song.title}</span> <button class="sleek-btn" style="padding: 4px 8px; font-size: 0.8rem;">Select</button>`;
    div.onclick = () => {
      db.collection('profiles').doc(currentUserId).update({ profileSongTitle: song.title, profileSongFile: song.file })
        .then(() => window.closeModal('song-selector-modal'));
    };
    listEl.appendChild(div);
  });
};

window.openPlaylistModal = function() {
  document.getElementById('playlist-selector-modal').style.display = 'flex';
  const dropdown = document.getElementById('playlist-dropdown');
  dropdown.innerHTML = '<option value="">-- Loading --</option>';
  
  db.collection('userVotes').doc(currentUserId).get().then(doc => {
    if (!doc.exists || !doc.data().playlists) { dropdown.innerHTML = '<option value="">No playlists yet.</option>'; return;}
    dropdown.innerHTML = '<option value="">-- Select Playlist --</option>';
    doc.data().playlists.forEach((pl, idx) => {
      dropdown.innerHTML += `<option value="${idx}">${pl.name} (${pl.songs ? pl.songs.length : 0} tracks)</option>`;
    });
  });
};

window.savePublicPlaylist = function() {
  const sel = document.getElementById('playlist-dropdown').value;
  if(sel === "") return;
  db.collection('userVotes').doc(currentUserId).get().then(doc => {
    const pl = doc.data().playlists[sel];
    db.collection('profiles').doc(currentUserId).update({
      publicPlaylistName: pl.name,
      publicPlaylistTrackCount: pl.songs ? pl.songs.length : 0,
      publicPlaylistIndex: sel 
    }).then(() => { alert("Updated!"); window.closeModal('playlist-selector-modal'); });
  });
};

window.openPublicPlaylistViewer = function() {
  if(!viewedProfileData || viewedProfileData.publicPlaylistIndex === undefined) return;
  
  const modal = document.getElementById('public-playlist-viewer-modal');
  modal.style.display = 'flex';
  document.getElementById('viewer-playlist-title').textContent = viewedProfileData.publicPlaylistName;
  
  const trackList = document.getElementById('viewer-track-list');
  trackList.innerHTML = '<p style="padding:10px; color:#aaa;">Loading tracks...</p>';

  db.collection('userVotes').doc(currentViewedProfileId).get().then(doc => {
    if(doc.exists && doc.data().playlists) {
      const pl = doc.data().playlists[viewedProfileData.publicPlaylistIndex];
      trackList.innerHTML = '';
      if(!pl.songs || pl.songs.length === 0) {
         trackList.innerHTML = '<p style="padding:10px; color:#888;">Playlist is empty.</p>';
         return;
      }
      pl.songs.forEach(song => {
        const div = document.createElement('div');
        div.className = 'song-list-item';
        div.innerHTML = `<span>${song.title} <small style="color:#aaa;">- ${song.artist}</small></span> <button class="sleek-btn" style="padding:4px 8px; font-size:0.8rem;">▶</button>`;
        div.onclick = () => playModalAudio(song.src, song.title);
        trackList.appendChild(div);
      });
    }
  });
};

window.playModalAudio = function(src, title) {
  const audio = document.getElementById('modal-audio');
  document.getElementById('modal-song-title').textContent = title;
  
  document.getElementById('profile-audio').pause();
  document.getElementById('mini-play-btn').textContent = "▶";

  audio.src = src;
  audio.play().then(() => {
    document.getElementById('modal-play-btn').textContent = "⏸";
  }).catch(e => alert("Please interact with the page before playing audio!"));
};

window.toggleModalAudio = function() {
  const audio = document.getElementById('modal-audio');
  const btn = document.getElementById('modal-play-btn');
  
  if(!audio.getAttribute('src') || audio.getAttribute('src') === "") return;
  
  if(audio.paused) { 
    audio.play(); 
    btn.textContent = "⏸"; 
  } else { 
    audio.pause(); 
    btn.textContent = "▶"; 
  }
};

window.stopModalAudio = function() {
  const audio = document.getElementById('modal-audio');
  audio.pause();
  audio.src = "";
  document.getElementById('modal-song-title').textContent = "Select a track below to play";
  document.getElementById('modal-play-btn').textContent = "▶";
};

window.resetModalPlayer = function() {
  document.getElementById('modal-play-btn').textContent = "▶";
};

window.editBio = function() {
  const newBio = prompt("Enter your new bio:");
  if (newBio !== null) db.collection('profiles').doc(currentUserId).update({ bio: newBio });
};

// --- PROJECT / GAME DETAILS / ART GALLERY SYSTEM ---
const siteProjects = {
  'dbd': {
    title: "Days Before Death",
    genre: "Survival / Horror",
    desc: "A gritty survival horror experience. Fight to stay alive, manage your resources, and uncover what lies in the darkness.",
    images: [
      "dbd1.jpg", 
      "dbd2.jpg"
    ],
    linkText: "Play on Roblox",
    link: "https://www.roblox.com/"
  },
  '2022': {
    title: "2022: The Game",
    genre: "Adventure",
    desc: "Step into the chaos of 2022. An adventure filled with custom Luau scripting, custom physical models, unique gameplay loops, and clan history.",
    images: [
      "2022_pic1.png",
      "2022_pic2.png"
    ],
    linkText: "Play on Roblox",
    link: "https://www.roblox.com/"
  },
  'up3': {
    title: "Unnamed Project 3",
    genre: "In Development",
    desc: "A highly classified upcoming project currently in the works. Stay tuned for advanced scripting mechanics and brand new environments.",
    images: [
      "project3_sneakpeek.jpg"
    ],
    linkText: "",
    link: "#"
  },
  'art_music': {
    title: "Album Covers & Concepts",
    genre: "Digital Art",
    desc: "Behind the scenes look at the artwork for The Pebble, 2022, and other visual media created by the team.",
    images: [
      "The Pebble Cover.jpg",
      "Skull 2022.png",
      "Badass irl edited.png"
    ],
    linkText: "",
    link: "#" 
  },
  'art_dice': {
    title: "CrzyReaper's Dice Sets",
    genre: "Physical Craft",
    desc: "Custom handmade dice and other physical art pieces created by CrzyReaper.",
    images: [
      "dice1.webp",
      "dice2.webp",
      "dice3.webp",
      "dice4.webp",
      "dice5.webp"
    ],
    linkText: "View on Instagram", 
    link: "#"
  }
};

window.openProjectDetails = function(projectId) {
  const proj = siteProjects[projectId];
  if(!proj) return;
  
  document.getElementById('project-modal-title').textContent = proj.title;
  document.getElementById('project-modal-genre').textContent = proj.genre;
  document.getElementById('project-modal-desc').textContent = proj.desc;
  
  const galleryEl = document.getElementById('project-modal-gallery');
  galleryEl.innerHTML = ''; 
  
  if (proj.images && proj.images.length > 0) {
    proj.images.forEach(imgUrl => {
      const img = document.createElement('img');
      img.src = imgUrl;
      img.className = 'project-gallery-img';
      galleryEl.appendChild(img);
    });
    galleryEl.style.display = "flex";
  } else {
    galleryEl.style.display = "none";
  }
  
  const linkEl = document.getElementById('project-modal-link');
  if (proj.link && proj.link !== "#") {
    linkEl.href = proj.link;
    linkEl.textContent = proj.linkText || "View Project";
    linkEl.style.display = "flex";
  } else {
    linkEl.style.display = "none"; 
  }
  
  document.getElementById('project-details-modal').style.display = 'flex';
};
