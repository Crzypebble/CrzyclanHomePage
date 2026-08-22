// js/levelLayouts.js
// Preset level designs and thematic styling. Auto-generation removed for strict level control.

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
        
        // 1. Check if the level has been hand-crafted
        if (this.presets[layoutId]) {
            return this.presets[layoutId](canvasHeight, levelData);
        }
        
        // 2. Strict Lockout: If not hand-crafted, boot the player back to menu.
        alert(`Area ${areaIdx} - Level ${levelIdx} is currently under construction!`);
        setTimeout(() => {
            if (window.quitGame) window.quitGame();
        }, 10);
        
        // Return a dummy layout just to prevent engine crashes before the quit executes
        return { 
            length: 800, 
            platforms: [{ x: 0, y: canvasHeight - 60, w: 800, h: 60 }], 
            enemies: [], 
            drops: [] 
        };
    },

    // ---------------------------------------------------------
    // HAND-CRAFTED PRESETS (Area 1 Complete)
    // ---------------------------------------------------------
    presets: {
        // Level 1 - Intro: Getting a feel for jumps and combat
        "Area1_Level1": function(canvasHeight, levelData) {
            const floorY = canvasHeight - 60;
            return {
                length: 4500,
                platforms: [
                    { x: -100, y: floorY, w: 800, h: 60 }, // Start
                    { x: 800, y: floorY - 120, w: 250, h: 20 }, // First hop
                    { x: 1200, y: floorY, w: 900, h: 60 }, // Main stretch
                    { x: 1400, y: floorY - 160, w: 200, h: 20 }, 
                    { x: 1800, y: floorY - 240, w: 200, h: 20 }, // High route
                    { x: 2200, y: floorY, w: 1000, h: 60 },
                    { x: 2500, y: floorY - 140, w: 300, h: 20 },
                    { x: 3400, y: floorY, w: 1200, h: 60 } // End platform
                ],
                enemies: [
                    { x: 1000, y: floorY - 100 },
                    { x: 1600, y: floorY - 220 },
                    { x: 2400, y: floorY - 100 },
                    { x: 2700, y: floorY - 200 }
                ],
                drops: [
                    { x: 500, y: floorY - 200, type: "powerup", data: window.AREA_POWERUPS ? window.AREA_POWERUPS[0] : null },
                    { x: 2600, y: floorY - 220, type: "heart" }
                ]
            };
        },

        // Level 2 - Mini-Boss: Longer run ending in a dedicated mini-boss arena
        "Area1_Level2": function(canvasHeight, levelData) {
            const floorY = canvasHeight - 60;
            return {
                length: 6000,
                platforms: [
                    { x: -100, y: floorY, w: 600, h: 60 }, // Start
                    { x: 650, y: floorY - 80, w: 200, h: 20 }, 
                    { x: 1000, y: floorY - 150, w: 200, h: 20 },
                    { x: 1350, y: floorY, w: 800, h: 60 }, 
                    { x: 1600, y: floorY - 120, w: 150, h: 20 },
                    { x: 1800, y: floorY - 240, w: 150, h: 20 }, 
                    { x: 2300, y: floorY, w: 500, h: 60 },
                    { x: 2950, y: floorY, w: 500, h: 60 },
                    { x: 3600, y: floorY - 100, w: 300, h: 20 },
                    // 4500 to 6000 is the flat Mini-Boss Arena
                    { x: 4500, y: floorY, w: 1600, h: 60 }, 
                    { x: 4900, y: floorY - 150, w: 200, h: 20 }, // Tactical platform 1
                    { x: 5400, y: floorY - 150, w: 200, h: 20 }  // Tactical platform 2
                ],
                enemies: [
                    { x: 1500, y: floorY - 100 },
                    { x: 1850, y: floorY - 300 },
                    { x: 2500, y: floorY - 100 },
                    { x: 3100, y: floorY - 100 },
                    { x: 3750, y: floorY - 150 }
                ],
                drops: [
                    { x: 1050, y: floorY - 250, type: "powerup", data: window.AREA_POWERUPS ? window.AREA_POWERUPS[0] : null },
                    { x: 3700, y: floorY - 200, type: "heart" },
                    // Drops right before the mini-boss arena
                    { x: 4600, y: floorY - 200, type: "heart" }
                ]
            };
        },

        // Level 3 - Main Boss Arena: Short, tactical enclosure
        "Area1_Level3": function(canvasHeight, levelData) {
            const floorY = canvasHeight - 60;
            return {
                length: 1500, // Small enclosed arena
                platforms: [
                    // One giant solid floor for the fight
                    { x: -100, y: floorY, w: 2000, h: 60 },
                    // Tactical dodge platforms
                    { x: 400, y: floorY - 150, w: 200, h: 20 },
                    { x: 900, y: floorY - 220, w: 200, h: 20 }
                ],
                enemies: [
                    // No normal enemies here, engine spawns the Main Area Boss automatically
                ],
                drops: [
                    // Give the player tools to win right at the start
                    { x: 300, y: floorY - 100, type: "powerup", data: window.AREA_POWERUPS ? window.AREA_POWERUPS[0] : null },
                    { x: 500, y: floorY - 100, type: "heart" }
                ]
            };
        }
    }
};
