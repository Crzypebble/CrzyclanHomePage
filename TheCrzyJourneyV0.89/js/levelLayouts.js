// js/levelLayouts.js
// Preset level designs, thematic styling, and length scaling

window.LevelLayouts = {
    // Area Color Schemes for Platforms
    areaThemes: {
        1: { top: "#4CAF50", body: "#3E2723", border: "#2E7D32" }, // Forest/Grass
        2: { top: "#FF5722", body: "#260B08", border: "#D84315" }, // Red Wastes
        3: { top: "#00BCD4", body: "#122329", border: "#00838F" }, // Ice/Crystal
        4: { top: "#9C27B0", body: "#1A0923", border: "#6A1B9A" }, // Void/Purple
        5: { top: "#FFEB3B", body: "#2A2300", border: "#FBC02D" }, // Desert Gold
        6: { top: "#E91E63", body: "#2B0612", border: "#C2185B" }, // Cyber Neon
        7: { top: "#607D8B", body: "#1B262C", border: "#455A64" }, // Iron Stronghold
        8: { top: "#795548", body: "#1F140E", border: "#4E342E" }, // Cavern
        9: { top: "#FF9800", body: "#2D1B00", border: "#EF6C00" }, // Volcanic
        10: { top: "#00E676", body: "#0A291B", border: "#00A152" }  // Toxic Core
    },

    getLayout: function(areaIdx, levelIdx, levelData, canvasHeight) {
        let layoutId = `Area${areaIdx}_Level${levelIdx}`;
        
        if (this.presets[layoutId]) {
            return this.presets[layoutId](canvasHeight);
        }
        
        return this.buildStandardLayout(areaIdx, levelIdx, levelData, canvasHeight);
    },

    // ---------------------------------------------------------
    // HAND-CRAFTED PRESETS
    // ---------------------------------------------------------
    presets: {
        "Area1_Level1": function(canvasHeight) {
            const floorY = canvasHeight - 60;
            return {
                length: 4500, // Stretched out intro level
                platforms: [
                    { x: -100, y: floorY, w: 800, h: 60 },
                    { x: 800, y: floorY - 120, w: 250, h: 20 },
                    { x: 1200, y: floorY, w: 900, h: 60 },
                    { x: 1400, y: floorY - 160, w: 200, h: 20 },
                    { x: 1800, y: floorY - 240, w: 200, h: 20 },
                    { x: 2200, y: floorY, w: 1000, h: 60 },
                    { x: 2500, y: floorY - 140, w: 300, h: 20 },
                    { x: 3300, y: floorY, w: 1400, h: 60 }
                ],
                enemies: [
                    { x: 1000, y: floorY - 100 },
                    { x: 1500, y: floorY - 220 },
                    { x: 2400, y: floorY - 100 },
                    { x: 2700, y: floorY - 200 }
                ],
                drops: [
                    { x: 500, y: floorY - 200, type: "powerup", data: window.AREA_POWERUPS ? window.AREA_POWERUPS[0] : null },
                    { x: 2600, y: floorY - 220, type: "heart" }
                ]
            };
        }
    },

    // ---------------------------------------------------------
    // AUTOMATIC SCALING FALLBACK
    // ---------------------------------------------------------
    buildStandardLayout: function(areaIdx, levelIdx, levelData, canvasHeight) {
        const floorY = canvasHeight - 60;
        
        // Area 1 starts at 5,000px, Area 10 reaches 15,000px (~3x)
        let levelLength = 4000 + (areaIdx * 1100); 
        
        let layout = {
            length: levelLength,
            platforms: [],
            enemies: [],
            drops: []
        };

        // Starting and Ending Platforms
        layout.platforms.push({ x: -100, y: floorY, w: 800, h: 60 }); 
        layout.platforms.push({ x: levelLength - 1000, y: floorY, w: 1800, h: 60 }); 

        let currentX = 800;
        let step = 0;
        
        while (currentX < levelLength - 1000) {
            step++;
            if (step % 4 === 0 && !levelData.isAreaBoss && !levelData.hasMiniBoss) {
                // Gap with high platform
                layout.platforms.push({ x: currentX + 100, y: floorY - 160, w: 220, h: 20 });
                currentX += 500; 
            } else if (step % 3 === 0) {
                // Step-up structure
                layout.platforms.push({ x: currentX, y: floorY, w: 350, h: 60 });
                layout.platforms.push({ x: currentX + 100, y: floorY - 120, w: 150, h: 20 });
                currentX += 450;
            } else {
                // Main floor block
                layout.platforms.push({ x: currentX, y: floorY, w: 600, h: 60 });
                currentX += 650;
            }
        }

        // Add regular upper platforming tiers
        for(let i = 1; i < (levelLength / 700); i++) {
            layout.platforms.push({ x: 700 * i, y: floorY - 180, w: 180, h: 20 });
            if (i % 2 === 0) {
                layout.platforms.push({ x: 700 * i + 250, y: floorY - 270, w: 140, h: 20 });
            }
        }

        // Enemies pacing
        if (!levelData.isAreaBoss) {
            for(let i = 1; i < (levelLength / 500); i++) {
                layout.enemies.push({ x: 500 * i + 200, y: floorY - 200 });
            }
        }

        // Powerups / Hearts
        const areaPowerObj = window.AREA_POWERUPS ? window.AREA_POWERUPS[Math.min(areaIdx - 1, 9)] : null;
        if (levelData.isAreaBoss || levelData.hasMiniBoss) {
            layout.drops.push({ x: 300, y: floorY - 300, type: "powerup", data: areaPowerObj });
            layout.drops.push({ x: 600, y: floorY - 300, type: "heart" });
        } else {
            if (!levelData.noPowerups && areaPowerObj) {
                layout.drops.push({ x: 500, y: floorY - 300, type: "powerup", data: areaPowerObj });
            }
            layout.drops.push({ x: levelLength / 2, y: floorY - 300, type: "heart" }); 
        }

        return layout;
    }
};
