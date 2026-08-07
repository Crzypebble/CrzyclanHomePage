// player.js - CRZYCLAN Player v2 (injects #crzy-player, draggable, dock, visualizer, queue, bg-visualizer)
(function(){
  const STATE_KEY = 'crzy_player_state';
  const ACCENT_KEY = 'crzy_player_accent';
  const MODE_KEY = 'crzy_player_mode';
  const VIZ_STYLE_KEY = 'crzy_player_viz_style';

  const old = document.getElementById('simple-player');
  if (old) old.remove();

  let audio = document.getElementById('mainAudioPlayer');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'mainAudioPlayer';
    audio.preload = 'metadata';
    audio.style.display = 'none';
    audio.crossOrigin = 'anonymous'; 
    document.body.appendChild(audio);
  }

  function $el(tag, attrs={}, html=''){
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else e.setAttribute(k,v); });
    e.innerHTML=html; return e;
  }

  // --- BACKGROUND VISUALIZER CANVAS ---
  const bgCanvas = $el('canvas', {id: 'crz-bg-canvas', style: 'position:fixed; top:0; left:0; width:100vw; height:100vh; z-index:-1; pointer-events:none; opacity: 0.15; transition: opacity 0.3s; display:none;'});
  document.body.prepend(bgCanvas);
  const bgCtx = bgCanvas.getContext('2d');

  // --- FOREGROUND PLAYER ---
  const player = $el('div',{id:'crzy-player'});
  player.innerHTML = `
    <div class="drag" title="Drag / Hold to move (When Unpinned)">
      <div class="title">CRZYCLAN Player</div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="icon-btn" id="crzy-prev" title="Prev">⏮</button>
        <button class="icon-btn" id="crzy-play" title="Play">▶️</button>
        <button class="icon-btn" id="crzy-next" title="Next">⏭</button>
        <button class="icon-btn" id="crzy-dock" title="Toggle Pin">📌</button>
        <button class="icon-btn" id="crzy-queue-btn" title="Queue">☰</button>
        <button class="icon-btn" id="crzy-settings-btn" title="Settings">⚙️</button>
      </div>
    </div>
    <div class="body">
      <div class="meta">
        <img id="crz-cover" class="cover" src="https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true">
        <div class="now">
          <div class="song" id="crz-song">Not playing</div>
          <div class="artist" id="crz-artist">—</div>
          <div class="progress">
            <input id="crz-progress" class="progress" type="range" min="0" max="100" value="0">
            <div style="display:flex;justify-content:space-between;"><span id="crz-time">0:00</span><span id="crz-duration">0:00</span></div>
          </div>
        </div>
      </div>
      <div class="visual-wrap">
        <canvas id="crz-canvas"></canvas>
        <div class="bottom-actions" style="display:flex;gap:8px;align-items:center;">
          <input id="crz-volume" type="range" min="0" max="1" step="0.01" value="1" title="Volume">
          <a id="crz-download" class="download-btn hidden" href="#" download>⬇️</a>
        </div>
      </div>
    </div>
    <div id="crz-settings" class="settings">
      <label style="display:flex; justify-content:space-between; margin-bottom:8px;">Visualizer Style 
        <select id="crz-viz-style" style="background:#222; color:#fff; border:1px solid #444; border-radius:4px;">
          <option value="bars">Bars</option>
          <option value="wave">Wave</option>
          <option value="off">Off</option>
        </select>
      </label>
      <label style="display:flex; justify-content:space-between; margin-bottom:8px;">Autoplay Next <input id="crz-autoplay" type="checkbox" checked></label>
      <label style="display:flex; justify-content:space-between; margin-bottom:8px;">Accent <input id="crz-accent" type="color" value="#ff0000"></label>
      <div style="text-align:right;margin-top:12px;"><button id="crz-close-settings" class="icon-btn">Close</button></div>
    </div>
  `;
  document.body.appendChild(player);

  const queuePanel = $el('div',{class:'crzy-queue'});
  queuePanel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong>Queue</strong><button id="crzy-clear-queue" title="Clear" style="background:transparent;color:#ff0000;border:1px solid #ff0000;border-radius:4px;padding:2px 8px;cursor:pointer;">Clear</button></div><div id="crzy-queue-items"></div>`;
  player.after(queuePanel);

  // Nodes
  const playBtn = document.getElementById('crzy-play');
  const prevBtn = document.getElementById('crzy-prev');
  const nextBtn = document.getElementById('crzy-next');
  const dockBtn = document.getElementById('crzy-dock');
  const queueBtn = document.getElementById('crzy-queue-btn');
  const settingsBtn = document.getElementById('crzy-settings-btn');
  const settingsPanel = document.getElementById('crz-settings');
  const vizStyleSelect = document.getElementById('crz-viz-style');
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
  const queueItemsWrap = document.getElementById('crzy-queue-items');

  // Load Settings
  const savedAccent = localStorage.getItem(ACCENT_KEY) || '#ff0000';
  document.documentElement.style.setProperty('--accent', savedAccent);
  accentInput.value = savedAccent;
  
  const savedViz = localStorage.getItem(VIZ_STYLE_KEY) || 'bars';
  vizStyleSelect.value = savedViz;

  const savedMode = localStorage.getItem(MODE_KEY) || 'dock';
  if (savedMode === 'dock') player.classList.add('docked');
  autoplayToggle.checked = localStorage.getItem('crz_autoplay') !== '0';

  // Audio Context
  let audioCtx, analyser, sourceNode, timeDataArray, freqDataArray, bufferLength;
  function setupAudioCtx(){
    if (!window.AudioContext && !window.webkitAudioContext) return false;
    if (audioCtx) return true;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 256; 
      bufferLength = analyser.frequencyBinCount;
      timeDataArray = new Uint8Array(bufferLength);
      freqDataArray = new Uint8Array(bufferLength);
      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      return true;
    } catch(e){
      console.warn('AudioContext failed - Visualizer disabled.', e);
      return false;
    }
  }

  // Canvas Resizing
  const ctx = canvas.getContext('2d');
  function resizeCanvas(){ 
    const rect = canvas.getBoundingClientRect(); 
    canvas.width = rect.width * (window.devicePixelRatio || 1); 
    canvas.height = rect.height * (window.devicePixelRatio || 1); 
    ctx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1); 

    bgCanvas.width = window.innerWidth * (window.devicePixelRatio || 1);
    bgCanvas.height = window.innerHeight * (window.devicePixelRatio || 1);
    bgCtx.scale(window.devicePixelRatio || 1, window.devicePixelRatio || 1);
  }
  window.addEventListener('resize', resizeCanvas);

  function drawViz(){
    const style = vizStyleSelect.value;
    if (style === 'off' || !analyser) { 
      ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight); 
      bgCanvas.style.display = 'none';
      return; 
    }
    
    const accentCol = localStorage.getItem(ACCENT_KEY) || '#ff0000';
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    
    if (style === 'bars') {
      analyser.getByteFrequencyData(freqDataArray);
      const barWidth = (w / bufferLength) * 2.5;
      let x = 0;
      
      for(let i = 0; i < bufferLength; i++) {
        const barHeight = (freqDataArray[i] / 255) * h;
        ctx.fillStyle = accentCol;
        ctx.fillRect(x, h - barHeight, barWidth, barHeight);
        x += barWidth + 1;
      }
    } else if (style === 'wave') {
      analyser.getByteTimeDomainData(timeDataArray);
      ctx.lineWidth = 2;
      ctx.strokeStyle = accentCol;
      ctx.beginPath();
      const slice = w / bufferLength;
      for (let i=0; i<bufferLength; i++){
        const v = (timeDataArray[i]-128)/128;
        const y = (h/2) + v*(h/2)*0.9;
        const x = i*slice;
        if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
      }
      ctx.stroke();
    }

    // BACKGROUND FULL-SCREEN DRAWING (Only when docked & playing)
    if (player.classList.contains('docked') && isPlaying) {
      bgCanvas.style.display = 'block';
      const bgW = bgCanvas.clientWidth;
      const bgH = bgCanvas.clientHeight;
      bgCtx.clearRect(0, 0, bgW, bgH);
      
      if (style === 'bars') {
        const bgBarW = (bgW / bufferLength) * 3;
        let bx = 0;
        bgCtx.fillStyle = accentCol;
        for(let i = 0; i < bufferLength; i++) {
          const bH = (freqDataArray[i] / 255) * (bgH * 0.4);
          bgCtx.fillRect(bx, bgH - bH, bgBarW, bH);
          bx += bgBarW + 2;
        }
      } else {
        bgCtx.lineWidth = 3;
        bgCtx.strokeStyle = accentCol;
        bgCtx.beginPath();
        const bgSlice = bgW / bufferLength;
        for (let i = 0; i < bufferLength; i++) {
          const v = (timeDataArray[i] - 128) / 128;
          const y = (bgH / 2) + v * (bgH / 3); 
          const x = i * bgSlice;
          if (i === 0) bgCtx.moveTo(x, y); else bgCtx.lineTo(x, y);
        }
        bgCtx.stroke();
      }
    } else {
      bgCanvas.style.display = 'none';
    }
  }

  let rafId=null;
  function animate(){ drawViz(); rafId = requestAnimationFrame(animate); }
  function startVisual(){ if (!setupAudioCtx()) { player.classList.add('pulse'); return; } if (!rafId) animate(); }
  function stopVisual(){ if (rafId){ cancelAnimationFrame(rafId); rafId=null; } player.classList.remove('pulse'); }

  let isPlaying = false;

  function updateMeta(){
    const src = audio.src || '';
    const filename = src.split('/').pop() || '';
    songText.textContent = audio.getAttribute('data-title') || filename || 'Not playing';
    artistText.textContent = audio.getAttribute('data-artist') || 'CRZYCLAN';
    const cover = audio.getAttribute('data-cover') || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true';
    coverImg.src = cover;
    if (src && window.isMember) { downloadBtn.href = src; downloadBtn.classList.remove('hidden'); } else downloadBtn.classList.add('hidden');
  }

  // Progress Bar
  audio.addEventListener('timeupdate', ()=>{
    if (!isNaN(audio.duration) && audio.duration>0){
      const pct = (audio.currentTime/audio.duration)*100;
      progressRange.value = pct;
      timeEl.textContent = formatTime(audio.currentTime);
      durEl.textContent = formatTime(audio.duration);
    }
  });
  progressRange.addEventListener('input', ()=> {
    if (!isNaN(audio.duration) && audio.duration>0) audio.currentTime = (progressRange.value/100)*audio.duration;
  });
  function formatTime(t){ if (!t||isNaN(t)) return '0:00'; const m = Math.floor(t/60); const s = Math.floor(t%60).toString().padStart(2,'0'); return `${m}:${s}`; }

  function togglePlay(){
    if (audio.paused) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      let playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          isPlaying = true; 
          playBtn.textContent = '⏸️'; 
          startVisual();
          broadcast({action:'play', src:audio.src});
        }).catch(e => console.error(e));
      }
    } else {
      audio.pause(); isPlaying=false; playBtn.textContent='▶️'; stopVisual(); broadcast({action:'pause'});
    }
  }
  playBtn.addEventListener('click', togglePlay);

  // Dock Logic
  dockBtn.addEventListener('click', ()=>{
    const docked = player.classList.toggle('docked'); 
    localStorage.setItem(MODE_KEY, docked ? 'dock' : 'float');
    positionQueue();
  });

  // Settings
  settingsBtn.addEventListener('click', ()=> settingsPanel.classList.toggle('show'));
  document.getElementById('crz-close-settings').addEventListener('click', ()=> settingsPanel.classList.remove('show'));
  accentInput.addEventListener('input', (e)=> { document.documentElement.style.setProperty('--accent', e.target.value); localStorage.setItem(ACCENT_KEY, e.target.value); });
  vizStyleSelect.addEventListener('change', ()=> localStorage.setItem(VIZ_STYLE_KEY, vizStyleSelect.value));
  autoplayToggle.addEventListener('change', ()=> localStorage.setItem('crz_autoplay', autoplayToggle.checked ? '1':'0'));
  volumeInput.addEventListener('input', (e)=> audio.volume = Number(e.target.value || 1));
  audio.volume = Number(volumeInput.value || 1);

  // Queue
  function getQueue(){ return JSON.parse(localStorage.getItem('crzy_queue')||'[]'); }
  function saveQueue(q){ localStorage.setItem('crzy_queue', JSON.stringify(q)); renderQueue(); }
  function addToQueue(song){ const q=getQueue(); q.push(song); saveQueue(q); showPopup('Added to queue'); }
  function clearQueue(){ saveQueue([]); showPopup('Queue cleared'); }
  function popQueue(){ const q=getQueue(); const next=q.shift(); saveQueue(q); return next; }

  function playNextInQueue() {
    const next = popQueue();
    if (next) window.CrzyPlayer.play(next.src, next.title, next.cover, next.artist);
    else showPopup("Queue empty", 1500);
  }

  prevBtn.addEventListener('click', ()=> { if (audio.currentTime > 3) audio.currentTime = 0; else showPopup("No previous history tracked"); });
  nextBtn.addEventListener('click', ()=> playNextInQueue());
  audio.addEventListener('ended', ()=> {
    stopVisual(); playBtn.textContent = '▶️';
    if (localStorage.getItem('crz_autoplay') !== '0') playNextInQueue();
  });

  // Broadcast
  function broadcast(obj){ const payload = { ts: Date.now(), ...obj }; localStorage.setItem(STATE_KEY, JSON.stringify(payload)); handleState(payload, true); }
  window.addEventListener('storage', (e)=> { if (e.key === STATE_KEY && e.newValue) try{ handleState(JSON.parse(e.newValue), false); } catch(e){} });

  function handleState(payload, local){
    if (!payload || !payload.action) return;
    if (payload.action === 'play') { 
      if (payload.src && payload.src !== audio.src){ 
        audio.src = payload.src; 
        if (payload.meta) { 
          if (payload.meta.cover) audio.setAttribute('data-cover', payload.meta.cover); 
          if (payload.meta.title) audio.setAttribute('data-title', payload.meta.title); 
          if (payload.meta.artist) audio.setAttribute('data-artist', payload.meta.artist); 
        } 
        updateMeta(); 
      } 
      let playPromise = audio.play();
      if (playPromise !== undefined) playPromise.then(_ => { playBtn.textContent='⏸️'; startVisual(); }).catch(e => console.warn(e));
    }
    else if (payload.action === 'pause'){ audio.pause(); playBtn.textContent='▶️'; stopVisual(); }
    else if (payload.action === 'setSrc'){ 
      if (payload.src){ 
        audio.src = payload.src; 
        if (payload.meta){ 
          if (payload.meta.cover) audio.setAttribute('data-cover', payload.meta.cover); 
          if (payload.meta.title) audio.setAttribute('data-title', payload.meta.title); 
          if (payload.meta.artist) audio.setAttribute('data-artist', payload.meta.artist); 
        } 
        updateMeta(); 
      } 
    }
  }

  function findCoverInDOM(src) {
    if (!src) return null;
    const el = document.querySelector(`[data-src="${src}"]`);
    if (el) {
      const album = el.closest('.album-wrapper');
      if (album) {
        const img = album.querySelector('.album-cover');
        if (img) return img.src;
      }
      const card = el.closest('.track-card');
      if (card) {
        const img = card.querySelector('.track-art');
        if (img) return img.src;
      }
    }
    return null;
  }

  window.CrzyPlayer = {
    play: (src, title, cover, artist) => {
      let finalCover = cover;
      if (!finalCover || finalCover === 'null') {
        finalCover = findCoverInDOM(src) || 'https://github.com/Crzypebble/CrzyclanHomePage/blob/main/default-cover.jpg?raw=true';
      }

      if (src) {
        audio.src = src;
        if (title) audio.setAttribute('data-title', title);
        if (artist) audio.setAttribute('data-artist', artist);
        if (finalCover) audio.setAttribute('data-cover', finalCover);
        updateMeta();
      }
      let playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.then(_ => {
          isPlaying = true; playBtn.textContent = '⏸️'; startVisual();
        }).catch(error => { console.error("Autoplay prevented:", error); showPopup("Playback blocked. Tap play.", 2000); });
      }
      broadcast({action:'play', src: audio.src, meta:{title: audio.getAttribute('data-title'), artist: audio.getAttribute('data-artist'), cover: audio.getAttribute('data-cover')}});
    },
    setSrc: (src, meta) => {
      audio.src = src;
      if (meta && meta.cover) audio.setAttribute('data-cover', meta.cover);
      if (meta && meta.title) audio.setAttribute('data-title', meta.title);
      if (meta && meta.artist) audio.setAttribute('data-artist', meta.artist);
      updateMeta();
      broadcast({action:'setSrc', src, meta});
    },
    addToQueue: addToQueue, clearQueue: clearQueue, popQueue: popQueue
  };

  audio.addEventListener('loadedmetadata', ()=> { updateMeta(); durEl.textContent = formatTime(audio.duration); });
  setTimeout(()=> resizeCanvas(), 200);

  // Queue Rendering
  function renderQueue(){
    const q=getQueue(); queueItemsWrap.innerHTML='';
    if (!q.length) { queueItemsWrap.innerHTML = '<div style="color:#aaa;padding:8px">Queue empty</div>'; return; }
    q.forEach((s,i)=>{
      const item = $el('div',{class:'item',draggable:'true', 'data-i':i});
      item.innerHTML = `<div style="display:flex;gap:8px;align-items:center"><div class="drag-handle">⋮</div><div class="info"><strong>${s.title}</strong><br><small>${s.artist||''}</small></div></div>
        <div style="position:relative">
          <button class="small-menu" aria-expanded="false">⋯</button>
          <div class="menu"><button class="remove">Remove</button></div>
        </div>`;
      queueItemsWrap.appendChild(item);

      const menuBtn = item.querySelector('.small-menu');
      const menu = item.querySelector('.menu');
      menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); menuBtn.classList.toggle('open'); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });

      item.querySelector('.remove').addEventListener('click', (e)=> {
        e.stopPropagation();
        const idx = +item.getAttribute('data-i');
        const arr = getQueue(); arr.splice(idx,1); saveQueue(arr); showPopup('Removed from queue');
      });

      item.addEventListener('dragstart', (ev)=> { ev.dataTransfer.setData('text/plain', item.getAttribute('data-i')); item.classList.add('dragging'); });
      item.addEventListener('dragend', ()=> { item.classList.remove('dragging'); renderQueue(); });
      item.addEventListener('dragover', (ev)=> ev.preventDefault());
      item.addEventListener('drop', (ev)=> {
        ev.preventDefault();
        const from = +ev.dataTransfer.getData('text/plain');
        const to = +item.getAttribute('data-i');
        if (isNaN(from) || isNaN(to)) return;
        const arr = getQueue();
        const [moved] = arr.splice(from,1);
        arr.splice(to,0,moved);
        saveQueue(arr);
      });
    });
  }

  // Position Queue Dynamic Logic
  queueBtn.addEventListener('click', (e)=> { e.stopPropagation(); player.classList.toggle('queue-open'); positionQueue(); renderQueue(); });
  
  function positionQueue(){
    const rect = player.getBoundingClientRect();
    const qWidth = 360;

    if (player.classList.contains('docked')) {
      queuePanel.style.left = '20px';
      queuePanel.style.bottom = '90px'; 
    } else {
      if (window.innerWidth <= 768) {
        queuePanel.style.left = '4vw';
        queuePanel.style.bottom = (window.innerHeight - rect.top + 15) + 'px';
      } else {
        if (rect.right + qWidth + 20 > window.innerWidth) {
          queuePanel.style.left = (rect.left - qWidth - 15) + 'px'; 
        } else {
          queuePanel.style.left = (rect.right + 15) + 'px'; 
        }
        queuePanel.style.bottom = (window.innerHeight - rect.bottom) + 'px'; 
      }
    }
  }
  window.addEventListener('resize', positionQueue);

  document.getElementById('crzy-clear-queue').addEventListener('click', ()=> clearQueue());

  const popup = document.createElement('div');
  popup.style.position='fixed'; popup.style.right='18px'; popup.style.bottom='18px'; popup.style.background='var(--accent)'; popup.style.padding='12px 18px'; popup.style.color='#fff'; popup.style.borderRadius='8px'; popup.style.opacity=0; popup.style.transition='opacity .2s'; popup.style.zIndex=99999;
  document.body.appendChild(popup);
  function showPopup(msg, t=1200){ popup.textContent = msg; popup.style.opacity=1; setTimeout(()=>{ popup.style.opacity=0; }, t); }

  let isDragging=false, dragOffset={x:0,y:0};
  const dragBar = player.querySelector('.drag');
  dragBar.addEventListener('mousedown', startDrag);
  dragBar.addEventListener('touchstart', startDrag, {passive:false});
  function startDrag(e){
    if (player.classList.contains('docked')) return;
    isDragging=true; dragBar.style.cursor='grabbing';
    const ev = e.touches ? e.touches[0] : e;
    dragOffset.x = ev.clientX - player.offsetLeft;
    dragOffset.y = ev.clientY - player.offsetTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive:false});
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
  }
  function onDrag(e){
    if (!isDragging) return;
    const ev = e.touches ? e.touches[0] : e;
    let x = ev.clientX - dragOffset.x;
    let y = ev.clientY - dragOffset.y;
    x = Math.max(6, Math.min(window.innerWidth - player.offsetWidth - 6, x));
    y = Math.max(6, Math.min(window.innerHeight - player.offsetHeight - 6, y));
    player.style.left = x + 'px'; player.style.top = y + 'px';
    positionQueue();
  }
  function stopDrag(){
    isDragging=false; dragBar.style.cursor='grab'; document.removeEventListener('mousemove', onDrag); document.removeEventListener('touchmove', onDrag); document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchend', stopDrag);
  }

  window.addEventListener('keydown',(e)=>{ if (e.code==='Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){ e.preventDefault(); togglePlay(); } });

  renderQueue();
  updateMeta();
  positionQueue();
  document.addEventListener('click', ()=>{ try { setupAudioCtx(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){} }, { once:true });

})();
