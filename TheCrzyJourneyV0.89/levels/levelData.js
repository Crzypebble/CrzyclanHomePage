// levels/levelData.js
// The Lore, Powerups, and Dynamic Level Generator

window.GAME_LORE = "The Warlords of the Digital Void have stolen the Golden Skull. Retrieve it.";

// The 10 Unique Powerups! Area 9 introduces the Glock for late-game bosses.
window.AREA_POWERUPS = [
    { type: "fire", icon: "🔥", color: "#ff4400", projSpeed: 12 },      
    { type: "ice", icon: "❄️", color: "#00ccff", projSpeed: 10 },       
    { type: "earth", icon: "🪨", color: "#8b4513", projSpeed: 14 },     
    { type: "wind", icon: "🌪️", color: "#d3d3d3", projSpeed: 18 },      
    { type: "lightning", icon: "⚡", color: "#ffff00", projSpeed: 20 }, 
    { type: "poison", icon: "🧪", color: "#32cd32", projSpeed: 8 },     
    { type: "shadow", icon: "🌑", color: "#4b0082", projSpeed: 15 },    
    { type: "light", icon: "☀️", color: "#ffdf00", projSpeed: 22 },     
    { type: "glock", icon: "🔫", color: "#a0a0a0", projSpeed: 30 },     // The Glock!
    { type: "void", icon: "🌌", color: "#1a1a1a", projSpeed: 25 }       
];

window.GAME_ZONES = [];
const levelCounts = [4, 6, 8, 10, 10, 12, 12, 14, 14, 15];
const areaNames = [
    "The Outskirts", "The Red Wastes", "The Toxic Swamps", "The Crystal Caverns", "The Ashen Peaks", 
    "The Neon Ruins", "The Forgotten Catacombs", "The Shattered Skyway", "The Obsidian Fortress", "The Void Core"
];

for(let a = 1; a <= 10; a++) {
    let numLevels = levelCounts[a - 1];
    let levels = [];
    
    for(let l = 1; l <= numLevels; l++) {
        let isAreaBoss = (l === numLevels);
        let hasMiniBoss = false;
        
        if (!isAreaBoss) {
            if (numLevels === 15 && (l === 5 || l === 10)) hasMiniBoss = true; 
            else if (numLevels % 2 === 0 && l === (numLevels / 2)) hasMiniBoss = true; 
            else if (numLevels === 5 && l === 3) hasMiniBoss = true; 
        }
        
        // Every Even-Numbered level that ISN'T a boss gets NO POWERUPS!
        let hasNoPowerups = false;
        if (!isAreaBoss && !hasMiniBoss && l % 2 === 0) {
            hasNoPowerups = true; 
        }

        let name = "Level " + l;
        if (hasMiniBoss) name = "Mini-Boss";
        if (isAreaBoss) name = "Area Boss";
        if (a === 10 && isAreaBoss) name = "VOID LORD"; 
        
        levels.push({
            id: `${a}-${l}`,
            name: name,
            hasMiniBoss: hasMiniBoss,
            isAreaBoss: isAreaBoss,
            stompImmune: isAreaBoss, 
            noPowerups: hasNoPowerups, 
            length: isAreaBoss ? 4000 : 2500 + (l * 300) 
        });
    }
    
    window.GAME_ZONES.push({
        areaIndex: a,
        areaName: `Area ${a}: ${areaNames[a-1]}`,
        bgUrl: `assets/backgrounds/area${a}_bg.jpg`, 
        miniBossBgUrl: `assets/backgrounds/area${a}_miniboss_bg.jpg`,
        bossBgUrl: `assets/backgrounds/area${a}_boss_bg.jpg`,
        musicUrl: `assets/audio/music/area${a}.mp3`,  
        miniBossMusicUrl: `assets/audio/music/area${a}_miniboss.mp3`, 
        bossMusicUrl: `assets/audio/music/area${a}_boss.mp3`,
        levels: levels
    });
}