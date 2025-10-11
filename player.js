// player.js - CRZYCLAN Player v2 (injects #crzy-player, draggable, dock, visualizer, queue)
// - removes old #simple-player if present
// - exposes window.crzyPlayer API for music.js
(function(){
  const STATE_KEY = 'crzy_player_state';
  const ACCENT_KEY = 'crzy_player_accent';
  const MODE_KEY = 'crzy_player_mode';

  // remove old player block if present
  const old = document.getElementById('simple-player');
  if (old) old.remove();

  // ensure single audio element exists
  let audio = document.getElementById('audio-player');
  if (!audio) {
    audio = document.createElement('audio');
    audio.id = 'audio-player';
    audio.preload = 'metadata';
    audio.style.display = 'none';
    document.body.appendChild(audio);
  }

  // create player container
  function $el(tag, attrs={}, html=''){
    const e=document.createElement(tag);
    Object.entries(attrs).forEach(([k,v])=>{ if(k==='class') e.className=v; else e.setAttribute(k,v); });
    e.innerHTML=html; return e;
  }

  const player = $el('div',{id:'crzy-player'});
  player.innerHTML = `
    <div class="drag" title="Drag / Hold to move">
      <div class="title">CRZYCLAN Player</div>
      <div style="display:flex;gap:6px;align-items:center">
        <button class="icon-btn" id="crzy-prev" title="Prev">⏮</button>
        <button class="icon-btn" id="crzy-play" title="Play">▶️</button>
        <button class="icon-btn" id="crzy-next" title="Next">⏭</button>
        <button class="icon-btn" id="crzy-dock" title="Dock">📌</button>
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
      <label>Visualizer <input id="crz-visual-toggle" type="checkbox" checked></label>
      <label>Autoplay Next <input id="crz-autoplay" type="checkbox"></label>
      <label>Accent <input id="crz-accent" type="color" value="#ff0000"></label>
      <div style="text-align:right;margin-top:8px;"><button id="crz-close-settings" class="icon-btn">Close</button></div>
    </div>
  `;
  document.body.appendChild(player);

  // queue panel under the player (separate element sibling)
  const queuePanel = $el('div',{class:'crzy-queue'});
  queuePanel.innerHTML = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;"><strong>Queue</strong><button id="crzy-clear-queue" title="Clear">Clear</button></div><div id="crzy-queue-items"></div>`;
  player.after(queuePanel);

  // nodes
  const playBtn = document.getElementById('crzy-play');
  const prevBtn = document.getElementById('crzy-prev');
  const nextBtn = document.getElementById('crzy-next');
  const dockBtn = document.getElementById('crzy-dock');
  const queueBtn = document.getElementById('crzy-queue-btn');
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
  const queueItemsWrap = document.getElementById('crzy-queue-items');

  // get saved accent/mode
  const savedAccent = localStorage.getItem(ACCENT_KEY) || '#ff0000';
  document.documentElement.style.setProperty('--accent', savedAccent);
  accentInput.value = savedAccent;
  const savedMode = localStorage.getItem(MODE_KEY) || 'float';
  if (savedMode === 'dock') player.classList.add('docked');

  // audio context + visualizer
  let audioCtx, analyser, sourceNode, dataArray, bufferLength;
  function setupAudioCtx(){
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
    } catch(e){ console.warn('audio ctx issue', e); }
    return true;
  }

  // canvas hi-dpi
  const ctx = canvas.getContext('2d');
  function resizeCanvas(){ const rect = canvas.getBoundingClientRect(); canvas.width = rect.width * devicePixelRatio; canvas.height = rect.height * devicePixelRatio; ctx.scale(devicePixelRatio, devicePixelRatio); }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // particles
  let particles = [];
  function createParticles(n=22){
    particles=[];
    for(let i=0;i<n;i++){
      particles.push({ x:Math.random()*canvas.clientWidth, y:Math.random()*canvas.clientHeight, vx:(Math.random()-0.5)*0.6, vy:(Math.random()-0.5)*0.6, size:1+Math.random()*3 });
    }
  }
  createParticles(24);

  function drawViz(){
    if (!visualToggle.checked || !analyser) { ctx.clearRect(0,0,canvas.clientWidth,canvas.clientHeight); return; }
    analyser.getByteTimeDomainData(dataArray);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    ctx.clearRect(0,0,w,h);
    ctx.lineWidth = 2;
    ctx.strokeStyle = localStorage.getItem(ACCENT_KEY) || '#ff0000';
    ctx.beginPath();
    const slice = w / dataArray.length;
    for (let i=0;i<dataArray.length;i++){
      const v = (dataArray[i]-128)/128;
      const y = (h/2) + v*(h/2)*0.8;
      const x = i*slice;
      if (i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
    let sum=0;
    for(let i=0;i<dataArray.length;i++) sum += Math.abs(dataArray[i]-128);
    const amp = sum/dataArray.length/128;
    for(let p of particles){
      p.x += p.vx*(1+amp*4);
      p.y += p.vy*(1+amp*4);
      if (p.x < -10) p.x = w+10; if (p.x > w+10) p.x = -10;
      if (p.y < -10) p.y = h+10; if (p.y > h+10) p.y = -10;
      ctx.fillStyle = `rgba(255,0,0,${0.06+amp*0.6})`;
      ctx.beginPath(); ctx.arc(p.x,p.y,p.size+amp*4,0,Math.PI*2); ctx.fill();
    }
    if (amp > 0.02) player.classList.add('pulse'); else player.classList.remove('pulse');
  }
  let rafId=null;
  function animate(){ drawViz(); rafId = requestAnimationFrame(animate); }
  function startVisual(){ if (!setupAudioCtx()) { player.classList.add('pulse'); return; } if (!rafId) animate(); }
  function stopVisual(){ if (rafId){ cancelAnimationFrame(rafId); rafId=null; } }

  // state
  let isPlaying = false;

  // update meta
  function updateMeta(){
    const src = audio.src || '';
    const filename = src.split('/').pop() || '';
    songText.textContent = audio.getAttribute('data-title') || filename || 'Not playing';
    artistText.textContent = audio.getAttribute('data-artist') || 'CRZYCLAN';
    const cover = audio.getAttribute('data-cover') || coverImg.src;
    coverImg.src = cover;
    if (src && window.isMember) { downloadBtn.href = src; downloadBtn.classList.remove('hidden'); } else downloadBtn.classList.add('hidden');
  }

  // progress updates
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

  // play/pause
  function togglePlay(){
    if (audio.paused) {
      if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume();
      audio.play().catch(()=>{});
      isPlaying = true; playBtn.textContent = '⏸️'; startVisual();
      broadcast({action:'play', src:audio.src});
    } else {
      audio.pause(); isPlaying=false; playBtn.textContent='▶️'; stopVisual(); broadcast({action:'pause'});
    }
  }
  playBtn.addEventListener('click', togglePlay);

  // dock toggle
  dockBtn.addEventListener('click', ()=>{
    const docked = player.classList.toggle('docked'); localStorage.setItem(MODE_KEY, docked? 'dock':'float');
    // reposition queue panel
    positionQueue();
  });

  // settings
  settingsBtn.addEventListener('click', ()=> settingsPanel.classList.toggle('show'));
  document.getElementById('crz-close-settings').addEventListener('click', ()=> settingsPanel.classList.remove('show'));
  accentInput.addEventListener('input', (e)=> { document.documentElement.style.setProperty('--accent', e.target.value); localStorage.setItem(ACCENT_KEY, e.target.value); });
  visualToggle.addEventListener('change', ()=> localStorage.setItem('crz_visual_on', visualToggle.checked ? '1':'0'));
  autoplayToggle.addEventListener('change', ()=> localStorage.setItem('crz_autoplay', autoplayToggle.checked ? '1':'0'));
  volumeInput.addEventListener('input', (e)=> audio.volume = Number(e.target.value || 1));
  audio.volume = Number(volumeInput.value || 1);

  // prev/next
  prevBtn.addEventListener('click', ()=> { window.dispatchEvent(new CustomEvent('crzy-player-action',{detail:{action:'prev'}})); });
  nextBtn.addEventListener('click', ()=> { window.dispatchEvent(new CustomEvent('crzy-player-action',{detail:{action:'next'}})); });

  // on ended -> dispatch event consumed by music.js for autoplay logic & attempt queue pop
  audio.addEventListener('ended', ()=> {
    stopVisual();
    playBtn.textContent = '▶️';
    const auto = localStorage.getItem('crz_autoplay') === '1';
    // notify host: let them handle next selection (they will check queue and sections)
    window.dispatchEvent(new CustomEvent('crzy-player-ended', { detail: { src: audio.src } }));
    if (!auto) return;
  });

  // broadcast cross-tab
  function broadcast(obj){ const payload = { ts: Date.now(), ...obj }; localStorage.setItem(STATE_KEY, JSON.stringify(payload)); handleState(payload, true); }
  window.addEventListener('storage', (e)=> { if (e.key === STATE_KEY && e.newValue) try{ handleState(JSON.parse(e.newValue), false); } catch(e){} });

  function handleState(payload, local){
    if (!payload || !payload.action) return;
    if (payload.action === 'play') { if (payload.src && payload.src !== audio.src){ audio.src = payload.src; if (payload.meta) { if (payload.meta.cover) audio.setAttribute('data-cover', payload.meta.cover); if (payload.meta.title) audio.setAttribute('data-title', payload.meta.title); if (payload.meta.artist) audio.setAttribute('data-artist', payload.meta.artist); } updateMeta(); } audio.play().catch(()=>{}); playBtn.textContent='⏸️'; startVisual(); }
    else if (payload.action === 'pause'){ audio.pause(); playBtn.textContent='▶️'; stopVisual(); }
    else if (payload.action === 'setSrc'){ if (payload.src){ audio.src = payload.src; if (payload.meta){ if (payload.meta.cover) audio.setAttribute('data-cover', payload.meta.cover); if (payload.meta.title) audio.setAttribute('data-title', payload.meta.title); if (payload.meta.artist) audio.setAttribute('data-artist', payload.meta.artist); } updateMeta(); } }
  }

  // expose API
  window.crzyPlayer = {
    setSrc: (src, meta={}) => {
      audio.src = src;
      if (meta.cover) audio.setAttribute('data-cover', meta.cover);
      if (meta.title) audio.setAttribute('data-title', meta.title);
      if (meta.artist) audio.setAttribute('data-artist', meta.artist);
      updateMeta();
      broadcast({ action:'setSrc', src, meta });
    },
    play: () => broadcast({ action:'play', src: audio.src }),
    pause: () => broadcast({ action:'pause' }),
    toggle: togglePlay
  };

  // update meta on loadedmetadata
  audio.addEventListener('loadedmetadata', ()=> { updateMeta(); durEl.textContent = formatTime(audio.duration); });

  // resize canvas at end
  setTimeout(()=> resizeCanvas(), 200);
  // queue UI management stored in localStorage 'crzy_queue'
  function getQueue(){ return JSON.parse(localStorage.getItem('crzy_queue')||'[]'); }
  function saveQueue(q){ localStorage.setItem('crzy_queue', JSON.stringify(q)); renderQueue(); }
  function addToQueue(song){ const q=getQueue(); q.push(song); saveQueue(q); showPopup('Added to queue'); }
  function clearQueue(){ saveQueue([]); showPopup('Queue cleared'); }
  function popQueue(){ const q=getQueue(); const next=q.shift(); saveQueue(q); return next; }

  // queue UI rendering and drag/drop reorder
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

      // menu handlers
      const menuBtn = item.querySelector('.small-menu');
      const menu = item.querySelector('.menu');
      menuBtn.addEventListener('click', (e)=>{ e.stopPropagation(); menuBtn.classList.toggle('open'); menuBtn.classList.toggle('active'); menuBtn.classList.toggle('open'); menu.style.display = menu.style.display === 'block' ? 'none' : 'block'; });

      item.querySelector('.remove').addEventListener('click', (e)=> {
        e.stopPropagation();
        const idx = +item.getAttribute('data-i');
        const arr = getQueue(); arr.splice(idx,1); saveQueue(arr); showPopup('Removed from queue');
      });

      // drag/drop basics
      item.addEventListener('dragstart', (ev)=> { ev.dataTransfer.setData('text/plain', item.getAttribute('data-i')); item.classList.add('dragging'); });
      item.addEventListener('dragend', ()=> { item.classList.remove('dragging'); renderQueue(); });
      item.addEventListener('dragover', (ev)=> { ev.preventDefault(); });
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

  // open/close queue panel
  queueBtn.addEventListener('click', (e)=> {
    e.stopPropagation();
    player.classList.toggle('queue-open');
    positionQueue();
    renderQueue();
  });
  function positionQueue(){
    // position the queue panel relative to player bottom-left (or docked center)
    const rect = player.getBoundingClientRect();
    if (!player.classList.contains('docked')) {
      queuePanel.style.left = Math.max(8, rect.left) + 'px';
      queuePanel.style.bottom = (window.innerHeight - rect.bottom + 12) + 'px';
    } else {
      queuePanel.style.left = '8px';
      queuePanel.style.bottom = '90px';
    }
  }
  window.addEventListener('resize', positionQueue);

  document.getElementById('crzy-clear-queue').addEventListener('click', ()=> { clearQueue(); });

  // popup
  const popup = document.createElement('div');
  popup.style.position='fixed'; popup.style.right='18px'; popup.style.bottom='18px'; popup.style.background='var(--accent)'; popup.style.padding='12px 18px'; popup.style.color='#fff'; popup.style.borderRadius='8px'; popup.style.opacity=0; popup.style.transition='opacity .2s';
  document.body.appendChild(popup);
  function showPopup(msg, t=1200){ popup.textContent = msg; popup.style.opacity=1; setTimeout(()=>{ popup.style.opacity=0; }, t); }

  // drag the player when not docked
  let isDragging=false, dragOffset={x:0,y:0};
  const dragBar = player.querySelector('.drag');
  dragBar.addEventListener('mousedown', startDrag);
  dragBar.addEventListener('touchstart', startDrag, {passive:false});
  function startDrag(e){
    if (player.classList.contains('docked')) return;
    isDragging=true;
    dragBar.style.cursor='grabbing';
    const ev = e.touches ? e.touches[0] : e;
    dragOffset.x = ev.clientX - player.offsetLeft;
    dragOffset.y = ev.clientY - player.offsetTop;
    document.addEventListener('mousemove', onDrag);
    document.addEventListener('touchmove', onDrag, {passive:false});
    document.addEventListener('mouseup', stopDrag);
    document.addEventListener('touchend', stopDrag);
    player.classList.add('pulse'); // pulse while dragging
  }
  function onDrag(e){
    if (!isDragging) return;
    const ev = e.touches ? e.touches[0] : e;
    let x = ev.clientX - dragOffset.x;
    let y = ev.clientY - dragOffset.y;
    x = Math.max(6, Math.min(window.innerWidth - player.offsetWidth - 6, x));
    y = Math.max(6, Math.min(window.innerHeight - player.offsetHeight - 6, y));
    player.style.left = x + 'px';
    player.style.top = y + 'px';
    positionQueue();
  }
  function stopDrag(){
    isDragging=false; dragBar.style.cursor='grab'; document.removeEventListener('mousemove', onDrag); document.removeEventListener('touchmove', onDrag); document.removeEventListener('mouseup', stopDrag); document.removeEventListener('touchend', stopDrag); player.classList.remove('pulse');
  }

  // keyboard space toggles play (if not focused on input)
  window.addEventListener('keydown',(e)=>{ if (e.code==='Space' && document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA'){ e.preventDefault(); togglePlay(); } });

  // expose helper for music.js to add queue
  window.CrzyPlayer = {
    play: (src, title, cover, artist) => {
      if (src) {
        audio.src = src;
        if (title) audio.setAttribute('data-title', title);
        if (artist) audio.setAttribute('data-artist', artist);
        if (cover) audio.setAttribute('data-cover', cover);
        updateMeta();
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
    addToQueue: addToQueue,
    clearQueue: clearQueue,
    popQueue: popQueue
  };

  // initial render
  renderQueue();
  updateMeta();
  positionQueue();

  // init audio context on user gesture
  document.addEventListener('click', ()=>{ try { setupAudioCtx(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){} }, { once:true });

})();
