// js/physics.js
// Dedicated Physics & Collision Engine for The Crzy Journey

window.Physics = {
    // Axis-Aligned Bounding Box (AABB) collision check
    checkCollision: function(rect1, rect2) {
        const r1w = rect1.w || rect1.width || 0;
        const r1h = rect1.h || rect1.height || 0;
        const r2w = rect2.w || rect2.width || 0;
        const r2h = rect2.h || rect2.height || 0;

        return (
            rect1.x < rect2.x + r2w &&
            rect1.x + r1w > rect2.x &&
            rect1.y < rect2.y + r2h &&
            rect1.y + r1h > rect2.y
        );
    },

    // Handles player movement, gravity, solid walls, and fall-through platforms
    updatePlayerPhysics: function(player, platforms, isHoldingDown) {
        // Horizontal Platform Collision (Only thick solid platforms block horizontally)
        for (let plat of platforms) {
            let isFallThrough = plat.h <= 20;
            if (!isFallThrough && this.checkCollision(player, plat)) {
                if (player.vx > 0) player.x = plat.x - player.width;
                else if (player.vx < 0) player.x = plat.x + plat.w;
                player.vx = 0;
            }
        }

        // Apply Gravity & Vertical Movement
        player.vy += player.gravity;
        player.y += player.vy;
        player.grounded = false;

        // Vertical Collision & Landing
        for (let plat of platforms) {
            let isFallThrough = plat.h <= 20;

            if (this.checkCollision(player, plat)) {
                if (player.vy > 0) { // Falling downward
                    if (isFallThrough) {
                        // Pass through if player holds DOWN, or land if falling onto platform top
                        if (player.y + player.height - player.vy <= plat.y + 6 && !isHoldingDown) {
                            player.y = plat.y - player.height;
                            player.vy = 0;
                            player.grounded = true;
                            player.jumpsLeft = player.maxJumps; // Reset double jump
                        }
                    } else {
                        // Solid platform top
                        player.y = plat.y - player.height;
                        player.vy = 0;
                        player.grounded = true;
                        player.jumpsLeft = player.maxJumps; // Reset double jump
                    }
                } else if (player.vy < 0 && !isFallThrough) {
                    // Solid ceiling hit
                    player.y = plat.y + plat.h;
                    player.vy = 0;
                }
            }
        }
    },

    // Handles magic/bouncing projectiles and wall impacts
    updateProjectiles: function(projectiles, platforms, cameraX, canvasWidth, canvasHeight) {
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            p.vy += p.gravity;
            p.x += p.vx;
            p.y += p.vy;

            // Remove off-screen projectiles
            if (p.x > cameraX + canvasWidth + 100 || p.x < cameraX - 100 || p.y > canvasHeight + 100) {
                projectiles.splice(i, 1);
                continue;
            }

            let hitWall = false;
            for (let plat of platforms) {
                if (this.checkCollision(p, plat)) {
                    // Bouncing logic for non-Glock arc projectiles hitting platform top
                    if (p.gravity > 0 && p.vy > 0 && p.y + p.height - p.vy <= plat.y + 15) {
                        p.y = plat.y - p.height;
                        p.vy = -7;
                    } else {
                        hitWall = true;
                    }
                }
            }
            if (hitWall) projectiles.splice(i, 1);
        }
    }
};