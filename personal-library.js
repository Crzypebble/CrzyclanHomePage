// personal-library.js
// Handles playlists: create, open, add songs, rename, delete, play
// Data saved in localStorage under 'crzy_playlists'
// Relies on a global audio element with id 'audio-player' already present on the page.

document.addEventListener('DOMContentLoaded', () => {
  // DOM shortcuts
  const playlistGrid = document.getElementById('playlistGrid');
  const createBtn = document.getElementById('createPlaylistBtn');
  const newNameInput = document.getElementById('newPlaylistName');
  const newCoverInput = document.getElementById('newPlaylistCover');

  const playlistView = document.getElementById('playlistView');
  const playlistViewTitle = document.getElementById('playlistViewTitle');
  const playlistViewThumb = document.getElementById('playlistViewThumb');
  const playlistViewMeta = document.getElementById('playlistViewMeta');
  const playlistSongs = document.getElementById('playlistSongs');
  const playlistBackBtn = document.getElementById('playlistBackBtn');
  const renamePlaylistBtn = document.getElementById('renamePlaylistBtn');
  const deletePlaylistBtn = document.getElementById('deletePlaylistBtn');

  const searchTracksInput = document.getElementById('searchTracks');
  const searchResults = document.getElementById('searchResults');

  const audioPlayer = document.getElementById('audio-player');
  const nowPlaying = document.getElementById('now-playing');

  // Example official tracks list (matches the filenames you put in your music library)
  // Keep src exactly as your pages reference (no folder prefix unless you store them in a folder).
  const officialTracks = [
    { title: "Welcome To Hell", artist: "Crzypebble", src: "welcometohellprodblksaturn.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "Smoke Bitches", artist: "Crzypebble", src: "smokebitchesprodsmxkypete.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "The Boulder: Rocks And Pebbles", artist: "Crzypebble", src: "theboulderrocksandpebblesprodfuckserbab.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "Gas", artist: "Crzypebble", src: "gas.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "Collide", artist: "Crzypebble", src: "collideprodmyss.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "Hurt Pebble", artist: "Crzypebble", src: "hurtpebbleproddimebaggiefeaturingrockandjamma.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "The Fading Light Of The Renaissance", artist: "Crzypebble", src: "fadinglight.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "WHY", artist: "Crzypebble", src: "why.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    { title: "C3ZYCL4N", artist: "Crzypebble", src: "c3zycl4n.mp3", cover: "https://github.com/Crzypebble/CrzyclanHomePage/blob/main/The%20Pebble%20Cover.jpg?raw=true" },
    // Add more officialTracks entries if needed
  ];

  // Utilities
  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function getPlaylists() {
    return JSON.parse(localStorage.getItem('crzy_playlists') || '[]');
  }

  function savePlaylists(list) {
    localStorage.setItem('crzy_playlists', JSON.stringify(list));
  }

  function getUploadedTracks() {
    // uploadedTracks used by your upload page is stored as 'uploadedTracks' (from earlier code)
    return JSON.parse(localStorage.getItem('uploadedTracks') || '[]');
  }

  // Render playlist cards grid
  function renderPlaylistGrid() {
    const playlists = getPlaylists();
    playlistGrid.innerHTML = playlists.length === 0 ? '<p style="color:#ccc">No playlists yet. Create one above.</p>' : '';

    playlists.forEach(pl => {
      const card = document.createElement('div');
      card.className = 'playlist-card';
      card.style.display = 'flex';
      card.style.alignItems = 'center';
      card.style.gap = '12px';
      card.style.cursor = 'pointer';
      card.style.padding = '12px';
      card.style.marginBottom = '10px';

      card.innerHTML = `
        <img src="${pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="${pl.name}" class="playlist-thumb" style="width:120px;height:120px;object-fit:cover;border-radius:8px;border:2px solid red;">
        <div style="flex:1;text-align:left;">
          <h3 style="margin:0;color:red;">${pl.name}</h3>
          <small style="color:#999;">${new Date(pl.createdAt).toLocaleString()}</small>
          <div style="color:#ccc;margin-top:6px">${pl.songs?.length || 0} song(s)</div>
        </div>
      `;

      // clicking the card opens the playlist
      card.addEventListener('click', () => openPlaylist(pl.id));

      playlistGrid.appendChild(card);
    });
  }

  // Create new playlist
  createBtn.addEventListener('click', () => {
    const name = newNameInput.value.trim();
    if (!name) {
      alert('Please provide a playlist name.');
      return;
    }

    const coverFile = newCoverInput.files[0];
    if (coverFile) {
      const fr = new FileReader();
      fr.onload = function(e) {
        createNewPlaylist(name, e.target.result);
      };
      fr.readAsDataURL(coverFile);
    } else {
      createNewPlaylist(name, null);
    }
  });

  function createNewPlaylist(name, coverDataUrl) {
    const playlists = getPlaylists();
    const newPl = { id: uid(), name, cover: coverDataUrl || '', songs: [], createdAt: Date.now() };
    playlists.unshift(newPl);
    savePlaylists(playlists);
    newNameInput.value = '';
    newCoverInput.value = '';
    renderPlaylistGrid();
    openPlaylist(newPl.id);
  }

  // Open playlist view
  function openPlaylist(id) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === id);
    if (!pl) return;

    // show view
    playlistView.style.display = 'block';
    // hide grid for clarity
    // optionally keep grid visible — here we hide the create area visually by scrolling, but keep it simple:
    // Fill view
    playlistViewTitle.textContent = pl.name;
    playlistViewThumb.src = pl.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true';
    playlistViewMeta.textContent = `${pl.songs.length} song(s) • created ${new Date(pl.createdAt).toLocaleDateString()}`;

    // attach rename/delete handlers
    renamePlaylistBtn.onclick = () => {
      const newName = prompt('Rename playlist:', pl.name);
      if (newName && newName.trim()) {
        pl.name = newName.trim();
        saveAndRefresh(playlists);
        openPlaylist(id); // re-open to update UI
      }
    };

    deletePlaylistBtn.onclick = () => {
      if (!confirm(`Delete playlist "${pl.name}"? This cannot be undone.`)) return;
      const remaining = playlists.filter(p => p.id !== id);
      savePlaylists(remaining);
      playlistView.style.display = 'none';
      renderPlaylistGrid();
    };

    playlistBackBtn.onclick = () => {
      playlistView.style.display = 'none';
      renderPlaylistGrid();
    };

    renderPlaylistSongs(pl);
    renderSearchResults(''); // init empty search
    // set a small delay to focus search field
    setTimeout(() => {
      searchTracksInput && searchTracksInput.focus();
    }, 250);
  }

  function renderPlaylistSongs(pl) {
    playlistSongs.innerHTML = '';
    if (!pl.songs || pl.songs.length === 0) {
      playlistSongs.innerHTML = '<p style="color:#ccc">No songs in this playlist yet.</p>';
      return;
    }

    pl.songs.forEach((s, idx) => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '12px';
      row.style.alignItems = 'center';
      row.style.marginBottom = '8px';
      row.innerHTML = `
        <img src="${s.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="${s.title}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #333;">
        <div style="flex:1;text-align:left;">
          <strong style="color:red; display:block">${s.title}</strong>
          <div style="color:#ccc">${s.artist || ''}</div>
        </div>
        <div style="display:flex; gap:6px; align-items:center;">
          <button class="add-song-btn" onclick="(function(){ playPlaylistSong('${pl.id}', ${idx}) })()">Play</button>
          <button onclick="(function(){ removeSongFromPlaylist('${pl.id}', ${idx}) })()" style="background:#ff4d4d;color:#fff;padding:6px;border-radius:6px;border:none;">Remove</button>
        </div>
      `;
      playlistSongs.appendChild(row);
    });
  }

  // Play song from playlist (exposes a global function used by inline onclick)
  window.playPlaylistSong = function(plId, songIndex) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === plId);
    if (!pl || !pl.songs || !pl.songs[songIndex]) return;
    const s = pl.songs[songIndex];

    audioPlayer.src = s.src || s.audio || '';
    audioPlayer.play().catch(()=>{ /* ignore autoplay issues */ });
    nowPlaying && (nowPlaying.textContent = `Now Playing: ${s.title} — ${s.artist || ''}`);
  };

  window.removeSongFromPlaylist = function(plId, index) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === plId);
    if (!pl) return;
    pl.songs.splice(index, 1);
    savePlaylists(playlists);
    if (playlistView.style.display === 'block') {
      openPlaylist(plId); // refresh view
    } else {
      renderPlaylistGrid();
    }
  };

  function saveAndRefresh(list) {
    savePlaylists(list);
    renderPlaylistGrid();
  }

  // Search / Add songs UI
  function renderSearchResults(query) {
    // combined pool: officialTracks + uploadedTracks
    const uploads = getUploadedTracks(); // uploadedTracks from upload page (they store in localStorage)
    const pool = [
      // official (use a copy)
      ...officialTracks.map(t => ({ ...t, source: 'official' })),
      // user uploads (their objects have title, artist, audio, cover)
      ...(uploads.map(u => ({ title: u.title, artist: u.artist || '', src: u.audio || u.src, cover: u.cover || u.coverArt || '', source: 'uploads' })))
    ];

    const q = (query || '').toLowerCase().trim();
    const filtered = q ? pool.filter(t => (t.title + ' ' + (t.artist || '') ).toLowerCase().includes(q)) : pool;

    searchResults.innerHTML = '';
    if (filtered.length === 0) {
      searchResults.innerHTML = '<p style="color:#ccc">No matches</p>';
      return;
    }

    filtered.forEach(item => {
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.gap = '10px';
      row.style.alignItems = 'center';
      row.style.marginBottom = '8px';
      row.style.padding = '6px';
      row.style.borderRadius = '6px';
      row.style.background = '#111';
      row.style.border = '1px solid #222';

      row.innerHTML = `
        <img src="${item.cover || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true'}" alt="${item.title}" style="width:64px;height:64px;object-fit:cover;border-radius:6px;border:1px solid #333;">
        <div style="flex:1;text-align:left;">
          <strong style="color:red; display:block">${item.title}</strong>
          <div style="color:#ccc">${item.artist || ''} <small style="color:#666">(${item.source})</small></div>
        </div>
        <div>
          <button class="add-song-btn">Add</button>
        </div>
      `;

      // Add button attaches to the currently open playlist
      const addBtn = row.querySelector('button.add-song-btn');
      addBtn.addEventListener('click', () => {
        const playlists = getPlaylists();
        // find open playlist by title (playlistViewTitle) - better to store the id
        // We'll find the playlist by matching title+createdAt shown in meta
        const openName = playlistViewTitle.textContent;
        const pl = playlists.find(p => p.name === openName);
        if (!pl) {
          alert('Playlist not found. Go back and open the playlist again.');
          return;
        }

        // avoid duplicates by src
        if (!pl.songs) pl.songs = [];
        if (pl.songs.some(s => s.src === item.src || s.audio === item.src)) {
          alert('This song is already in the playlist.');
          return;
        }

        // push
        pl.songs.push({ title: item.title, artist: item.artist || '', src: item.src, cover: item.cover || '' });
        savePlaylists(playlists);
        renderPlaylistSongs(pl);
        playlistViewMeta.textContent = `${pl.songs.length} song(s) • created ${new Date(pl.createdAt).toLocaleDateString()}`;
      });

      searchResults.appendChild(row);
    });
  }

  // Live search
  searchTracksInput && searchTracksInput.addEventListener('input', (e) => {
    renderSearchResults(e.target.value);
  });

  // initial render
  renderPlaylistGrid();

  // expose a function to let other pages add songs directly to a selected playlist:
  // Usage example (from another script): addSongToPlaylist(playlistId, { title, artist, src, cover })
  window.addSongToPlaylist = function(playlistId, song) {
    const playlists = getPlaylists();
    const pl = playlists.find(p => p.id === playlistId);
    if (!pl) return false;
    pl.songs = pl.songs || [];
    pl.songs.push(song);
    savePlaylists(playlists);
    return true;
  };

  // ensure main nav always visible (in case other scripts hide it)
  const mainNav = document.querySelector('header nav');
  if (mainNav) mainNav.style.display = 'flex';
});
