// music.js - site-wide UI for music library, queue, playlists, search
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

if (!localStorage.getItem("playlists")) localStorage.setItem("playlists", JSON.stringify([]));
if (!localStorage.getItem("crzy_queue")) localStorage.setItem("crzy_queue", JSON.stringify([]));

// ---------------- PLAYER INTERFACE ----------------
// Attempt to communicate with player.js via window.CrzyPlayer if present
function playTrackBySrc(src, title, cover) {
  // if player exposes API use it
  if (window.CrzyPlayer && typeof window.CrzyPlayer.play === "function") {
    window.CrzyPlayer.play(src, title, cover);
  } else {
    // fallback use audio element
    const audio = document.getElementById("audio-player");
    if (audio) {
      audio.src = src;
      audio.play().catch(()=>{});
      const now = document.getElementById("now-playing");
      if (now) now.textContent = "Now Playing: " + (title || src);
      // add playing class
      const sp = document.getElementById("simple-player");
      sp && sp.classList.add("playing");
    }
  }
}

// quick play from element with data-src
function playTrackFromElement(el) {
  const src = el.dataset && el.dataset.src ? el.dataset.src : el.getAttribute('data-src');
  const title = el.textContent.trim();
  if (!src) return showPopup("No file attached", "#b30000");
  playTrackBySrc(src, title);
  // add to last played state
  localStorage.setItem("crzy_player_last", JSON.stringify({src, title, time:0}));
}

// ---------------- QUEUE ----------------
function getQueue() {
  return JSON.parse(localStorage.getItem("crzy_queue") || "[]");
}
function saveQueue(q) {
  localStorage.setItem("crzy_queue", JSON.stringify(q));
}
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
  // attach handlers
  el.querySelectorAll(".play-queue").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      const i = +btn.dataset.i;
      const q = getQueue();
      const s = q[i];
      if (s) playTrackBySrc(s.src, s.title, s.cover);
    });
  });
  el.querySelectorAll(".remove-queue").forEach(btn => {
    btn.addEventListener("click", (ev) => {
      const i = +btn.dataset.i;
      const q = getQueue();
      q.splice(i,1);
      saveQueue(q);
      renderQueue();
      showPopup("Removed from queue", "#ff0000");
    });
  });
}

// show/hide queue panel
function toggleQueuePanel(show) {
  const panel = document.getElementById("queuePanel");
  if (!panel) return;
  if (typeof show === "boolean") {
    panel.style.display = show ? "block" : "none";
  } else {
    panel.style.display = panel.style.display === "block" ? "none" : "block";
  }
}
document.addEventListener("click", (e) => {
  // prevent clicks on add buttons from closing search etc
});

// queue open button on player
document.addEventListener("DOMContentLoaded", () => {
  const qbtn = document.getElementById("open-queue-btn");
  qbtn && qbtn.addEventListener("click", (e) => {
    toggleQueuePanel();
    renderQueue();
  });
});

// ---------------- SEARCH RESULTS ----------------
function showSearchResults(term) {
  let results = masterSongs.filter(s => (s.title + " " + s.artist + " " + (s.source||"")).toLowerCase().includes(term.toLowerCase()));
  // also include uploaded tracks from localStorage uploads if you store them
  // create results box
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
      controls.appendChild(queueBtn);
      controls.appendChild(playBtn);
      controls.appendChild(addBtn);
      row.appendChild(controls);
      box.appendChild(row);
    });
  }
  document.body.appendChild(box);
  setTimeout(() => {
    document.addEventListener("click", closeSearchResultsOnce);
  }, 50);
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

// ---------------- PLAYLIST PICKER & ADD ----------------
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
  if (!name) return alert("Name required");
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  pls.push({ name, cover: null, songs: [] });
  localStorage.setItem("playlists", JSON.stringify(pls));
  loadPlaylistsForPicker();
  showPopup("Playlist created", "#ff0000");
}

function addSongToPlaylist(index, song) {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  if (!pls[index]) return showPopup("Playlist not found", "#b30000");
  pls[index].songs = pls[index].songs || [];
  if (pls[index].songs.find(s => s.src === song.src)) {
    showPopup("Already in playlist", "#b30000");
    return;
  }
  pls[index].songs.push(song);
  localStorage.setItem("playlists", JSON.stringify(pls));
  showPopup("Added to playlist", "#ff0000");
}

// ---------------- BIND UI ELEMENTS ----------------
document.addEventListener("DOMContentLoaded", () => {
  // Add to queue handlers
  document.querySelectorAll(".add-queue").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const song = {
        title: btn.dataset.title || btn.getAttribute('data-title'),
        artist: btn.dataset.artist || btn.getAttribute('data-artist'),
        src: btn.dataset.src || btn.getAttribute('data-src')
      };
      addToQueue(song);
    });
  });

  // Add to playlist handlers
  document.querySelectorAll(".add-playlist").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const song = {
        title: btn.dataset.title || btn.getAttribute('data-title'),
        artist: btn.dataset.artist || btn.getAttribute('data-artist'),
        src: btn.dataset.src || btn.getAttribute('data-src'),
        source: 'Official'
      };
      openAddPicker(song);
    });
  });

  // Playable text elements
  document.querySelectorAll(".playable").forEach(el => {
    el.addEventListener("click", (e) => {
      const src = el.dataset.src || el.getAttribute('data-src');
      const title = el.textContent.trim();
      if (src) playTrackBySrc(src, title);
    });
  });

  // track-line click => play
  document.querySelectorAll(".track-line").forEach(li => {
    li.addEventListener("click", (e) => {
      // ignore if click on inline buttons
      if (e.target.closest('button')) return;
      const src = li.dataset.src || li.getAttribute('data-src');
      if (src && !src.startsWith('hidden')) {
        const title = li.textContent.trim();
        playTrackBySrc(src, title);
      }
    });
  });

  // site-wide clickable add buttons in album & lists
  document.querySelectorAll(".add-queue, .add-playlist").forEach(btn=>{
    // already wired above but re-check for elements added later
    btn.style.cursor = "pointer";
  });

  // queue controls in player - previous/next/pause handled by player.js ideally
  document.getElementById("skip-forward")?.addEventListener("click", () => {
    // if queue has items pop and play
    const next = popQueue();
    if (next) {
      playTrackBySrc(next.src, next.title, next.cover);
    } else {
      showPopup("Queue empty", "#b30000");
    }
  });

  document.getElementById("skip-back")?.addEventListener("click", () => {
    // no history tracking implemented here; if player supports it use player API
    showPopup("Back is not implemented", "#b30000");
  });

  document.getElementById("open-queue-btn")?.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleQueuePanel();
    renderQueue();
  });

  // ensure queue renders on load
  renderQueue();

  // when page loads if there is a last-played state, load into player (resume possible)
  const last = JSON.parse(localStorage.getItem("crzy_player_last") || "null");
  if (last && last.src) {
    // set audio src so player shows track; do not autoplay unless you prefer autoplay
    if (window.CrzyPlayer && typeof window.CrzyPlayer.load === "function") {
      window.CrzyPlayer.load(last.src, last.title, last.cover || null);
    } else {
      const audio = document.getElementById("audio-player");
      if (audio) {
        audio.src = last.src;
        document.getElementById("now-playing") && (document.getElementById("now-playing").textContent = "Last: " + last.title);
      }
    }
  }
});

// expose functions globally that other modules (player.js) might call
window.openAddPicker = openAddPicker;
window.openAddPickerFromButton = openAddPickerFromButton;
window.addToQueue = addToQueue;
window.playTrackBySrc = playTrackBySrc;
