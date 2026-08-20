// js/engine.js
const canvas = document.getElementById("game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const gameContainer = document.getElementById("game-container");
const completeScreen = document.getElementById("level-complete-screen");
const gameOverScreen = document.getElementById("game-over-screen");

// FORCE FOCUS TO PREVENT CONSOLE BROWSER CURSOR HIJACK
if (canvas) {
    canvas.setAttribute("tabindex", "0");
    canvas.addEventListener("click", () => canvas.focus());
    canvas.addEventListener("mouseenter", () => canvas.focus());
}

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
window.addEventListener("keydown", e => {
    keys[e.code] = true;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(e.code)) e.preventDefault();
});
window.addEventListener("keyup", e => keys[e.code] = false);

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

function updateVolumes() {
    let master = masterVolInput ? masterVolInput.value / 100 : 1;
    levelAudio.volume = master;
    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.volume = master;
}

function isActionPressed(action, playerNum = 1) {
    if (playerNum === 1) {
        if (action === "moveLeft" && (keys["ArrowLeft"])) return true;
        if (action === "moveRight" && (keys["ArrowRight"])) return true;
        if (action === "moveDown" && (keys["ArrowDown"])) return true;
        if (action === "jump" && (keys["ArrowUp"] || keys["Space"])) return true;
        if (action === "attack" && (keys["KeyZ"] || keys["ShiftLeft"])) return true;
        if (action === "swap" && (keys["KeyQ"])) return true;
        
        const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        if (gp) {
            if (action === "jump" && gp.buttons[0]?.pressed) return true; 
            if (action === "attack" && (gp.buttons[2]?.pressed || gp.buttons[1]?.pressed)) return true; 
            if (action === "swap" && gp.buttons[3]?.pressed) return true; 
            if (action === "moveLeft" && (gp.buttons[14]?.pressed || gp.axes[0] < -0.5)) return true; 
            if (action === "moveRight" && (gp.buttons[15]?.pressed || gp.axes[0] > 0.5)) return true; 
            if (action === "moveDown" && (gp.buttons[13]?.pressed || gp.axes[1] > 0.5)) return true; 
        }
    } else if (playerNum === 2) {
        // P2 Keyboard mapping (WASD + E/R)
        if (action === "moveLeft" && (keys["KeyA"])) return true;
        if (action === "moveRight" && (keys["KeyD"])) return true;
        if (action === "moveDown" && (keys["KeyS"])) return true;
        if (action === "jump" && (keys["KeyW"])) return true;
        if (action === "attack" && (keys["KeyE"])) return true;
        if (action === "swap" && (keys["KeyR"])) return true;
        if (action === "join" && (keys["Enter"])) return true;

        const gp2 = navigator.getGamepads ? navigator.getGamepads()[1] : null;
        if (gp2) {
            if (action === "join" && gp2.buttons[9]?.pressed) return true; // Options/Start
            if (action === "jump" && gp2.buttons[0]?.pressed) return true; 
            if (action === "attack" && (gp2.buttons[2]?.pressed || gp2.buttons[1]?.pressed)) return true; 
            if (action === "swap" && gp2.buttons[3]?.pressed) return true; 
            if (action === "moveLeft" && (gp2.buttons[14]?.pressed || gp2.axes[0] < -0.5)) return true; 
            if (action === "moveRight" && (gp2.buttons[15]?.pressed || gp2.axes[0] > 0.5)) return true; 
            if (action === "moveDown" && (gp2.buttons[13]?.pressed || gp2.axes[1] > 0.5)) return true; 
        }
    }
    return false;
}

// SHARED STATE
let sharedLives = 3;
let projectiles = [], enemyProjectiles = [], enemies = [], platforms = [], physicalDrops = [], finishLineX = 3000, boss = null, secretWarp = null;

let p1 = { active: true, x: 100, y: 100, vx: 0, vy: 0, width: 30, height: 50, speed: 6, jumpPower: -14, gravity: 0.6, grounded: false, jumpsLeft: 2, powerup: null, reservePowerup: null, invulnTimer: 0, color: "white", shootTimer: 0, swapTimer: 0 };
let p2 = { active: false, x: 100, y: 100, vx: 0, vy: 0, width: 30, height: 50, speed: 6, jumpPower: -14, gravity: 0.6, grounded: false, jumpsLeft: 2, powerup: null, reservePowerup: null, invulnTimer: 0, color: "#00aaff", shootTimer: 0, swapTimer: 0 };

window.startGameEngine = function(levelData, areaObj, lIdx) {
    currentLevelData = levelData; currentAreaObj = areaObj; 
    currentAreaIdx = areaObj.areaIndex; currentLevelIdx = lIdx;
    
    const nmSelect = document.getElementById("nightmare-select");
    nightmareMode = nmSelect ? nmSelect.value : "none";
    
    if (nightmareMode === "1life" || nightmareMode === "timer_1life") sharedLives = 1;
    else sharedLives = p2.active ? 6 : 3;
    
    if (currentAreaIdx === 1 && currentLevelIdx === 1) globalTimer = 900; 
    
    engineState = "PLAYING";
    bgImage.src = levelData.isAreaBoss ? areaObj.bossBgUrl : (levelData.hasMiniBoss ? areaObj.miniBossBgUrl : areaObj.bgUrl);
    levelAudio.src = levelData.isAreaBoss ? areaObj.bossMusicUrl : (levelData.hasMiniBoss ? areaObj.miniBossMusicUrl : areaObj.musicUrl);

    document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
    document.body.classList.remove("show-bg");
    if (gameContainer) gameContainer.style.display = "block";
    if (completeScreen) completeScreen.style.display = "none";
    if (gameOverScreen) gameOverScreen.style.display = "none";

    resizeCanvas(); window.addEventListener("resize", resizeCanvas);
    if(canvas) canvas.focus();
    
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
}

window.handleGameOverAction = function() {
    if (nightmareMode !== "none") {
        const zone = window.GAME_ZONES[0];
        startGameEngine(zone.levels[0], zone, 1);
    } else {
        if (gameOverScreen) gameOverScreen.style.display = "none";
        sharedLives = p2.active ? 6 : 3; 
        globalTimer = 900; p1.powerup = null; p1.reservePowerup = null; p2.powerup = null; p2.reservePowerup = null;
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

function resetLevel() {
    p1.x = 100; p1.y = 100; p1.vx = 0; p1.vy = 0; p1.invulnTimer = 0;
    if (p2.active) { p2.x = 140; p2.y = 100; p2.vx = 0; p2.vy = 0; p2.invulnTimer = 0; }
    
    cameraX = 0; maxCameraX = 0; cameraLocked = false; lockedCameraX = 0;
    projectiles = []; enemyProjectiles = []; enemies = []; platforms = []; physicalDrops = []; boss = null; secretWarp = null;
    currentSeed = (currentAreaIdx * 100) + currentLevelIdx;

    finishLineX = (currentLevelData && currentLevelData.length) ? currentLevelData.length : 3000;
    const floorY = canvas ? canvas.height - 60 : 600;
    
    let areaPowerObj = { type: "fire", icon: "🔥", color: "red", projSpeed: 10 };
    if (window.AREA_POWERUPS && window.AREA_POWERUPS.length > 0) areaPowerObj = window.AREA_POWERUPS[Math.min(currentAreaIdx - 1, window.AREA_POWERUPS.length - 1)];

    // SPREAD POWERUPS ACROSS LEVEL
    if (currentLevelData && !currentLevelData.isAreaBoss && !currentLevelData.hasMiniBoss && !currentLevelData.noPowerups) {
        let drops = Math.floor(finishLineX / 800);
        for(let i=1; i<=drops; i++) {
            physicalDrops.push({ x: 800 * i, y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: areaPowerObj });
            if(i % 2 === 0) physicalDrops.push({ x: (800 * i) + 400, y: floorY - 300, vx: 0, vy: 0, type: "heart" }); 
        }
    } else if (currentLevelData && (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss)) {
        physicalDrops.push({ x: 300, y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: areaPowerObj });
        physicalDrops.push({ x: 500, y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: areaPowerObj });
    }

    // PLATFORMS
    if (currentLevelData && (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss)) {
        platforms.push({ x: -100, y: floorY, w: finishLineX + 2000, h: 60 }); 
        platforms.push({x: finishLineX - 800, y: floorY - 150, w: 200, h: 20});
        platforms.push({x: finishLineX - 400, y: floorY - 250, w: 200, h: 20});
    } else {
        platforms.push({ x: -100, y: floorY, w: 600, h: 60 }); 
        platforms.push({ x: finishLineX - 600, y: floorY, w: 1200, h: 60 }); 
        let currentX = 500;
        while (currentX < finishLineX - 600) {
            let rng = seededRandom();
            if (rng < 0.25) { platforms.push({ x: currentX + 50, y: floorY - 150, w: 150, h: 20 }); currentX += 350; } 
            else if (rng < 0.5) { platforms.push({ x: currentX, y: floorY - 60, w: 150, h: 120 }); currentX += 150; } 
            else { let w = 200 + (seededRandom() * 400); platforms.push({ x: currentX, y: floorY, w: w, h: 60 }); currentX += w; }
        }
        for(let i=1; i < (finishLineX/800); i++) {
            platforms.push({x: 800 * i, y: floorY - 180, w: 150, h: 20});
            platforms.push({x: 800 * i + 350, y: floorY - 250, w: 100, h: 20});
        }
    }

    // ENEMIES (Increased density)
    if (!currentLevelData || !currentLevelData.isAreaBoss) {
        for(let i=1; i < (finishLineX/350); i++) { 
            let eSpeed = -2 * (1 + (currentAreaIdx * 0.05)) * difficultyMult;
            let type = "walker";
            if (currentAreaIdx >= 2 && seededRandom() > 0.5) type = "jumper";
            if (currentAreaIdx >= 3 && seededRandom() > 0.7) type = "flyer";
            
            let startY = type === "flyer" ? floorY - 250 : floorY - 200;
            let ex = (350 * i) + (seededRandom() * 100);
            enemies.push({ x: ex, y: startY, width: 40, height: 40, vx: eSpeed, vy: 0, hp: 1, grounded: false, type: type, startY: startY });
        }
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
            phase: 1, shootTimer: 0, spikeTimer: 0, stompImmune: false, hasSpikes: currentAreaIdx > 1 
        };
    }
    updateHUD();
}

function resizeCanvas() { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }

function collectPowerup(playerObj, data) { 
    if (!playerObj.powerup) playerObj.powerup = data; 
    else playerObj.reservePowerup = data; 
    updateHUD(); 
}

function triggerGameOver() { 
    engineState = "GAMEOVER"; 
    if (gameOverScreen) {
        document.getElementById("game-over-text").textContent = (nightmareMode !== "none") ? "NIGHTMARE RUN FAILED" : "GAME OVER";
        gameOverScreen.style.display = "block"; 
    }
    levelAudio.pause(); 
}

function takeDamage(playerObj) {
    if (playerObj.invulnTimer > 0 || engineState !== "PLAYING") return false;
    if (playerObj.powerup) { playerObj.powerup = null; playerObj.invulnTimer = 90; updateHUD(); return false; } 
    else { 
        sharedLives -= 1; 
        updateHUD(); 
        if (sharedLives <= 0) triggerGameOver(); 
        else resetLevel(); 
        return true; 
    }
}

function shoot(playerObj) {
    if (!playerObj.powerup) return;
    if (projectiles.length > 6) return; // Increased limit for 2 players
    let isGlock = playerObj.powerup.type === "glock";
    let lookDir = playerObj.vx < 0 ? -1 : 1; 
    if (playerObj.vx === 0) lookDir = 1;
    projectiles.push({ x: playerObj.x + (lookDir === 1 ? playerObj.width : -20), y: playerObj.y + 15, vx: playerObj.powerup.projSpeed * lookDir, vy: isGlock ? 0 : -5, gravity: isGlock ? 0 : 0.6, width: 20, height: 20, color: playerObj.powerup.color, icon: playerObj.powerup.icon });
}

function updateHUD() {
    const uiLives = document.getElementById("ui-lives"); if (uiLives) uiLives.textContent = "❤️".repeat(Math.max(0, sharedLives));
    const uiLevel = document.getElementById("ui-level"); if (uiLevel) uiLevel.textContent = currentLevelData.name;
    
    const pwrUI = document.getElementById("ui-powerup"); 
    if (pwrUI) { 
        if (p1.powerup) { pwrUI.textContent = "P1: " + p1.powerup.icon + (p2.active && p2.powerup ? " | P2: " + p2.powerup.icon : ""); pwrUI.style.color = p1.powerup.color; } 
        else { pwrUI.textContent = "None"; pwrUI.style.color = "#ccc"; } 
    }
}

function winLevel() {
    engineState = "COMPLETE";
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    if (typeof saveProgress === 'function') saveProgress(nextA, nextL);
    if (completeScreen) completeScreen.style.display = "block";
}

function updatePlayerPhysics(pObj, pNum) {
    if (isActionPressed("moveLeft", pNum)) pObj.vx = -pObj.speed;
    else if (isActionPressed("moveRight", pNum)) pObj.vx = pObj.speed;
    else pObj.vx = 0;

    if (isActionPressed("jump", pNum) && !keys[`jump_lock_${pNum}`]) {
        if (pObj.grounded || pObj.jumpsLeft > 0) { pObj.vy = pObj.jumpPower; pObj.grounded = false; pObj.jumpsLeft--; keys[`jump_lock_${pNum}`] = true; }
    }
    if (!isActionPressed("jump", pNum)) keys[`jump_lock_${pNum}`] = false;

    if (isActionPressed("attack", pNum) && Date.now() - pObj.shootTimer > 250) { shoot(pObj); pObj.shootTimer = Date.now(); }
    
    if (isActionPressed("swap", pNum) && Date.now() - pObj.swapTimer > 300) {
        if (pObj.powerup || pObj.reservePowerup) {
            let temp = pObj.powerup; pObj.powerup = pObj.reservePowerup; pObj.reservePowerup = temp; updateHUD(); pObj.swapTimer = Date.now();
        }
    }

    pObj.x += pObj.vx;
    let leftBound = cameraLocked ? lockedCameraX : maxCameraX;
    if (pObj.x < leftBound) { pObj.x = leftBound; if (pObj.vx < 0) pObj.vx = 0; }
    if (cameraLocked && pObj.x + pObj.width > lockedCameraX + canvas.width) { pObj.x = lockedCameraX + canvas.width - pObj.width; if (pObj.vx > 0) pObj.vx = 0; }

    const floorY = canvas.height - 60;
    for (let plat of platforms) {
        if (plat.y < floorY) continue; 
        if (pObj.y + pObj.height <= plat.y + 12) continue; 
        if (pObj.x < plat.x + plat.w && pObj.x + pObj.width > plat.x && pObj.y < plat.y + plat.h && pObj.y + pObj.height > plat.y) {
            if (pObj.vx > 0) pObj.x = plat.x - pObj.width; else if (pObj.vx < 0) pObj.x = plat.x + plat.w;
            pObj.vx = 0;
        }
    }

    pObj.vy += pObj.gravity; pObj.y += pObj.vy; pObj.grounded = false;
    
    for (let plat of platforms) {
        if (pObj.x < plat.x + plat.w && pObj.x + pObj.width > plat.x && pObj.y < plat.y + plat.h && pObj.y + pObj.height > plat.y) {
            if (plat.y < floorY) {
                let prevFeet = pObj.y - pObj.vy + pObj.height;
                if (pObj.vy > 0 && prevFeet <= plat.y + 15 && !isActionPressed("moveDown", pNum)) { pObj.y = plat.y - pObj.height; pObj.vy = 0; pObj.grounded = true; pObj.jumpsLeft = 2; }
            } else {
                if (pObj.vy > 0) { pObj.y = plat.y - pObj.height; pObj.vy = 0; pObj.grounded = true; pObj.jumpsLeft = 2; } 
                else if (pObj.vy < 0) { pObj.y = plat.y + plat.h; pObj.vy = 0; }
            }
        }
    }

    if (pObj.y > canvas.height + 100) { takeDamage(pObj); }
    if (pObj.x > finishLineX && !boss) { winLevel(); }
    if (pObj.invulnTimer > 0) pObj.invulnTimer--;
}

function gameLoop() {
    if (!canvas || canvas.width === 0) resizeCanvas();
    if (!ctx) return;
    const floorY = canvas.height - 60;

    if (engineState === "PLAYING") {
        
        // CHECK P2 JOIN
        if (!p2.active && isActionPressed("join", 2)) {
            p2.active = true;
            p2.x = p1.x; p2.y = p1.y - 50;
            sharedLives += 3;
            updateHUD();
        }

        updatePlayerPhysics(p1, 1);
        if (p2.active) updatePlayerPhysics(p2, 2);

        // CO-OP CAMERA (Centers between players if P2 active, otherwise follows P1)
        let camTargetX = p1.x;
        if (p2.active) camTargetX = (p1.x + p2.x) / 2;
        
        if (!cameraLocked) { maxCameraX = Math.max(maxCameraX, camTargetX - canvas.width / 3); cameraX = maxCameraX; }
        
        if (boss) {
            let triggerX = boss.x - canvas.width + 100; 
            if (!cameraLocked && cameraX >= triggerX && boss.phase === 1) { cameraLocked = true; lockedCameraX = cameraX; }
            if (boss.phase === 2) cameraLocked = false; 
        }

        // Projectiles
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
            let players = p2.active ? [p1, p2] : [p1];
            for (let pObj of players) {
                if (p.x < pObj.x + pObj.width && p.x + p.width > pObj.x && p.y < pObj.y + pObj.height && p.y + p.height > pObj.y) {
                    enemyProjectiles.splice(i, 1); hit = true; takeDamage(pObj); break;
                }
            }
            if (!hit && (p.x < cameraX || p.y > canvas.height)) enemyProjectiles.splice(i, 1);
        }

        for (let i = physicalDrops.length - 1; i >= 0; i--) {
            let d = physicalDrops[i]; d.vy += 0.5; d.y += d.vy;
            platforms.forEach(plat => { if (d.vy >= 0 && d.y + 30 >= plat.y && d.x + 30 > plat.x && d.x < plat.x + plat.w) { d.y = plat.y - 30; d.vy = -d.vy * 0.4; } });
            
            let players = p2.active ? [p1, p2] : [p1];
            for(let pObj of players) {
                if (pObj.x < d.x + 30 && pObj.x + pObj.width > d.x && pObj.y < d.y + 30 && pObj.y + pObj.height > d.y) {
                    if (d.type === "heart") { sharedLives++; updateHUD(); }
                    if (d.type === "powerup") { collectPowerup(pObj, d.data); }
                    physicalDrops.splice(i, 1);
                    break;
                }
            }
        }

        // ENEMY LOGIC (Culling fixed so they don't walk off map while offscreen)
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            
            // FREEZE ENEMIES FAR AWAY
            if (e.x > cameraX + canvas.width + 300 || e.x < cameraX - 300) continue; 

            if (e.type === "flyer") {
                e.x += e.vx; e.y = e.startY + Math.sin(Date.now() / 300 + e.x) * 40;
            } else {
                e.vy += p1.gravity; e.y += e.vy; e.grounded = false;
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

            let players = p2.active ? [p1, p2] : [p1];
            for (let pObj of players) {
                if (pObj.x < e.x + e.width && pObj.x + pObj.width > e.x && pObj.y < e.y + e.height && pObj.y + pObj.height > e.y) {
                    if (pObj.vy > 0 && pObj.y + pObj.height - pObj.vy <= e.y + 20) {
                        enemies.splice(i, 1); pObj.vy = -14; pObj.vx = -8; 
                    } else { takeDamage(pObj); }
                }
            }
        }

        if (boss) {
            const bossHpCont = document.getElementById("boss-hp-container");
            const bossHpBar = document.getElementById("boss-hp-bar");
            if (bossHpCont) bossHpCont.style.display = "block";
            if (bossHpBar) bossHpBar.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";
            
            if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) boss.phase = 2;
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
                        // Boss targets closest player
                        let target = p1;
                        if (p2.active && Math.abs(p2.x - boss.x) < Math.abs(p1.x - boss.x)) target = p2;
                        
                        let dx = (target.x + target.width/2) - (boss.x + boss.width/2);
                        let dy = (target.y + target.height/2) - (boss.y + boss.height/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let pSpeed = 7 * difficultyMult;
                        enemyProjectiles.push({x: boss.x + 20, y: boss.y + 40, vx: (dx/dist)*pSpeed, vy: (dy/dist)*pSpeed, width: 20, height: 20, color: "red"}); 
                        boss.shootTimer = 0;
                    }
                }

                for (let j = projectiles.length - 1; j >= 0; j--) {
                    let p = projectiles[j];
                    if (p.x < boss.x + boss.width && p.x + p.width > boss.x && p.y < boss.y + boss.height && p.y + p.height > boss.y) {
                        boss.hp -= 1; projectiles.splice(j, 1);
                    }
                }

                let players = p2.active ? [p1, p2] : [p1];
                for (let pObj of players) {
                    if (pObj.x < boss.x + boss.width && pObj.x + pObj.width > boss.x && pObj.y < boss.y + boss.height && pObj.y + pObj.height > boss.y) {
                        if (pObj.vy > 0 && pObj.y + pObj.height - pObj.vy <= boss.y + 20) {
                            if (boss.stompImmune) { takeDamage(pObj); } 
                            else { boss.hp -= 1; pObj.vy = -16; pObj.vx = -12; }
                        } else { takeDamage(pObj); }
                    }
                }
            }
        }
    }

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (bgImage.complete && bgImage.naturalWidth > 0) ctx.drawImage(bgImage, -cameraX * 0.5, 0, (finishLineX * 0.5) + canvas.width, canvas.height);
    else { ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

    ctx.save(); ctx.translate(-cameraX, 0);

    ctx.fillStyle = "#333"; platforms.forEach(plat => { ctx.fillRect(plat.x, plat.y, plat.w, plat.h); });

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
    });

    if (boss) {
        ctx.fillStyle = `hsl(${currentAreaIdx * 45}, 100%, 30%)`;
        ctx.fillRect(boss.x + 20, boss.y + 40, boss.width - 40, boss.height - 40);
    }

    ctx.font = "16px Arial";
    projectiles.forEach(p => { 
        if (p.icon) { ctx.fillText(p.icon, p.x, p.y + 15); } 
        else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); } 
    });
    
    enemyProjectiles.forEach(p => { 
        ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); 
    });

    // RENDER PLAYERS
    let playersToDraw = p2.active ? [p1, p2] : [p1];
    playersToDraw.forEach(pObj => {
        if ((pObj.invulnTimer % 10 < 5 || pObj.invulnTimer === 0) && engineState !== "GAMEOVER") { 
            ctx.fillStyle = pObj.color; ctx.fillRect(pObj.x + 5, pObj.y + 15, pObj.width - 10, pObj.height - 25); 
            ctx.beginPath(); ctx.arc(pObj.x + pObj.width/2, pObj.y + 10, 12, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = pObj.powerup ? pObj.powerup.color : "red"; ctx.fillRect(pObj.x + 2, pObj.y + 4, pObj.width - 4, 6);
            ctx.fillStyle = "black";
            let lookX = pObj.vx > 0 ? 4 : (pObj.vx < 0 ? -4 : 0);
            ctx.fillRect(pObj.x + pObj.width/2 - 4 + lookX, pObj.y + 8, 3, 3);
            ctx.fillRect(pObj.x + pObj.width/2 + 2 + lookX, pObj.y + 8, 3, 3);
        }
    });

    if (!p2.active) {
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillText("P2: Press Start to Join", cameraX + canvas.width/2 - 80, 50);
    }

    ctx.restore(); 
    gameLoopId = requestAnimationFrame(gameLoop);
}
