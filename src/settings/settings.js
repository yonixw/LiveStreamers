document.addEventListener("DOMContentLoaded", async () => {
  // UI Elements - Form & Streamers List
  const addStreamerForm = document.getElementById("add-streamer-form");
  const newStreamerUrlInput = document.getElementById("new-streamer-url");
  const newStreamerNameInput = document.getElementById("new-streamer-name");
  const newStreamerPlatformSelect = document.getElementById(
    "new-streamer-platform",
  );
  const streamersListEl = document.getElementById("streamers-list");
  const streamerCountLabel = document.getElementById("streamer-count-label");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  const btnCheckAll = document.getElementById("btn-check-all");
  const presetButtons = document.querySelectorAll(".btn-preset");

  // UI Elements - Controls
  const chkShowOverlay = document.getElementById("chk-show-overlay");
  const chkAlwaysOnTop = document.getElementById("chk-always-on-top");
  const chkClickThrough = document.getElementById("chk-click-through");
  const opacityRadios = document.querySelectorAll('input[name="opacity"]');

  const btnCenterOverlay = document.getElementById("btn-center-overlay");
  const btnToggleOverlay = document.getElementById("btn-toggle-overlay");
  const btnQuitApp = document.getElementById("btn-quit-app");
  const btnOpenDevTools = document.getElementById("btn-open-devtools");
  const btnClearLogs = document.getElementById("btn-clear-logs");
  const logTerminal = document.getElementById("log-terminal");

  let localStreamers = [];
  // Track pet task states for each user: null | 'running' | 'success' | 'error'
  const petTaskStates = new Map();

  // Logging helper: logs to UI log terminal, browser DevTools console, and Node CLI terminal
  function appendLog(message, type = "info", tag = "LiveCheck") {
    const timestamp = new Date().toLocaleTimeString();

    // 1. Browser DevTools console
    if (type === "error") {
      console.error(`[${tag} ${timestamp}]`, message);
    } else {
      console.log(`[${tag} ${timestamp}]`, message);
    }

    // 2. Main process Node CLI terminal via IPC
    if (window.electronAPI && window.electronAPI.logTerminal) {
      window.electronAPI.logTerminal(tag, message, type === "error");
    }

    // 3. In-app UI log terminal
    if (logTerminal) {
      const entry = document.createElement("div");
      entry.className = `log-entry log-${type}`;

      const timeSpan = document.createElement("span");
      timeSpan.className = "log-time";
      timeSpan.textContent = `[${timestamp}]`;

      const tagSpan = document.createElement("span");
      tagSpan.className = "log-tag";
      tagSpan.textContent = `[${tag}]`;

      const msgSpan = document.createElement("span");
      msgSpan.className = "log-msg";
      msgSpan.textContent = message;

      entry.appendChild(timeSpan);
      entry.appendChild(tagSpan);
      entry.appendChild(msgSpan);
      logTerminal.appendChild(entry);
      logTerminal.scrollTop = logTerminal.scrollHeight;
    }
  }

  // Clear log terminal
  if (btnClearLogs) {
    btnClearLogs.addEventListener("click", () => {
      if (logTerminal) {
        logTerminal.innerHTML = `
          <div class="log-entry system-log">
            <span class="log-time">[System]</span>
            <span class="log-msg">Logs cleared.</span>
          </div>
        `;
      }
    });
  }

  // Toggle DevTools
  if (btnOpenDevTools) {
    btnOpenDevTools.addEventListener("click", () => {
      if (window.electronAPI && window.electronAPI.toggleDevTools) {
        window.electronAPI.toggleDevTools();
      }
    });
  }

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Helper to detect platform
  function detectPlatform(url) {
    if (!url) return "other";
    const lower = url.toLowerCase();
    if (lower.includes("kick.com")) return "kick";
    if (lower.includes("twitch.tv")) return "twitch";
    if (lower.includes("youtube.com") || lower.includes("youtu.be"))
      return "youtube";
    return "other";
  }

  // Format number of viewers (e.g. 1.5k)
  function formatViewerCount(num) {
    if (num === null || num === undefined) return "";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return String(num);
  }

  // Platform badges styling
  function getPlatformBadge(platform) {
    const plat = (platform || "other").toLowerCase();
    switch (plat) {
      case "youtube":
        return `<span class="platform-pill pill-youtube">YouTube</span>`;
      case "twitch":
        return `<span class="platform-pill pill-twitch">Twitch</span>`;
      case "kick":
        return `<span class="platform-pill pill-kick">Kick</span>`;
      default:
        return `<span class="platform-pill pill-other">Web</span>`;
    }
  }

  // Pet Avatar Task - Executed on Node.js Side
  async function runPetAvatarTask(userName, itemElement) {
    petTaskStates.set(userName, "running");
    updateItemPetTaskUI(itemElement, userName);

    appendLog(
      `[${userName}] Start Sleep - Dispatched to Node.js backend (2s async task)...`,
      "info",
      "PetTask",
    );

    try {
      if (window.electronAPI && window.electronAPI.runPetAvatarTask) {
        const result = await window.electronAPI.runPetAvatarTask(userName);

        if (result.success) {
          petTaskStates.set(userName, "success");
          updateItemPetTaskUI(itemElement, userName);
          appendLog(
            `[${userName}] End Sleep - Success! [Node.js Crypto Random: ${result.cryptoRandom}]`,
            "success",
            "PetTask",
          );
        } else {
          petTaskStates.set(userName, "error");
          updateItemPetTaskUI(itemElement, userName);
          appendLog(
            `[${userName}] Error sleep - ${result.error} [Node.js Crypto Random: ${result.cryptoRandom}]`,
            "error",
            "PetTask",
          );
        }
      }
    } catch (err) {
      petTaskStates.set(userName, "error");
      updateItemPetTaskUI(itemElement, userName);
      appendLog(
        `[${userName}] Error sleep - ${err.message}`,
        "error",
        "PetTask",
      );
    }
  }

  function updateItemPetTaskUI(itemElement, userName) {
    if (!itemElement) return;
    const state = petTaskStates.get(userName);
    const petIndicatorEl = itemElement.querySelector(".pet-task-indicator");
    const petBtn = itemElement.querySelector(".btn-pet");

    if (!petIndicatorEl) return;

    if (state === "running") {
      petIndicatorEl.innerHTML =
        '<span class="task-spinner" title="Pet task running..."></span>';
      if (petBtn) petBtn.disabled = true;
    } else if (state === "success") {
      petIndicatorEl.innerHTML =
        '<span class="task-status-success" title="Pet task succeeded!">✓</span>';
      if (petBtn) petBtn.disabled = false;
    } else if (state === "error") {
      petIndicatorEl.innerHTML =
        '<span class="task-status-error" title="Pet task failed!">✕</span>';
      if (petBtn) petBtn.disabled = false;
    } else {
      petIndicatorEl.innerHTML = "";
      if (petBtn) petBtn.disabled = false;
    }
  }

  // Check live status for single streamer
  async function checkStreamerLive(streamer, itemElement) {
    appendLog(
      `Checking ${streamer.name || streamer.url} via yt-dlp-utils...`,
      "info",
      "LiveCheck",
    );

    const checkBtn = itemElement
      ? itemElement.querySelector(".btn-check")
      : null;
    if (checkBtn) checkBtn.disabled = true;

    try {
      if (window.electronAPI && window.electronAPI.checkStreamerLive) {
        await window.electronAPI.checkStreamerLive(streamer.id);
      }
    } catch (err) {
      appendLog(
        `Error checking ${streamer.name}: ${err.message}`,
        "error",
        "LiveCheck",
      );
    } finally {
      if (checkBtn) checkBtn.disabled = false;
    }
  }

  // Render the list of streamers with full controls
  function renderStreamersList(streamers) {
    localStreamers = Array.isArray(streamers) ? streamers : [];
    const liveCount = localStreamers.filter((s) => s.isLive).length;
    streamerCountLabel.textContent = `Streamers (${localStreamers.length}) • ${liveCount} Live`;
    streamersListEl.innerHTML = "";

    if (localStreamers.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-message";
      emptyLi.textContent =
        "No streamers added yet. Add a Kick, Twitch, or YouTube URL above.";
      streamersListEl.appendChild(emptyLi);
      return;
    }

    localStreamers.forEach((streamer, index) => {
      const li = document.createElement("li");
      li.className = `streamer-item ${streamer.isLive ? "is-live" : "is-offline"}`;

      // Left Column: Avatar & Details
      const infoDiv = document.createElement("div");
      infoDiv.className = "streamer-item-info";

      const avatarDiv = document.createElement("div");
      avatarDiv.className = "streamer-avatar-mini";
      avatarDiv.textContent = getInitials(streamer.name || streamer.url);

      // Distinct color hash
      let hash = 0;
      const strToHash = streamer.name || streamer.url || "streamer";
      for (let i = 0; i < strToHash.length; i++) {
        hash = strToHash.charCodeAt(i) + ((hash << 5) - hash);
      }
      const hue1 = Math.abs(hash % 360);
      const hue2 = (hue1 + 40) % 360;
      avatarDiv.style.background = `linear-gradient(135deg, hsl(${hue1}, 70%, 55%), hsl(${hue2}, 75%, 45%))`;

      const detailsDiv = document.createElement("div");
      detailsDiv.className = "streamer-details";

      const titleRow = document.createElement("div");
      titleRow.className = "streamer-title-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "streamer-name-text";
      nameSpan.textContent = streamer.name || "Streamer";

      const platformBadge = document.createElement("span");
      platformBadge.innerHTML = getPlatformBadge(streamer.platform);

      titleRow.appendChild(nameSpan);
      titleRow.appendChild(platformBadge);

      const urlSpan = document.createElement("div");
      urlSpan.className = "streamer-url-text";
      urlSpan.title = streamer.url;
      urlSpan.textContent = streamer.url;

      // Live status info banner (if live or cached)
      const statusRow = document.createElement("div");
      statusRow.className = "streamer-status-row";

      let statusBadgeHtml = "";
      if (streamer.checkStatus === "checking") {
        statusBadgeHtml = `<span class="status-indicator status-checking"><span class="task-spinner-sm"></span> Checking...</span>`;
      } else if (streamer.isLive) {
        const viewers =
          streamer.cachedInfo && streamer.cachedInfo.viewerCount != null
            ? ` • 👁️ ${formatViewerCount(streamer.cachedInfo.viewerCount)}`
            : "";
        const game =
          streamer.cachedInfo &&
          (streamer.cachedInfo.game || streamer.cachedInfo.category)
            ? ` • 🎮 ${streamer.cachedInfo.game || streamer.cachedInfo.category}`
            : "";
        statusBadgeHtml = `<span class="status-indicator status-live">🔴 LIVE${viewers}${game}</span>`;
      } else {
        const lastCheckedStr = streamer.lastChecked
          ? `Last checked: ${new Date(streamer.lastChecked).toLocaleTimeString()}`
          : "Not checked yet";
        statusBadgeHtml = `<span class="status-indicator status-offline">⚪ Offline (${lastCheckedStr})</span>`;
      }

      statusRow.innerHTML = statusBadgeHtml;

      // Optional cached stream title on second line if live
      if (streamer.isLive && streamer.cachedInfo && streamer.cachedInfo.title) {
        const streamTitle = document.createElement("div");
        streamTitle.className = "cached-stream-title";
        streamTitle.textContent = `"${streamer.cachedInfo.title}"`;
        statusRow.appendChild(streamTitle);
      }

      detailsDiv.appendChild(titleRow);
      detailsDiv.appendChild(urlSpan);
      detailsDiv.appendChild(statusRow);

      infoDiv.appendChild(avatarDiv);
      infoDiv.appendChild(detailsDiv);

      // Right Column: Actions (Check Now, Pet, Remove)
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "streamer-item-actions";

      // Pet indicator
      const petIndicator = document.createElement("span");
      petIndicator.className = "pet-task-indicator";

      // Check Live Button
      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "btn-check";
      checkBtn.title = `Check live status now for ${streamer.name || streamer.url}`;
      checkBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
        </svg>
        Check
      `;
      checkBtn.addEventListener("click", () => {
        checkStreamerLive(streamer, li);
      });

      // Pet Task Button
      const petBtn = document.createElement("button");
      petBtn.type = "button";
      petBtn.className = "btn-pet";
      petBtn.title = `Run Node.js async pet task for ${streamer.name || streamer.url}`;
      petBtn.innerHTML = `🐾 Pet`;
      petBtn.addEventListener("click", () => {
        runPetAvatarTask(streamer.name || streamer.url, li);
      });

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-icon-action";
      deleteBtn.title = `Remove ${streamer.name || streamer.url}`;
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteBtn.addEventListener("click", () => {
        removeStreamer(streamer.id);
      });

      actionsDiv.appendChild(petIndicator);
      actionsDiv.appendChild(checkBtn);
      actionsDiv.appendChild(petBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);
      streamersListEl.appendChild(li);

      // Restore existing pet task state if present
      updateItemPetTaskUI(li, streamer.name || streamer.url);
    });
  }

  // Add Streamer handler
  addStreamerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const url = newStreamerUrlInput.value.trim();
    if (!url) return;

    let selectedPlatform = newStreamerPlatformSelect.value;
    if (selectedPlatform === "auto") {
      selectedPlatform = detectPlatform(url);
    }

    const name = newStreamerNameInput.value.trim();

    appendLog(
      `Adding streamer: ${name || url} (${selectedPlatform})...`,
      "info",
      "Streamer",
    );

    if (window.electronAPI && window.electronAPI.addStreamer) {
      const updatedList = await window.electronAPI.addStreamer({
        url,
        name: name || undefined,
        platform: selectedPlatform,
      });
      renderStreamersList(updatedList);
    }

    newStreamerUrlInput.value = "";
    newStreamerNameInput.value = "";
    newStreamerPlatformSelect.value = "auto";
  });

  // Remove Streamer handler
  async function removeStreamer(streamerId) {
    if (window.electronAPI && window.electronAPI.removeStreamer) {
      const updatedList = await window.electronAPI.removeStreamer(streamerId);
      renderStreamersList(updatedList);
      appendLog(`Removed streamer ID: ${streamerId}`, "info", "Streamer");
    }
  }

  // Check All Now handler
  if (btnCheckAll) {
    btnCheckAll.addEventListener("click", async () => {
      appendLog(
        "Triggering manual live check for all streamers...",
        "info",
        "LiveCheck",
      );
      btnCheckAll.disabled = true;
      if (window.electronAPI && window.electronAPI.checkStreamerLive) {
        await window.electronAPI.checkStreamerLive();
      }
      setTimeout(() => {
        btnCheckAll.disabled = false;
      }, 3000);
    });
  }

  // Preset example buttons
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      const name = btn.getAttribute("data-name");
      const platform = btn.getAttribute("data-platform");

      newStreamerUrlInput.value = url;
      newStreamerNameInput.value = name;
      newStreamerPlatformSelect.value = platform;
      newStreamerUrlInput.focus();
    });
  });

  // Reset to defaults
  btnResetDefaults.addEventListener("click", async () => {
    const defaultStreamers = [
      {
        id: "yt-lofigirl",
        name: "Lofi Girl",
        url: "https://www.youtube.com/@LofiGirl/live",
        platform: "youtube",
        isLive: false,
        cachedInfo: null,
        lastChecked: null,
        checkStatus: "idle",
        lastError: null,
      },
      {
        id: "tw-shroud",
        name: "Shroud",
        url: "https://www.twitch.tv/shroud",
        platform: "twitch",
        isLive: false,
        cachedInfo: null,
        lastChecked: null,
        checkStatus: "idle",
        lastError: null,
      },
      {
        id: "kc-xqc",
        name: "xQc",
        url: "https://kick.com/xqc",
        platform: "kick",
        isLive: false,
        cachedInfo: null,
        lastChecked: null,
        checkStatus: "idle",
        lastError: null,
      },
    ];

    petTaskStates.clear();
    if (window.electronAPI && window.electronAPI.updateStreamers) {
      const updated =
        await window.electronAPI.updateStreamers(defaultStreamers);
      renderStreamersList(updated);
      appendLog(
        "Reset streamers to defaults (YouTube, Twitch, Kick).",
        "info",
        "Streamer",
      );
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
    if (Array.isArray(settings.streamers)) {
      renderStreamersList(settings.streamers);
    }
  }

  // Load initial streamers and settings
  if (window.electronAPI) {
    try {
      if (window.electronAPI.getStreamers) {
        const streamers = await window.electronAPI.getStreamers();
        renderStreamersList(streamers);
      }
      if (window.electronAPI.getSettings) {
        const initialSettings = await window.electronAPI.getSettings();
        applySettingsToUI(initialSettings);
      }
    } catch (err) {
      console.error("Failed to load initial settings/streamers:", err);
    }
  }

  // Listen for live updates
  if (window.electronAPI && window.electronAPI.onStreamersUpdated) {
    window.electronAPI.onStreamersUpdated((updatedStreamers) => {
      renderStreamersList(updatedStreamers);
    });
  }

  if (window.electronAPI && window.electronAPI.onSettingsUpdated) {
    window.electronAPI.onSettingsUpdated((newSettings) => {
      applySettingsToUI(newSettings);
    });
  }
});
