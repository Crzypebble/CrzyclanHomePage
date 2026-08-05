// music.js - site-wide UI for music library, queue, playlists, search

// ---------------- GLOBAL VOTE DATABASE & AUTH ----------------
let globalVotes = {};
let loggedInUser = null; 
let userLikes = [];    // Now stored in memory via Database, NOT LocalStorage
let userDislikes = [];
let userVotesUnsubscribe = null; // Helps us clean up when logging out

// Listen to Firestore in real-time if Firebase is loaded
if (typeof firebase !== 'undefined') {
  const db = firebase.firestore();

  // Track login state in the background
  firebase.auth().onAuthStateChanged((user) => {
    loggedInUser = user;
    
    // Stop listening to previous user's data if they logged out
    if (userVotesUnsubscribe) {
      userVotesUnsubscribe();
      userVotesUnsubscribe = null;
    }

    if (user) {
      // User is LOGGED IN: Fetch their personal likes from their Account ID
      userVotesUnsubscribe = db.collection("userVotes").doc(user.uid).onSnapshot((doc) => {
        if (doc.exists) {
          userLikes = doc.data().likes || [];
          userDislikes = doc.data().dislikes || [];
        } else {
          userLikes = [];
          userDislikes = [];
        }
        updateVoteUI(); // Light up their specific buttons
      });
    } else {
      // User is LOGGED OUT: Instantly clear personal likes from the screen
      userLikes = [];
      userDislikes = [];
      updateVoteUI(); 
    }
  });
  
  // This automatically fetches the global counts for ALL users
  db.collection("songVotes").onSnapshot((snapshot) => {
    snapshot.forEach(doc => {
      globalVotes[doc.id] = doc.data();
    });
    updateVoteUI(); 
    if (typeof renderTop10 === 'function') renderTop10(); 
  });
}

async function updateSongVote(src, type, increment) {
  if (typeof firebase === 'undefined') return; 
  
  const db = firebase.firestore();
  const songId = src.replace(/[^a-zA-Z0-9]/g, '_'); 
  const songRef = db.collection("songVotes").doc(songId);
  
  // Stop it from going below 0 in the global database
  const currentData = globalVotes[songId] || { likes: 0, dislikes: 0 };
  const currentCount = currentData[type] || 0;
  if (increment < 0 && currentCount <= 0) return; 
  
  try {
    await songRef.set({
      [type]: firebase.firestore.FieldValue.increment(increment)
    }, { merge: true });
  } catch (e) {
    console.error("Firebase Database Error:", e);
  }
}

// ---------------- SITE-WIDE SONG LIST ----------------
const masterSongs = [
  { title: "Welcome To Hell", artist: "Crzypebble", src: "welcometohellprodblksaturn.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Smoke Bitches", artist: "Crzypebble", src: "smokebitchesprodsmxkypete.mp3", source: "Official" },
  { title: "THE BOULDER", artist: "Crzypebble", src: "theboulderrocksandpebblesprodfuckserbab.mp3", source: "Official" },
  { title: "Gas", artist: "Crzypebble", src: "gas.mp3", source: "Official" },
  { title: "Collide", artist: "Crzypebble", src: "collideprodmyss.mp3", source: "Official" },
  { title: "Hurt Pebble", artist: "Crzypebble", src: "hurtpebbleproddimebaggiefeaturingrockandjamma.mp3", source: "Official" },
  { title: "The Fading Light Of The Renaissance", artist: "Crzypebble", src: "fadinglight.mp3", source: "Official" },
  { title: "Renaissance (Stoned)", artist: "Crzypebble", src: "renaissancestoned.mp3", source: "Official" },
  { title: "Straight Ahead", artist: "Crzypebble", src: "straightahead.mp3", source: "Official" },
  { title: "WHY", artist: "Crzypebble", src: "why.mp3", source: "Official" },
  { title: "Carry The Fight", artist: "Crzypebble", src: "carrythefight.mp3", source: "Official" },
  { title: "Kiss Of Death (Memories)", artist: "Crzypebble", src: "kissofdeath.mp3", source: "Official" },
  { title: "Collide FT. BIGGIETREV", artist: "Crzypebble", src: "collidebiggietrev.mp3", source: "Official" },
  { title: "C3ZYCL4N", artist: "Crzypebble", src: "c3zycl4n.mp3", source: "Official" },
  { title: "EVERYTHING", artist: "Crzypebble", src: "everything.m4a", source: "Official" },
  { title: "Why Do I Try?", artist: "Crzypebble", src: "whydoitry.mp3", source: "Official" },
  { title: "Thick And The Bad", artist: "Crzypebble", src: "thickandthebad.mp3", source: "Official" },
  { title: "Flesh and Signal", artist: "Crzypebble", src: "fleshandsignal.mp3", source: "Official" },
  { title: "Mind in Red", artist: "Crzypebble", src: "mindinred.mp3", source: "Official" },
  { title: "Trigger Run", artist: "Days Before Death", src: "triggerrun.mp3", source: "Game" },
  { title: "Down Below", artist: "Days Before Death", src: "downbelow.mp3", source: "Game" },
  { title: "Days Before Death", artist: "Days Before Death", src: "daysbeforedeath.mp3", source: "Game" },
  { title: "Dead Weight", artist: "Days Before Death", src: "deadweight.mp3", source: "Game" },
  { title: "Eye Of The Loop", artist: "Days Before Death", src: "eyeoftheloop.mp3", source: "Game" },
  { title: "Crimson Code", artist: "AI", src: "crimsoncode.mp3", source: "AI" },
  { title: "Cart was full", artist: "User", src: "cartwasfull.mp3", source: "Uploads" }
];

// ---------------- UTIL / STORAGE ----------------
const popupEl = document.getElementById("popup");
function showPopup(msg, color = "#ff0000") {
  if (!popupEl) return;
  popupEl.textContent = msg;
  popupEl.style.background = color;
  popupEl.classList.add("show");
  popupEl.style.display = "block";
  setTimeout(() => {
    popupEl.classList.remove("show");
    popupEl.style.display = "none";
  }, 1500);
}

// Clean up old legacy likes data from local storage so it doesn't cause conflicts
localStorage.removeItem("crzy_likes");
localStorage.removeItem("crzy_dislikes");
if (!localStorage.getItem("playlists")) localStorage.setItem("playlists", JSON.stringify([]));
if (!localStorage.getItem("crzy_queue")) localStorage.setItem("crzy_queue", JSON.stringify([]));


// ---------------- AUTHENTICATION MODAL LOGIC ----------------
function closeAuthModal() {
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.remove('show');
  document.getElementById('modal-auth-status').textContent = "";
}

function modalLogin() {
  const e = document.getElementById('modal-email').value;
  const p = document.getElementById('modal-password').value;
  const status = document.getElementById('modal-auth-status');
  
  if (!e || !p) return status.textContent = "Please enter email and password.";
  
  firebase.auth().signInWithEmailAndPassword(e, p)
    .then(() => {
      closeAuthModal();
      showPopup("Logged in successfully!", "#00ff00");
    })
    .catch(error => status.textContent = error.message);
}

function modalSignUp() {
  const e = document.getElementById('modal-email').value;
  const p = document.getElementById('modal-password').value;
  const status = document.getElementById('modal-auth-status');
  
  if (!e || !p) return status.textContent = "Please enter email and password.";
  
  firebase.auth().createUserWithEmailAndPassword(e, p)
    .then(() => {
      closeAuthModal();
      showPopup("Account created! You can now vote.", "#00ff00");
    })
    .catch(error => status.textContent = error.message);
}

// ---------------- LIKES & DISLIKES SYSTEM ----------------
async function toggleVote(src, type) {
  if (!loggedInUser) return; // Safeguard

  const uid = loggedInUser.uid;
  const db = firebase.firestore();
  const userRef = db.collection("userVotes").doc(uid);

  // We modify the memory variables directly so the screen feels instantly responsive
  let newLikes = [...userLikes];
  let newDislikes = [...userDislikes];

  if (type === 'like') {
    if (newLikes.includes(src)) {
      newLikes = newLikes.filter(s => s !== src); 
      updateSongVote(src, "likes", -1); 
    } else {
      newLikes.push(src); 
      updateSongVote(src, "likes", 1); 
      if (newDislikes.includes(src)) {
        newDislikes = newDislikes.filter(s => s !== src);
        updateSongVote(src, "dislikes", -1); 
      }
    }
  } else {
    if (newDislikes.includes(src)) {
      newDislikes = newDislikes.filter(s => s !== src);
      updateSongVote(src, "dislikes", -1);
    } else {
      newDislikes.push(src);
      updateSongVote(src, "dislikes", 1);
      if (newLikes.includes(src)) {
        newLikes = newLikes.filter(s => s !== src);
        updateSongVote(src, "likes", -1);
      }
    }
  }

  // Update local memory and screen instantly
  userLikes = newLikes;
  userDislikes = newDislikes;
  updateVoteUI(); 

  // Save the new personal list to the Database tied to their account!
  try {
    await userRef.set({
      likes: newLikes,
      dislikes: newDislikes
    }, { merge: true });
  } catch(e) {
    console.error("Error saving user vote:", e);
  }
}

function updateVoteUI() {
  document.querySelectorAll('.like-btn, .vote-like, .dislike-btn, .vote-dislike').forEach(btn => {
    const container = btn.closest('.track-line, .track-card, .search-row');
    let src = container?.dataset.src || container?.querySelector('[data-src]')?.dataset.src;
    
    if(!src) return;

    const songId = src.replace(/[^a-zA-Z0-9]/g, '_');
    const dbVotes = globalVotes[songId] || { likes: 0, dislikes: 0 };

    // Force UI to display 0 if the math gets messed up
    const safeLikes = Math.max(0, dbVotes.likes || 0);
    const safeDislikes = Math.max(0, dbVotes.dislikes || 0);

    // Reading from userLikes memory instead of local storage!
    if (btn.classList.contains('like-btn') || btn.classList.contains('vote-like')) {
      btn.style.opacity = userLikes.includes(src) ? "1" : "0.5";
      btn.style.filter = userLikes.includes(src) ? "drop-shadow(0 0 5px #00ff00)" : "none";
      const countSpan = btn.querySelector('.like-count');
      if (countSpan) countSpan.textContent = safeLikes;
    } else {
      btn.style.opacity = userDislikes.includes(src) ? "1" : "0.5";
      btn.style.filter = userDislikes.includes(src) ? "drop-shadow(0 0 5px #ff0000)" : "none";
      const countSpan = btn.querySelector('.dislike-count');
      if (countSpan) countSpan.textContent = safeDislikes;
    }
  });
}

// ---------------- TOP 10 RENDERER ----------------
function renderTop10() {
  const topListEl = document.getElementById("top-10-list");
  if (!topListEl) return;

  let sortedSongs = masterSongs.map(song => {
    const songId = song.src.replace(/[^a-zA-Z0-9]/g, '_');
    const votes = globalVotes[songId] || { likes: 0 };
    return { ...song, likes: Math.max(0, votes.likes || 0) }; 
  });

  sortedSongs.sort((a, b) => b.likes - a.likes);
  let top10 = sortedSongs.filter(s => s.likes > 0).slice(0, 10);

  if (top10.length === 0) {
    topListEl.innerHTML = '<li class="empty-notice" style="list-style: none; opacity: 0.7;">No likes yet. Be the first!</li>';
    return;
  }

  topListEl.innerHTML = "";
  top10.forEach((song, index) => {
    const li = document.createElement("li");
    li.className = "track-line";
    li.dataset.src = song.src;
    li.tabIndex = 0;
    
    if (index === 0) li.style.borderLeft = "4px solid #ff0000";
    
    li.innerHTML = `
      <strong>#${index + 1}</strong> - ${song.title} <small>(${song.artist})</small> 
      <span style="color:#ff0000; font-weight:bold; margin-left: 8px;">[🔥 ${song.likes}]</span>
      <span class="track-actions-inline">
        <button class="like-btn" title="Like">👍 <span class="like-count">0</span></button>
        <button class="dislike-btn" title="Dislike">👎 <span class="dislike-count">0</span></button>
        <button class="add-queue" data-src="${song.src}" data-title="${song.title}" data-artist="${song.artist}">➜</button>
        <button class="add-playlist" data-src="${song.src}" data-title="${song.title}" data-artist="${song.artist}">＋</button>
      </span>
    `;
    topListEl.appendChild(li);
  });
  
  updateVoteUI(); 
}

// Delegate events
document.body.addEventListener("click", (e) => {
  const likeBtn = e.target.closest('.like-btn, .vote-like');
  const dislikeBtn = e.target.closest('.dislike-btn, .vote-dislike');
  const actionBtn = e.target.closest('button');
  const trackEl = e.target.closest('.track-line, .playable, .search-row');
  
  if (likeBtn || dislikeBtn) {
    e.stopPropagation(); 
    
    if (!loggedInUser) {
      const modal = document.getElementById('authModal');
      if (modal) modal.classList.add('show');
      return; 
    }
    
    const type = likeBtn ? 'like' : 'dislike';
    let src = trackEl?.dataset.src || trackEl?.querySelector('[data-src]')?.dataset.src;
    
    if (src) {
      toggleVote(src, type);
    }
  } 
  else if (trackEl && !actionBtn) {
      e.stopPropagation();
      const src = trackEl.getAttribute('data-src');
      let rawTitle = trackEl.textContent.split('-')[0].trim();
      
      if (trackEl.classList.contains('track-line')) {
         const split = trackEl.textContent.split('-');
         if (split.length > 1) rawTitle = split[1].trim();
      }
      
      if (src && !src.startsWith('hidden')) {
          playTrackBySrc(src, rawTitle, null);
      }
  }
});

// ---------------- PLAYER INTERFACE ----------------
function playTrackBySrc(src, title, cover) {
  if (window.CrzyPlayer && typeof window.CrzyPlayer.play === "function") {
    let artist = "Crzypebble";
    const songData = masterSongs.find(s => s.src === src);
    if (songData && songData.artist) artist = songData.artist;
      
    window.CrzyPlayer.play(src, title, cover, artist);
  } else {
    const audio = document.getElementById("mainAudioPlayer") || document.getElementById("audio-player");
    if (audio) {
      audio.src = src;
      audio.play().catch(e => console.error("Playback blocked:", e));
      const now = document.getElementById("now-playing");
      if (now) now.textContent = "Now Playing: " + (title || src);
      const sp = document.getElementById("simple-player");
      sp && sp.classList.add("playing");
    } else {
        console.error("CRITICAL ERROR: No audio player element found on the page.");
    }
  }
}

function playTrackFromElement(el) {
  const src = el.dataset && el.dataset.src ? el.dataset.src : el.getAttribute('data-src');
  const title = el.textContent.trim();
  if (!src) return showPopup("No file attached", "#b30000");
  playTrackBySrc(src, title);
  localStorage.setItem("crzy_player_last", JSON.stringify({src, title, time:0}));
}

// ---------------- QUEUE ----------------
function getQueue() { return JSON.parse(localStorage.getItem("crzy_queue") || "[]"); }
function saveQueue(q) { localStorage.setItem("crzy_queue", JSON.stringify(q)); }
function addToQueue(song) {
  const q = getQueue();
  q.push(song);
  saveQueue(q);
  renderQueue();
  showPopup("Added to queue", "#ff0000");
}
function clearQueue() {
  saveQueue([]);
  renderQueue();
  showPopup("Queue cleared", "#ff0000");
}
function popQueue() {
  const q = getQueue();
  const next = q.shift();
  saveQueue(q);
  renderQueue();
  return next;
}
function renderQueue() {
  const q = getQueue();
  const el = document.getElementById("queueItems");
  if (!el) return;
  el.innerHTML = "";
  if (!q.length) {
    el.innerHTML = "<div style='padding:8px;color:#aaa'>Queue is empty</div>";
    return;
  }
  q.forEach((s, i) => {
    const d = document.createElement("div");
    d.className = "queue-item";
    d.innerHTML = `<div style="flex:1"><b>${s.title}</b><br><small>${s.artist}</small></div><div style="display:flex;gap:6px"><button class="play-queue" data-i="${i}">▶</button><button class="remove-queue" data-i="${i}">✖</button></div>`;
    el.appendChild(d);
  });
  el.querySelectorAll(".play-queue").forEach(btn => {
    btn.addEventListener("click", () => {
      const s = getQueue()[+btn.dataset.i];
      if (s) playTrackBySrc(s.src, s.title, s.cover);
    });
  });
  el.querySelectorAll(".remove-queue").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = getQueue();
      q.splice(+btn.dataset.i, 1);
      saveQueue(q);
      renderQueue();
      showPopup("Removed from queue", "#ff0000");
    });
  });
}

// ---------------- SEARCH RESULTS ----------------
function showSearchResults(term) {
  let results = masterSongs.filter(s => (s.title + " " + s.artist + " " + (s.source||"")).toLowerCase().includes(term.toLowerCase()));
  let existing = document.getElementById("searchResultsBox");
  if (existing) existing.remove();
  const box = document.createElement("div");
  box.id = "searchResultsBox";
  box.className = "search-results-box";
  box.style.position = "absolute";
  box.style.right = "20px";
  box.style.top = "110px";
  box.style.background = "#0b0b0b";
  box.style.border = "1px solid rgba(255,0,0,0.12)";
  box.style.padding = "10px";
  box.style.borderRadius = "8px";
  box.style.zIndex = 9999;
  box.style.maxHeight = "340px";
  box.style.overflow = "auto";
  if (!results.length) {
    box.innerHTML = "<div style='padding:8px;color:#aaa;'>No results</div>";
  } else {
    results.forEach(s => {
      const row = document.createElement("div");
      row.className = "search-row";
      row.dataset.src = s.src;
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "6px 4px";
      row.innerHTML = `<div style="max-width:70%"><b>${s.title}</b><br><small>${s.artist} · ${s.source||''}</small></div>`;
      
      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "8px";
      
      const playBtn = document.createElement("button");
      playBtn.textContent = "▶";
      playBtn.style.background = "#ff0000";
      playBtn.style.color = "#fff";
      playBtn.onclick = (e) => { e.stopPropagation(); playTrackBySrc(s.src, s.title, s.cover); };
      
      const addBtn = document.createElement("button");
      addBtn.textContent = "＋";
      addBtn.style.background = "#ff0000";
      addBtn.style.color = "#fff";
      addBtn.onclick = (e) => { e.stopPropagation(); openAddPicker({title:s.title, artist:s.artist, src:s.src, source:s.source, cover:s.cover}); };
      
      const queueBtn = document.createElement("button");
      queueBtn.textContent = "➜";
      queueBtn.style.background = "#ff0000";
      queueBtn.style.color = "#fff";
      queueBtn.onclick = (e) => { e.stopPropagation(); addToQueue({title:s.title, artist:s.artist, src:s.src, cover:s.cover}); };
      
      controls.append(queueBtn, playBtn, addBtn);
      row.appendChild(controls);
      box.appendChild(row);
    });
  }
  document.body.appendChild(box);
  setTimeout(() => document.addEventListener("click", closeSearchResultsOnce), 50);
  updateVoteUI();
}

function closeSearchResultsOnce(e) {
  const box = document.getElementById("searchResultsBox");
  if (!box) return;
  if (!box.contains(e.target) && e.target.id !== "siteSearch") {
    box.remove();
    document.removeEventListener("click", closeSearchResultsOnce);
  }
}

const siteSearch = document.getElementById("siteSearch");
siteSearch && siteSearch.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (!val) {
    const old = document.getElementById("searchResultsBox");
    if (old) old.remove();
    return;
  }
  showSearchResults(val);
});

// ---------------- PLAYLIST PICKER, ADD & DASHBOARD ----------------
const playlistPicker = document.getElementById("playlistPicker");
const playlistList = document.getElementById("playlistList");
const createPlaylistBtn = document.getElementById("createPlaylistBtn");
createPlaylistBtn && createPlaylistBtn.addEventListener("click", createNewPlaylistFromPicker);

function loadPlaylistsForPicker() {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  playlistList.innerHTML = "";
  if (!pls.length) {
    playlistList.innerHTML = `<div style="color:#aaa;padding:8px">No playlists yet</div>`;
    return;
  }
  pls.forEach((pl, idx) => {
    const div = document.createElement("div");
    div.className = "playlist-picker-item";
    div.innerHTML = `<img src="${pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="cover"><div style="flex:1"><b>${pl.name}</b><br><small>${(pl.songs||[]).length} songs</small></div>`;
    div.onclick = () => {
      if (window.__crzy_pending_add) {
        addSongToPlaylist(idx, window.__crzy_pending_add);
        window.__crzy_pending_add = null;
      }
      closePicker();
    };
    playlistList.appendChild(div);
  });
}

function openAddPicker(song) {
  window.__crzy_pending_add = song;
  loadPlaylistsForPicker();
  playlistPicker.classList.add("show");
}
function openAddPickerFromButton(evt, song) {
  evt.stopPropagation();
  openAddPicker(song);
}
function closePicker() {
  playlistPicker.classList.remove("show");
  window.__crzy_pending_add = null;
}

function createNewPlaylistFromPicker() {
  const name = prompt("Playlist name:");
  if (!name) return;
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  pls.push({ name, cover: null, songs: [] });
  localStorage.setItem("playlists", JSON.stringify(pls));
  loadPlaylistsForPicker();
  renderPlaylistDashboard(); 
  showPopup("Playlist created", "#ff0000");
}

function addSongToPlaylist(index, song) {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  if (!pls[index]) return showPopup("Playlist not found", "#b30000");
  pls[index].songs = pls[index].songs || [];
  if (pls[index].songs.find(s => s.src === song.src)) {
    return showPopup("Already in playlist", "#b30000");
  }
  pls[index].songs.push(song);
  localStorage.setItem("playlists", JSON.stringify(pls));
  renderPlaylistDashboard(); 
  showPopup("Added to playlist", "#ff0000");
}

function renderPlaylistDashboard() {
  const container = document.getElementById("playlistContainer");
  if (!container) return; 
  
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  container.innerHTML = "";

  if (pls.length === 0) {
    container.innerHTML = "<div style='color:#aaa;'>You haven't created any playlists yet.</div>";
    document.getElementById("playlistTracksList").innerHTML = "<li class='empty-notice' style='list-style: none; opacity: 0.7;'>No playlist selected.</li>";
    
    const playAllBtn = document.getElementById("play-all-playlist-btn");
    if (playAllBtn) playAllBtn.style.display = "none";
    
    return;
  }

  pls.forEach((pl, idx) => {
    const btn = document.createElement("button");
    btn.textContent = pl.name;
    btn.style.margin = "0 8px 8px 0";
    btn.style.padding = "6px 12px";
    btn.style.background = "rgba(255,0,0,0.2)";
    btn.style.border = "1px solid #ff0000";
    btn.style.color = "#fff";
    btn.style.cursor = "pointer";
    btn.style.borderRadius = "4px";
    
    btn.onclick = () => loadActivePlaylist(idx);
    container.appendChild(btn);
  });
}

function loadActivePlaylist(plIdx) {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  const pl = pls[plIdx];
  if (!pl) return;

  document.getElementById("activePlaylistTitle").textContent = pl.name;
  const tracksList = document.getElementById("playlistTracksList");
  tracksList.innerHTML = "";

  const playAllBtn = document.getElementById("play-all-playlist-btn");

  if (!pl.songs || pl.songs.length === 0) {
    tracksList.innerHTML = "<li style='list-style: none; opacity: 0.7;'>Playlist is empty. Add songs to listen!</li>";
    if (playAllBtn) playAllBtn.style.display = "none";
    return;
  }

  if (playAllBtn) playAllBtn.style.display = "block";

  pl.songs.forEach((song, songIdx) => {
    const li = document.createElement("li");
    li.className = "track-line";
    li.dataset.src = song.src;
    
    li.innerHTML = `
      ${song.title} - <small>${song.artist || 'Unknown'}</small>
      <span class="track-actions-inline">
        <button class="like-btn" title="Like">👍 <span class="like-count">0</span></button>
        <button class="dislike-btn" title="Dislike">👎 <span class="dislike-count">0</span></button>
        <button class="play-pl-song" title="Play">▶️</button>
        <button class="remove-pl-song" title="Remove from Playlist" style="color:#ff0000;">✖</button>
      </span>
    `;

    li.querySelector('.play-pl-song').onclick = (e) => {
      e.stopPropagation();
      playTrackBySrc(song.src, song.title, song.cover);
    };

    li.querySelector('.remove-pl-song').onclick = (e) => {
      e.stopPropagation();
      removeSongFromPlaylist(plIdx, songIdx);
    };

    tracksList.appendChild(li);
  });

  updateVoteUI(); 
}

function removeSongFromPlaylist(plIdx, songIdx) {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  if (pls[plIdx] && pls[plIdx].songs) {
    pls[plIdx].songs.splice(songIdx, 1);
    localStorage.setItem("playlists", JSON.stringify(pls));
    loadActivePlaylist(plIdx); 
    showPopup("Removed from playlist", "#ff0000");
  }
}

// ---------------- QUEUE OVERWRITE HELPER ----------------
function executeQueueOverwrite(queueArray) {
  if (queueArray.length > 0) {
    const firstSong = queueArray.shift();
    localStorage.setItem("crzy_queue", JSON.stringify(queueArray));
    
    renderQueue();
    playTrackBySrc(firstSong.src, firstSong.title, null);
    showPopup("Queue Updated", "#ff0000");
  }
}

// ---------------- BIND UI ELEMENTS ----------------
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("mainAudioPlayer") || document.getElementById("audio-player");

  document.body.addEventListener("click", (e) => {
    if (e.target.classList.contains("play-album-btn")) {
      const targetId = e.target.getAttribute("data-target");
      const container = document.getElementById(targetId);
      if (container) {
        const queueBtns = container.querySelectorAll(".add-queue");
        let newQueue = [];
        queueBtns.forEach(btn => {
          newQueue.push({
            title: btn.getAttribute("data-title"),
            artist: btn.getAttribute("data-artist"),
            src: btn.getAttribute("data-src")
          });
        });
        executeQueueOverwrite(newQueue);
      }
    }
    
    if (e.target.id === "play-all-playlist-btn") {
      const list = document.getElementById("playlistTracksList");
      if (list) {
        const tracks = list.querySelectorAll(".track-line");
        let newQueue = [];
        tracks.forEach(li => {
          newQueue.push({
            src: li.getAttribute("data-src"),
            title: li.childNodes[0].textContent.split('-')[0].trim() || "Unknown",
            artist: "Playlist"
          });
        });
        executeQueueOverwrite(newQueue);
      }
    }
  });

  if (audio) {
    audio.addEventListener("ended", () => {
      const next = popQueue();
      if (next) {
        playTrackBySrc(next.src, next.title, next.cover);
      } else {
        showPopup("Queue finished", "#ff0000");
      }
    });
  }

  document.getElementById("skip-forward")?.addEventListener("click", () => {
    const next = popQueue();
    if (next) {
      playTrackBySrc(next.src, next.title, next.cover);
    } else {
      showPopup("Queue empty", "#b30000");
    }
  });

  document.getElementById("skip-back")?.addEventListener("click", () => {
    if (audio) {
      if (audio.currentTime > 3) {
        audio.currentTime = 0;
      } else {
        showPopup("Backwards navigation requires history tracking", "#b30000");
      }
    }
  });

  document.querySelectorAll(".add-queue").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      addToQueue({
        title: btn.dataset.title || btn.getAttribute('data-title'),
        artist: btn.dataset.artist || btn.getAttribute('data-artist'),
        src: btn.dataset.src || btn.getAttribute('data-src')
      });
    });
  });

  document.querySelectorAll(".add-playlist").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openAddPicker({
        title: btn.dataset.title || btn.getAttribute('data-title'),
        artist: btn.dataset.artist || btn.getAttribute('data-artist'),
        src: btn.dataset.src || btn.getAttribute('data-src'),
        source: 'Official'
      });
    });
  });

  document.querySelectorAll(".add-queue, .add-playlist").forEach(btn => btn.style.cursor = "pointer");

  renderQueue();
  renderPlaylistDashboard();
  renderTop10(); 
  updateVoteUI(); 

  const last = JSON.parse(localStorage.getItem("crzy_player_last") || "null");
  if (last && last.src) {
    if (window.CrzyPlayer && typeof window.CrzyPlayer.load === "function") {
      window.CrzyPlayer.load(last.src, last.title, last.cover || null);
    } else {
      if (audio) {
        audio.src = last.src;
        document.getElementById("now-playing") && (document.getElementById("now-playing").textContent = "Last: " + last.title);
      }
    }
  }
});

// expose globally
window.openAddPicker = openAddPicker;
window.openAddPickerFromButton = openAddPickerFromButton;
window.addToQueue = addToQueue;
window.playTrackBySrc = playTrackBySrc;
window.modalLogin = modalLogin;
window.modalSignUp = modalSignUp;
window.closeAuthModal = closeAuthModal;
