// music.js - site-wide UI for music library, queue, playlists, search

let globalVotes = {};
let loggedInUser = null; 

let userLikes = [];    
let userDislikes = [];
let userPlaylists = [];
let userQueue = [];       
let userLastPlayed = null;

let userVotesUnsubscribe = null; 
let hasLoadedInitialState = false;

function requireAuth() {
  if (loggedInUser) return true;
  const modal = document.getElementById('authModal');
  if (modal) modal.classList.add('show');
  return false;
}

if (typeof firebase !== 'undefined') {
  const db = firebase.firestore();

  firebase.auth().onAuthStateChanged((user) => {
    loggedInUser = user;
    if (userVotesUnsubscribe) {
      userVotesUnsubscribe();
      userVotesUnsubscribe = null;
    }

    if (user) {
      userVotesUnsubscribe = db.collection("userVotes").doc(user.uid).onSnapshot((doc) => {
        if (doc.exists) {
          const d = doc.data();
          userLikes = d.likes || [];
          userDislikes = d.dislikes || [];
          userPlaylists = d.playlists || [];
          userQueue = d.queue || userQueue; 
          userLastPlayed = d.lastPlayed || null;
        } else {
          userLikes = []; userDislikes = []; userPlaylists = []; userLastPlayed = null;
        }
        
        updateVoteUI(); 
        renderPlaylistDashboard();
        renderQueue();

        if (!hasLoadedInitialState && userLastPlayed && userLastPlayed.src) {
          hasLoadedInitialState = true;
          if (window.CrzyPlayer && typeof window.CrzyPlayer.load === "function") {
            window.CrzyPlayer.load(userLastPlayed.src, userLastPlayed.title, userLastPlayed.cover || null);
          } else {
            const audio = document.getElementById("mainAudioPlayer") || document.getElementById("audio-player");
            if (audio && !audio.src) {
              audio.src = userLastPlayed.src;
              const np = document.getElementById("now-playing");
              if (np) np.textContent = "Last: " + userLastPlayed.title;
            }
          }
        }
      });
    } else {
      userLikes = [];
      userDislikes = [];
      userPlaylists = [];
      userLastPlayed = null;
      hasLoadedInitialState = false;
      
      updateVoteUI(); 
      renderPlaylistDashboard();
      renderQueue();
    }
  });
  
  db.collection("songVotes").onSnapshot((snapshot) => {
    snapshot.forEach(doc => { globalVotes[doc.id] = doc.data(); });
    updateVoteUI(); 
    if (typeof renderTop10 === 'function') renderTop10(); 
  });
}

async function syncUserData(updates) {
  if (!loggedInUser) return;
  try {
    await firebase.firestore().collection("userVotes").doc(loggedInUser.uid).set(updates, { merge: true });
  } catch(e) { console.error("Sync error:", e); }
}

async function updateSongVote(src, type, increment) {
  if (typeof firebase === 'undefined') return; 
  const db = firebase.firestore();
  const songId = src.replace(/[^a-zA-Z0-9]/g, '_'); 
  const songRef = db.collection("songVotes").doc(songId);
  
  const currentData = globalVotes[songId] || { likes: 0, dislikes: 0 };
  const currentCount = currentData[type] || 0;
  if (increment < 0 && currentCount <= 0) return; 
  
  try {
    await songRef.set({ [type]: firebase.firestore.FieldValue.increment(increment) }, { merge: true });
  } catch (e) { console.error(e); }
}

// ---------------- SITE-WIDE SONG LIST ----------------
const masterSongs = [
  { title: "Thick And The Bad(Ft.BiggieTrev)", artist: "Crzypebble", src: "Thick_And_The_Bad.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "i just wanna make good music", artist: "Crzypebble", src: "i_just_wanna_make_good_music.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "WHY(REMAKE)(Ft.BiggieTrev)", artist: "Crzypebble", src: "WHY_REMAKEFtBiggieTrev.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "Live My Life", artist: "Crzypebble", src: "Live_My_Life.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "Gold in the Backyard(Ft.BiggieTrev)", artist: "Crzypebble", src: "GoldInTheBackyard.m4a", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "These Days(ft.CrzyReaper)", artist: "Crzypebble", src: "These_DaysftCrzyReaper.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "Lost In Time(From 2022:The Game)", artist: "Crzypebble", src: "Lost_In_Time.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/Voices%20From%20The%20Past.webp?raw=true" },
  { title: "Welcome To Hell", artist: "Crzypebble", src: "welcometohellprodblksaturn.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Smoke Bitches", artist: "Crzypebble", src: "smokebitchesprodsmxkypete.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "THE BOULDER", artist: "Crzypebble", src: "theboulderrocksandpebblesprodfuckserbab.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Gas", artist: "Crzypebble", src: "gas.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Collide", artist: "Crzypebble", src: "collideprodmyss.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Hurt Pebble", artist: "Crzypebble", src: "hurtpebbleproddimebaggiefeaturingrockandjamma.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "The Fading Light Of The Renaissance", artist: "Crzypebble", src: "fadinglight.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Renaissance (Stoned)", artist: "Crzypebble", src: "renaissancestoned.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Straight Ahead", artist: "Crzypebble", src: "straightahead.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "WHY", artist: "Crzypebble", src: "why.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Carry The Fight", artist: "Crzypebble", src: "carrythefight.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Kiss Of Death (Memories)", artist: "Crzypebble", src: "kissofdeath.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "Collide FT. BIGGIETREV", artist: "Crzypebble", src: "collidebiggietrev.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "C3ZYCL4N", artist: "Crzypebble", src: "c3zycl4n.mp3", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
  { title: "EVERYTHING", artist: "Crzypebble", src: "everything.m4a", source: "Official", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Deluxe%20Cover.jpg?raw=true" },
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

// ---------------- UTIL / MODALS ----------------
const popupEl = document.getElementById("popup");
function showPopup(msg, color = "#ff0000") {
  if (!popupEl) return;
  popupEl.textContent = msg;
  popupEl.style.background = color;
  popupEl.classList.add("show");
  setTimeout(() => popupEl.classList.remove("show"), 1500);
}

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
  firebase.auth().signInWithEmailAndPassword(e, p).then(() => {
    closeAuthModal(); showPopup("Logged in successfully!", "#00ff00");
  }).catch(error => status.textContent = error.message);
}

function modalSignUp() {
  const e = document.getElementById('modal-email').value;
  const p = document.getElementById('modal-password').value;
  const status = document.getElementById('modal-auth-status');
  if (!e || !p) return status.textContent = "Please enter email and password.";
  firebase.auth().createUserWithEmailAndPassword(e, p).then(() => {
    closeAuthModal(); showPopup("Account created!", "#00ff00");
  }).catch(error => status.textContent = error.message);
}

// ---------------- UI INTERACTION (SPOTIFY ALBUM TOGGLE) ----------------
function toggleAlbum(id) {
  const container = document.getElementById(id);
  const chevron = container.previousElementSibling.querySelector('.album-chevron');
  if (container.style.display === 'none' || container.style.display === '') {
    container.style.display = 'block';
    if(chevron) chevron.style.transform = 'rotate(180deg)';
  } else {
    container.style.display = 'none';
    if(chevron) chevron.style.transform = 'rotate(0deg)';
  }
}
window.toggleAlbum = toggleAlbum;

// ---------------- EVENT DELEGATION (FIXES QUEUE BUG) ----------------
document.body.addEventListener("click", (e) => {
  // 1. Queue Button Fix
  const addQueueBtn = e.target.closest('.add-queue');
  if (addQueueBtn) {
    e.stopPropagation();
    addToQueue({
      title: addQueueBtn.dataset.title || addQueueBtn.getAttribute('data-title'),
      artist: addQueueBtn.dataset.artist || addQueueBtn.getAttribute('data-artist'),
      src: addQueueBtn.dataset.src || addQueueBtn.getAttribute('data-src')
    });
    return;
  }

  // 2. Add Playlist Button Fix
  const addPlBtn = e.target.closest('.add-playlist');
  if (addPlBtn) {
    e.stopPropagation();
    openAddPicker({
      title: addPlBtn.dataset.title || addPlBtn.getAttribute('data-title'),
      artist: addPlBtn.dataset.artist || addPlBtn.getAttribute('data-artist'),
      src: addPlBtn.dataset.src || addPlBtn.getAttribute('data-src'),
      source: 'Official'
    });
    return;
  }

  // 3. Play Album Button Fix
  if (e.target.classList.contains("play-album-btn")) {
    const targetId = e.target.getAttribute("data-target");
    const container = document.getElementById(targetId);
    if (container) {
      const queueBtns = container.querySelectorAll(".add-queue");
      let newQueue = [];
      queueBtns.forEach(btn => {
        newQueue.push({
          title: btn.getAttribute("data-title"), artist: btn.getAttribute("data-artist"), src: btn.getAttribute("data-src")
        });
      });
      executeQueueOverwrite(newQueue);
    }
    return;
  }

  // 4. Play Playlist Button
  if (e.target.id === "play-all-playlist-btn") {
    const list = document.getElementById("playlistTracksList");
    if (list) {
      const tracks = list.querySelectorAll(".track-line");
      let newQueue = [];
      tracks.forEach(li => {
        newQueue.push({
          src: li.getAttribute("data-src"), title: li.childNodes[0].textContent.split('-')[0].trim() || "Unknown", artist: "Playlist"
        });
      });
      executeQueueOverwrite(newQueue);
    }
    return;
  }

  // 5. Like / Dislike
  const likeBtn = e.target.closest('.like-btn, .vote-like');
  const dislikeBtn = e.target.closest('.dislike-btn, .vote-dislike');
  const actionBtn = e.target.closest('button');
  const trackEl = e.target.closest('.track-line, .playable, .search-row');
  
  if (likeBtn || dislikeBtn) {
    e.stopPropagation(); 
    if (!requireAuth()) return; 
    const type = likeBtn ? 'like' : 'dislike';
    let src = trackEl?.dataset.src || trackEl?.querySelector('[data-src]')?.dataset.src;
    if (src) toggleVote(src, type);
  } 
  // 6. Track Play
  else if (trackEl && !actionBtn) {
      e.stopPropagation();
      const src = trackEl.getAttribute('data-src');
      const foundSong = masterSongs.find(s => s.src === src);
      let rawTitle = foundSong ? foundSong.title : trackEl.textContent.split('-')[0].trim();
      let cover = foundSong ? foundSong.cover : null;
      
      if (trackEl.classList.contains('track-line') && !foundSong) {
         const split = trackEl.textContent.split('-');
         if (split.length > 1) rawTitle = split[1].trim();
      }
      if (src && !src.startsWith('hidden')) {
          playTrackBySrc(src, rawTitle, cover);
      }
  }
});

// ---------------- LIKES ----------------
async function toggleVote(src, type) {
  let newLikes = [...userLikes]; let newDislikes = [...userDislikes];
  if (type === 'like') {
    if (newLikes.includes(src)) {
      newLikes = newLikes.filter(s => s !== src); updateSongVote(src, "likes", -1); 
    } else {
      newLikes.push(src); updateSongVote(src, "likes", 1); 
      if (newDislikes.includes(src)) { newDislikes = newDislikes.filter(s => s !== src); updateSongVote(src, "dislikes", -1); }
    }
  } else {
    if (newDislikes.includes(src)) {
      newDislikes = newDislikes.filter(s => s !== src); updateSongVote(src, "dislikes", -1);
    } else {
      newDislikes.push(src); updateSongVote(src, "dislikes", 1);
      if (newLikes.includes(src)) { newLikes = newLikes.filter(s => s !== src); updateSongVote(src, "likes", -1); }
    }
  }
  userLikes = newLikes; userDislikes = newDislikes;
  updateVoteUI(); syncUserData({ likes: newLikes, dislikes: newDislikes });
}

function updateVoteUI() {
  document.querySelectorAll('.like-btn, .vote-like, .dislike-btn, .vote-dislike').forEach(btn => {
    const container = btn.closest('.track-line, .track-card, .search-row');
    let src = container?.dataset.src || container?.querySelector('[data-src]')?.dataset.src;
    if(!src) return;
    const songId = src.replace(/[^a-zA-Z0-9]/g, '_');
    const dbVotes = globalVotes[songId] || { likes: 0, dislikes: 0 };
    if (btn.classList.contains('like-btn') || btn.classList.contains('vote-like')) {
      btn.style.opacity = userLikes.includes(src) ? "1" : "0.5";
      btn.style.filter = userLikes.includes(src) ? "drop-shadow(0 0 5px #00ff00)" : "none";
      const countSpan = btn.querySelector('.like-count');
      if (countSpan) countSpan.textContent = Math.max(0, dbVotes.likes || 0);
    } else {
      btn.style.opacity = userDislikes.includes(src) ? "1" : "0.5";
      btn.style.filter = userDislikes.includes(src) ? "drop-shadow(0 0 5px #ff0000)" : "none";
      const countSpan = btn.querySelector('.dislike-count');
      if (countSpan) countSpan.textContent = Math.max(0, dbVotes.dislikes || 0);
    }
  });
}

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
    topListEl.innerHTML = '<li class="empty-notice" style="list-style: none; opacity: 0.7;">No likes yet. Be the first!</li>'; return;
  }
  topListEl.innerHTML = "";
  top10.forEach((song, index) => {
    const li = document.createElement("li");
    li.className = "track-line";
    li.dataset.src = song.src; li.tabIndex = 0;
    li.innerHTML = `<strong>#${index + 1}</strong> - ${song.title} <small>(${song.artist})</small> 
      <span style="color:#ff0000; font-weight:bold; margin-left: 8px;">[🔥 ${song.likes}]</span>
      <span class="track-actions-inline">
        <button class="like-btn" title="Like">👍 <span class="like-count">0</span></button>
        <button class="dislike-btn" title="Dislike">👎 <span class="dislike-count">0</span></button>
        <button class="add-queue" data-src="${song.src}" data-title="${song.title}" data-artist="${song.artist}">➜</button>
        <button class="add-playlist" data-src="${song.src}" data-title="${song.title}" data-artist="${song.artist}">＋</button>
      </span>`;
    topListEl.appendChild(li);
  });
  updateVoteUI(); 
}

// ---------------- PLAYER & QUEUE ----------------
function playTrackBySrc(src, title, cover) {
  const songData = masterSongs.find(s => s.src === src);
  if (!cover && songData && songData.cover) cover = songData.cover;
  if (!title && songData && songData.title) title = songData.title;

  if (loggedInUser) {
    userLastPlayed = { src, title, cover }; syncUserData({ lastPlayed: userLastPlayed });
  }

  if (window.CrzyPlayer && typeof window.CrzyPlayer.play === "function") {
    let artist = (songData && songData.artist) ? songData.artist : "Crzypebble";
    window.CrzyPlayer.play(src, title, cover, artist);
  } else {
    const audio = document.getElementById("mainAudioPlayer") || document.getElementById("audio-player");
    if (audio) {
      audio.src = src; audio.play().catch(e => console.error("Playback blocked:", e));
    }
  }
}

function saveQueue() { 
  renderQueue();
  if (loggedInUser) syncUserData({ queue: userQueue });
}

function addToQueue(song) {
  if (!song.cover) {
    const found = masterSongs.find(s => s.src === song.src);
    if (found && found.cover) song.cover = found.cover;
  }
  userQueue.push(song);
  saveQueue();
  showPopup("Added to queue", "#1db954");
}

function clearQueue() {
  userQueue = []; saveQueue(); showPopup("Queue cleared", "#ff0000");
}

function popQueue() {
  if (userQueue.length === 0) return null;
  const next = userQueue.shift(); saveQueue(); return next;
}

function renderQueue() {
  const el = document.getElementById("queueItems");
  if (!el) return;
  el.innerHTML = "";
  if (!userQueue.length) {
    el.innerHTML = "<div style='padding:8px;color:#aaa'>Queue is empty</div>"; return;
  }
  userQueue.forEach((s, i) => {
    const d = document.createElement("div"); d.className = "queue-item";
    d.innerHTML = `<div style="flex:1"><b>${s.title}</b><br><small>${s.artist}</small></div>
      <div style="display:flex;gap:6px"><button class="play-queue" data-i="${i}">▶</button><button class="remove-queue" data-i="${i}">✖</button></div>`;
    el.appendChild(d);
  });
  el.querySelectorAll(".play-queue").forEach(btn => {
    btn.addEventListener("click", () => { const s = userQueue[+btn.dataset.i]; if (s) playTrackBySrc(s.src, s.title, s.cover); });
  });
  el.querySelectorAll(".remove-queue").forEach(btn => {
    btn.addEventListener("click", () => { userQueue.splice(+btn.dataset.i, 1); saveQueue(); showPopup("Removed from queue", "#ff0000"); });
  });
}

function executeQueueOverwrite(queueArray) {
  if (queueArray.length > 0) {
    queueArray.forEach(item => {
      if (!item.cover) { const found = masterSongs.find(s => s.src === item.src); if (found && found.cover) item.cover = found.cover; }
    });
    const firstSong = queueArray.shift(); userQueue = queueArray; saveQueue();
    playTrackBySrc(firstSong.src, firstSong.title, firstSong.cover);
    showPopup("Queue Updated", "#1db954");
  }
}

// ---------------- SEARCH ----------------
function showSearchResults(term) {
  let results = masterSongs.filter(s => (s.title + " " + s.artist + " " + (s.source||"")).toLowerCase().includes(term.toLowerCase()));
  let existing = document.getElementById("searchResultsBox");
  if (existing) existing.remove();
  const box = document.createElement("div"); box.id = "searchResultsBox"; box.className = "queue-panel show";
  box.style.bottom = "auto"; box.style.top = "180px";
  if (!results.length) {
    box.innerHTML = "<div style='padding:8px;color:#aaa;'>No results</div>";
  } else {
    results.forEach(s => {
      const row = document.createElement("div"); row.className = "queue-item search-row"; row.dataset.src = s.src;
      row.innerHTML = `<div style="max-width:70%"><b>${s.title}</b><br><small>${s.artist} · ${s.source||''}</small></div>
      <div style="display:flex;gap:8px;">
        <button style="background:transparent;border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:12px;cursor:pointer;padding:4px 8px;" onclick="(e)=>{e.stopPropagation(); playTrackBySrc('${s.src}', '${s.title}', '${s.cover}')}">▶</button>
        <button style="background:transparent;border:1px solid rgba(255,255,255,0.4);color:#fff;border-radius:12px;cursor:pointer;padding:4px 8px;" class="add-queue" data-src="${s.src}" data-title="${s.title}" data-artist="${s.artist}">➜</button>
      </div>`;
      box.appendChild(row);
    });
  }
  document.body.appendChild(box);
  setTimeout(() => document.addEventListener("click", closeSearchResultsOnce), 50);
}
function closeSearchResultsOnce(e) {
  const box = document.getElementById("searchResultsBox");
  if (!box) return;
  if (!box.contains(e.target) && e.target.id !== "siteSearch") { box.remove(); document.removeEventListener("click", closeSearchResultsOnce); }
}
document.getElementById("siteSearch")?.addEventListener("input", (e) => {
  const val = e.target.value.trim();
  if (!val) { document.getElementById("searchResultsBox")?.remove(); return; }
  showSearchResults(val);
});

// ---------------- PLAYLISTS ----------------
const playlistPicker = document.getElementById("playlistPicker");
const playlistList = document.getElementById("playlistList");
document.getElementById("createPlaylistBtn")?.addEventListener("click", () => {
  if (!requireAuth()) return; 
  const name = prompt("Playlist name:"); if (!name) return;
  userPlaylists.push({ name, cover: null, songs: [] });
  syncUserData({ playlists: userPlaylists }); 
  loadPlaylistsForPicker(); renderPlaylistDashboard(); showPopup("Playlist created", "#1db954");
});

function loadPlaylistsForPicker() {
  playlistList.innerHTML = "";
  if (!userPlaylists.length) { playlistList.innerHTML = `<div style="color:#aaa;padding:8px">No playlists yet</div>`; return; }
  userPlaylists.forEach((pl, idx) => {
    const div = document.createElement("div"); div.className = "playlist-picker-item";
    div.innerHTML = `<img src="${pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="cover"><div style="flex:1"><b>${pl.name}</b><br><small>${(pl.songs||[]).length} songs</small></div>`;
    div.onclick = () => { if (window.__crzy_pending_add) { addSongToPlaylist(idx, window.__crzy_pending_add); window.__crzy_pending_add = null; } closePicker(); };
    playlistList.appendChild(div);
  });
}
function openAddPicker(song) {
  if (!requireAuth()) return; 
  window.__crzy_pending_add = song; loadPlaylistsForPicker(); playlistPicker.classList.add("show");
}
function closePicker() { playlistPicker.classList.remove("show"); window.__crzy_pending_add = null; }

function addSongToPlaylist(index, song) {
  if (!requireAuth()) return;
  userPlaylists[index].songs = userPlaylists[index].songs || [];
  if (userPlaylists[index].songs.find(s => s.src === song.src)) return showPopup("Already in playlist", "#b30000");
  userPlaylists[index].songs.push(song);
  syncUserData({ playlists: userPlaylists }); 
  renderPlaylistDashboard(); showPopup("Added to playlist", "#1db954");
}

function renderPlaylistDashboard() {
  const container = document.getElementById("playlistContainer"); if (!container) return; 
  container.innerHTML = "";
  if (userPlaylists.length === 0) {
    container.innerHTML = "<div style='color:#aaa;'>You haven't created any playlists yet. Log in to save them!</div>";
    document.getElementById("playlistTracksList").innerHTML = "<li class='empty-notice' style='list-style: none; opacity: 0.5;'>No playlist selected.</li>";
    document.getElementById("play-all-playlist-btn").style.display = "none"; return;
  }
  userPlaylists.forEach((pl, idx) => {
    const btn = document.createElement("button"); btn.textContent = pl.name; btn.className = "sleek-btn"; btn.style.margin = "0 8px 8px 0";
    btn.onclick = () => loadActivePlaylist(idx); container.appendChild(btn);
  });
}

function loadActivePlaylist(plIdx) {
  const pl = userPlaylists[plIdx]; if (!pl) return;
  document.getElementById("activePlaylistTitle").textContent = pl.name;
  const tracksList = document.getElementById("playlistTracksList"); tracksList.innerHTML = "";
  const playAllBtn = document.getElementById("play-all-playlist-btn");
  if (!pl.songs || pl.songs.length === 0) {
    tracksList.innerHTML = "<li style='list-style: none; opacity: 0.5;'>Playlist is empty. Add songs to listen!</li>"; playAllBtn.style.display = "none"; return;
  }
  playAllBtn.style.display = "block";
  pl.songs.forEach((song, songIdx) => {
    const li = document.createElement("li"); li.className = "track-line"; li.dataset.src = song.src;
    li.innerHTML = `${song.title} - <small>${song.artist || 'Unknown'}</small>
      <span class="track-actions-inline">
        <button class="like-btn">👍 <span class="like-count">0</span></button>
        <button class="dislike-btn">👎 <span class="dislike-count">0</span></button>
        <button class="play-pl-song">▶️</button>
        <button class="remove-pl-song" style="color:#ff0000;">✖</button>
      </span>`;
    li.querySelector('.play-pl-song').onclick = (e) => { e.stopPropagation(); playTrackBySrc(song.src, song.title, song.cover); };
    li.querySelector('.remove-pl-song').onclick = (e) => { e.stopPropagation(); if (requireAuth()) { userPlaylists[plIdx].songs.splice(songIdx, 1); syncUserData({ playlists: userPlaylists }); loadActivePlaylist(plIdx); showPopup("Removed", "#ff0000"); } };
    tracksList.appendChild(li);
  });
  updateVoteUI(); 
}

// ---------------- INIT ----------------
document.addEventListener("DOMContentLoaded", () => {
  const audio = document.getElementById("mainAudioPlayer") || document.getElementById("audio-player");
  if (audio) {
    audio.addEventListener("ended", () => {
      const next = popQueue();
      if (next) playTrackBySrc(next.src, next.title, next.cover);
      else showPopup("Queue finished", "#ff0000");
    });
  }
  renderQueue(); renderPlaylistDashboard(); renderTop10(); updateVoteUI(); 
});

window.openAddPicker = openAddPicker; window.addToQueue = addToQueue; window.playTrackBySrc = playTrackBySrc;
window.modalLogin = modalLogin; window.modalSignUp = modalSignUp; window.closeAuthModal = closeAuthModal; window.clearQueue = clearQueue;
