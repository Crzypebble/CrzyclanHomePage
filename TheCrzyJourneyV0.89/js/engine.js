// js/engine.js
const canvas = document.getElementById("game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const gameContainer = document.getElementById("game-container");
const completeScreen = document.getElementById("level-complete-screen");
const gameOverScreen = document.getElementById("game-over-screen");

let gameLoopId;
let engineState = "MENU"; 
let currentLevelData = null;
let currentAreaObj = null;
let currentAreaIdx = 1;
let currentLevelIdx = 1;
let difficultyMult = 1.0; 

let nightmareMode = "none";
let globalTimer = 900; 

let cameraX = 0;
let maxCameraX = 0; 
let cameraLocked = false;
let lockedCameraX = 0;

let bgImage = new Image();
let levelAudio = new Audio();
levelAudio.loop = true;

const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

// PREVENT MOUSE CLICKS IF CURSOR HIDDEN
window.addEventListener("pointerdown", e => {
    const cursorSel = document.getElementById("cursor-select");
    if (cursorSel && cursorSel.value === "hide" && e.pointerType === "mouse") {
        e.preventDefault();
        e.stopPropagation();
    }
}, { capture: true });

function bindTouch(id, code) {
    const el = document.getElementById(id);
    if(el) {
        el.addEventListener("touchstart", (e) => { e.preventDefault(); keys[code] = true; });
        el.addEventListener("touchend", (e) => { e.preventDefault(); keys[code] = false; });
    }
}
bindTouch("btn-left", "ArrowLeft"); bindTouch("btn-right", "ArrowRight");
bindTouch("btn-down", "ArrowDown"); bindTouch("btn-jump", "Space");
bindTouch("btn-shoot", "KeyZ"); bindTouch("btn-swap", "KeyQ");

let currentSeed = 1;
function seededRandom() {
    let x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
}

const masterVolInput = document.getElementById("master-volume");
if (masterVolInput) masterVolInput.addEventListener("input", updateVolumes);

const diffSelectInput = document.getElementById("difficulty-select");
if (diffSelectInput) diffSelectInput.addEventListener("change", e => {
    let diff = e.target.value;
    difficultyMult = (diff === "Easy") ? 0.6 : ((diff === "Hard") ? 1.5 : 1.0);
});

const mobileSelectInput = document.getElementById("mobile-controls-select");
if (mobileSelectInput) mobileSelectInput.addEventListener("change", applyMobileSettings);

function applyMobileSettings() {
    const setting = document.getElementById("mobile-controls-select");
    const mControls = document.getElementById("mobile-controls");
    if(!setting || !mControls) return;
    if (setting.value === "on") { mControls.style.display = "flex"; mControls.classList.remove("auto-mode"); }
    else if (setting.value === "off") { mControls.style.display = "none"; mControls.classList.remove("auto-mode"); }
    else { mControls.style.display = ""; mControls.classList.add("auto-mode"); }
}

const cursorSelect = document.getElementById("cursor-select");
if (cursorSelect) {
    cursorSelect.addEventListener("change", e => {
        if (e.target.value === "hide") document.body.classList.add("hide-mouse");
        else document.body.classList.remove("hide-mouse");
    });
}

const fsBtn = document.getElementById("fullscreen-btn");
if (fsBtn) {
    fsBtn.addEventListener("click", () => {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(err => console.log(err));
        else document.exitFullscreen();
    });
}

function updateVolumes() {
    let master = masterVolInput ? masterVolInput.value / 100 : 1;
    levelAudio.volume = master;
    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.volume = master;
}

window.loadSaveCode = function() {
    const input = document.getElementById("save-code-input");
    if (!input || !input.value) return;
    const parts = input.value.toUpperCase().split('-');
    if (parts.length === 3 && parts[0] === "CRZY") {
        let a = parseInt(parts[1]);
        let l = parseInt(parts[2]);
        const zone = window.GAME_ZONES.find(z => z.areaIndex === a);
        if (zone && zone.levels[l-1]) {
            startGameEngine(zone.levels[l-1], zone, l);
        } else alert("Invalid Level Code! Level doesn't exist.");
    } else alert("Invalid Save Code Format! (Example: CRZY-2-1)");
}

function isActionPressed(action) {
    if (action === "moveLeft" && (keys["ArrowLeft"] || keys["KeyA"])) return true;
    if (action === "moveRight" && (keys["ArrowRight"] || keys["KeyD"])) return true;
    if (action === "moveDown" && (keys["ArrowDown"] || keys["KeyS"])) return true;
    if (action === "jump" && (keys["ArrowUp"] || keys["KeyW"] || keys["Space"])) return true;
    if (action === "attack" && (keys["KeyZ"] || keys["Enter"] || keys["ShiftLeft"] || keys["KeyE"])) return true;
    if (action === "swap" && (keys["KeyQ"] || keys["KeyC"])) return true;

    const binds = window.getAllControlBindings ? window.getAllControlBindings() : {};
    const bind = binds[action];
    if (bind) {
        const match = /^GP(\d+):Button(\d+)$/.exec(bind);
        if (match && navigator.getGamepads) {
            const customGP = navigator.getGamepads()[parseInt(match[1], 10)];
            if (customGP && customGP.buttons[parseInt(match[2], 10)]?.pressed) return true;
        }
    }
    
    const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
    if (gp) {
        if (action === "jump" && gp.buttons[0]?.pressed) return true; 
        if (action === "attack" && (gp.buttons[2]?.pressed || gp.buttons[1]?.pressed)) return true; 
        if (action === "swap" && gp.buttons[3]?.pressed) return true; 
        if (action === "moveLeft" && (gp.buttons[14]?.pressed || gp.axes[0] < -0.5)) return true; 
        if (action === "moveRight" && (gp.buttons[15]?.pressed || gp.axes[0] > 0.5)) return true; 
        if (action === "moveDown" && (gp.buttons[13]?.pressed || gp.axes[1] > 0.5)) return true; 
    }
    return false;
}

let player = {
    x: 100, y: 100, vx: 0, vy: 0, width: 30, height: 50,
    speed: 6, jumpPower: -14, gravity: 0.6, grounded: false, jumpsLeft: 2,
    lives: 3, powerup: null, reservePowerup: null, invulnTimer: 0
};

let projectiles = [], enemyProjectiles = [], enemies = [], platforms = [], physicalDrops = [], finishLineX = 3000, boss = null, secretWarp = null;

window.startGameEngine = function(levelData, areaObj, lIdx) {
    currentLevelData = levelData; currentAreaObj = areaObj; 
    currentAreaIdx = areaObj.areaIndex; currentLevelIdx = lIdx;
    
    applyMobileSettings();
    const nmSelect = document.getElementById("nightmare-select");
    nightmareMode = nmSelect ? nmSelect.value : "none";
    
    if (nightmareMode === "1life" || nightmareMode === "timer_1life") player.lives = 1;
    else player.lives = 3;
    
    if (currentAreaIdx === 1 && currentLevelIdx === 1) globalTimer = 900; 
    
    engineState = "PLAYING";
    bgImage.src = levelData.isAreaBoss ? areaObj.bossBgUrl : (levelData.hasMiniBoss ? areaObj.miniBossBgUrl : areaObj.bgUrl);
    levelAudio.src = levelData.isAreaBoss ? areaObj.bossMusicUrl : (levelData.hasMiniBoss ? areaObj.miniBossMusicUrl : areaObj.musicUrl);

    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.pause();
    updateVolumes();
    levelAudio.play().catch(e => console.log("Audio block:", e));

    document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
    document.body.classList.remove("show-bg");
    if (gameContainer) gameContainer.style.display = "block";
    if (completeScreen) completeScreen.style.display = "none";
    if (gameOverScreen) gameOverScreen.style.display = "none";

    resizeCanvas(); window.addEventListener("resize", resizeCanvas);
    resetLevel(); cancelAnimationFrame(gameLoopId); gameLoop();
}

window.quitGame = function() {
    engineState = "MENU"; cancelAnimationFrame(gameLoopId);
    if (gameContainer) gameContainer.style.display = "none";
    if (completeScreen) completeScreen.style.display = "none";
    if (gameOverScreen) gameOverScreen.style.display = "none";
    document.body.classList.add("show-bg");
    const mainMenu = document.getElementById("main-menu");
    if (mainMenu) mainMenu.style.display = "block";

    levelAudio.pause();
    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.play();
    if(typeof renderLevelSelect === 'function') renderLevelSelect();
}

window.handleGameOverAction = function() {
    if (nightmareMode !== "none") {
        const zone = window.GAME_ZONES[0];
        startGameEngine(zone.levels[0], zone, 1);
    } else {
        if (gameOverScreen) gameOverScreen.style.display = "none";
        player.lives = 3; globalTimer = 900; player.powerup = null; player.reservePowerup = null;
        engineState = "PLAYING"; levelAudio.currentTime = 0; levelAudio.play();
        resetLevel();
    }
}

window.nextLevel = function() {
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    const nextZone = window.GAME_ZONES.find(z => z.areaIndex === nextA);
    if(!nextZone) { alert("CONGRATULATIONS! You beat the game!"); quitGame(); return; }
    startGameEngine(nextZone.levels[nextL - 1], nextZone, nextL);
}

// MASSIVE FIX: ENTIRE LEVEL GENERATION RESTORED
function resetLevel() {
    player.x = 100; player.y = 100; player.vx = 0; player.vy = 0; player.invulnTimer = 0;
    cameraX = 0; maxCameraX = 0; cameraLocked = false; lockedCameraX = 0;
    projectiles = []; enemyProjectiles = []; enemies = []; platforms = []; physicalDrops = []; boss = null; secretWarp = null;
    currentSeed = (currentAreaIdx * 100) + currentLevelIdx;

    finishLineX = (currentLevelData && currentLevelData.length) ? currentLevelData.length : 3000;
    const floorY = canvas ? canvas.height - 60 : 600;
    
    let areaPowerObj = { type: "fire", icon: "🔥", color: "red", projSpeed: 10 };
    if (window.AREA_POWERUPS && window.AREA_POWERUPS.length > 0) {
        areaPowerObj = window.AREA_POWERUPS[Math.min(currentAreaIdx - 1, window.AREA_POWERUPS.length - 1)];
    }

    // Powerups for Regular Levels
    if (currentLevelData && !currentLevelData.isAreaBoss && !currentLevelData.hasMiniBoss && !currentLevelData.noPowerups) {
        physicalDrops.push({ x: 400, y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: areaPowerObj });
        physicalDrops.push({ x: finishLineX / 2, y: floorY - 300, vx: 0, vy: 0, type: "heart" }); 
    }
    // Powerups for Boss Arenas (RESTORED!)
    else if (currentLevelData && (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss)) {
        for(let i=0; i<2; i++) {
            let pwrIndex = Math.floor(seededRandom() * (currentAreaIdx || 1));
            let randPwr = (window.AREA_POWERUPS && window.AREA_POWERUPS[pwrIndex]) ? window.AREA_POWERUPS[pwrIndex] : areaPowerObj;
            physicalDrops.push({ x: 300 + (i*200), y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: randPwr });
        }
    }

    // PLATFORMS AND GAPS (RESTORED!)
    if (currentLevelData && (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss)) {
        // Boss Arena (Flat with simple platforms)
        platforms.push({ x: -100, y: floorY, w: finishLineX + 2000, h: 60 }); 
        platforms.push({x: finishLineX - 800, y: floorY - 150, w: 200, h: 20});
        platforms.push({x: finishLineX - 400, y: floorY - 250, w: 200, h: 20});
    } else {
        // Regular Levels (Gaps, obstacles, upper tiers)
        platforms.push({ x: -100, y: floorY, w: 600, h: 60 }); 
        platforms.push({ x: finishLineX - 600, y: floorY, w: 1200, h: 60 }); 

        let currentX = 500;
        while (currentX < finishLineX - 600) {
            let rng = seededRandom();
            if (rng < 0.25) {
                platforms.push({ x: currentX + 50, y: floorY - 150, w: 150, h: 20 });
                currentX += 350; 
            } else if (rng < 0.5) {
                platforms.push({ x: currentX, y: floorY - 60, w: 150, h: 120 });
                currentX += 150;
            } else {
                let w = 200 + (seededRandom() * 400);
                platforms.push({ x: currentX, y: floorY, w: w, h: 60 });
                currentX += w;
            }
        }

        // UPPER PLATFORMS (RESTORED!)
        for(let i=1; i < (finishLineX/800); i++) {
            platforms.push({x: 800 * i, y: floorY - 180, w: 150, h: 20});
            platforms.push({x: 800 * i + 350, y: floorY - 250, w: 100, h: 20});
        }
    }

    // ENEMIES (Increased spawn density)
    if (!currentLevelData || !currentLevelData.isAreaBoss) {
        for(let i=1; i < (finishLineX/400); i++) { 
            let eSpeed = -2 * (1 + (currentAreaIdx * 0.05)) * difficultyMult;
            let type = "walker";
            if (currentAreaIdx >= 2 && seededRandom() > 0.5) type = "jumper";
            if (currentAreaIdx >= 3 && seededRandom() > 0.7) type = "flyer";
            
            let startY = type === "flyer" ? floorY - 250 : floorY - 200;
            let ex = (400 * i) + (seededRandom() * 100);
            enemies.push({ x: ex, y: startY, width: 40, height: 40, vx: eSpeed, vy: 0, hp: 1, grounded: false, type: type, startY: startY });
        }
    }

    if (seededRandom() > 0.8 && (!currentLevelData || !currentLevelData.isAreaBoss)) {
        secretWarp = { x: finishLineX - 800, y: floorY - 60, w: 60, h: 60 };
    }

    let isLateGame = currentAreaIdx >= 6;
    let bScale = isLateGame ? 2 : 1; 
    let bHP = isLateGame ? 80 : 20;

    if (currentLevelData && (currentLevelData.hasMiniBoss || currentLevelData.isAreaBoss)) {
        let bX = currentLevelData.isAreaBoss ? finishLineX - 1500 : finishLineX - 1200;
        boss = {
            name: currentLevelData.isAreaBoss ? currentLevelData.name.toUpperCase() : "Mini Boss", 
            x: bX, y: floorY - (120 * bScale), width: 100 * bScale, height: 120 * bScale,
            hp: (currentLevelData.isAreaBoss ? bHP : bHP / 2) * difficultyMult, maxHp: (currentLevelData.isAreaBoss ? bHP : bHP / 2) * difficultyMult, 
            phase: 1, shootTimer: 0, isLateGame: isLateGame, spikeTimer: 0, stompImmune: false, hasSpikes: currentAreaIdx > 1 
        };
    }
    updateHUD();
}

function resizeCanvas() { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }

function collectPowerup(data) { if (!player.powerup) player.powerup = data; else player.reservePowerup = data; updateHUD(); }

function triggerGameOver() { 
    engineState = "GAMEOVER"; 
    if (gameOverScreen) {
        document.getElementById("game-over-text").textContent = (nightmareMode !== "none") ? "NIGHTMARE RUN FAILED" : "GAME OVER";
        document.getElementById("retry-btn").textContent = (nightmareMode !== "none") ? "Reset to Area 1" : "Try Again";
        gameOverScreen.style.display = "block"; 
    }
    levelAudio.pause(); 
}

function takeDamage() {
    if (player.invulnTimer > 0 || engineState !== "PLAYING") return false;
    if (player.powerup) { player.powerup = null; player.invulnTimer = 90; updateHUD(); return false; } 
    else { player.lives -= 1; updateHUD(); if (player.lives <= 0) triggerGameOver(); else resetLevel(); return true; }
}

function shoot() {
    if (!player.powerup) {
        let meleeBox = { x: player.x, y: player.y, w: player.width + 40, h: player.height };
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i];
            if (p.x < meleeBox.x + meleeBox.w && p.x + p.width > meleeBox.x && p.y < meleeBox.y + meleeBox.h && p.y + p.height > meleeBox.y) {
                p.vx = 15; p.color = "#00ff00"; projectiles.push(p); enemyProjectiles.splice(i, 1);
            }
        }
        return;
    }
    if (projectiles.length > 3) return;
    let isGlock = player.powerup.type === "glock";
    projectiles.push({ x: player.x + player.width, y: player.y + 15, vx: player.powerup.projSpeed, vy: isGlock ? 0 : -5, gravity: isGlock ? 0 : 0.6, width: 20, height: 20, color: player.powerup.color, icon: player.powerup.icon });
}

function updateHUD() {
    const uiLives = document.getElementById("ui-lives"); if (uiLives) uiLives.textContent = "❤️".repeat(Math.max(0, player.lives));
    const uiLevel = document.getElementById("ui-level"); if (uiLevel) uiLevel.textContent = currentLevelData.name;
    let timeUi = document.getElementById("ui-time"); if (timeUi) timeUi.style.display = (nightmareMode === "timer" || nightmareMode === "timer_1life") ? "inline-block" : "none";
    
    const pwrUI = document.getElementById("ui-powerup"); 
    if (pwrUI) { 
        if (player.powerup) { pwrUI.textContent = player.powerup.icon + " " + player.powerup.type.toUpperCase(); pwrUI.style.color = player.powerup.color; } 
        else { pwrUI.textContent = "None"; pwrUI.style.color = "#ccc"; } 
    }
    
    const resUI = document.getElementById("ui-reserve");
    if (resUI) {
        if (player.reservePowerup) { resUI.textContent = player.reservePowerup.icon + " " + player.reservePowerup.type.toUpperCase(); resUI.style.color = player.reservePowerup.color; } 
        else { resUI.textContent = "None"; resUI.style.color = "#555"; } 
    }
}

function winLevel() {
    engineState = "COMPLETE";
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    if (typeof saveProgress === 'function') saveProgress(nextA, nextL);
    const codeEl = document.getElementById("generated-save-code");
    if (codeEl) codeEl.textContent = `CRZY-${nextA}-${nextL}`;
    if (completeScreen) completeScreen.style.display = "block";
}

let lastShootTime = 0, lastSwapTime = 0;

function gameLoop() {
    if (!canvas || canvas.width === 0) resizeCanvas();
    if (!ctx) return;
    const floorY = canvas.height - 60;

    if (engineState === "PLAYING") {
        if (nightmareMode === "timer" || nightmareMode === "timer_1life") {
            globalTimer -= 1/60;
            let timeUi = document.getElementById("ui-time");
            if(timeUi) timeUi.textContent = `Time: ${Math.ceil(globalTimer)}`;
            if (globalTimer <= 0) { player.lives = 0; takeDamage(); }
        }

        if (isActionPressed("moveLeft")) player.vx = -player.speed;
        else if (isActionPressed("moveRight")) player.vx = player.speed;
        else player.vx = 0;

        if (isActionPressed("jump") && !keys["jump_lock"]) {
            if (player.grounded || player.jumpsLeft > 0) { player.vy = player.jumpPower; player.grounded = false; player.jumpsLeft--; keys["jump_lock"] = true; }
        }
        if (!isActionPressed("jump")) keys["jump_lock"] = false;

        if (isActionPressed("attack") && Date.now() - lastShootTime > 250) { shoot(); lastShootTime = Date.now(); }
        
        if (isActionPressed("swap") && Date.now() - lastSwapTime > 300) {
            if (player.powerup || player.reservePowerup) {
                let temp = player.powerup; 
                player.powerup = player.reservePowerup; 
                player.reservePowerup = temp; 
                updateHUD(); 
                lastSwapTime = Date.now();
            }
        }

        if (!cameraLocked) { maxCameraX = Math.max(maxCameraX, player.x - canvas.width / 3); cameraX = maxCameraX; }
        
        if (boss) {
            let triggerX = boss.x - canvas.width + 100; 
            if (!cameraLocked && cameraX >= triggerX && boss.phase === 1) { cameraLocked = true; lockedCameraX = cameraX; }
            if (boss.phase === 2) cameraLocked = false; 
        }

        player.x += player.vx;
        let leftBound = cameraLocked ? lockedCameraX : maxCameraX;
        if (player.x < leftBound) { player.x = leftBound; if (player.vx < 0) player.vx = 0; }
        if (cameraLocked && player.x + player.width > lockedCameraX + canvas.width) { player.x = lockedCameraX + canvas.width - player.width; if (player.vx > 0) player.vx = 0; }

        for (let plat of platforms) {
            if (plat.y < floorY) continue; 
            if (player.y + player.height <= plat.y + 12) continue; 
            if (player.x < plat.x + plat.w && player.x + player.width > plat.x && player.y < plat.y + plat.h && player.y + player.height > plat.y) {
                if (player.vx > 0) player.x = plat.x - player.width; else if (player.vx < 0) player.x = plat.x + plat.w;
                player.vx = 0;
            }
        }

        player.vy += player.gravity; player.y += player.vy; player.grounded = false;
        
        for (let plat of platforms) {
            if (player.x < plat.x + plat.w && player.x + player.width > plat.x && player.y < plat.y + plat.h && player.y + player.height > plat.y) {
                if (plat.y < floorY) {
                    let prevFeet = player.y - player.vy + player.height;
                    if (player.vy > 0 && prevFeet <= plat.y + 15 && !isActionPressed("moveDown")) { player.y = plat.y - player.height; player.vy = 0; player.grounded = true; player.jumpsLeft = 2; }
                } else {
                    if (player.vy > 0) { player.y = plat.y - player.height; player.vy = 0; player.grounded = true; player.jumpsLeft = 2; } 
                    else if (player.vy < 0) { player.y = plat.y + plat.h; player.vy = 0; }
                }
            }
        }

        if (secretWarp && player.x < secretWarp.x + secretWarp.w && player.x + player.width > secretWarp.x && player.y < secretWarp.y + secretWarp.h && player.y + player.height > secretWarp.y) {
            if (isActionPressed("moveDown")) { player.x += 10; winLevel(); return; }
        }

        if (player.y > canvas.height + 100) { if(takeDamage()) { requestAnimationFrame(gameLoop); return; } }
        if (player.x > finishLineX && !boss) { winLevel(); }
        if (player.invulnTimer > 0) player.invulnTimer--;

        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i]; p.vy += p.gravity; p.x += p.vx; p.y += p.vy;
            if (p.x > cameraX + canvas.width || p.x < cameraX || p.y > canvas.height) { projectiles.splice(i, 1); continue; }
            let hitWall = false;
            for (let plat of platforms) {
                if (p.x < plat.x + plat.w && p.x + p.width > plat.x && p.y < plat.y + plat.h && p.y + p.height > plat.y) {
                    if (p.gravity > 0 && p.vy > 0 && p.y + p.height - p.vy <= plat.y + 20) { p.y = plat.y - p.height; p.vy = -8; } else { hitWall = true; }
                }
            }
            if (hitWall) { projectiles.splice(i, 1); continue; }
        }

        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i]; p.x += p.vx; p.y += p.vy;
            let hit = false;
            if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
                enemyProjectiles.splice(i, 1); hit = true; if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
            }
            if (!hit && (p.x < cameraX || p.y > canvas.height)) enemyProjectiles.splice(i, 1);
        }

        for (let i = physicalDrops.length - 1; i >= 0; i--) {
            let d = physicalDrops[i]; d.vy += 0.5; d.y += d.vy;
            platforms.forEach(plat => { if (d.vy >= 0 && d.y + 30 >= plat.y && d.x + 30 > plat.x && d.x < plat.x + plat.w) { d.y = plat.y - 30; d.vy = -d.vy * 0.4; } });
            if (d.y > canvas.height) { physicalDrops.splice(i, 1); continue; }
            if (player.x < d.x + 30 && player.x + player.width > d.x && player.y < d.y + 30 && player.y + player.height > d.y) {
                if (d.type === "heart") { player.lives++; updateHUD(); }
                if (d.type === "powerup") { collectPowerup(d.data); }
                physicalDrops.splice(i, 1);
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            if (e.type === "flyer") {
                e.x += e.vx; e.y = e.startY + Math.sin(Date.now() / 300 + e.x) * 40;
            } else {
                e.vy += player.gravity; e.y += e.vy; e.grounded = false;
                for (let plat of platforms) {
                    if (e.x < plat.x + plat.w && e.x + e.width > plat.x && e.y < plat.y + plat.h && e.y + e.height > plat.y) {
                        if (e.vy > 0) { e.y = plat.y - e.height; e.vy = 0; e.grounded = true; }
                    }
                }
                e.x += e.vx; 
                let hitWall = false;
                for (let plat of platforms) {
                    if (e.x < plat.x + plat.w && e.x + e.width > plat.x && e.y < plat.y + plat.h && e.y + e.height > plat.y) {
                        if (e.vx > 0) { e.x = plat.x - e.width; hitWall = true; } else if (e.vx < 0) { e.x = plat.x + plat.w; hitWall = true; }
                    }
                }
                if (hitWall) { if (e.grounded) e.vy = -12; e.vx *= -1; }
                if (e.type === "jumper" && e.grounded && Math.random() < 0.02) e.vy = -12;
            }
            if (e.y > canvas.height) { enemies.splice(i, 1); continue; } 

            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) { enemies.splice(i, 1); projectiles.splice(j, 1); break; }
            }

            if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
                if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 20) {
                    enemies.splice(i, 1); player.vy = -14; player.vx = -8; 
                } else { if(takeDamage()) { requestAnimationFrame(gameLoop); return; } }
            }
        }

        if (boss) {
            const bossHpCont = document.getElementById("boss-hp-container");
            const bossNameUi = document.getElementById("boss-name-ui");
            const bossHpBar = document.getElementById("boss-hp-bar");
            if (bossHpCont) bossHpCont.style.display = "block";
            if (bossNameUi) bossNameUi.textContent = boss.name;
            if (bossHpBar) bossHpBar.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";
            
            if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; }
            if (boss.hp <= 0) { winLevel(); boss = null; }
            
            if (boss) { 
                if (boss.hasSpikes && boss.phase !== 2) {
                    boss.spikeTimer++;
                    if (boss.spikeTimer > 150) { boss.stompImmune = !boss.stompImmune; boss.spikeTimer = 0; }
                } else { boss.stompImmune = boss.phase === 2; }

                if (boss.phase === 2) { 
                    boss.x += 8; 
                    if (boss.x >= finishLineX - 200) { boss.x = finishLineX - 200; boss.phase = 3; }
                }

                if (cameraLocked || boss.phase === 2 || boss.phase === 3) {
                    boss.shootTimer++;
                    let fireThresh = 150 - (currentAreaIdx * 4); 
                    if (difficultyMult === 0.6) fireThresh *= 1.5; 
                    
                    if (boss.phase === 2 || boss.phase === 3) fireThresh *= 0.35; 

                    if (boss.shootTimer > fireThresh) {
                        let dx = (player.x + player.width/2) - (boss.x + boss.width/2);
                        let dy = (player.y + player.height/2) - (boss.y + boss.height/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let pSpeed = 7 * difficultyMult;
                        enemyProjectiles.push({x: boss.x + 20, y: boss.y + 40, vx: (dx/dist)*pSpeed, vy: (dy/dist)*pSpeed, width: 20, height: 20, color: "red"}); 
                        boss.shootTimer = 0;
                    }
                }

                for (let j = projectiles.length - 1; j >= 0; j--) {
                    let p = projectiles[j];
                    if (p.x < boss.x + boss.width && p.x + p.width > boss.x && p.y < boss.y + boss.height && p.y + p.height > boss.y) {
                        boss.hp -= 1; 
                        projectiles.splice(j, 1);
                    }
                }

                if (boss && player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) {
                    if (player.vy > 0 && player.y + player.height - player.vy <= boss.y + 20) {
                        if (boss.stompImmune) { 
                            if(takeDamage()) { requestAnimationFrame(gameLoop); return; } 
                        } else { 
                            boss.hp -= 1; player.vy = -16; player.vx = -12; 
                        }
                    } else { 
                        if(takeDamage()) { requestAnimationFrame(gameLoop); return; } 
                    }
                }
            }
        } else {
            const bossHpCont = document.getElementById("boss-hp-container");
            if (bossHpCont) bossHpCont.style.display = "none";
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImage.complete && bgImage.naturalWidth > 0) ctx.drawImage(bgImage, -cameraX * 0.5, 0, (finishLineX * 0.5) + canvas.width, canvas.height);
    else { ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    ctx.save(); ctx.translate(-cameraX, 0);

    ctx.fillStyle = "#333"; platforms.forEach(plat => { ctx.fillRect(plat.x, plat.y, plat.w, plat.h); });

    if (secretWarp) {
        ctx.fillStyle = "purple"; ctx.fillRect(secretWarp.x, secretWarp.y, secretWarp.w, secretWarp.h);
        ctx.fillStyle = "white"; ctx.font = "16px Arial"; ctx.fillText("SECRET (DOWN)", secretWarp.x - 20, secretWarp.y - 10);
    }

    if(!boss || boss.phase === 3) {
        ctx.fillStyle = "gold"; ctx.fillRect(finishLineX, floorY - 200, 10, 200);
        ctx.fillStyle = "#ffaa00"; ctx.fillRect(finishLineX, floorY - 200, 60, 40);
    }

    ctx.font = "28px Arial";
    physicalDrops.forEach(d => {
        if (d.type === "heart") ctx.fillText("❤️", d.x, d.y + 25);
        if (d.type === "powerup") ctx.fillText(d.data.icon, d.x, d.y + 25);
    });

    enemies.forEach(e => {
        ctx.fillStyle = (e.type === "flyer") ? "purple" : (e.type === "jumper" ? "orange" : `hsl(${currentAreaIdx * 35}, 80%, 40%)`);
        ctx.fillRect(e.x + 5, e.y + 15, e.width - 10, e.height - 25); 
        ctx.beginPath(); ctx.arc(e.x + e.width/2, e.y + 10, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(e.x + e.width/2 - 4, e.y + 8, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(e.x + e.width/2 - 5, e.y + 8, 2, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = (e.type === "flyer") ? "purple" : (e.type === "jumper" ? "orange" : `hsl(${currentAreaIdx * 35}, 80%, 40%)`);
        let legOff = (Math.floor(Date.now() / 100) % 2 === 0) ? 3 : 0;
        ctx.fillRect(e.x + 10, e.y + e.height - 10, 6, 10 - legOff);
        ctx.fillRect(e.x + 24, e.y + e.height - 10, 6, 10 + legOff);
    });

    if (boss) {
        let bColor = `hsl(${currentAreaIdx * 45}, 100%, 30%)`;
        ctx.fillStyle = bColor;
        ctx.fillRect(boss.x + 20, boss.y + 40, boss.width - 40, boss.height - 40);
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + 20, boss.width/4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "red";
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 - 10, boss.y + 15, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 + 10, boss.y + 15, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; 
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 - 11, boss.y + 15, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 + 9, boss.y + 15, 2, 0, Math.PI*2); ctx.fill();

        if (boss.stompImmune && boss.hasSpikes) {
            ctx.fillStyle = "#888"; 
            ctx.beginPath();
            let spikeCount = 3; let spikeWidth = boss.width / spikeCount;
            for(let i=0; i<spikeCount; i++) {
                ctx.moveTo(boss.x + (i*spikeWidth), boss.y + 10);
                ctx.lineTo(boss.x + (spikeWidth/2) + (i*spikeWidth), boss.y - 30);
                ctx.lineTo(boss.x + spikeWidth + (i*spikeWidth), boss.y + 10);
            }
            ctx.fill();
        }
        ctx.fillStyle = bColor;
        let armOffset = (boss.phase === 2 && Math.floor(Date.now() / 150) % 2 === 0) ? -20 : 0;
        ctx.fillRect(boss.x, boss.y + (boss.height/3) + armOffset, 20, boss.height/2);
        ctx.fillRect(boss.x + boss.width - 20, boss.y + (boss.height/3) - armOffset, 20, boss.height/2);
    }

    ctx.font = "16px Arial";
    projectiles.forEach(p => { 
        if (p.icon === "🔫" || p.color === "yellow" || p.icon === "bullet") {
            ctx.fillStyle = "#ffaa00"; ctx.fillRect(p.x, p.y + 10, 15, 4); 
            ctx.fillStyle = "rgba(255, 255, 255, 0.5)"; ctx.fillRect(p.x - 5, p.y + 10, 5, 4);
        } else if (p.icon) { ctx.fillText(p.icon, p.x, p.y + 15); } 
        else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); } 
    });
    
    enemyProjectiles.forEach(p => { 
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); 
    });

    if ((player.invulnTimer % 10 < 5 || player.invulnTimer === 0) && engineState !== "GAMEOVER") { 
        ctx.fillStyle = "white"; ctx.fillRect(player.x + 5, player.y + 15, player.width - 10, player.height - 25); 
        ctx.beginPath(); ctx.arc(player.x + player.width/2, player.y + 10, 12, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = player.powerup ? player.powerup.color : "red"; ctx.fillRect(player.x + 2, player.y + 4, player.width - 4, 6);
        ctx.fillStyle = "black";
        let lookX = player.vx > 0 ? 4 : (player.vx < 0 ? -4 : 0);
        ctx.fillRect(player.x + player.width/2 - 4 + lookX, player.y + 8, 3, 3);
        ctx.fillRect(player.x + player.width/2 + 2 + lookX, player.y + 8, 3, 3);

        ctx.fillStyle = "white";
        if (!player.grounded) {
            ctx.fillRect(player.x + 5, player.y + player.height - 10, 6, 6);
            ctx.fillRect(player.x + 5, player.y + player.height - 4, 10, 4); 
            ctx.fillRect(player.x + player.width - 11, player.y + player.height - 10, 6, 8);
        } else {
            let stride = (Math.abs(player.vx) > 0.1 && Math.floor(Date.now() / 100) % 2 === 0) ? 5 : 0;
            ctx.fillRect(player.x + 5, player.y + player.height - 10, 6, 10 - stride);
            ctx.fillRect(player.x + player.width - 11, player.y + player.height - 10, 6, 10 + stride);
        }
    }

    ctx.restore(); 
    gameLoopId = requestAnimationFrame(gameLoop);
}

let lastGP = { up: false, down: false, a: false };
let selectedMenuIndex = 0;
function menuGamepadLoop() {
    if (engineState !== "PLAYING") {
        const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (gp) {
            const up = gp.buttons[12]?.pressed || gp.axes[1] < -0.5;
            const down = gp.buttons[13]?.pressed || gp.axes[1] > 0.5;
            const a = gp.buttons[0]?.pressed;
            const visibleButtons = Array.from(document.querySelectorAll("button:not(:disabled), input:not(:disabled), select:not(:disabled)"))
                .filter(b => b.offsetParent !== null && b.style.display !== 'none');

            if (visibleButtons.length > 0) {
                if (document.activeElement !== visibleButtons[selectedMenuIndex]) visibleButtons[selectedMenuIndex].focus();
                if (down && !lastGP.down) { selectedMenuIndex = (selectedMenuIndex + 1) % visibleButtons.length; visibleButtons[selectedMenuIndex].focus(); }
                if (up && !lastGP.up) { selectedMenuIndex = (selectedMenuIndex - 1 + visibleButtons.length) % visibleButtons.length; visibleButtons[selectedMenuIndex].focus(); }
                if (a && !lastGP.a) visibleButtons[selectedMenuIndex].click();
            }
            lastGP = { up, down, a };
        }
    }
    requestAnimationFrame(menuGamepadLoop);
}
menuGamepadLoop();