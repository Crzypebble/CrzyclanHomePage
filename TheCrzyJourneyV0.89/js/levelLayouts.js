// js/levelLayouts.js
// Handles all preset level designs and scaling length progression

window.LevelLayouts = {
    getLayout: function(areaIdx, levelIdx, levelData, canvasHeight) {
        let layoutId = `Area${areaIdx}_Level${levelIdx}`;
        
        // 1. Check if you have hand-crafted this specific level below
        if (this.presets[layoutId]) {
            return this.presets[layoutId](canvasHeight);
        }
        
        // 2. Fallback: If not hand-crafted yet, build a standard predictable layout
        return this.buildStandardLayout(areaIdx, levelIdx, levelData, canvasHeight);
    },

    // ---------------------------------------------------------
    // HAND-CRAFTED LEVEL PRESETS
    // ---------------------------------------------------------
    presets: {
        "Area1_Level1": function(canvasHeight) {
            const floorY = canvasHeight - 60;
            return {
                length: 2500, // Short intro level
                platforms: [
                    { x: -100, y: floorY, w: 600, h: 60 }, // Starting floor
                    { x: 500, y: floorY, w: 1000, h: 60 }, // Main floor segment
                    { x: 700, y: floorY - 100, w: 150, h: 20 }, // Fall-through platform
                    { x: 1000, y: floorY - 150, w: 150, h: 20 }, // Higher platform
                    { x: 1600, y: floorY, w: 1500, h: 60 } // End floor
                ],
                enemies: [
                    { x: 800, y: floorY - 100 },
                    { x: 1200, y: floorY - 100 }
                ],
                drops: [
                    { x: 400, y: floorY - 200, type: "powerup", data: window.AREA_POWERUPS ? window.AREA_POWERUPS[0] : null },
                    { x: 1500, y: floorY - 200, type: "heart" }
                ]
            };
        }
        // You can add "Area1_Level2": function(canvasHeight) { ... } here later!
    },

    // ---------------------------------------------------------
    // AUTOMATIC SCALING FALLBACK (For levels you haven't built yet)
    // ---------------------------------------------------------
    buildStandardLayout: function(areaIdx, levelIdx, levelData, canvasHeight) {
        const floorY = canvasHeight - 60;
        
        // Area 1 = 2800px. Area 10 = 10000px (Roughly 3x longer)
        let levelLength = 2000 + (areaIdx * 800); 
        
        let layout = {
            length: levelLength,
            platforms: [],
            enemies: [],
            drops: []
        };

        // Standard boundaries
        layout.platforms.push({ x: -100, y: floorY, w: 600, h: 60 }); 
        layout.platforms.push({ x: levelLength - 800, y: floorY, w: 1600, h: 60 }); 
        
        // Build generic floors and platforms based on the scaled length
        let currentX = 500;
        while (currentX < levelLength - 800) {
            // Predictable pattern instead of random math
            if (currentX % 3 === 0 && !levelData.isAreaBoss && !levelData.hasMiniBoss) {
                layout.platforms.push({ x: currentX + 50, y: floorY - 150, w: 150, h: 20 });
                currentX += 350; 
            } else if (currentX % 2 === 0) {
                layout.platforms.push({ x: currentX, y: floorY - 60, w: 150, h: 120 }); // Wall block
                currentX += 150;
            } else {
                layout.platforms.push({ x: currentX, y: floorY, w: 400, h: 60 }); // Floor block
                currentX += 450;
            }
        }
        
        // Add upper tier platforms
        for(let i = 1; i < (levelLength / 800); i++) {
            layout.platforms.push({ x: 800 * i, y: floorY - 180, w: 150, h: 20 });
            layout.platforms.push({ x: 800 * i + 350, y: floorY - 250, w: 100, h: 20 });
        }

        // Generic Enemy Placements
        if (!levelData.isAreaBoss) {
            for(let i = 1; i < (levelLength / 600); i++) {
                layout.enemies.push({ x: 600 * i, y: floorY - 200 });
            }
        }

        // Standard Drops
        const areaPowerObj = window.AREA_POWERUPS ? window.AREA_POWERUPS[Math.min(areaIdx - 1, 9)] : null;
        if (levelData.isAreaBoss || levelData.hasMiniBoss) {
            layout.drops.push({ x: 300, y: floorY - 300, type: "powerup", data: areaPowerObj });
            layout.drops.push({ x: 500, y: floorY - 300, type: "heart" });
        } else {
            if (!levelData.noPowerups && areaPowerObj) {
                layout.drops.push({ x: 400, y: floorY - 300, type: "powerup", data: areaPowerObj });
            }
            layout.drops.push({ x: levelLength / 2, y: floorY - 300, type: "heart" }); 
        }

        return layout;
    }
};
