document.addEventListener("DOMContentLoaded", async () => {
  // UI Elements
  const addUserForm = document.getElementById("add-user-form");
  const newUserNameInput = document.getElementById("new-user-name");
  const usersListEl = document.getElementById("users-list");
  const userCountLabel = document.getElementById("user-count-label");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");

  const chkShowOverlay = document.getElementById("chk-show-overlay");
  const chkAlwaysOnTop = document.getElementById("chk-always-on-top");
  const chkClickThrough = document.getElementById("chk-click-through");
  const opacityRadios = document.querySelectorAll('input[name="opacity"]');

  const btnCenterOverlay = document.getElementById("btn-center-overlay");
  const btnToggleOverlay = document.getElementById("btn-toggle-overlay");
  const btnQuitApp = document.getElementById("btn-quit-app");

  let localUsers = [];

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Render the list of user names
  function renderUsersList(users) {
    localUsers = users || [];
    userCountLabel.textContent = `Users (${localUsers.length})`;
    usersListEl.innerHTML = "";

    localUsers.forEach((user, index) => {
      const li = document.createElement("li");
      li.className = "user-item";

      const infoDiv = document.createElement("div");
      infoDiv.className = "user-item-info";

      const avatarDiv = document.createElement("div");
      avatarDiv.className = "user-avatar-mini";
      avatarDiv.textContent = getInitials(user);

      // Distinct subtle gradient colors based on name hash
      let hash = 0;
      for (let i = 0; i < user.length; i++) {
        hash = user.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue1 = Math.abs(hash % 360);
      const hue2 = (hue1 + 40) % 360;
      avatarDiv.style.background = `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 75%, 45%))`;

      const nameSpan = document.createElement("span");
      nameSpan.className = "user-name-text";
      nameSpan.textContent = user;

      infoDiv.appendChild(avatarDiv);
      infoDiv.appendChild(nameSpan);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "user-item-actions";

      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-icon-action";
      deleteBtn.title = `Remove ${user}`;
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;

      deleteBtn.addEventListener("click", () => {
        removeUser(index);
      });

      actionsDiv.appendChild(deleteBtn);
      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);
      usersListEl.appendChild(li);
    });
  }

  // Add user handler
  addUserForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const name = newUserNameInput.value.trim();
    if (!name) return;

    localUsers.push(name);
    newUserNameInput.value = "";
    renderUsersList(localUsers);

    if (window.electronAPI && window.electronAPI.updateUsers) {
      window.electronAPI.updateUsers(localUsers);
    }
  });

  // Remove user handler
  function removeUser(index) {
    localUsers.splice(index, 1);
    renderUsersList(localUsers);

    if (window.electronAPI && window.electronAPI.updateUsers) {
      window.electronAPI.updateUsers(localUsers);
    }
  }

  // Reset to defaults
  btnResetDefaults.addEventListener("click", () => {
    const defaultUsers = [
      "Streamer 1",
      "Alex Live",
      "Nova Gamer",
      "Jordan Pro",
    ];
    renderUsersList(defaultUsers);
    if (window.electronAPI && window.electronAPI.updateUsers) {
      window.electronAPI.updateUsers(defaultUsers);
    }
  });

  // Checkbox handlers
  chkShowOverlay.addEventListener("change", () => {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        overlayVisible: chkShowOverlay.checked,
      });
    }
  });

  chkAlwaysOnTop.addEventListener("change", () => {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        isAlwaysOnTop: chkAlwaysOnTop.checked,
      });
    }
  });

  chkClickThrough.addEventListener("change", () => {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        isIgnoringMouseEvents: chkClickThrough.checked,
      });
    }
  });

  // Opacity radio handlers
  opacityRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (
        radio.checked &&
        window.electronAPI &&
        window.electronAPI.updateSettings
      ) {
        const opacityVal = parseFloat(radio.value);
        window.electronAPI.updateSettings({ currentOpacity: opacityVal });
      }
    });
  });

  // Quick Action buttons
  btnCenterOverlay.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.centerOverlay) {
      window.electronAPI.centerOverlay();
    }
  });

  btnToggleOverlay.addEventListener("click", () => {
    chkShowOverlay.checked = !chkShowOverlay.checked;
    chkShowOverlay.dispatchEvent(new Event("change"));
  });

  btnQuitApp.addEventListener("click", () => {
    if (window.electronAPI && window.electronAPI.quitApp) {
      window.electronAPI.quitApp();
    }
  });

  // Sync state from main process
  function applySettingsToUI(settings) {
    if (!settings) return;

    if (typeof settings.overlayVisible === "boolean") {
      chkShowOverlay.checked = settings.overlayVisible;
    }
    if (typeof settings.isAlwaysOnTop === "boolean") {
      chkAlwaysOnTop.checked = settings.isAlwaysOnTop;
    }
    if (typeof settings.isIgnoringMouseEvents === "boolean") {
      chkClickThrough.checked = settings.isIgnoringMouseEvents;
    }
    if (typeof settings.currentOpacity === "number") {
      opacityRadios.forEach((radio) => {
        radio.checked =
          Math.abs(parseFloat(radio.value) - settings.currentOpacity) < 0.05;
      });
    }
    if (Array.isArray(settings.users)) {
      renderUsersList(settings.users);
    }
  }

  // Load initial settings
  if (window.electronAPI && window.electronAPI.getSettings) {
    try {
      const initialSettings = await window.electronAPI.getSettings();
      applySettingsToUI(initialSettings);
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  }

  // Listen for external updates (e.g., changes from tray or other sources)
  if (window.electronAPI && window.electronAPI.onSettingsUpdated) {
    window.electronAPI.onSettingsUpdated((newSettings) => {
      applySettingsToUI(newSettings);
    });
  }
});
