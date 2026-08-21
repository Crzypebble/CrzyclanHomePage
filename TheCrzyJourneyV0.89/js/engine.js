// js/engine.js
// CORE GAME ENGINE - Powered by levelData.js, physics.js & render.js

const canvas = document.getElementById("game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const gameContainer = document.getElementById("game-container");
const completeScreen = document.getElementById("level-complete-screen");
const gameOverScreen = document.getElementById("game-over-screen");

// --- GAME STATE ---
let gameLoopId;
let engineState = "MENU"; 
let currentLevelData = null;
let currentAreaObj = null;
let currentAreaIdx = 1;
let currentLevelIdx = 1;
let difficultyMult = 1.0; 

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

let nightmareTimeFrames = -1;
let currentSeed = 1;

function seededRandom() {
    let x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
}

function isActionPressed(action) {
    if (action === "moveLeft" && (keys["ArrowLeft"] || keys["KeyA"])) return true;
    if (action === "moveRight" && (keys["ArrowRight"] || keys["KeyD"])) return true;
    if (action === "moveDown" && (keys["ArrowDown"] || keys["KeyS"])) return true;
    if (action === "jump" && (keys["ArrowUp"] || keys["KeyW"] || keys["Space"])) return true;
    if (action === "attack" && (keys["KeyZ"] || keys["Enter"] || keys["ShiftLeft"] || keys["KeyE"])) return true;
    if (action === "swap" && (keys["KeyQ"] || keys["KeyC"])) return true;
    if (action === "parry" && (keys["KeyF"] || keys["KeyV"])) return true; 

    const binds = window.getAllControlBindings ? window.getAllControlBindings() : {};
    const bind = binds[action];

    if (bind) {
        const match = /^GP(\d+):Button(\d+)$/.exec(bind);
        if (match && navigator.getGamepads) {
            const gpIndex = parseInt(match[1], 10);
            const btnIndex = parseInt(match[2], 10);
            const gp = navigator.getGamepads()[gpIndex];
            if (gp && gp.buttons[btnIndex] && gp.buttons[btnIndex].pressed) return true;
        }
    }
    return false;
}

let player = {
    x: 100, y: 100, vx: 0, vy: 0, width: 30, height: 50,
    speed: 6, jumpPower: -14, gravity: 0.6, grounded: false,
    maxJumps: 2, jumpsLeft: 2,
    lives: 3, powerup: null, reservePowerup: null, invulnTimer: 0,
    parryTimer: 0, parryCooldown: 0, facingRight: true 
};

let projectiles = [];
let enemyProjectiles = [];
let enemies = [];
let platforms = [];
let physicalDrops = []; 
let finishLineX = 3000;
let boss = null; 

window.startGameEngine = function(levelData, areaObj, lIdx) {
    currentLevelData = levelData; currentAreaObj = areaObj; 
    currentAreaIdx = areaObj.areaIndex; currentLevelIdx = lIdx;
    engineState = "PLAYING";
    
    if (levelData.isAreaBoss) {
        bgImage.src = areaObj.bossBgUrl; levelAudio.src = areaObj.bossMusicUrl;
    } else if (levelData.hasMiniBoss) {
        bgImage.src = areaObj.miniBossBgUrl; levelAudio.src = areaObj.miniBossMusicUrl;
    } else {
        bgImage.src = areaObj.bgUrl; levelAudio.src = areaObj.musicUrl;
    }
    
    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.pause();
    
    updateVolumes();
    levelAudio.play().catch(e => console.log("Audio block:", e));
    
    document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
    document.body.classList.remove("show-bg");
    if (gameContainer) gameContainer.style.display = "block";
    if (completeScreen) completeScreen.style.display = "none";
    if (gameOverScreen) gameOverScreen.style.display = "none";
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    resetLevel();
    cancelAnimationFrame(gameLoopId);
    gameLoop();
};

window.quitGame = function() {
    engineState = "MENU";
    cancelAnimationFrame(gameLoopId);
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
};

function updateVolumes() {
    const masterVol = document.getElementById("master-volume");
    let master = masterVol ? masterVol.value / 100 : 1.0;
    levelAudio.volume = master;
    const menuMusic = document.getElementById("menu-music");
    if (menuMusic) menuMusic.volume = master;
}

function resetLevel() {
    const nightmareSetting = document.getElementById("nightmare-select")?.value || "none";
    
    if (nightmareSetting === "1life" || nightmareSetting === "timer_1life") {
        player.lives = 1;
    } else {
        player.lives = 3;
    }

    if (nightmareSetting === "timer" || nightmareSetting === "timer_1life") {
        nightmareTimeFrames = 15 * 60 * 60; 
    } else {
        nightmareTimeFrames = -1;
    }

    player.x = 100; player.y = 100; player.vx = 0; player.vy = 0; player.invulnTimer = 0;
    player.jumpsLeft = player.maxJumps; player.parryTimer = 0; player.parryCooldown = 0;
    cameraX = 0; maxCameraX = 0; cameraLocked = false; lockedCameraX = 0;
    projectiles = []; enemyProjectiles = []; enemies = []; platforms = []; physicalDrops = []; boss = null;
    
    currentSeed = (currentAreaIdx * 100) + currentLevelIdx;
    finishLineX = currentLevelData.length || 3000;
    const floorY = canvas.height - 60;
    
    const areaPowerObj = window.AREA_POWERUPS ? window.AREA_POWERUPS[Math.min(currentAreaIdx - 1, 9)] : null;
    
    if (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss) {
        for(let i = 0; i < 2; i++) {
            let randIndex = Math.floor(seededRandom() * currentAreaIdx);
            let randPwr = window.AREA_POWERUPS[randIndex];
            physicalDrops.push({ x: 300 + (i * 200), y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: randPwr });
        }
    } else {
        if (!currentLevelData.noPowerups && areaPowerObj) {
            physicalDrops.push({ x: 400, y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: areaPowerObj });
        }
        physicalDrops.push({ x: finishLineX / 2, y: floorY - 300, vx: 0, vy: 0, type: "heart" }); 
    }

    platforms.push({ x: -100, y: floorY, w: 600, h: 60 }); 
    platforms.push({ x: finishLineX - 600, y: floorY, w: 1200, h: 60 }); 
    
    let currentX = 500;
    while (currentX < finishLineX - 600) {
        let rng = seededRandom();
        if (rng < 0.25 && !currentLevelData.isAreaBoss && !currentLevelData.hasMiniBoss) {
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
    
    for(let i = 1; i < (finishLineX / 800); i++) {
        platforms.push({ x: 800 * i, y: floorY - 180, w: 150, h: 20 });
        platforms.push({ x: 800 * i + 350, y: floorY - 250, w: 100, h: 20 });
    }

    if (!currentLevelData.isAreaBoss) {
        for(let i = 1; i < (finishLineX / 600); i++) {
            let eSpeed = -2 * (1 + (currentAreaIdx * 0.05)) * difficultyMult;
            enemies.push({ x: 600 * i, y: floorY - 200, width: 40, height: 40, vx: eSpeed, vy: 0, hp: 1, grounded: false });
        }
    }
    
    let isLateGame = currentAreaIdx >= 6;
    let bScale = isLateGame ? 2 : 1; 
    let bHP = isLateGame ? 80 : 20;

    if (currentLevelData.hasMiniBoss) {
        boss = {
            name: "Mini Boss", x: finishLineX - 400, y: floorY - (100 * bScale), 
            width: 80 * bScale, height: 100 * bScale,
            hp: (bHP / 2) * difficultyMult, maxHp: (bHP / 2) * difficultyMult, 
            phase: 3, shootTimer: 0, stompImmune: false, isLateGame: isLateGame,
            vy: 0, hasTimedSpikes: false, spikeTimer: 0
        };
    } else if (currentLevelData.isAreaBoss) {
        boss = {
            name: currentLevelData.name.toUpperCase(), x: finishLineX - 600, y: floorY - (120 * bScale), 
            width: 100 * bScale, height: 120 * bScale,
            hp: bHP * difficultyMult, maxHp: bHP * difficultyMult, 
            phase: 1, shootTimer: 0, stompImmune: true, isLateGame: isLateGame,
            vy: 0, hasTimedSpikes: true, spikeTimer: 0 // Enabled for standard bosses
        };

        if (currentAreaIdx === 2) {
            boss.maxHp = boss.maxHp * 3; 
            boss.hp = boss.maxHp;
            boss.stompImmune = false; 
            boss.hasTimedSpikes = false; // Disable spikes entirely for the Area 2 Cube
        }

        platforms.push({ x: finishLineX - 800, y: floorY - 150, w: 200, h: 20 });
        platforms.push({ x: finishLineX - 400, y: floorY - 250, w: 200, h: 20 });
    }

    updateHUD();
}

function resizeCanvas() { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }

function triggerGameOver() { engineState = "GAMEOVER"; if(gameOverScreen) gameOverScreen.style.display = "block"; levelAudio.pause(); }

function takeDamage() {
    if (player.invulnTimer > 0 || engineState !== "PLAYING") return false;
    if (player.powerup) {
        player.powerup = null; player.invulnTimer = 90; updateHUD(); return false;
    } else {
        player.lives -= 1; updateHUD();
        if (player.lives <= 0) triggerGameOver(); else resetLevel(); 
        return true; 
    }
}

function shoot() {
    if (!player.powerup) return;
    if (projectiles.length > 3) return;
    
    let isGlock = player.powerup.type === "glock";
    let dirMultiplier = player.facingRight ? 1 : -1;
    
    projectiles.push({ 
        x: player.facingRight ? player.x + player.width : player.x - 20, 
        y: player.y + 15, 
        vx: (player.powerup.projSpeed || 15) * dirMultiplier, 
        vy: isGlock ? 0 : -5, 
        gravity: isGlock ? 0 : 0.6,
        width: 20, height: 20, 
        color: player.powerup.color, icon: player.powerup.icon,
        isGlock: isGlock
    });
}

function updateHUD() {
    const livesUI = document.getElementById("ui-lives");
    if (livesUI) livesUI.textContent = "❤️".repeat(Math.max(0, player.lives));
    
    const levelUI = document.getElementById("ui-level");
    if (levelUI && currentLevelData) levelUI.textContent = currentLevelData.name;
    
    const pwrUI = document.getElementById("ui-powerup");
    if (pwrUI) {
        pwrUI.textContent = player.powerup ? `${player.powerup.icon} ${player.powerup.type.toUpperCase()}` : "None";
        pwrUI.style.color = player.powerup ? player.powerup.color : "#ccc";
    }
    
    const resUI = document.getElementById("ui-reserve");
    if (resUI) {
        resUI.textContent = player.reservePowerup ? `${player.reservePowerup.icon} ${player.reservePowerup.type.toUpperCase()}` : "None";
        resUI.style.color = player.reservePowerup ? player.reservePowerup.color : "#555";
    }
}

function winLevel() {
    engineState = "COMPLETE";
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    
    if (typeof saveProgress === 'function') saveProgress(nextA, nextL);
    const saveCodeEl = document.getElementById("generated-save-code");
    if (saveCodeEl) saveCodeEl.textContent = `CRZY-${nextA}-${nextL}`;
    if (completeScreen) completeScreen.style.display = "block";
}

// --- MAIN ENGINE LOOP ---
let lastShootTime = 0;
let lastSwapTime = 0;
let lastJumpState = false;

function gameLoop() {
    if (canvas.width === 0) resizeCanvas();
    const floorY = canvas.height - 60;
    
    if (engineState === "PLAYING") {
        if (nightmareTimeFrames > 0) {
            nightmareTimeFrames--;
            if (nightmareTimeFrames <= 0) triggerGameOver();
        }

        if (player.parryTimer > 0) player.parryTimer--;
        if (player.parryCooldown > 0) player.parryCooldown--;
        if (player.invulnTimer > 0) player.invulnTimer--;

        if (isActionPressed("moveLeft")) {
            player.vx = -player.speed;
            player.facingRight = false;
        } else if (isActionPressed("moveRight")) {
            player.vx = player.speed;
            player.facingRight = true;
        } else {
            player.vx = 0;
        }

        let jumpPressed = isActionPressed("jump");
        if (jumpPressed && !lastJumpState && player.jumpsLeft > 0) {
            player.vy = player.jumpPower; 
            player.grounded = false;
            player.jumpsLeft--;
        }
        lastJumpState = jumpPressed;

        if (isActionPressed("attack") && Date.now() - lastShootTime > 250) {
            shoot(); lastShootTime = Date.now();
        }

        if (isActionPressed("swap") && Date.now() - lastSwapTime > 300) {
            if (player.powerup || player.reservePowerup) {
                let temp = player.powerup; 
                player.powerup = player.reservePowerup; 
                player.reservePowerup = temp;
                updateHUD(); 
                lastSwapTime = Date.now();
            }
        }

        if (isActionPressed("parry") && player.parryCooldown === 0) {
            player.parryTimer = 12; 
            player.parryCooldown = 40; 
        }

        if (!cameraLocked) {
            let targetCamX = player.x - canvas.width / 3;
            if (targetCamX > maxCameraX) maxCameraX = targetCamX;
            if (maxCameraX < 0) maxCameraX = 0;
            cameraX = maxCameraX;
        }

        player.x += player.vx;

        let leftBound = cameraLocked ? lockedCameraX : maxCameraX;
        if (player.x < leftBound) player.x = leftBound;
        if (cameraLocked && player.x + player.width > lockedCameraX + canvas.width) {
            player.x = lockedCameraX + canvas.width - player.width;
        }

        window.Physics.updatePlayerPhysics(player, platforms, isActionPressed("moveDown"));

        if (player.y > canvas.height + 100) {
            if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
        }

        if (player.x > finishLineX && !boss) { winLevel(); }
        
        window.Physics.updateProjectiles(projectiles, platforms, cameraX, canvas.width, canvas.height);
        
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i]; p.x += p.vx; p.y += p.vy;
            
            if (window.Physics.checkCollision(p, player)) {
                if (player.parryTimer > 0) {
                    p.vx = -p.vx * 1.5; 
                    p.vy = -Math.abs(p.vy || 5); 
                    p.color = "#00ffff"; 
                    p.isGlock = false; 
                    p.gravity = 0; 
                    
                    projectiles.push(p); 
                    enemyProjectiles.splice(i, 1); 
                } else {
                    enemyProjectiles.splice(i, 1);
                    if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
                }
            } else if (p.x < cameraX - 100 || p.y > canvas.height + 100) {
                enemyProjectiles.splice(i, 1);
            }
        }

        for (let i = physicalDrops.length - 1; i >= 0; i--) {
            let d = physicalDrops[i];
            d.vy += 0.5; d.y += d.vy;
            platforms.forEach(plat => {
                if (d.vy >= 0 && d.y + 30 >= plat.y && d.x + 30 > plat.x && d.x < plat.x + plat.w) {
                    d.y = plat.y - 30; d.vy = -d.vy * 0.4; 
                }
            });
            
            if (window.Physics.checkCollision(player, { x: d.x, y: d.y, w: 30, h: 30 })) {
                if (d.type === "heart") { player.lives++; updateHUD(); }
                if (d.type === "powerup") { 
                    if (!player.powerup) player.powerup = d.data; 
                    else player.reservePowerup = d.data; 
                    updateHUD(); 
                }
                physicalDrops.splice(i, 1);
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            e.vy += player.gravity; e.y += e.vy; e.grounded = false;
            
            for (let plat of platforms) {
                if (window.Physics.checkCollision(e, plat)) {
                    if (e.vy > 0) { e.y = plat.y - e.height; e.vy = 0; e.grounded = true; }
                }
            }

            e.x += e.vx; 
            for (let plat of platforms) {
                if (window.Physics.checkCollision(e, plat)) {
                    if (e.vx > 0) e.x = plat.x - e.width;
                    else if (e.vx < 0) e.x = plat.x + plat.w;
                    e.vx *= -1;
                }
            }

            if (e.y > canvas.height) { enemies.splice(i, 1); continue; } 
            
            for (let j = projectiles.length - 1; j >= 0; j--) {
                if (window.Physics.checkCollision(projectiles[j], e)) {
                    enemies.splice(i, 1); projectiles.splice(j, 1); break;
                }
            }
            
            if (window.Physics.checkCollision(player, e)) {
                if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 20) {
                    enemies.splice(i, 1);
                    player.vy = -14; player.vx = -8; 
                    player.jumpsLeft = player.maxJumps; 
                } else {
                    if (player.parryTimer === 0) { 
                        if(takeDamage()) { requestAnimationFrame(gameLoop); return; } 
                    }
                }
            }
        }

        // BOSS AI & PHYSICS
        if (boss) {
            const hpCont = document.getElementById("boss-hp-container");
            const hpBar = document.getElementById("boss-hp-bar");
            const nameUi = document.getElementById("boss-name-ui");
            if (hpCont) hpCont.style.display = "block";
            if (nameUi) nameUi.textContent = boss.name;
            if (hpBar) hpBar.style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";

            // --- TIMED SPIKES CYCLE ---
            if (boss.hasTimedSpikes) {
                boss.spikeTimer++;
                if (boss.spikeTimer > 210) boss.spikeTimer = 0; // 210 frames total (3.5 seconds)
                
                // Spikes are ON for 120 frames (2 seconds), OFF for 90 frames (1.5 seconds)
                boss.stompImmune = boss.spikeTimer < 120;
            }

            if (currentAreaIdx === 2 && boss.name === "Mini Boss") {
                boss.vy += 0.4;
                boss.y += boss.vy;
                if (boss.y + boss.height >= floorY) {
                    boss.y = floorY - boss.height;
                    boss.vy = -12; 
                }
            } else if (currentAreaIdx === 2 && boss.name !== "Mini Boss") {
                if ((boss.phase === 1 || boss.phase === 3) && player.x < boss.x) {
                    boss.x -= 0.5 * difficultyMult; 
                }
            }

            let triggerX = boss.x - canvas.width + 100; 
            if (!cameraLocked && cameraX >= triggerX && boss.phase !== 2) {
                cameraLocked = true; 
                lockedCameraX = cameraX;
            }

            let fireThreshold = 150 - (currentAreaIdx * 4); 
            
            if (boss.phase === 1 || boss.phase === 3) { 
                if (cameraLocked) {
                    boss.shootTimer++;
                    if (boss.shootTimer > fireThreshold) {
                        let dx = (player.x + player.width/2) - (boss.x + boss.width/2);
                        let dy = (player.y + player.height/2) - (boss.y + boss.height/2);
                        let dist = Math.sqrt(dx*dx + dy*dy) || 1;
                        enemyProjectiles.push({
                            x: boss.x + 20, y: boss.y + 40, 
                            vx: (dx / dist) * 7, vy: (dy / dist) * 7, 
                            width: 20, height: 20, color: "red"
                        }); 
                        boss.shootTimer = 0;
                    }
                }
                
                if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { 
                    boss.phase = 2; 
                    cameraLocked = false; 
                }
                if (boss.hp <= 0) { winLevel(); boss = null; }
                
            } else if (boss.phase === 2) { 
                boss.x += 10; 
                if (boss.x >= finishLineX - 200) {
                    boss.x = finishLineX - 200; 
                    boss.phase = 3; 
                }
            }

            for (let j = projectiles.length - 1; j >= 0; j--) {
                if (boss && window.Physics.checkCollision(projectiles[j], boss)) {
                    if (boss.phase !== 2) boss.hp -= 1; 
                    projectiles.splice(j, 1);
                }
            }
            
            if (boss && window.Physics.checkCollision(player, boss)) {
                if (player.vy > 0 && player.y + player.height - player.vy <= boss.y + 20) {
                    if (boss.stompImmune) {
                        if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
                    } else {
                        if (boss.phase !== 2) boss.hp -= 1; 
                        player.vy = -16; player.vx = -12; 
                        player.jumpsLeft = player.maxJumps;
                    }
                } else {
                    if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
                }
            }
        }
    }

    // --- RENDERING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage.complete && bgImage.naturalWidth > 0) {
        let stretchWidth = (finishLineX * 0.5) + canvas.width;
        ctx.drawImage(bgImage, -cameraX * 0.5, 0, stretchWidth, canvas.height);
    } else {
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.save(); ctx.translate(-cameraX, 0);

    ctx.fillStyle = "#333"; 
    platforms.forEach(plat => ctx.fillRect(plat.x, plat.y, plat.w, plat.h));

    if (!boss || boss.phase === 3) {
        ctx.fillStyle = "gold"; ctx.fillRect(finishLineX, floorY - 200, 10, 200);
        ctx.fillStyle = "#ffaa00"; ctx.fillRect(finishLineX, floorY - 200, 60, 40);
    }

    ctx.font = "28px Arial";
    physicalDrops.forEach(d => {
        if (d.type === "heart") ctx.fillText("❤️", d.x, d.y + 25);
        if (d.type === "powerup") ctx.fillText(d.data.icon, d.x, d.y + 25);
    });

    enemies.forEach(e => {
        if (window.Render) window.Render.enemy(ctx, e, currentAreaIdx);
    });

    if (boss) {
        if (window.Render) window.Render.boss(ctx, boss, currentAreaIdx);
    }

    enemyProjectiles.forEach(p => { 
        ctx.fillStyle = p.color || "red"; 
        ctx.beginPath(); 
        ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); 
        ctx.fill(); 
    });

    ctx.font = "16px Arial";
    projectiles.forEach(p => { 
        if (p.isGlock) {
            ctx.strokeStyle = "rgba(255, 200, 0, 0.8)";
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(p.x + p.width/2, p.y + p.height/2);
            ctx.lineTo((p.x + p.width/2) - (p.vx * 3), (p.y + p.height/2));
            ctx.stroke();
        }
        if (p.icon) ctx.fillText(p.icon, p.x, p.y + 15);
        else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); } 
    });

    if (window.Render) {
        window.Render.player(ctx, player, engineState);
    }

    ctx.restore(); 

    if (nightmareTimeFrames > 0 && engineState === "PLAYING") {
        ctx.fillStyle = "red";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Time Left: " + Math.ceil(nightmareTimeFrames / 60) + "s", canvas.width / 2 - 80, 50);
    }

    gameLoopId = requestAnimationFrame(gameLoop);
}
