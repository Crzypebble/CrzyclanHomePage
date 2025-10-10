// player.js - CRZYCLAN Player v2 (waveform/particles visualizer + float/dock + cross-tab sync)
// Option B: waveform/particles visualizer
(function () {
  const ACCENT_KEY = 'crzy_player_accent';
  const MODE_KEY = 'crzy_player_mode'; // 'float' | 'dock'
  const STATE_KEY = 'crzy_player_state'; // for cross-tab state sync

  // helper to create element quickly
  function $el(tag, attrs = {}, html = '') {
    const e = document.createElement(tag);
    for (const k in attrs) {
      if (k === 'class') e.className = attrs[k];
      else if (k === 'style') e.style.cssText = attrs[k];
      else e.setAttribute(k, attrs[k]);
    }
    e.innerHTML = html;
    return e;
  }

  // Find or create audio element
  let audio = document.getElementById('audio-player');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.preload = 'metadata';
    document.body.appendChild(audio);
  }

  // Build player UI
  const player = $el('div', { id: 'crzy-player' });
  player.innerHTML = `
    <div class="drag" title="Drag / Hold to move">
      <div class="title">CRZYCLAN Player</div>
      <div class="controls">
        <button class="icon-btn" id="crzy-prev" title="Previous">⏮</button>
        <button class="icon-btn" id="crzy-play" title="Play/Pause">▶️</button>
        <button class="icon-btn" id="crzy-next" title="Next">⏭</button>
        <button class="icon-btn" id="crzy-dock" title="Toggle Dock">📌</button>
        <button class="icon-btn" id="crzy-settings-btn" title="Settings">⚙️</button>
      </div>
    </div>
    <div class="body">
      <div>
        <div class="meta">
          <img src="https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true" class="cover" id="crz-cover">
          <div class="now">
            <div class="song" id="crz-song">None</div>
            <div class="artist" id="crz-artist">Not playing</div>
            <div class="progress">
              <input class="progress" type="range" id="crz-progress" min="0" max="100" value="0">
              <div style="display:flex;justify-content:space-between;">
                <span class="player-time" id="crz-time">0:00</span>
                <span class="player-time" id="crz-duration">0:00</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="visual-wrap">
        <canvas id="crz-canvas"></canvas>
        <div class="bottom-actions">
          <input id="crz-volume" type="range" min="0" max="1" step="0.01" value="1" title="Volume">
          <a id="crz-download" class="download-btn" href="#" download style="display:none">⬇️</a>
        </div>
      </div>
    </div>

    <div class="settings" id="crz-settings">
      <label>Visualizer <input type="checkbox" id="crz-visual-toggle" checked></label>
      <label>Autoplay Next <input type="checkbox" id="crz-autoplay"></label>
      <label>Accent <input type="color" id="crz-accent" value="#ff2965"></label>
      <div style="text-align:right;margin-top:8px;">
        <button id="crz-close-settings" class="icon-btn">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(player);

  // Cache nodes
  const playBtn = document.getElementById('crzy-play');
  const prevBtn = document.getElementById('crzy-prev');
  const nextBtn = document.getElementById('crzy-next');
  const dockBtn = document.getElementById('crzy-dock');
  const settingsBtn = document.getElementById('crzy-settings-btn');
  const settingsPanel = document.getElementById('crz-settings');
  const visualToggle = document.getElementById('crz-visual-toggle');
  const autoplayToggle = document.getElementById('crz-autoplay');
  const accentInput = document.getElementById('crz-accent');
  const coverImg = document.getElementById('crz-cover');
  const songText = document.getElementById('crz-song');
  const artistText = document.getElementById('crz-artist');
  const progressRange = document.getElementById('crz-progress');
  const timeEl = document.getElementById('crz-time');
  const durEl = document.getElementById('crz-duration');
  const canvas = document.getElementById('crz-canvas');
  const volumeInput = document.getElementById('crz-volume');
  const downloadBtn = document.getElementById('crz-download');

  // Apply saved accent and mode
  const savedAccent = localStorage.getItem(ACCENT_KEY);
  if (savedAccent) {
    document.documentElement.style.setProperty('--accent', savedAccent);
    accentInput.value = savedAccent;
  } else {
    document.documentElement.style.setProperty('--accent', '#ff2965');
  }

  const savedMode = localStorage.getItem(MODE_KEY) || 'float';
  if (savedMode === 'dock') player.classList.add('docked');

  // Play state
  let isPlaying = false;
  let rafId = null;

  // WebAudio setup
  let audioCtx, analyser, sourceNode;
  let bufferLength, dataArray;
  function setupAudioContext() {
    if (!window.AudioContext) return false;
    if (audioCtx) return true;
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioCtx.createAnalyser();
    analyser.fftSize = 2048;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    try {
      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
    } catch (e) {
      // if cross-origin or multiple sources created, fallback gracefully
      console.warn('Audio context setup error', e);
    }
    return true;
  }

  // Visualizer: waveform + particles
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * devicePixelRatio;
    canvas.height = rect.height * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  function createParticles(count = 36) {
    particles = [];
    for (let i=0;i<count;i++){
      particles.push({
        x: Math.random()*canvas.clientWidth,
        y: Math.random()*canvas.clientHeight,
        vx: (Math.random()-0.5)*0.6,
        vy: (Math.random()-0.5)*0.6,
        size: 1 + Math.random()*3,
        hue: 340 + Math.random()*30
      });
    }
  }
  createParticles(22);

  function drawVisualizer() {
    if (!visualToggle.checked) {
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
      return;
    }
    if (!analyser || !dataArray) {
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight);
      return;
    }
    analyser.getByteTimeDomainData(dataArray);

    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);

    // waveform
    ctx.lineWidth = 2;
    ctx.strokeStyle = localStorage.getItem(ACCENT_KEY) || '#ff2965';
    ctx.beginPath();
    const slice = w / dataArray.length;
    for (let i=0;i<dataArray.length;i++){
      const v = (dataArray[i] - 128) / 128;
      const y = (h/2) + v*(h/2)*0.8;
      const x = i * slice;
      if (i===0) ctx.moveTo(x,y);
      else ctx.lineTo(x,y);
    }
    ctx.stroke();

    // amplitude for pulses/particles
    let sum = 0;
    for (let i=0;i<dataArray.length;i++) sum += Math.abs(dataArray[i]-128);
    const amp = sum / dataArray.length / 128; // 0..~1

    // update particles
    for (let p of particles) {
      p.x += p.vx * (1 + amp*4);
      p.y += p.vy * (1 + amp*4);
      p.size += (Math.random()-0.5)*0.2;
      if (p.x < -10) p.x = w + 10;
      if (p.x > w + 10) p.x = -10;
      if (p.y < -10) p.y = h + 10;
      if (p.y > h + 10) p.y = -10;
      ctx.fillStyle = `rgba(255,41,101,${0.08 + amp*0.6})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size + amp*4, 0, Math.PI*2);
      ctx.fill();
    }

    // set pulsing outline if amp passes threshold
    if (amp > 0.02 && !player.classList.contains('pulse')) {
      player.classList.add('pulse');
    } else if (amp <= 0.02 && player.classList.contains('pulse')) {
      player.classList.remove('pulse');
    }
  }

  // animation loop
  function animate() {
    drawVisualizer();
    rafId = requestAnimationFrame(animate);
  }

  // update track meta
  function updateMeta() {
    const src = audio.src || '';
    const filename = src.split('/').pop() || '';
    songText.textContent = filename || 'Not playing';
    artistText.textContent = src ? 'CRZYCLAN' : '—';

    // show download if src and membership is handled by your site: expose a function isMember?
    if (src && window.isMember) {
      downloadBtn.href = src;
      downloadBtn.style.display = 'inline-block';
    } else {
      downloadBtn.style.display = 'none';
    }

    // cover: try to find data-cover attr or fallback
    const cover = audio.getAttribute('data-cover') || coverImg.src;
    coverImg.src = cover;
  }

  // progress updates
  audio.addEventListener('timeupdate', () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
      const pct = (audio.currentTime / audio.duration) * 100;
      progressRange.value = pct;
      timeEl.textContent = formatTime(audio.currentTime);
      durEl.textContent = formatTime(audio.duration);
    }
  });

  progressRange.addEventListener('input', () => {
    if (!isNaN(audio.duration) && audio.duration > 0) {
      const pct = progressRange.value / 100;
      audio.currentTime = pct * audio.duration;
    }
  });

  function formatTime(t) {
    if (!t || isNaN(t)) return '0:00';
    const m = Math.floor(t/60);
    const s = Math.floor(t%60).toString().padStart(2,'0');
    return `${m}:${s}`;
  }

  // play/pause handler
  function togglePlay() {
    if (audio.paused) {
      // resume or start
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      audio.play().catch(err => console.warn('play prevented', err));
      isPlaying = true;
      playBtn.textContent = '⏸️';
      startVisual();
      broadcastState({ action: 'play', src: audio.src });
    } else {
      audio.pause();
      isPlaying = false;
      playBtn.textContent = '▶️';
      stopVisual();
      broadcastState({ action: 'pause' });
    }
  }

  playBtn.addEventListener('click', togglePlay);

  // dock toggle
  dockBtn.addEventListener('click', () => {
    const docked = player.classList.toggle('docked');
    localStorage.setItem(MODE_KEY, docked ? 'dock' : 'float');
  });

  // settings open/close
  settingsBtn.addEventListener('click', (e) => {
    settingsPanel.classList.toggle('show');
  });
  document.getElementById('crz-close-settings').addEventListener('click', () => {
    settingsPanel.classList.remove('show');
  });

  // accent color persisted
  accentInput.addEventListener('input', (e) => {
    const v = e.target.value;
    document.documentElement.style.setProperty('--accent', v);
    localStorage.setItem(ACCENT_KEY, v);
  });

  // visual toggle & autoplay persisted
  visualToggle.addEventListener('change', () => {
    localStorage.setItem('crz_visual_on', visualToggle.checked ? '1' : '0');
  });
  autoplayToggle.addEventListener('change', () => {
    localStorage.setItem('crz_autoplay', autoplayToggle.checked ? '1' : '0');
  });

  // volume
  volumeInput.addEventListener('input', (e) => {
    audio.volume = Number(e.target.value);
  });

  // previous/next - placeholders (you can wire these to your playlist logic)
  prevBtn.addEventListener('click', () => {
    broadcastState({ action: 'prev' });
  });
  nextBtn.addEventListener('click', () => {
    broadcastState({ action: 'next' });
  });

  // start/stop visual loop
  function startVisual() {
    if (!setupAudioContext()) {
      // not supported, still show pulse animation via CSS animation
      player.classList.add('pulse');
      return;
    }
    if (!rafId) {
      animate();
    }
  }
  function stopVisual() {
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  // on ended: hide pulse and maybe autoplay next if enabled
  audio.addEventListener('ended', () => {
    stopVisual();
    player.classList.remove('pulse');
    playBtn.textContent = '▶️';
    const auto = localStorage.getItem('crz_autoplay') === '1';
    if (auto) {
      broadcastState({ action: 'next' });
    } else {
      broadcastState({ action: 'ended' });
    }
  });

  // format initial meta
  updateMeta();

  // Start/stop on load if needed
  // Sync across tabs using localStorage events
  function broadcastState(obj) {
    const payload = {
      ts: Date.now(),
      ...obj
    };
    localStorage.setItem(STATE_KEY, JSON.stringify(payload));
    // also immediately handle locally for reliability
    handleState(payload, true);
  }

  window.addEventListener('storage', (e) => {
    if (e.key === STATE_KEY && e.newValue) {
      try {
        const payload = JSON.parse(e.newValue);
        handleState(payload, false);
      } catch (err) {}
    }
  });

  function handleState(payload, local) {
    if (!payload || !payload.action) return;
    if (payload.action === 'play') {
      if (payload.src && payload.src !== audio.src) {
        audio.src = payload.src;
        updateMeta();
      }
      audio.play().catch(()=>{});
      isPlaying = true;
      playBtn.textContent = '⏸️';
      startVisual();
    } else if (payload.action === 'pause') {
      audio.pause();
      isPlaying = false;
      playBtn.textContent = '▶️';
      stopVisual();
    } else if (payload.action === 'setSrc') {
      if (payload.src) {
        audio.src = payload.src;
        if (payload.cover) audio.setAttribute('data-cover', payload.cover);
        updateMeta();
      }
    } else if (payload.action === 'ended') {
      // stopped
      audio.pause();
      isPlaying = false;
      stopVisual();
    } else if (payload.action === 'prev' || payload.action === 'next') {
      // emit a custom event so the host page can handle playlist changes
      window.dispatchEvent(new CustomEvent('crzy-player-action', { detail: payload }));
    }
  }

  // allow host pages to set src via window.crzyPlayer.setSrc(...)
  window.crzyPlayer = {
    setSrc: (src, meta = {}) => {
      audio.src = src;
      if (meta.cover) audio.setAttribute('data-cover', meta.cover);
      if (meta.title) songText.textContent = meta.title;
      if (meta.artist) artistText.textContent = meta.artist;
      updateMeta();
      broadcastState({ action: 'setSrc', src, cover: meta.cover || '' });
    },
    play: () => broadcastState({ action: 'play', src: audio.src }),
    pause: () => broadcastState({ action: 'pause' }),
    toggle: togglePlay
  };

  // Click on cover/song area could open player expand (placeholder)
  coverImg.addEventListener('dblclick', () => {
    // example: go to a full player page (if you have one)
    console.log('double click cover');
  });

  // drag functionality (mouse + touch)
  let isDragging = false, dragOffset = {x:0,y:0};
  const dragBar = player.querySelector('.drag');
  dragBar.addEventListener('mousedown', startDrag);
  dragBar.addEventListener('touchstart', startDrag, {passive:false});
  function startDrag(e) {
    if (player.classList.contains('docked')) return;
    isDragging = true;
    dragBar.style.cursor = 'grabbing';
    const ev = e.touches ? e.touches[0] : e;
    dragOffset.x = ev.clientX - player.offsetLeft;
    dragOffset.y = ev.clientY - player.offsetTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive:false});
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }
  function onDrag(e) {
    if (!isDragging) return;
    const ev = e.touches ? e.touches[0] : e;
    let x = ev.clientX - dragOffset.x;
    let y = ev.clientY - dragOffset.y;
    // constrain within window
    x = Math.max(6, Math.min(window.innerWidth - player.offsetWidth - 6, x));
    y = Math.max(6, Math.min(window.innerHeight - player.offsetHeight - 6, y));
    player.style.left = x + 'px';
    player.style.top = y + 'px';
  }
  function stopDrag() {
    isDragging = false;
    dragBar.style.cursor = 'grab';
    document.removeEventListener('mousemove', onDrag);
    document.removeEventListener('touchmove', onDrag);
    document.removeEventListener('mouseup', stopDrag);
    document.removeEventListener('touchend', stopDrag);
  }

  // initialize visual/audio context when user interacts
  function tryInitAudio() {
    if (!setupAudioContext()) return;
    // resume context on user gesture
    if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
  }
  document.addEventListener('click', tryInitAudio, { once: true });

  // Update meta display when src changes
  audio.addEventListener('loadedmetadata', () => {
    updateMeta();
    durEl.textContent = formatTime(audio.duration);
  });

  // allow host pages to call crzyPlayer.setMeta({title,artist,cover})
  window.crzyPlayer.setMeta = (meta) => {
    if (meta.title) songText.textContent = meta.title;
    if (meta.artist) artistText.textContent = meta.artist;
    if (meta.cover) coverImg.src = meta.cover;
  };

  // set initial volume
  audio.volume = Number(volumeInput.value || 1);

  // start/stop via keyboard space (if focused) - optional
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
      e.preventDefault();
      togglePlay();
    }
  });

  // when page loads if audio already has src set, prepare meta & optionally autoplay
  if (audio.src) {
    updateMeta();
    const autoPlay = localStorage.getItem('crz_autoplay') === '1';
    if (autoPlay) {
      handleState({ action: 'play', src: audio.src }, true);
    }
  }

  // set cover clickable to open audio src (for download preview)
  coverImg.addEventListener('click', () => {
    if (audio.src) window.open(audio.src, '_blank');
  });

  // finalize: make canvas HiDPI friendly on insertion
  setTimeout(() => { resizeCanvas(); }, 300);

})();
