// js/controls.js
// Modified to ONLY listen for Controller Bindings

const DEFAULT_BINDINGS = {
  moveLeft: "GP0:Button14",
  moveRight: "GP0:Button15",
  moveUp: "GP0:Button12",
  moveDown: "GP0:Button13",
  jump: "GP0:Button0",
  attack: "GP0:Button2",
  pause: "GP0:Button9"
};

let bindings = loadJSON("bindings", DEFAULT_BINDINGS);
const controlsList = document.getElementById("controls-list");
const controllerStatus = document.getElementById("controller-status");

let pollingId = null;
let rebindAction = null;
let rebindValueEl = null;
let rebindButtonEl = null;
let rebindGamepadStates = new Map();

function loadJSON(key, fallback) {
  try {
    const saved = JSON.parse(localStorage.getItem(key));
    if (!saved) return structuredCloneSafe(fallback);
    return { ...structuredCloneSafe(fallback), ...saved };
  } catch (_) {
    return structuredCloneSafe(fallback);
  }
}

function structuredCloneSafe(obj) { return JSON.parse(JSON.stringify(obj)); }
function saveBindings() { localStorage.setItem("bindings", JSON.stringify(bindings)); }

function hasGamepad() {
  const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
  return gps.length > 0;
}

function prettyBinding(value) {
  const match = /^GP(\d+):Button(\d+)$/.exec(value);
  if (match) return `Controller ${Number(match[1]) + 1} • Button ${Number(match[2]) + 1}`;
  return "Not Bound";
}

function actionName(action) {
  return action.replace(/([A-Z])/g, " $1").replace(/^./, c => c.toUpperCase());
}

function updateControllerStatus() {
  if (controllerStatus) controllerStatus.textContent = `Controller: ${hasGamepad() ? "Connected" : "Not Connected"}`;
}
window.addEventListener("gamepadconnected", updateControllerStatus);
window.addEventListener("gamepaddisconnected", updateControllerStatus);

function renderBindingsList() {
  if (!controlsList) return;
  controlsList.innerHTML = "";

  Object.entries(bindings).forEach(([action, key]) => {
    const row = document.createElement("div");
    row.className = "control-row";

    const label = document.createElement("div");
    label.className = "control-label";
    label.textContent = actionName(action);

    const value = document.createElement("div");
    value.className = "binding-value";
    value.textContent = prettyBinding(key);

    const btn = document.createElement("button");
    btn.className = "rebind-button";
    btn.textContent = "Rebind";
    btn.type = "button";

    btn.addEventListener("click", e => {
      e.preventDefault();
      startRebind(action, value, btn);
    });

    row.appendChild(label);
    row.appendChild(value);
    row.appendChild(btn);
    controlsList.appendChild(row);
  });
}

function startRebind(action, valueEl, btnEl) {
  if (rebindAction) return;

  rebindAction = action;
  rebindValueEl = valueEl;
  rebindButtonEl = btnEl;

  valueEl.textContent = "Press controller button...";
  valueEl.style.background = "rgba(120, 0, 0, .75)";
  btnEl.textContent = "Cancel";
  btnEl.classList.add("confirm");

  rebindGamepadStates.clear();

  const poll = () => {
    const gps = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
    
    for (const gp of gps) {
      for (let i = 0; i < gp.buttons.length; i++) {
        const pressed = !!gp.buttons[i]?.pressed;
        const wasPressed = rebindGamepadStates.get(`${gp.index}:${i}`) || false;

        if (pressed && !wasPressed) {
          bindings[action] = `GP${gp.index}:Button${i}`;
          finishRebind(true);
          return;
        }
        rebindGamepadStates.set(`${gp.index}:${i}`, pressed);
      }
    }
    pollingId = requestAnimationFrame(poll);
  };
  pollingId = requestAnimationFrame(poll);
}

function finishRebind(save) {
  if (!rebindAction) return;
  if (save) saveBindings();
  if (pollingId) { cancelAnimationFrame(pollingId); pollingId = null; }

  rebindGamepadStates.clear();
  rebindAction = null;
  rebindValueEl = null;
  rebindButtonEl = null;

  renderBindingsList();
}

document.addEventListener("DOMContentLoaded", () => {
  renderBindingsList();
  updateControllerStatus();
});

window.getAllControlBindings = function() {
  return structuredCloneSafe(bindings);
};