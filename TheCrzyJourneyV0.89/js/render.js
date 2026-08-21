// js/render.js
// Handles all visual drawing for the player, enemies, and bosses

window.Render = {
    player: function(ctx, player, engineState) {
        if (player.invulnTimer % 10 >= 5 || engineState === "GAMEOVER") return;

        // Body
        ctx.fillStyle = "#fff";
        ctx.fillRect(player.x + 5, player.y + 20, 20, 30);
        
        // Head
        ctx.beginPath();
        ctx.arc(player.x + 15, player.y + 10, 12, 0, Math.PI * 2);
        ctx.fill();

        // Eyes
        ctx.fillStyle = "#000";
        // Flip eyes based on facing direction
        let eyeOffset = player.facingRight ? 0 : -4;
        ctx.beginPath(); ctx.arc(player.x + 11 + eyeOffset, player.y + 8, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(player.x + 19 + eyeOffset, player.y + 8, 2, 0, Math.PI * 2); ctx.fill();

        // Headband / Powerup Indicator
        ctx.fillStyle = player.powerup ? player.powerup.color : "#555";
        ctx.fillRect(player.x + 3, player.y + 2, 24, 6);

        // Animated Legs
        ctx.fillStyle = "#fff";
        let legOffset = (Math.abs(player.vx) > 0 && Math.floor(Date.now() / 100) % 2 === 0) ? 5 : 0;
        ctx.fillRect(player.x + 5, player.y + 50, 6, 10 - legOffset);
        ctx.fillRect(player.x + 19, player.y + 50, 6, 10 + legOffset);

        // --- PARRY ANIMATION ---
        if (player.parryTimer > 0) {
            ctx.save();
            ctx.translate(player.x + 15, player.y + 35); // Anchor to center-chest
            
            // Calculate a swift swing arc from high to low based on the 12-frame timer
            let swingProgress = (12 - player.parryTimer) / 12; 
            let swingAngle = (swingProgress * Math.PI) - (Math.PI / 2); // Swings from top to bottom
            let dirMultiplier = player.facingRight ? 1 : -1;
            
            ctx.rotate(swingAngle * dirMultiplier);
            
            // Draw the swinging arm (looks like a swift backhand/deflect motion)
            ctx.fillStyle = "#fff";
            ctx.fillRect(0, -4, 25 * dirMultiplier, 8);
            
            ctx.restore();

            // Add a cyan energy swoosh effect that expands outward
            ctx.save();
            ctx.strokeStyle = `rgba(0, 255, 255, ${player.parryTimer / 12})`; // Fades out
            ctx.lineWidth = 4;
            ctx.beginPath();
            let arcCenter = player.facingRight ? player.x + 30 : player.x;
            // Draw a sweeping semi-circle facing the direction of the parry
            let startAngle = player.facingRight ? -Math.PI/2 : Math.PI/2;
            let endAngle = player.facingRight ? Math.PI/2 : (3*Math.PI)/2;
            ctx.arc(arcCenter, player.y + 30, 20 + (swingProgress * 15), startAngle, endAngle);
            ctx.stroke();
            ctx.restore();
        }
    },

    enemy: function(ctx, e, currentAreaIdx) {
        let baseColor = `hsl(${currentAreaIdx * 35}, 80%, 40%)`;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(e.x + 5, e.y + 15, e.width - 10, e.height - 25);
        
        ctx.beginPath();
        ctx.arc(e.x + e.width / 2, e.y + 10, 10, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = "white";
        ctx.beginPath(); ctx.arc(e.x + e.width / 2 - 4, e.y + 8, 4, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "black";
        ctx.beginPath(); ctx.arc(e.x + e.width / 2 - 5, e.y + 8, 2, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = baseColor;
        let legOff = (Math.floor(Date.now() / 100) % 2 === 0) ? 3 : 0;
        ctx.fillRect(e.x + 10, e.y + e.height - 10, 6, 10 - legOff);
        ctx.fillRect(e.x + 24, e.y + e.height - 10, 6, 10 + legOff);
    },

    boss: function(ctx, boss, currentAreaIdx) {
        const isMiniBoss = boss.name === "Mini Boss";

        // ==========================================
        // AREA 2 THEMES: The Red Wastes
        // ==========================================
        if (currentAreaIdx === 2) {
            if (isMiniBoss) {
                // The Bouncing Red Blob
                ctx.fillStyle = "#ff3333";
                ctx.beginPath();
                let squish = boss.vy > 0 ? 10 : (boss.vy < 0 ? -10 : 0);
                ctx.ellipse(boss.x + boss.width/2, boss.y + boss.height/2 + squish, boss.width/2, boss.height/2 - squish, 0, 0, Math.PI * 2);
                ctx.fill();
                
                // Blob Eyes
                ctx.fillStyle = "#000";
                ctx.beginPath(); ctx.arc(boss.x + 25, boss.y + 30, 5, 0, Math.PI * 2); ctx.fill();
                ctx.beginPath(); ctx.arc(boss.x + boss.width - 25, boss.y + 30, 5, 0, Math.PI * 2); ctx.fill();
                return;
            } else {
                // The Big Slow Cube
                ctx.fillStyle = "#880000";
                ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
                ctx.strokeStyle = "#ff0000";
                ctx.lineWidth = 4;
                ctx.strokeRect(boss.x, boss.y, boss.width, boss.height);
                
                // Menacing Cube Eyes
                ctx.fillStyle = "#ffaa00";
                ctx.fillRect(boss.x + 20, boss.y + 20, 20, 10);
                ctx.fillRect(boss.x + boss.width - 40, boss.y + 20, 20, 10);
                return;
            }
        }

        // ==========================================
        // DEFAULT FALLBACK BOSS DESIGNS
        // ==========================================
        if (boss.isLateGame) { ctx.shadowColor = "#ff0000"; ctx.shadowBlur = 25; }

        let bColor = boss.stompImmune ? "#222" : `hsl(${currentAreaIdx * 45}, 100%, 30%)`;
        
        ctx.fillStyle = bColor;
        ctx.fillRect(boss.x + 20, boss.y + 40, boss.width - 40, boss.height - 40);
        ctx.beginPath(); ctx.arc(boss.x + boss.width / 2, boss.y + 20, boss.width / 4, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = boss.isLateGame ? "#ff0000" : "red";
        ctx.beginPath(); ctx.arc(boss.x + boss.width / 2 - 10, boss.y + 15, 6, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width / 2 + 10, boss.y + 15, 6, 0, Math.PI * 2); ctx.fill();
        
        ctx.fillStyle = boss.isLateGame ? "#ffff00" : "white";
        ctx.beginPath(); ctx.arc(boss.x + boss.width / 2 - 11, boss.y + 15, 2, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.arc(boss.x + boss.width / 2 + 9, boss.y + 15, 2, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; 

        if (boss.stompImmune) {
            ctx.fillStyle = "#888"; ctx.beginPath();
            let spikeCount = boss.isLateGame ? 5 : 3;
            let spikeWidth = boss.width / spikeCount;
            for (let i = 0; i < spikeCount; i++) {
                ctx.moveTo(boss.x + (i * spikeWidth), boss.y + 10);
                ctx.lineTo(boss.x + (spikeWidth / 2) + (i * spikeWidth), boss.y - 30);
                ctx.lineTo(boss.x + spikeWidth + (i * spikeWidth), boss.y + 10);
            }
            ctx.fill();
        }
        
        ctx.fillStyle = bColor;
        let armOffset = (boss.phase === 2 && Math.floor(Date.now() / 150) % 2 === 0) ? -20 : 0;
        ctx.fillRect(boss.x, boss.y + (boss.height / 3) + armOffset, 20, boss.height / 2);
        ctx.fillRect(boss.x + boss.width - 20, boss.y + (boss.height / 3) - armOffset, 20, boss.height / 2);
    }
};
