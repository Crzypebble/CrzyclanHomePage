// js/engine.js
// CORE GAME ENGINE - Stretched Backgrounds, Bouncing Magic, Deterministic Seeds

const canvas = document.getElementById("game-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const gameContainer = document.getElementById("game-container");
const completeScreen = document.getElementById("level-complete-screen");
const gameOverScreen = document.getElementById("game-over-screen");

// --- GAME STATE & SETTINGS ---
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

// --- DETERMINISTIC SEED SYSTEM ---
let currentSeed = 1;
function seededRandom() {
    let x = Math.sin(currentSeed++) * 10000;
    return x - Math.floor(x);
}

// --- SETTINGS LISTENERS ---
document.getElementById("master-volume").addEventListener("input", updateVolumes);
document.getElementById("difficulty-select").addEventListener("change", e => {
    let diff = e.target.value;
    if (diff === "Easy") difficultyMult = 0.6;
    else if (diff === "Hard") difficultyMult = 1.5;
    else difficultyMult = 1.0;
});
function updateVolumes() {
    let master = document.getElementById("master-volume").value / 100;
    levelAudio.volume = master;
    document.getElementById("menu-music").volume = master;
}

// --- UNIFIED INPUT CHECKER ---
function isActionPressed(action) {
    if (action === "moveLeft" && (keys["ArrowLeft"] || keys["KeyA"])) return true;
    if (action === "moveRight" && (keys["ArrowRight"] || keys["KeyD"])) return true;
    if (action === "jump" && (keys["ArrowUp"] || keys["KeyW"] || keys["Space"])) return true;
    if (action === "attack" && (keys["KeyZ"] || keys["Enter"] || keys["ShiftLeft"] || keys["KeyE"])) return true;
    if (action === "swap" && (keys["KeyQ"] || keys["KeyC"])) return true;

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
    
    if (action === "swap" && navigator.getGamepads) {
        const gp = navigator.getGamepads()[0];
        if (gp && gp.buttons[3] && gp.buttons[3].pressed) return true;
    }
    return false;
}

// --- ENTITIES ---
let player = {
    x: 100, y: 100, vx: 0, vy: 0, width: 30, height: 50,
    speed: 6, jumpPower: -14, gravity: 0.6, grounded: false,
    lives: 3, powerup: null, reservePowerup: null, invulnTimer: 0
};

let projectiles = [];
let enemyProjectiles = [];
let enemies = [];
let platforms = [];
let physicalDrops = []; 
let finishLineX = 3000;
let boss = null; 

// --- START / STOP ---
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
    
    document.getElementById("menu-music").pause();
    updateVolumes();
    levelAudio.play().catch(e => console.log("Audio block:", e));
    
    document.querySelectorAll('.menu-section').forEach(sec => sec.style.display = 'none');
    document.body.classList.remove("show-bg");
    gameContainer.style.display = "block";
    completeScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    resetLevel();
    cancelAnimationFrame(gameLoopId);
    gameLoop();
}

window.quitGame = function() {
    engineState = "MENU";
    cancelAnimationFrame(gameLoopId);
    gameContainer.style.display = "none";
    completeScreen.style.display = "none";
    gameOverScreen.style.display = "none";
    document.body.classList.add("show-bg");
    document.getElementById("main-menu").style.display = "block";
    
    levelAudio.pause();
    document.getElementById("menu-music").play();
    if(typeof renderLevelSelect === 'function') renderLevelSelect();
}

window.restartGame = function() {
    gameOverScreen.style.display = "none";
    player.lives = 3; player.powerup = null; player.reservePowerup = null;
    engineState = "PLAYING";
    levelAudio.currentTime = 0; levelAudio.play();
    resetLevel();
}

window.nextLevel = function() {
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    
    const nextZone = window.GAME_ZONES.find(z => z.areaIndex === nextA);
    if(!nextZone) { alert("CONGRATULATIONS! You beat the game!"); quitGame(); return; }
    
    startGameEngine(nextZone.levels[nextL - 1], nextZone, nextL);
}

function resetLevel() {
    player.x = 100; player.y = 100; player.vx = 0; player.vy = 0; player.invulnTimer = 0;
    cameraX = 0; maxCameraX = 0; cameraLocked = false; lockedCameraX = 0;
    projectiles = []; enemyProjectiles = []; enemies = []; platforms = []; physicalDrops = []; boss = null;
    
    currentSeed = (currentAreaIdx * 100) + currentLevelIdx;
    
    finishLineX = currentLevelData.length || 3000;
    const floorY = canvas.height - 60;
    
    const areaPowerObj = window.AREA_POWERUPS[Math.min(currentAreaIdx - 1, 9)];
    
    if (currentLevelData.isAreaBoss || currentLevelData.hasMiniBoss) {
        for(let i=0; i<2; i++) {
            let randPwr = window.AREA_POWERUPS[Math.floor(seededRandom() * currentAreaIdx)];
            physicalDrops.push({ x: 300 + (i*200), y: floorY - 300, vx: 0, vy: 0, type: "powerup", data: randPwr });
        }
    } else {
        if (!currentLevelData.noPowerups) {
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
    
    for(let i=1; i < (finishLineX/800); i++) {
        platforms.push({x: 800 * i, y: floorY - 180, w: 150, h: 20});
        platforms.push({x: 800 * i + 350, y: floorY - 250, w: 100, h: 20});
    }

    if (!currentLevelData.isAreaBoss) {
        for(let i=1; i < (finishLineX/600); i++) {
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
            phase: 3, shootTimer: 0, stompImmune: false, isLateGame: isLateGame
        };
    } else if (currentLevelData.isAreaBoss) {
        boss = {
            name: currentLevelData.name.toUpperCase(), x: finishLineX - 600, y: floorY - (120 * bScale), 
            width: 100 * bScale, height: 120 * bScale,
            hp: bHP * difficultyMult, maxHp: bHP * difficultyMult, 
            phase: 1, shootTimer: 0, stompImmune: true, isLateGame: isLateGame
        };
        platforms.push({x: finishLineX - 800, y: floorY - 150, w: 200, h: 20});
        platforms.push({x: finishLineX - 400, y: floorY - 250, w: 200, h: 20});
    }

    updateHUD();
}

function resizeCanvas() { if(canvas) { canvas.width = window.innerWidth; canvas.height = window.innerHeight; } }

function collectPowerup(data) { 
    if (!player.powerup) {
        player.powerup = data;
    } else {
        player.reservePowerup = data;
    }
    updateHUD(); 
}

function triggerGameOver() { engineState = "GAMEOVER"; gameOverScreen.style.display = "block"; levelAudio.pause(); }

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
    if (!player.powerup) {
        let deflectHit = false;
        let meleeBox = { x: player.x, y: player.y, w: player.width + 40, h: player.height };
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i];
            if (p.x < meleeBox.x + meleeBox.w && p.x + p.width > meleeBox.x && p.y < meleeBox.y + meleeBox.h && p.y + p.height > meleeBox.y) {
                p.vx = 15; p.vy = 0; p.color = "#00ff00"; p.icon = "🟢"; 
                projectiles.push(p); enemyProjectiles.splice(i, 1); deflectHit = true;
            }
        }
        return;
    }
    
    if (projectiles.length > 3) return;
    
    let isGlock = player.powerup.type === "glock";
    projectiles.push({ 
        x: player.x + player.width, y: player.y + 15, 
        vx: player.powerup.projSpeed, 
        vy: isGlock ? 0 : -5, 
        gravity: isGlock ? 0 : 0.6, // Gravity pulling magic down
        width: 20, height: 20, 
        color: player.powerup.color, icon: player.powerup.icon 
    });
}

function updateHUD() {
    document.getElementById("ui-lives").textContent = "❤️".repeat(Math.max(0, player.lives));
    document.getElementById("ui-level").textContent = currentLevelData.name;
    
    const pwrUI = document.getElementById("ui-powerup");
    if (player.powerup) { 
        pwrUI.textContent = player.powerup.icon + " " + player.powerup.type.toUpperCase(); 
        pwrUI.style.color = player.powerup.color; 
    } else { pwrUI.textContent = "None"; pwrUI.style.color = "#ccc"; }
    
    const resUI = document.getElementById("ui-reserve");
    if (player.reservePowerup) {
        resUI.textContent = player.reservePowerup.icon + " " + player.reservePowerup.type.toUpperCase(); 
        resUI.style.color = player.reservePowerup.color; 
    } else { resUI.textContent = "None"; resUI.style.color = "#555"; }
}

function winLevel() {
    engineState = "COMPLETE";
    let nextA = currentAreaIdx; let nextL = currentLevelIdx + 1;
    if (nextL > currentAreaObj.levels.length) { nextL = 1; nextA++; }
    
    if (typeof saveProgress === 'function') saveProgress(nextA, nextL);
    document.getElementById("generated-save-code").textContent = `CRZY-${nextA}-${nextL}`;
    completeScreen.style.display = "block";
}

// --- MAIN LOOP ---
let lastShootTime = 0;
let lastSwapTime = 0;

function gameLoop() {
    if (canvas.width === 0) resizeCanvas();
    const floorY = canvas.height - 60;
    
    if (engineState === "PLAYING") {
        
        if (isActionPressed("moveLeft")) player.vx = -player.speed;
        else if (isActionPressed("moveRight")) player.vx = player.speed;
        else player.vx = 0;

        if (isActionPressed("jump") && player.grounded) {
            player.vy = player.jumpPower; player.grounded = false;
        }
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

        if (!cameraLocked) {
            let targetCamX = player.x - canvas.width / 3;
            if (targetCamX > maxCameraX) maxCameraX = targetCamX;
            if (maxCameraX < 0) maxCameraX = 0;
            cameraX = maxCameraX;
        }

        if (boss) {
            let triggerX = boss.x - canvas.width + 100; 
            if (!cameraLocked && cameraX >= triggerX) {
                cameraLocked = true; lockedCameraX = cameraX;
            }
        }

        player.x += player.vx;

        let leftBound = cameraLocked ? lockedCameraX : maxCameraX;
        if (player.x < leftBound) {
            player.x = leftBound;
            if (player.vx < 0) player.vx = 0; 
        }

        if (cameraLocked && player.x + player.width > lockedCameraX + canvas.width) {
            player.x = lockedCameraX + canvas.width - player.width;
            if (player.vx > 0) player.vx = 0;
        }

        for (let plat of platforms) {
            if (player.x < plat.x + plat.w && player.x + player.width > plat.x &&
                player.y < plat.y + plat.h && player.y + player.height > plat.y) {
                if (player.vx > 0) player.x = plat.x - player.width;
                else if (player.vx < 0) player.x = plat.x + plat.w;
                player.vx = 0;
            }
        }

        player.vy += player.gravity; 
        player.y += player.vy;
        player.grounded = false;
        for (let plat of platforms) {
            if (player.x < plat.x + plat.w && player.x + player.width > plat.x &&
                player.y < plat.y + plat.h && player.y + player.height > plat.y) {
                if (player.vy > 0) {
                    player.y = plat.y - player.height;
                    player.vy = 0; player.grounded = true;
                } else if (player.vy < 0) {
                    player.y = plat.y + plat.h;
                    player.vy = 0;
                }
            }
        }

        if (player.y > canvas.height + 100) {
            if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
        }

        if (player.x > finishLineX && !boss) { winLevel(); }
        if (player.invulnTimer > 0) player.invulnTimer--;

        // BOUNCING PROJECTILE PHYSICS
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i]; 
            p.vy += p.gravity; 
            p.x += p.vx; 
            p.y += p.vy;
            
            if (p.x > cameraX + canvas.width || p.x < cameraX || p.y > canvas.height) {
                projectiles.splice(i, 1); continue;
            }
            
            let hitWall = false;
            for (let plat of platforms) {
                if (p.x < plat.x + plat.w && p.x + p.width > plat.x && p.y < plat.y + plat.h && p.y + p.height > plat.y) {
                    // If it's a magic projectile hitting the TOP of a platform, BOUNCE!
                    if (p.gravity > 0 && p.vy > 0 && p.y + p.height - p.vy <= plat.y + 20) {
                        p.y = plat.y - p.height; 
                        p.vy = -8; // Bounces back up!
                    } else {
                        // Otherwise (hit wall sideways, or is Glock), destroy it
                        hitWall = true; 
                    }
                }
            }
            if (hitWall) { projectiles.splice(i, 1); continue; }
        }
        
        for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
            let p = enemyProjectiles[i]; p.x += p.vx; p.y += p.vy;
            let hit = false;
            if (p.x < player.x + player.width && p.x + p.width > player.x && p.y < player.y + player.height && p.y + p.height > player.y) {
                enemyProjectiles.splice(i, 1); hit = true;
                if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
            }
            if (!hit && (p.x < cameraX || p.y > canvas.height)) enemyProjectiles.splice(i, 1);
        }

        for (let i = physicalDrops.length - 1; i >= 0; i--) {
            let d = physicalDrops[i];
            d.vy += 0.5; d.y += d.vy;
            platforms.forEach(plat => {
                if (d.vy >= 0 && d.y + 30 >= plat.y && d.x + 30 > plat.x && d.x < plat.x + plat.w) {
                    d.y = plat.y - 30; d.vy = -d.vy * 0.4; 
                }
            });
            if (d.y > canvas.height) { physicalDrops.splice(i, 1); continue; }
            
            if (player.x < d.x + 30 && player.x + player.width > d.x && player.y < d.y + 30 && player.y + player.height > d.y) {
                if (d.type === "heart") { player.lives++; updateHUD(); }
                if (d.type === "powerup") { collectPowerup(d.data); }
                physicalDrops.splice(i, 1);
            }
        }
        
        for (let i = enemies.length - 1; i >= 0; i--) {
            let e = enemies[i]; 
            
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
                    if (e.vx > 0) { e.x = plat.x - e.width; hitWall = true; }
                    else if (e.vx < 0) { e.x = plat.x + plat.w; hitWall = true; }
                }
            }

            if (hitWall) {
                if (e.grounded) e.vy = -12; 
                e.vx *= -1; 
            }

            if (e.y > canvas.height) { enemies.splice(i, 1); continue; } 
            
            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                if (p.x < e.x + e.width && p.x + p.width > e.x && p.y < e.y + e.height && p.y + p.height > e.y) {
                    enemies.splice(i, 1); projectiles.splice(j, 1); break;
                }
            }
            
            if (player.x < e.x + e.width && player.x + player.width > e.x && player.y < e.y + e.height && player.y + player.height > e.y) {
                if (player.vy > 0 && player.y + player.height - player.vy <= e.y + 20) {
                    enemies.splice(i, 1);
                    player.vy = -14; player.vx = -8; 
                } else {
                    if(takeDamage()) { requestAnimationFrame(gameLoop); return; } 
                }
            }
        }

        if (boss) {
            document.getElementById("boss-hp-container").style.display = "block";
            document.getElementById("boss-name-ui").textContent = boss.name;
            document.getElementById("boss-hp-bar").style.width = Math.max(0, (boss.hp / boss.maxHp) * 100) + "%";

            if (cameraLocked) {
                let fireThreshold = 150 - (currentAreaIdx * 4); 
                if (difficultyMult === 0.6) fireThreshold *= 1.5; 
                if (boss.isLateGame) fireThreshold *= 0.6; 

                if ((difficultyMult > 1 || currentAreaIdx > 3) && boss.phase !== 2) {
                    if (player.y < boss.y) boss.y -= 2; 
                    if (player.y > boss.y && boss.y < floorY - 120) boss.y += 2;
                }

                if (boss.phase === 1 || boss.phase === 3) { 
                    boss.shootTimer++;
                    let currentThreshold = boss.phase === 3 ? fireThreshold * 0.7 : fireThreshold;

                    if (boss.shootTimer > currentThreshold) {
                        let dx = (player.x + player.width/2) - (boss.x + boss.width/2);
                        let dy = (player.y + player.height/2) - (boss.y + boss.height/2);
                        let dist = Math.sqrt(dx*dx + dy*dy);
                        let pSpeed = 7 * difficultyMult;
                        if (boss.isLateGame) pSpeed *= 1.5;

                        let bvx = (dx / dist) * pSpeed;
                        let bvy = (dy / dist) * pSpeed;
                        
                        let projColor = boss.isLateGame ? "#ff00ff" : "red";
                        enemyProjectiles.push({x: boss.x + 20, y: boss.y + 40, vx: bvx, vy: bvy, width: 20, height: 20, color: projColor}); 
                        boss.shootTimer = 0;
                    }
                    if (boss.hp <= boss.maxHp / 2 && boss.phase === 1) { boss.phase = 2; } 
                    if (boss.hp <= 0) { winLevel(); boss = null; }
                } else if (boss.phase === 2) { 
                    boss.x += 10; if (boss.x >= finishLineX - 200) { boss.x = finishLineX - 200; boss.phase = 3; }
                }
            }

            for (let j = projectiles.length - 1; j >= 0; j--) {
                let p = projectiles[j];
                if (boss && p.x < boss.x + boss.width && p.x + p.width > boss.x && p.y < boss.y + boss.height && p.y + p.height > boss.y) {
                    if(boss.phase !== 2) boss.hp -= 1; projectiles.splice(j, 1);
                }
            }
            
            if (boss && player.x < boss.x + boss.width && player.x + player.width > boss.x && player.y < boss.y + boss.height && player.y + player.height > boss.y) {
                if (player.vy > 0 && player.y + player.height - player.vy <= boss.y + 20) {
                    if (boss.stompImmune) {
                        if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
                    } else {
                        if(boss.phase !== 2) boss.hp -= 1; 
                        player.vy = -16; player.vx = -12; 
                    }
                } else {
                    if(takeDamage()) { requestAnimationFrame(gameLoop); return; }
                }
            }
        } else {
            document.getElementById("boss-hp-container").style.display = "none";
        }
    }

    // --- RENDERING ---
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (bgImage.complete && bgImage.naturalWidth > 0) {
        // STRETCHED BACKGROUND LOGIC
        // This calculates exactly how wide the image needs to be so it spans the entire 
        // level distance perfectly while applying the 0.5x parallax scroll!
        let stretchWidth = (finishLineX * 0.5) + canvas.width;
        ctx.drawImage(bgImage, -cameraX * 0.5, 0, stretchWidth, canvas.height);
    } else {
        ctx.fillStyle = "#1a1a1a"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

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

    ctx.fillStyle = `hsl(${currentAreaIdx * 35}, 80%, 40%)`;
    enemies.forEach(e => {
        ctx.fillRect(e.x + 5, e.y + 15, e.width - 10, e.height - 25); 
        ctx.beginPath(); ctx.arc(e.x + e.width/2, e.y + 10, 10, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(e.x + e.width/2 - 4, e.y + 8, 4, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = "black"; ctx.beginPath(); ctx.arc(e.x + e.width/2 - 5, e.y + 8, 2, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = `hsl(${currentAreaIdx * 35}, 80%, 40%)`;
        let legOff = (Math.floor(Date.now() / 100) % 2 === 0) ? 3 : 0;
        ctx.fillRect(e.x + 10, e.y + e.height - 10, 6, 10 - legOff);
        ctx.fillRect(e.x + 24, e.y + e.height - 10, 6, 10 + legOff);
    });

    if (boss) {
        if (boss.isLateGame) {
            ctx.shadowColor = "#ff0000";
            ctx.shadowBlur = 25;
        }

        let bColor = boss.stompImmune ? "#222" : `hsl(${currentAreaIdx * 45}, 100%, 30%)`;
        ctx.fillStyle = bColor;
        ctx.fillRect(boss.x + 20, boss.y + 40, boss.width - 40, boss.height - 40);
        
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2, boss.y + 20, boss.width/4, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = boss.isLateGame ? "#ff0000" : "red";
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 - 10, boss.y + 15, 6, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 + 10, boss.y + 15, 6, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = boss.isLateGame ? "#ffff00" : "white"; 
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 - 11, boss.y + 15, 2, 0, Math.PI*2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width/2 + 9, boss.y + 15, 2, 0, Math.PI*2); ctx.fill();

        ctx.shadowBlur = 0; 

        if (boss.stompImmune) {
            ctx.fillStyle = "#888"; 
            ctx.beginPath();
            let spikeCount = boss.isLateGame ? 5 : 3;
            let spikeWidth = boss.width / spikeCount;
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
        if (p.icon) ctx.fillText(p.icon, p.x, p.y + 15);
        else { ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.width, p.height); } 
    });
    enemyProjectiles.forEach(p => { 
        ctx.fillStyle = p.color; 
        if(p.color === "#ff00ff") {
            ctx.shadowColor = "#ff00ff"; ctx.shadowBlur = 10;
        }
        ctx.beginPath(); ctx.arc(p.x + p.width/2, p.y + p.height/2, p.width/2, 0, Math.PI*2); ctx.fill(); 
        ctx.shadowBlur = 0;
    });

    if (player.invulnTimer % 10 < 5 && engineState !== "GAMEOVER") { 
        ctx.fillStyle = "#fff"; ctx.fillRect(player.x + 5, player.y + 20, 20, 30); 
        ctx.beginPath(); ctx.arc(player.x + 15, player.y + 10, 12, 0, Math.PI*2); ctx.fill();
        
        ctx.fillStyle = player.powerup ? player.powerup.color : "#555";
        ctx.fillRect(player.x + 3, player.y + 5, 24, 6);
        
        ctx.fillStyle = "#fff";
        let legOffset = (Math.abs(player.vx) > 0 && Math.floor(Date.now() / 100) % 2 === 0) ? 5 : 0;
        ctx.fillRect(player.x + 5, player.y + 50, 6, 10 - legOffset);
        ctx.fillRect(player.x + 19, player.y + 50, 6, 10 + legOffset);
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
                if (document.activeElement !== visibleButtons[selectedMenuIndex]) {
                    visibleButtons[selectedMenuIndex].focus();
                }
                if (down && !lastGP.down) { 
                    selectedMenuIndex = (selectedMenuIndex + 1) % visibleButtons.length; 
                    visibleButtons[selectedMenuIndex].focus(); 
                }
                if (up && !lastGP.up) { 
                    selectedMenuIndex = (selectedMenuIndex - 1 + visibleButtons.length) % visibleButtons.length; 
                    visibleButtons[selectedMenuIndex].focus(); 
                }
                if (a && !lastGP.a) visibleButtons[selectedMenuIndex].click();
            }
            lastGP = { up, down, a };
        }
    }
    requestAnimationFrame(menuGamepadLoop);
}
menuGamepadLoop();