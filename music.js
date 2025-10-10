// music.js - controls search, playlists, add picker, and sends play commands to player.js

// ---------- SITE-WIDE SONG LIST (official + community + uploads) ----------
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
// (You can expand this list as you add files — it must match file names in your root)

// ---------- PLAYER COMMUNICATION ----------
function playTrackBySrc(src, title) {
  // export to player.js
  if (window.CrzyPlayer && typeof window.CrzyPlayer.play === "function") {
    window.CrzyPlayer.play(src, title);
  } else {
    // fallback: find audio element if player not loaded
    const audio = document.getElementById("audio-player");
    if (audio) {
      audio.src = src;
      audio.play().catch(() => {});
      document.getElementById("now-playing").textContent = "Now Playing: " + (title || src);
    }
  }
}

function playTrackFromElement(el) {
  const src = el.dataset.src;
  const title = el.textContent.trim();
  if (!src) return;
  playTrackBySrc(src, title);
}

// ---------- SEARCH ---------- 
const siteSearch = document.getElementById("siteSearch");
siteSearch && siteSearch.addEventListener("input", () => {
  const term = siteSearch.value.trim().toLowerCase();
  if (!term) {
    // optionally clear any active results area
    return;
  }
  showSearchResults(term);
});

function showSearchResults(term) {
  // build a floating results area under search
  let results = masterSongs.filter(s => (s.title + " " + s.artist).toLowerCase().includes(term));
  // create results container (remove old if exists)
  let existing = document.getElementById("searchResultsBox");
  if (existing) existing.remove();
  const box = document.createElement("div");
  box.id = "searchResultsBox";
  box.className = "search-results-box";
  box.style.position = "absolute";
  box.style.right = "20px";
  box.style.top = "110px";
  box.style.background = "#0b0b0b";
  box.style.border = "1px solid #330000";
  box.style.padding = "10px";
  box.style.borderRadius = "8px";
  box.style.zIndex = 999;
  box.style.maxHeight = "320px";
  box.style.overflow = "auto";
  if (results.length === 0) {
    box.innerHTML = "<div style='padding:8px;color:#aaa;'>No results</div>";
  } else {
    results.forEach(s => {
      const row = document.createElement("div");
      row.className = "search-row";
      row.style.display = "flex";
      row.style.justifyContent = "space-between";
      row.style.alignItems = "center";
      row.style.padding = "6px 4px";
      row.innerHTML = `<div><b>${s.title}</b><br><small>${s.artist} · ${s.source}</small></div>`;
      const controls = document.createElement("div");
      controls.style.display = "flex";
      controls.style.gap = "8px";
      const playBtn = document.createElement("button");
      playBtn.textContent = "▶";
      playBtn.onclick = (e) => { e.stopPropagation(); playTrackBySrc(s.src, s.title); };
      const addBtn = document.createElement("button");
      addBtn.textContent = "+";
      addBtn.onclick = (e) => { e.stopPropagation(); openAddPicker({title:s.title, artist:s.artist, src:s.src, source:s.source}); };
      controls.appendChild(playBtn);
      controls.appendChild(addBtn);
      row.appendChild(controls);
      box.appendChild(row);
    });
  }
  document.body.appendChild(box);
  // click outside to close
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

// ---------- PLAYLIST / PICKER LOGIC ----------
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
    div.innerHTML = `<img src="${pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}"><div style="flex:1"><b>${pl.name}</b><br><small>${(pl.songs||[]).length} songs</small></div>`;
    div.onclick = () => {
      // commit adding the previously queued song
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
  // song: {title, artist, src, source}
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
  showPopup("Playlist created", "red");
}

// Add song to playlist index
function addSongToPlaylist(index, song) {
  const pls = JSON.parse(localStorage.getItem("playlists") || "[]");
  if (!pls[index]) return showPopup("Playlist not found", "red");
  pls[index].songs = pls[index].songs || [];
  // avoid duplicates by src
  if (pls[index].songs.find(s => s.src === song.src)) {
    showPopup("Already in playlist", "red");
    return;
  }
  pls[index].songs.push(song);
  localStorage.setItem("playlists", JSON.stringify(pls));
  showPopup("Added to playlist", "red");
}

// ---------- Popup helper ----------
const popupEl = document.getElementById("popup");
function showPopup(msg, color = "red") {
  popupEl.textContent = msg;
  popupEl.style.background = color;
  popupEl.classList.add("show");
  popupEl.style.display = "block";
  setTimeout(() => {
    popupEl.classList.remove("show");
    popupEl.style.display = "none";
  }, 1700);
}

// ---------- QUICK PLAY CALLS FROM DOM (for clickable elements) ----------
window.playTrackFromElement = playTrackFromElement;
window.openAddPickerFromButton = openAddPickerFromButton;

// ---------- initialize default playlists UI (so personal library can use same storage) ----------
(function init() {
  if (!localStorage.getItem("playlists")) {
    localStorage.setItem("playlists", JSON.stringify([]));
  }
})();
