// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const avatarsContainer = document.getElementById("avatars-container");
  const overlayRoot = document.getElementById("overlay-root");
  const btnOpenSettings = document.getElementById("btn-open-settings");

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Generate pleasant gradient colors for avatar based on name hash
  function getAvatarGradient(name) {
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 52%), hsl(${hue2}, 80%, 42%))`;
  }

  // Render multiple circle avatars
  function renderAvatars(users) {
    avatarsContainer.innerHTML = "";
    if (!users || users.length === 0) return;

    users.forEach((userName) => {
      const card = document.createElement("div");
      card.className = "avatar-card";
      card.title = `${userName} - Live Streamer`;

      const frame = document.createElement("div");
      frame.className = "circle-frame";

      const inner = document.createElement("div");
      inner.className = "avatar-inner";
      inner.style.background = getAvatarGradient(userName);
      inner.textContent = getInitials(userName);

      const statusBadge = document.createElement("div");
      statusBadge.className = "status-badge";
      statusBadge.title = "Online & Streaming";

      frame.appendChild(inner);
      frame.appendChild(statusBadge);

      const nameTag = document.createElement("div");
      nameTag.className = "user-name-tag";
      nameTag.textContent = userName;

      card.appendChild(frame);
      card.appendChild(nameTag);
      avatarsContainer.appendChild(card);
    });
  }

  // Open settings button
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.openSettings) {
        window.electronAPI.openSettings();
      }
    });
  }

  // Double click to toggle pin / always on top
  overlayRoot.addEventListener("dblclick", async (e) => {
    // Avoid double clicking specific buttons
    if (e.target.closest("button")) return;
    if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
      const isPinned = await window.electronAPI.toggleAlwaysOnTop();
      overlayRoot.style.transform = isPinned ? "scale(1.02)" : "scale(1)";
      setTimeout(() => {
        overlayRoot.style.transform = "scale(1)";
      }, 300);
    }
  });

  // Right-click opens the Settings window
  overlayRoot.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.openSettings) {
      window.electronAPI.openSettings();
    }
  });

  // Initial load
  if (window.electronAPI && window.electronAPI.getUsers) {
    try {
      const users = await window.electronAPI.getUsers();
      renderAvatars(users);
    } catch (err) {
      console.error("Failed to load users:", err);
    }
  }

  // Listen for live updates
  if (window.electronAPI && window.electronAPI.onUsersUpdated) {
    window.electronAPI.onUsersUpdated((updatedUsers) => {
      renderAvatars(updatedUsers);
    });
  }
});
