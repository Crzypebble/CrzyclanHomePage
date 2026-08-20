// js/areas.js
let highestUnlockedAreaIndex = 1; 
let highestUnlockedLevelIndex = 1; 

document.addEventListener("DOMContentLoaded", () => {
  loadProgress();
  renderLevelSelect();
});

function loadProgress() {
  const savedA = localStorage.getItem("crzy_area");
  const savedL = localStorage.getItem("crzy_level");
  if(savedA) highestUnlockedAreaIndex = parseInt(savedA);
  if(savedL) highestUnlockedLevelIndex = parseInt(savedL);
}

function saveProgress(areaIdx, levelIdx) {
  if (areaIdx > highestUnlockedAreaIndex || (areaIdx === highestUnlockedAreaIndex && levelIdx > highestUnlockedLevelIndex)) {
      highestUnlockedAreaIndex = areaIdx;
      highestUnlockedLevelIndex = levelIdx;
      localStorage.setItem("crzy_area", areaIdx);
      localStorage.setItem("crzy_level", levelIdx);
  }
}

window.applySaveCode = function() {
  const input = document.getElementById("savecode-input").value.trim().toUpperCase();
  const msg = document.getElementById("save-code-msg");
  
  const match = input.match(/^CRZY-(\d+)-(\d+)$/);
  if (match) {
      const a = parseInt(match[1]);
      const l = parseInt(match[2]);
      
      const targetArea = window.GAME_ZONES.find(z => z.areaIndex === a);
      const maxLevels = targetArea ? targetArea.levels.length : 0;

      if (a >= 1 && a <= 10 && l >= 1 && l <= maxLevels) {
          saveProgress(a, l);
          renderLevelSelect();
          msg.textContent = `Success! Unlocked up to Area ${a}, Level ${l}.`;
          msg.style.color = "#00ff00";
      } else {
          msg.textContent = "Invalid level code.";
          msg.style.color = "red";
      }
  } else {
      msg.textContent = "Invalid format. Expected CRZY-X-X";
      msg.style.color = "red";
  }
  
  setTimeout(() => msg.textContent = "", 3000);
};

function renderLevelSelect() {
  const areasContainer = document.getElementById("areas-container");
  if (!areasContainer) return;
  areasContainer.innerHTML = `<p style="color: #aaa; margin-bottom: 30px; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.5;">${window.GAME_LORE}</p>`; 

  window.GAME_ZONES.forEach(area => {
    const areaTitle = document.createElement("h3");
    areaTitle.style.color = (area.areaIndex > highestUnlockedAreaIndex) ? "#555" : "#ff0000";
    areaTitle.style.fontSize = "1.8rem";
    areaTitle.style.margin = "40px 0 15px 0";
    areaTitle.textContent = area.areaName;
    areasContainer.appendChild(areaTitle);

    const levelGrid = document.createElement("div");
    levelGrid.style.display = "flex";
    levelGrid.style.flexWrap = "wrap";
    levelGrid.style.justifyContent = "center";
    levelGrid.style.gap = "15px";
    levelGrid.style.maxWidth = "700px"; 
    levelGrid.style.margin = "0 auto 30px auto";

    let lIndex = 1;
    area.levels.forEach(level => {
      const btn = document.createElement("button");
      btn.className = "menu-tab";
      btn.style.width = "30%"; 
      btn.style.margin = "0"; 
      
      const isUnlocked = (area.areaIndex < highestUnlockedAreaIndex) || 
                         (area.areaIndex === highestUnlockedAreaIndex && lIndex <= highestUnlockedLevelIndex);

      if (!isUnlocked) {
          btn.disabled = true;
          btn.textContent = "🔒 Locked";
      } else {
          if (level.isAreaBoss) {
            btn.style.border = "2px solid #ff0000"; btn.style.width = "100%"; btn.textContent = `💀 ${level.name} 💀`;
          } else if (level.hasMiniBoss) {
            btn.style.color = "#ffaa00"; btn.textContent = `⚔️ ${level.name}`;
          } else {
            btn.textContent = level.name;
          }
      }
      
      const passLevel = lIndex;
      
      btn.onclick = () => {
        if (typeof startGameEngine === "function") {
           startGameEngine(level, area, passLevel);
        } else {
           alert("Engine script missing!");
        }
      };
      
      levelGrid.appendChild(btn);
      lIndex++;
    });

    areasContainer.appendChild(levelGrid);
  });
}