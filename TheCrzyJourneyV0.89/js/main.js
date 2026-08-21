// js/main.js
document.addEventListener("DOMContentLoaded", () => {
    const sections = document.querySelectorAll(".menu-section");
    const menuMusic = document.getElementById("menu-music");

    function showSection(id) {
        sections.forEach(section => {
            section.style.display = section.id === id ? "block" : "none";
        });
    }

    // 1. Initial State: Show Disclaimer
    showSection("disclaimer-screen");

    // 2. Handle Disclaimer Accept Button
    const acceptBtn = document.getElementById("accept-btn");
    if (acceptBtn) {
        acceptBtn.addEventListener("click", () => {
            if (menuMusic) {
                menuMusic.volume = 0.5; 
                menuMusic.play().catch(e => console.log("Audio block error:", e));
            }
            document.body.classList.add("show-bg");
            showSection("main-menu");
        });
    }

    // 3. Handle all other menu navigation tabs
    document.addEventListener("click", e => {
        const tab = e.target.closest(".menu-tab");
        if (!tab) return;
        const target = tab.dataset.target;
        if (target) showSection(target);
    });

    // 4. MENU CONTROLLER SUPPORT (D-Pad Navigation)
    let lastPadTime = 0;
    let currentBtnIdx = 0;

    function pollMenuGamepad() {
        const gp = navigator.getGamepads ? navigator.getGamepads()[0] : null;
        
        // Only run polling if it's been 200ms since last input to prevent scrolling too fast
        if (gp && Date.now() - lastPadTime > 200) {
            
            // Grab all visible interactive elements in the currently active menu section
            const visibleBtns = Array.from(document.querySelectorAll('.menu-section[style*="display: block"] button, .menu-section[style*="display: block"] select, #game-over-screen[style*="display: block"] button, #level-complete-screen[style*="display: block"] button')).filter(b => b.offsetParent !== null);
            
            if (visibleBtns.length > 0) {
                // D-Pad Down or Left Stick Down
                if (gp.axes[1] > 0.5 || gp.buttons[13]?.pressed) {
                    currentBtnIdx = (currentBtnIdx + 1) % visibleBtns.length;
                    visibleBtns[currentBtnIdx].focus();
                    lastPadTime = Date.now();
                } 
                // D-Pad Up or Left Stick Up
                else if (gp.axes[1] < -0.5 || gp.buttons[12]?.pressed) {
                    currentBtnIdx = (currentBtnIdx - 1 + visibleBtns.length) % visibleBtns.length;
                    visibleBtns[currentBtnIdx].focus();
                    lastPadTime = Date.now();
                } 
                // X / A Button to Select
                else if (gp.buttons[0]?.pressed) {
                    visibleBtns[currentBtnIdx].click();
                    lastPadTime = Date.now();
                }
            }
        }
        requestAnimationFrame(pollMenuGamepad);
    }
    pollMenuGamepad();
});
