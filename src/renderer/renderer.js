// Renderer process script
document.addEventListener("DOMContentLoaded", () => {
  const circleContainer = document.getElementById("circle-container");

  // Double click toggles pin (always on top) or gives visual feedback
  circleContainer.addEventListener("dblclick", async () => {
    if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
      const isPinned = await window.electronAPI.toggleAlwaysOnTop();
      circleContainer.style.filter = isPinned
        ? "drop-shadow(0 0 12px #38bdf8)"
        : "none";
      setTimeout(() => {
        circleContainer.style.filter = "none";
      }, 600);
    }
  });

  // Right-click can trigger hide or custom behavior
  circleContainer.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    // System context menu is accessible via the system tray icon
  });
});
