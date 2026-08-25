document.addEventListener("DOMContentLoaded", async () => {
  // Sorting Strategy UI
  const sortRadios = document.querySelectorAll('input[name="sort-order"]');

  // Avatar Size & Alignment UI
  const avatarSizeSlider = document.getElementById("avatar-size-slider");
  const avatarSizeDisplay = document.getElementById("avatar-size-display");
  const sizePresetButtons = document.querySelectorAll(".btn-size-preset");
  const fontSizeSlider = document.getElementById("font-size-slider");
  const fontSizeDisplay = document.getElementById("font-size-display");
  const fontPresetButtons = document.querySelectorAll(".btn-font-preset");
  const btnAlignLeft = document.getElementById("btn-align-left");
  const btnAlignRight = document.getElementById("btn-align-right");
  const orientationRadios = document.querySelectorAll(
    'input[name="layout-orientation"]',
  );
  const chkLayoutReversed = document.getElementById("chk-layout-reversed");
  const externalLinkCards = document.querySelectorAll(".external-link-card");

  // Streamer Form Elements
  const streamerForm = document.getElementById("streamer-form");
  const editStreamerIdInput = document.getElementById("edit-streamer-id");
  const formSectionTitle = document.getElementById("form-section-title");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const btnSubmitText = document.getElementById("btn-submit-text");

  const streamerNameInput = document.getElementById("streamer-name-input");
  const streamerAvatarInput = document.getElementById("streamer-avatar-input");
  const streamerFollowingDateInput = document.getElementById(
    "streamer-following-date-input",
  );
  const streamerNoteInput = document.getElementById("streamer-note-input");
  const btnBrowseAvatar = document.getElementById("btn-browse-avatar");
  const avatarFormPreview = document.getElementById("avatar-form-preview");
  const avatarPreviewFallback = document.getElementById(
    "avatar-preview-fallback",
  );
  const avatarPreviewImg = document.getElementById("avatar-preview-img");

  const urlsInputList = document.getElementById("urls-input-list");
  const btnAddUrlRow = document.getElementById("btn-add-url-row");

  // Trigger Form Elements
  const trigGoingLive = document.getElementById("trig-going-live");
  const trigTitleChange = document.getElementById("trig-title-change");
  const trigTitleContainsEnabled = document.getElementById(
    "trig-title-contains-enabled",
  );
  const trigTitleContainsText = document.getElementById(
    "trig-title-contains-text",
  );
  const trigCategoryChange = document.getElementById("trig-category-change");
  const trigViewerEnabled = document.getElementById("trig-viewer-enabled");
  const trigViewerThreshold = document.getElementById("trig-viewer-threshold");
  const trigRuntimeEnabled = document.getElementById("trig-runtime-enabled");
  const trigRuntimeThreshold = document.getElementById(
    "trig-runtime-threshold",
  );

  // Streamers List Elements
  const streamersListEl = document.getElementById("streamers-list");
  const streamerCountLabel = document.getElementById("streamer-count-label");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  const btnCheckAll = document.getElementById("btn-check-all");
  const presetButtons = document.querySelectorAll(".btn-preset");

  // Window Controls
  const chkShowNicknameTag = document.getElementById("chk-show-nickname-tag");
  const chkShowOverlay = document.getElementById("chk-show-overlay");
  const chkAlwaysOnTop = document.getElementById("chk-always-on-top");
  const chkSmartClickThrough = document.getElementById(
    "chk-smart-click-through",
  );
  const chkClickThrough = document.getElementById("chk-click-through");
  const chkShowBoundaryCorners = document.getElementById(
    "chk-show-boundary-corners",
  );
  const chkHideOfflineEnabled = document.getElementById(
    "chk-hide-offline-enabled",
  );
  const inputHideOfflineDays = document.getElementById(
    "input-hide-offline-days",
  );
  const inputWindowStatesCount = document.getElementById(
    "input-window-states-count",
  );
  const windowStatesButtons = document.getElementById("window-states-buttons");
  const windowStateBadge = document.getElementById("window-state-badge");
  const opacityRadios = document.querySelectorAll('input[name="opacity"]');

  const btnCenterOverlay = document.getElementById("btn-center-overlay");
  const btnToggleOverlay = document.getElementById("btn-toggle-overlay");
  const btnQuitApp = document.getElementById("btn-quit-app");
  const btnOpenDevTools = document.getElementById("btn-open-devtools");
  const btnClearLogs = document.getElementById("btn-clear-logs");
  const logTerminal = document.getElementById("log-terminal");

  let localStreamers = [];
  const petTaskStates = new Map();

  // Output a log entry to browser DevTools console
  function logToDevToolsConsole(entry) {
    if (!entry) return;
    const { timestamp, tag, message, type } = entry;
    const prefix = `[${timestamp || new Date().toLocaleTimeString()}] [${tag || "System"}]`;
    if (type === "error") {
      console.error(prefix, message);
    } else if (type === "warn") {
      console.warn(prefix, message);
    } else {
      console.log(prefix, message);
    }
  }

  // Display only the latest log entry in the Settings UI
  function displayLatestLogUI(entry) {
    if (!logTerminal || !entry) return;

    const { timestamp, tag, message, type } = entry;
    const logType = type || "info";

    logTerminal.innerHTML = "";

    const entryEl = document.createElement("div");
    entryEl.className = `log-entry log-${logType}`;

    const timeSpan = document.createElement("span");
    timeSpan.className = "log-time";
    timeSpan.textContent = `[${timestamp || new Date().toLocaleTimeString()}]`;

    const tagSpan = document.createElement("span");
    tagSpan.className = "log-tag";
    tagSpan.textContent = `[${tag || "System"}]`;

    const msgSpan = document.createElement("span");
    msgSpan.className = "log-msg";
    msgSpan.textContent =
      typeof message === "object"
        ? JSON.stringify(message)
        : String(message || "");

    entryEl.appendChild(timeSpan);
    entryEl.appendChild(tagSpan);
    entryEl.appendChild(msgSpan);
    logTerminal.appendChild(entryEl);
  }

  // Process an incoming log entry: print to page console + update latest log in UI
  function handleLogEntry(entry, updateUI = true) {
    logToDevToolsConsole(entry);
    if (updateUI) {
      displayLatestLogUI(entry);
    }
  }

  // Logging helper for renderer user actions
  function appendLog(message, type = "info", tag = "Settings") {
    if (window.electronAPI && window.electronAPI.logTerminal) {
      window.electronAPI.logTerminal(tag, message, type === "error");
    } else {
      handleLogEntry(
        {
          timestamp: new Date().toLocaleTimeString(),
          tag,
          message,
          type,
        },
        true,
      );
    }
  }

  // Clear logs
  if (btnClearLogs) {
    btnClearLogs.addEventListener("click", async () => {
      if (window.electronAPI && window.electronAPI.clearLogs) {
        await window.electronAPI.clearLogs();
      }
      try {
        console.clear();
      } catch (_e) {}
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

  // Format viewer count
  function formatViewerCount(num) {
    if (num === null || num === undefined) return "";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Number(num).toLocaleString();
  }

  // Format offline duration
  function formatOfflineDuration(isoString) {
    if (!isoString) return "Offline";
    try {
      const start = new Date(isoString).getTime();
      const now = Date.now();
      const diffMs = now - start;
      if (diffMs < 0 || isNaN(diffMs)) return "Offline";

      const totalMins = Math.floor(diffMs / 60000);
      const days = Math.floor(totalMins / 1440);
      const hours = Math.floor((totalMins % 1440) / 60);
      const mins = totalMins % 60;
      if (days > 0) {
        return `${days}d ${hours}h`;
      }
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${Math.max(1, mins)}m`;
    } catch {
      return "Offline";
    }
  }

  function isStreamerOfflineHidden(streamer, hideEnabled, maxDays) {
    if (!hideEnabled) return false;
    if (streamer.isLive) return false;
    if (!streamer.offlineSince) return true;
    try {
      const offlineTime = new Date(streamer.offlineSince).getTime();
      if (isNaN(offlineTime)) return true;
      const diffMs = Date.now() - offlineTime;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      return diffDays > maxDays;
    } catch {
      return true;
    }
  }

  function getPlatformPillClass(plat) {
    switch (plat) {
      case "youtube":
        return "pill-youtube";
      case "twitch":
        return "pill-twitch";
      case "kick":
        return "pill-kick";
      default:
        return "pill-other";
    }
  }

  // Avatar Preview Updater
  function updateAvatarPreview() {
    const name = streamerNameInput.value.trim();
    let imgPath = streamerAvatarInput.value.trim();

    avatarPreviewFallback.textContent = getInitials(name);

    if (imgPath) {
      if (
        !/^https?:\/\//i.test(imgPath) &&
        !imgPath.startsWith("data:") &&
        !imgPath.startsWith("file://")
      ) {
        imgPath = `file:///${imgPath.replace(/\\/g, "/")}`;
      }
      avatarPreviewImg.src = imgPath;
      avatarPreviewImg.style.display = "block";
      avatarPreviewFallback.style.display = "none";

      avatarPreviewImg.onerror = () => {
        avatarPreviewImg.style.display = "none";
        avatarPreviewFallback.style.display = "block";
      };
    } else {
      avatarPreviewImg.style.display = "none";
      avatarPreviewFallback.style.display = "block";
    }
  }

  streamerNameInput.addEventListener("input", updateAvatarPreview);
  streamerAvatarInput.addEventListener("input", updateAvatarPreview);

  // Browse local avatar image button
  if (btnBrowseAvatar) {
    btnBrowseAvatar.addEventListener("click", async () => {
      if (window.electronAPI && window.electronAPI.selectAvatarImage) {
        const filePath = await window.electronAPI.selectAvatarImage();
        if (filePath) {
          streamerAvatarInput.value = filePath;
          updateAvatarPreview();
        }
      }
    });
  }

  // Format local date YYYY-MM-DD
  function getTodayDateString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }

  // Generate random default check frequency: 20 minutes + rand(1..20) -> 21 to 40 minutes
  function getRandomDefaultFreq() {
    return 20 + Math.floor(Math.random() * 20) + 1;
  }

  // URL builder row management with per-link frequency in minutes
  function createUrlRow(
    entry = { url: "", freqMinutes: getRandomDefaultFreq() },
  ) {
    const rawUrl = typeof entry === "string" ? entry : entry?.url || "";
    const rawFreq =
      typeof entry === "object" && entry?.freqMinutes
        ? entry.freqMinutes
        : getRandomDefaultFreq();

    const row = document.createElement("div");
    row.className = "url-input-row";

    const orderChip = document.createElement("span");
    orderChip.className = "url-order-chip";
    orderChip.textContent = "#1";

    const urlInput = document.createElement("input");
    urlInput.type = "text";
    urlInput.placeholder = "Stream URL (e.g. https://kick.com/streamer)";
    urlInput.value = rawUrl;
    urlInput.required = true;

    const platTag = document.createElement("span");
    platTag.className = "url-platform-tag pill-other";
    platTag.textContent = "URL";

    function updatePlatTag() {
      const plat = detectPlatform(urlInput.value);
      platTag.className = `url-platform-tag ${getPlatformPillClass(plat)}`;
      platTag.textContent = plat.toUpperCase();
    }
    urlInput.addEventListener("input", updatePlatTag);
    updatePlatTag();

    // Frequency in minutes input (min 5 minutes, default 20 + 1-20 rand)
    const freqWrapper = document.createElement("div");
    freqWrapper.className = "url-freq-wrapper";
    freqWrapper.title =
      "Check frequency for this link in minutes (min 5m, checks at minute counter % freq == 0)";

    const freqLabel = document.createElement("span");
    freqLabel.className = "url-freq-label";
    freqLabel.textContent = "Freq:";

    const freqInput = document.createElement("input");
    freqInput.type = "number";
    freqInput.className = "input-url-freq";
    freqInput.min = "5";
    freqInput.step = "1";
    freqInput.value = String(
      Math.max(5, parseInt(rawFreq, 10) || getRandomDefaultFreq()),
    );

    const freqUnit = document.createElement("span");
    freqUnit.className = "url-freq-label";
    freqUnit.textContent = "m";

    freqWrapper.appendChild(freqLabel);
    freqWrapper.appendChild(freqInput);
    freqWrapper.appendChild(freqUnit);

    const actions = document.createElement("div");
    actions.className = "url-row-actions";

    const btnUp = document.createElement("button");
    btnUp.type = "button";
    btnUp.className = "btn-url-order";
    btnUp.title = "Check this platform earlier (Move Up)";
    btnUp.innerHTML = "▲";
    btnUp.addEventListener("click", () => {
      const prev = row.previousElementSibling;
      if (prev) {
        urlsInputList.insertBefore(row, prev);
        updateUrlsOrderChips();
      }
    });

    const btnDown = document.createElement("button");
    btnDown.type = "button";
    btnDown.className = "btn-url-order";
    btnDown.title = "Check this platform later (Move Down)";
    btnDown.innerHTML = "▼";
    btnDown.addEventListener("click", () => {
      const next = row.nextElementSibling;
      if (next) {
        urlsInputList.insertBefore(next, row);
        updateUrlsOrderChips();
      }
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-url-remove";
    btnDel.title = "Remove this URL";
    btnDel.innerHTML = "✕";
    btnDel.addEventListener("click", () => {
      if (urlsInputList.children.length > 1) {
        row.remove();
        updateUrlsOrderChips();
      } else {
        urlInput.value = "";
        freqInput.value = getRandomDefaultFreq().toString();
        updatePlatTag();
      }
    });

    actions.appendChild(btnUp);
    actions.appendChild(btnDown);
    actions.appendChild(btnDel);

    row.appendChild(orderChip);
    row.appendChild(urlInput);
    row.appendChild(freqWrapper);
    row.appendChild(platTag);
    row.appendChild(actions);

    return row;
  }

  function updateUrlsOrderChips() {
    Array.from(urlsInputList.children).forEach((row, idx) => {
      const chip = row.querySelector(".url-order-chip");
      if (chip) chip.textContent = `#${idx + 1}`;
      const btnUp = row.querySelector(
        ".url-row-actions .btn-url-order:first-child",
      );
      const btnDown = row.querySelector(
        ".url-row-actions .btn-url-order:nth-child(2)",
      );
      if (btnUp) btnUp.disabled = idx === 0;
      if (btnDown) btnDown.disabled = idx === urlsInputList.children.length - 1;
    });
  }

  function setFormUrls(urls = []) {
    urlsInputList.innerHTML = "";
    if (!urls || urls.length === 0) {
      urlsInputList.appendChild(
        createUrlRow({ url: "", freqMinutes: getRandomDefaultFreq() }),
      );
    } else {
      urls.forEach((u) => urlsInputList.appendChild(createUrlRow(u)));
    }
    updateUrlsOrderChips();
  }

  function getFormUrls() {
    const rows = Array.from(urlsInputList.querySelectorAll(".url-input-row"));
    return rows
      .map((row) => {
        const urlInp = row.querySelector('input[type="text"]');
        const freqInp = row.querySelector(".input-url-freq");
        const url = urlInp ? urlInp.value.trim() : "";
        const freqMinutes = freqInp
          ? Math.max(5, parseInt(freqInp.value, 10) || getRandomDefaultFreq())
          : getRandomDefaultFreq();
        return { url, freqMinutes };
      })
      .filter((item) => item.url.length > 0);
  }

  if (btnAddUrlRow) {
    btnAddUrlRow.addEventListener("click", () => {
      urlsInputList.appendChild(
        createUrlRow({ url: "", freqMinutes: getRandomDefaultFreq() }),
      );
      updateUrlsOrderChips();
      const lastInput =
        urlsInputList.lastElementChild.querySelector('input[type="text"]');
      if (lastInput) lastInput.focus();
    });
  }

  // Reset form to Add mode
  function resetStreamerForm() {
    editStreamerIdInput.value = "";
    formSectionTitle.textContent = "Add Streamer Profile";
    btnSubmitText.textContent = "Save Streamer";
    btnCancelEdit.style.display = "none";

    streamerNameInput.value = "";
    streamerAvatarInput.value = "";
    if (streamerFollowingDateInput) {
      streamerFollowingDateInput.value = getTodayDateString();
    }
    if (streamerNoteInput) {
      streamerNoteInput.value = "";
    }
    setFormUrls([{ url: "", freqMinutes: getRandomDefaultFreq() }]);

    trigGoingLive.checked = true;
    trigTitleChange.checked = true;
    if (trigTitleContainsEnabled) trigTitleContainsEnabled.checked = false;
    if (trigTitleContainsText) trigTitleContainsText.value = "";
    trigCategoryChange.checked = true;
    trigViewerEnabled.checked = false;
    trigViewerThreshold.value = "5000";
    if (trigRuntimeEnabled) trigRuntimeEnabled.checked = false;
    if (trigRuntimeThreshold) trigRuntimeThreshold.value = "30";

    updateAvatarPreview();
  }

  // Populate form for Editing an existing streamer
  function populateEditForm(streamer) {
    if (!streamer) return;
    editStreamerIdInput.value = streamer.id;
    formSectionTitle.textContent = `Edit Streamer: ${streamer.name}`;
    btnSubmitText.textContent = "Update Streamer";
    btnCancelEdit.style.display = "inline-flex";

    streamerNameInput.value = streamer.name || "";
    streamerAvatarInput.value = streamer.avatarImage || "";
    if (streamerFollowingDateInput) {
      streamerFollowingDateInput.value = streamer.followingDate
        ? String(streamer.followingDate).slice(0, 10)
        : getTodayDateString();
    }
    if (streamerNoteInput) {
      streamerNoteInput.value = streamer.note || "";
    }
    setFormUrls(streamer.urls || [{ url: streamer.url, freqMinutes: 1 }]);

    const trig = streamer.triggers || {};
    trigGoingLive.checked = trig.goingLive !== false;
    trigTitleChange.checked = trig.titleChange !== false;
    if (trigTitleContainsEnabled) {
      trigTitleContainsEnabled.checked = Boolean(trig.titleContainsEnabled);
    }
    if (trigTitleContainsText) {
      trigTitleContainsText.value = trig.titleContainsText || "";
    }
    trigCategoryChange.checked = trig.categoryChange !== false;
    trigViewerEnabled.checked = Boolean(trig.viewerCountEnabled);
    trigViewerThreshold.value = String(trig.viewerCountThreshold || 5000);
    if (trigRuntimeEnabled) {
      trigRuntimeEnabled.checked = Boolean(trig.runtimeMinutesEnabled);
    }
    if (trigRuntimeThreshold) {
      trigRuntimeThreshold.value = String(trig.runtimeMinutesThreshold || 30);
    }

    updateAvatarPreview();
    streamerForm.scrollIntoView({ behavior: "smooth" });
  }

  if (btnCancelEdit) {
    btnCancelEdit.addEventListener("click", () => {
      resetStreamerForm();
    });
  }

  // Submit Streamer Form
  streamerForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = streamerNameInput.value.trim();
    const avatarImage = streamerAvatarInput.value.trim();
    const followingDate =
      streamerFollowingDateInput && streamerFollowingDateInput.value
        ? streamerFollowingDateInput.value.trim()
        : getTodayDateString();
    const note = streamerNoteInput ? streamerNoteInput.value.trim() : "";
    const urls = getFormUrls();

    if (!name || urls.length === 0) {
      alert("Please provide a name and at least one stream URL.");
      return;
    }

    const triggers = {
      goingLive: trigGoingLive.checked,
      titleChange: trigTitleChange.checked,
      titleContainsEnabled: trigTitleContainsEnabled
        ? trigTitleContainsEnabled.checked
        : false,
      titleContainsText: trigTitleContainsText
        ? trigTitleContainsText.value.trim()
        : "",
      categoryChange: trigCategoryChange.checked,
      viewerCountEnabled: trigViewerEnabled.checked,
      viewerCountThreshold: Number(trigViewerThreshold.value) || 5000,
      runtimeMinutesEnabled: trigRuntimeEnabled
        ? trigRuntimeEnabled.checked
        : false,
      runtimeMinutesThreshold: trigRuntimeThreshold
        ? Number(trigRuntimeThreshold.value) || 30
        : 30,
    };

    const editingId = editStreamerIdInput.value;

    if (editingId) {
      const updatedList = localStreamers.map((s) => {
        if (s.id === editingId) {
          return {
            ...s,
            name,
            avatarImage,
            followingDate,
            note,
            urls,
            triggers,
          };
        }
        return s;
      });

      appendLog(
        `Updated streamer "${name}" with ${urls.length} URLs.`,
        "info",
        "Streamer",
      );
      if (window.electronAPI && window.electronAPI.updateStreamers) {
        const result = await window.electronAPI.updateStreamers(updatedList);
        renderStreamersList(result);
      }
    } else {
      appendLog(
        `Adding new streamer "${name}" with ${urls.length} check URLs...`,
        "info",
        "Streamer",
      );
      if (window.electronAPI && window.electronAPI.addStreamer) {
        const result = await window.electronAPI.addStreamer({
          name,
          avatarImage,
          followingDate,
          note,
          urls,
          triggers,
        });
        renderStreamersList(result);
      }
    }

    resetStreamerForm();
  });

  // Pet Avatar Task
  async function runPetAvatarTask(streamer, itemElement) {
    const streamerName = streamer.name || "Streamer";
    petTaskStates.set(streamer.id, "running");
    updateItemPetTaskUI(itemElement, streamer.id);

    try {
      if (window.electronAPI && window.electronAPI.runPetAvatarTask) {
        const result = await window.electronAPI.runPetAvatarTask(streamerName);
        if (result.success) {
          petTaskStates.set(streamer.id, "success");
          updateItemPetTaskUI(itemElement, streamer.id);
        } else {
          petTaskStates.set(streamer.id, "error");
          updateItemPetTaskUI(itemElement, streamer.id);
        }
      }
    } catch (err) {
      petTaskStates.set(streamer.id, "error");
      updateItemPetTaskUI(itemElement, streamer.id);
    }
  }

  function updateItemPetTaskUI(itemElement, streamerId) {
    if (!itemElement) return;
    const state = petTaskStates.get(streamerId);
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

  // Check single streamer live
  async function checkStreamerLive(streamer, itemElement) {
    appendLog(
      `Checking ${streamer.name} across ${streamer.urls?.length || 1} URL(s)...`,
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

  // Move streamer up/down in manual order
  async function moveStreamerOrder(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= localStreamers.length) return;

    const reordered = [...localStreamers];
    const temp = reordered[index];
    reordered[index] = reordered[newIndex];
    reordered[newIndex] = temp;

    if (window.electronAPI && window.electronAPI.updateStreamers) {
      const result = await window.electronAPI.updateStreamers(reordered);
      renderStreamersList(result);
    }
  }

  // Render Streamers List with detailed Trigger Debugging and Per-Link Frequencies
  function renderStreamersList(streamers) {
    localStreamers = Array.isArray(streamers) ? streamers : [];
    const liveCount = localStreamers.filter((s) => s.isLive).length;
    streamerCountLabel.textContent = `Configured Streamers (${localStreamers.length}) • ${liveCount} Live`;
    streamersListEl.innerHTML = "";

    if (localStreamers.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-message";
      emptyLi.textContent = "No streamers added yet. Add streamer URLs above.";
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

      let imgPath = streamer.avatarImage;
      if (imgPath) {
        if (
          !/^https?:\/\//i.test(imgPath) &&
          !imgPath.startsWith("data:") &&
          !imgPath.startsWith("file://")
        ) {
          imgPath = `file:///${imgPath.replace(/\\/g, "/")}`;
        }
        const img = document.createElement("img");
        img.src = imgPath;
        img.alt = streamer.name;
        img.onerror = () => {
          img.remove();
          avatarDiv.textContent = getInitials(streamer.name);
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = getInitials(streamer.name);
      }

      // Details
      const detailsDiv = document.createElement("div");
      detailsDiv.className = "streamer-details";

      const titleRow = document.createElement("div");
      titleRow.className = "streamer-title-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "streamer-name-text";
      nameSpan.textContent = streamer.name || "Streamer";
      titleRow.appendChild(nameSpan);

      // URL chips showing checking order and frequency
      const urlsContainer = document.createElement("div");
      urlsContainer.className = "streamer-urls-chips";

      const urls = Array.isArray(streamer.urls)
        ? streamer.urls
        : [{ url: streamer.url || "", freqMinutes: 1 }];
      urls.forEach((entry, uIdx) => {
        const urlStr = typeof entry === "string" ? entry : entry?.url || "";
        const freq =
          typeof entry === "object" && entry?.freqMinutes
            ? entry.freqMinutes
            : 1;
        const plat = detectPlatform(urlStr);

        const chip = document.createElement("span");
        const isActive = streamer.isLive && streamer.activeUrl === urlStr;
        chip.className = `url-order-badge ${isActive ? "active-url-badge" : ""}`;
        chip.title = `${uIdx + 1}. [${plat.toUpperCase()}] ${urlStr} (Checked every ${freq}m)`;
        chip.textContent = `${uIdx + 1}.${plat.toUpperCase()} (${freq}m)${isActive ? " [LIVE]" : ""}`;
        urlsContainer.appendChild(chip);
      });
      titleRow.appendChild(urlsContainer);

      // Snoozed Badge button (Click to un-snooze)
      if (
        streamer.snoozedUntil &&
        new Date(streamer.snoozedUntil).getTime() > Date.now()
      ) {
        const snoozeDate = new Date(streamer.snoozedUntil);
        const snoozeBtn = document.createElement("button");
        snoozeBtn.type = "button";
        snoozeBtn.className = "btn-snooze-badge";
        snoozeBtn.title = `Snoozed until ${snoozeDate.toLocaleTimeString()} (${snoozeDate.toLocaleDateString()}). Click to un-snooze!`;
        snoozeBtn.innerHTML = `💤 Click to Un-snooze`;
        snoozeBtn.addEventListener("click", async (e) => {
          e.stopPropagation();
          const updated = localStreamers.map((s) =>
            s.id === streamer.id ? { ...s, snoozedUntil: null } : s,
          );
          if (window.electronAPI && window.electronAPI.updateStreamers) {
            const res = await window.electronAPI.updateStreamers(updated);
            renderStreamersList(res);
            appendLog(
              `Un-snoozed streamer: ${streamer.name}`,
              "info",
              "Streamer",
            );
          }
        });
        titleRow.appendChild(snoozeBtn);
      }

      // Status Row
      const statusRow = document.createElement("div");
      statusRow.className = "streamer-status-row";

      let statusBadgeHtml = "";
      if (streamer.checkStatus === "checking") {
        statusBadgeHtml = `<span class="status-indicator status-checking"><span class="task-spinner-sm"></span> Checking...</span>`;
      } else if (streamer.isLive) {
        const viewers =
          streamer.cachedInfo?.viewerCount != null
            ? ` • 👁️ ${formatViewerCount(streamer.cachedInfo.viewerCount)}`
            : "";
        const game =
          streamer.cachedInfo?.game || streamer.cachedInfo?.category
            ? ` • 🎮 ${streamer.cachedInfo.game || streamer.cachedInfo.category}`
            : "";
        statusBadgeHtml = `<span class="status-indicator status-live">🔴 LIVE on ${streamer.activePlatform?.toUpperCase() || "WEB"}${viewers}${game}</span>`;
      } else {
        const lastCheckedStr = streamer.lastChecked
          ? `Last check: ${new Date(streamer.lastChecked).toLocaleTimeString()}`
          : "Not checked yet";
        const offlineDur = streamer.offlineSince
          ? ` • Offline: ${formatOfflineDuration(streamer.offlineSince)}`
          : "";
        const isHidden = isStreamerOfflineHidden(
          streamer,
          chkHideOfflineEnabled?.checked,
          parseInt(inputHideOfflineDays?.value, 10) || 7,
        );
        const hiddenBadge = isHidden
          ? ` <span class="badge-hidden-offline" title="Hidden from overlay window (> ${inputHideOfflineDays?.value || 7}d offline or unknown timestamp)">👁️‍🗨️ Hidden in Overlay</span>`
          : "";
        statusBadgeHtml = `<span class="status-indicator status-offline">⚪ Offline (${lastCheckedStr}${offlineDur})</span>${hiddenBadge}`;
      }
      statusRow.innerHTML = statusBadgeHtml;

      // Detailed Trigger Debug Box
      if (streamer.lastTrigger) {
        const trig = streamer.lastTrigger;
        const triggerDebugBox = document.createElement("div");
        triggerDebugBox.className = "streamer-trigger-debug-box";

        const trigTimeStr = trig.timestamp
          ? new Date(trig.timestamp).toLocaleTimeString()
          : "";

        let diffHtml = "";
        if (trig.diff && trig.diff.from && trig.diff.to) {
          diffHtml = `
            <div class="trigger-debug-diff">
              <span class="trigger-diff-from" title="${trig.diff.from}">${trig.diff.from}</span>
              <span class="trigger-diff-arrow">➔</span>
              <span class="trigger-diff-to" title="${trig.diff.to}">${trig.diff.to}</span>
            </div>
          `;
        }

        triggerDebugBox.innerHTML = `
          <div class="trigger-debug-header">
            <span class="trigger-debug-title">⚡ ${trig.label || "Trigger Fired"}</span>
            <span class="trigger-debug-time">${trigTimeStr}</span>
          </div>
          <div class="trigger-debug-message">${trig.message || ""}</div>
          ${diffHtml}
        `;

        statusRow.appendChild(triggerDebugBox);
      }

      detailsDiv.appendChild(titleRow);

      // Meta row: Following Date & Note
      if (streamer.followingDate || streamer.note) {
        const metaRow = document.createElement("div");
        metaRow.className = "streamer-meta-row";

        if (streamer.followingDate) {
          const dateSpan = document.createElement("span");
          dateSpan.className = "streamer-following-date";
          dateSpan.title = `Following since: ${streamer.followingDate}`;
          dateSpan.innerHTML = `📅 Followed: <strong>${streamer.followingDate}</strong>`;
          metaRow.appendChild(dateSpan);
        }

        if (streamer.note) {
          const noteSpan = document.createElement("span");
          noteSpan.className = "streamer-note-tag";
          noteSpan.title = streamer.note;
          const noteIcon = document.createElement("span");
          noteIcon.className = "note-icon";
          noteIcon.textContent = "💬";
          const noteText = document.createElement("span");
          noteText.className = "streamer-note-text";
          noteText.textContent = streamer.note;
          noteSpan.appendChild(noteIcon);
          noteSpan.appendChild(noteText);
          metaRow.appendChild(noteSpan);
        }

        detailsDiv.appendChild(metaRow);
      }

      detailsDiv.appendChild(statusRow);

      infoDiv.appendChild(avatarDiv);
      infoDiv.appendChild(detailsDiv);

      // Right Column: Actions
      const actionsDiv = document.createElement("div");
      actionsDiv.className = "streamer-item-actions";

      // Move Up/Down buttons for manual order
      const btnUp = document.createElement("button");
      btnUp.type = "button";
      btnUp.className = "btn-icon-action";
      btnUp.title = "Move Up in list";
      btnUp.innerHTML = "▲";
      btnUp.disabled = index === 0;
      btnUp.addEventListener("click", () => moveStreamerOrder(index, -1));

      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.className = "btn-icon-action";
      btnDown.title = "Move Down in list";
      btnDown.innerHTML = "▼";
      btnDown.disabled = index === localStreamers.length - 1;
      btnDown.addEventListener("click", () => moveStreamerOrder(index, 1));

      // Edit Button
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-icon-action";
      btnEdit.title = "Edit Streamer URLs & Triggers";
      btnEdit.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      btnEdit.addEventListener("click", () => populateEditForm(streamer));

      // Pet Indicator
      const petIndicator = document.createElement("span");
      petIndicator.className = "pet-task-indicator";

      // Check Button
      const checkBtn = document.createElement("button");
      checkBtn.type = "button";
      checkBtn.className = "btn-check";
      checkBtn.title = "Check live status now";
      checkBtn.innerHTML = `Check`;
      checkBtn.addEventListener("click", () => checkStreamerLive(streamer, li));

      // Pet Button
      const petBtn = document.createElement("button");
      petBtn.type = "button";
      petBtn.className = "btn-pet";
      petBtn.title = "Run async Pet task";
      petBtn.innerHTML = `🐾 Pet`;
      petBtn.addEventListener("click", () => runPetAvatarTask(streamer, li));

      // Delete Button
      const deleteBtn = document.createElement("button");
      deleteBtn.type = "button";
      deleteBtn.className = "btn-icon-action btn-delete";
      deleteBtn.title = `Remove ${streamer.name}`;
      deleteBtn.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      deleteBtn.addEventListener("click", async () => {
        if (window.electronAPI && window.electronAPI.removeStreamer) {
          const updated = await window.electronAPI.removeStreamer(streamer.id);
          renderStreamersList(updated);
          appendLog(`Removed streamer: ${streamer.name}`, "info", "Streamer");
        }
      });

      actionsDiv.appendChild(btnUp);
      actionsDiv.appendChild(btnDown);
      actionsDiv.appendChild(btnEdit);
      actionsDiv.appendChild(petIndicator);
      actionsDiv.appendChild(checkBtn);
      actionsDiv.appendChild(petBtn);
      actionsDiv.appendChild(deleteBtn);

      li.appendChild(infoDiv);
      li.appendChild(actionsDiv);
      streamersListEl.appendChild(li);

      updateItemPetTaskUI(li, streamer.id);
    });
  }

  // Check All Now
  if (btnCheckAll) {
    btnCheckAll.addEventListener("click", async () => {
      appendLog(
        "Triggering manual live checks for all streamers...",
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

  // Preset buttons with frequencies
  presetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const preset = btn.getAttribute("data-preset");
      if (preset === "lofi") {
        streamerNameInput.value = "Lofi Girl";
        streamerAvatarInput.value = "";
        if (streamerFollowingDateInput)
          streamerFollowingDateInput.value = getTodayDateString();
        if (streamerNoteInput)
          streamerNoteInput.value = "Cozy lo-fi beats stream";
        setFormUrls([
          { url: "https://www.youtube.com/@LofiGirl/live", freqMinutes: 1 },
        ]);
      } else if (preset === "shroud") {
        streamerNameInput.value = "Shroud";
        streamerAvatarInput.value = "";
        if (streamerFollowingDateInput)
          streamerFollowingDateInput.value = getTodayDateString();
        if (streamerNoteInput)
          streamerNoteInput.value = "FPS / shooter gameplay";
        setFormUrls([
          { url: "https://www.twitch.tv/shroud", freqMinutes: 1 },
          { url: "https://www.youtube.com/@shroud/live", freqMinutes: 2 },
        ]);
      } else if (preset === "xqc") {
        streamerNameInput.value = "xQc";
        streamerAvatarInput.value = "";
        if (streamerFollowingDateInput)
          streamerFollowingDateInput.value = getTodayDateString();
        if (streamerNoteInput) streamerNoteInput.value = "Variety / gaming";
        setFormUrls([
          { url: "https://kick.com/xqc", freqMinutes: 1 },
          { url: "https://www.twitch.tv/xqcow", freqMinutes: 1 },
          { url: "https://www.youtube.com/@xQcOW/live", freqMinutes: 3 },
        ]);
      }
      updateAvatarPreview();
      streamerNameInput.focus();
    });
  });

  // Sort Radio Handlers
  sortRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (
        radio.checked &&
        window.electronAPI &&
        window.electronAPI.updateSettings
      ) {
        window.electronAPI.updateSettings({ sortBy: radio.value });
        appendLog(
          `Sort strategy updated to: ${radio.value}`,
          "info",
          "Sorting",
        );
      }
    });
  });

  // Avatar Size Handlers
  function updateAvatarSizeUI(size) {
    const num = parseInt(size, 10) || 80;
    if (avatarSizeDisplay) avatarSizeDisplay.textContent = `${num}px`;
    if (avatarSizeSlider) avatarSizeSlider.value = String(num);

    sizePresetButtons.forEach((btn) => {
      const presetSize = parseInt(btn.getAttribute("data-size"), 10);
      if (presetSize === num) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function saveAvatarSize(size) {
    const num = Math.max(40, Math.min(200, parseInt(size, 10) || 80));
    updateAvatarSizeUI(num);
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({ avatarSize: num });
      appendLog(`Avatar size updated to: ${num}px`, "info", "Settings");
    }
  }

  if (avatarSizeSlider) {
    avatarSizeSlider.addEventListener("input", (e) => {
      const size = parseInt(e.target.value, 10);
      if (avatarSizeDisplay) avatarSizeDisplay.textContent = `${size}px`;
      sizePresetButtons.forEach((btn) => {
        btn.classList.toggle(
          "active",
          parseInt(btn.getAttribute("data-size"), 10) === size,
        );
      });
    });

    avatarSizeSlider.addEventListener("change", (e) => {
      saveAvatarSize(e.target.value);
    });
  }

  sizePresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.getAttribute("data-size");
      saveAvatarSize(size);
    });
  });

  // Font Size Handlers
  function updateFontSizeUI(size) {
    const num = parseInt(size, 10) || 12;
    if (fontSizeDisplay) fontSizeDisplay.textContent = `${num}px`;
    if (fontSizeSlider) fontSizeSlider.value = String(num);

    fontPresetButtons.forEach((btn) => {
      const presetSize = parseInt(btn.getAttribute("data-size"), 10);
      if (presetSize === num) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  function saveFontSize(size) {
    const num = Math.max(8, Math.min(32, parseInt(size, 10) || 12));
    updateFontSizeUI(num);
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({ fontSize: num });
      appendLog(`Font size updated to: ${num}px`, "info", "Settings");
    }
  }

  if (fontSizeSlider) {
    fontSizeSlider.addEventListener("input", (e) => {
      const size = parseInt(e.target.value, 10);
      if (fontSizeDisplay) fontSizeDisplay.textContent = `${size}px`;
      fontPresetButtons.forEach((btn) => {
        btn.classList.toggle(
          "active",
          parseInt(btn.getAttribute("data-size"), 10) === size,
        );
      });
    });

    fontSizeSlider.addEventListener("change", (e) => {
      saveFontSize(e.target.value);
    });
  }

  fontPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const size = btn.getAttribute("data-size");
      saveFontSize(size);
    });
  });

  // Avatar Alignment Handlers
  function updateAlignmentUI(align) {
    const isRight = align === "right";
    if (btnAlignLeft) btnAlignLeft.classList.toggle("active", !isRight);
    if (btnAlignRight) btnAlignRight.classList.toggle("active", isRight);
  }

  function saveAlignment(align) {
    updateAlignmentUI(align);
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({ avatarAlignment: align });
      appendLog(`Avatar alignment updated to: ${align}`, "info", "Settings");
    }
  }

  if (btnAlignLeft) {
    btnAlignLeft.addEventListener("click", () => saveAlignment("left"));
  }

  if (btnAlignRight) {
    btnAlignRight.addEventListener("click", () => saveAlignment("right"));
  }

  // Show Nickname as Tag Handler
  if (chkShowNicknameTag) {
    chkShowNicknameTag.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          showNicknameTag: chkShowNicknameTag.checked,
        });
        appendLog(
          `Nickname tag visibility set to: ${chkShowNicknameTag.checked ? "Enabled" : "Disabled"}`,
          "info",
          "Settings",
        );
      }
    });
  }

  // Orientation controls
  orientationRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (
        radio.checked &&
        window.electronAPI &&
        window.electronAPI.updateSettings
      ) {
        window.electronAPI.updateSettings({
          layoutOrientation: radio.value,
        });
        appendLog(
          `Layout orientation set to: ${radio.value}`,
          "info",
          "Settings",
        );
      }
    });
  });

  if (chkLayoutReversed) {
    chkLayoutReversed.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          layoutReversed: chkLayoutReversed.checked,
        });
        appendLog(
          `Layout reversed set to: ${chkLayoutReversed.checked ? "Enabled" : "Disabled"}`,
          "info",
          "Settings",
        );
      }
    });
  }

  // External Community Links
  externalLinkCards.forEach((card) => {
    card.addEventListener("click", (e) => {
      e.preventDefault();
      const url = card.getAttribute("data-url");
      if (url && window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(url);
      }
    });
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

  if (chkSmartClickThrough) {
    chkSmartClickThrough.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          smartClickThrough: chkSmartClickThrough.checked,
        });
        appendLog(
          `Smart Click-Through set to: ${chkSmartClickThrough.checked ? "Enabled" : "Disabled"}`,
          "info",
          "Settings",
        );
      }
    });
  }

  chkClickThrough.addEventListener("change", () => {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        isIgnoringMouseEvents: chkClickThrough.checked,
      });
    }
  });

  if (chkShowBoundaryCorners) {
    chkShowBoundaryCorners.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          showBoundaryCorners: chkShowBoundaryCorners.checked,
        });
        appendLog(
          `Window Boundary Corners set to: ${chkShowBoundaryCorners.checked ? "Visible" : "Hidden"}`,
          "info",
          "Settings",
        );
      }
    });
  }

  if (chkHideOfflineEnabled) {
    chkHideOfflineEnabled.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          hideOfflineEnabled: chkHideOfflineEnabled.checked,
        });
        appendLog(
          `Hide Inactive Offline Streamers set to: ${chkHideOfflineEnabled.checked ? "Enabled" : "Disabled"}`,
          "info",
          "Settings",
        );
        renderStreamersList(localStreamers);
      }
    });
  }

  if (inputHideOfflineDays) {
    inputHideOfflineDays.addEventListener("change", (e) => {
      const val = Math.max(1, Math.min(365, parseInt(e.target.value, 10) || 7));
      e.target.value = String(val);
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          hideOfflineDays: val,
        });
        appendLog(
          `Hide Offline threshold set to: ${val} day(s)`,
          "info",
          "Settings",
        );
        renderStreamersList(localStreamers);
      }
    });
  }

  // Multiple Window States Handlers
  function renderWindowStatesUI(count, activeIndex) {
    const total = Math.max(1, parseInt(count, 10) || 1);
    const active = Math.max(
      0,
      Math.min(total - 1, parseInt(activeIndex, 10) || 0),
    );

    if (inputWindowStatesCount) {
      inputWindowStatesCount.value = String(total);
    }

    if (windowStateBadge) {
      windowStateBadge.textContent = `State ${active + 1} of ${total}`;
    }

    if (windowStatesButtons) {
      windowStatesButtons.innerHTML = "";
      for (let i = 0; i < total; i++) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = `btn-size-preset ${i === active ? "active" : ""}`;
        btn.textContent = `State ${i + 1}`;
        btn.setAttribute("data-state-index", String(i));
        btn.addEventListener("click", () => {
          if (window.electronAPI && window.electronAPI.setWindowStateIndex) {
            window.electronAPI.setWindowStateIndex(i);
          }
        });
        windowStatesButtons.appendChild(btn);
      }
    }
  }

  if (inputWindowStatesCount) {
    inputWindowStatesCount.addEventListener("change", (e) => {
      const val = Math.max(1, Math.min(10, parseInt(e.target.value, 10) || 1));
      e.target.value = String(val);
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          windowStatesCount: val,
        });
        appendLog(
          `Multiple Window States count set to: ${val}`,
          "info",
          "Settings",
        );
      }
    });
  }

  // Opacity radios
  opacityRadios.forEach((radio) => {
    radio.addEventListener("change", () => {
      if (
        radio.checked &&
        window.electronAPI &&
        window.electronAPI.updateSettings
      ) {
        window.electronAPI.updateSettings({
          currentOpacity: parseFloat(radio.value),
        });
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

  // Sync settings
  function applySettingsToUI(settings) {
    if (!settings) return;

    if (settings.sortBy) {
      sortRadios.forEach((radio) => {
        radio.checked = radio.value === settings.sortBy;
      });
    }

    if (settings.avatarSize) {
      updateAvatarSizeUI(settings.avatarSize);
    }

    if (settings.fontSize) {
      updateFontSizeUI(settings.fontSize);
    }

    if (settings.avatarAlignment) {
      updateAlignmentUI(settings.avatarAlignment);
    }

    if (settings.layoutOrientation) {
      orientationRadios.forEach((radio) => {
        radio.checked = radio.value === settings.layoutOrientation;
      });
    }

    if (typeof settings.layoutReversed === "boolean" && chkLayoutReversed) {
      chkLayoutReversed.checked = settings.layoutReversed;
    }

    if (typeof settings.showNicknameTag === "boolean" && chkShowNicknameTag) {
      chkShowNicknameTag.checked = settings.showNicknameTag;
    }

    if (typeof settings.overlayVisible === "boolean") {
      chkShowOverlay.checked = settings.overlayVisible;
    }
    if (typeof settings.isAlwaysOnTop === "boolean") {
      chkAlwaysOnTop.checked = settings.isAlwaysOnTop;
    }
    if (
      typeof settings.smartClickThrough === "boolean" &&
      chkSmartClickThrough
    ) {
      chkSmartClickThrough.checked = settings.smartClickThrough;
    }
    if (typeof settings.isIgnoringMouseEvents === "boolean") {
      chkClickThrough.checked = settings.isIgnoringMouseEvents;
    }
    if (
      typeof settings.showBoundaryCorners === "boolean" &&
      chkShowBoundaryCorners
    ) {
      chkShowBoundaryCorners.checked = settings.showBoundaryCorners;
    }
    if (
      typeof settings.hideOfflineEnabled === "boolean" &&
      chkHideOfflineEnabled
    ) {
      chkHideOfflineEnabled.checked = settings.hideOfflineEnabled;
    }
    if (settings.hideOfflineDays && inputHideOfflineDays) {
      inputHideOfflineDays.value = String(settings.hideOfflineDays);
    }
    renderWindowStatesUI(
      settings.windowStatesCount || 1,
      settings.currentWindowStateIndex || 0,
    );
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

  // Initial load
  resetStreamerForm();
  if (window.electronAPI) {
    try {
      if (window.electronAPI.getSettings) {
        const initialSettings = await window.electronAPI.getSettings();
        applySettingsToUI(initialSettings);
      }
    } catch (err) {
      console.error("Failed to load initial settings:", err);
    }

    try {
      if (window.electronAPI.getLogHistory) {
        const history = await window.electronAPI.getLogHistory();
        if (Array.isArray(history) && history.length > 0) {
          history.forEach((entry) => logToDevToolsConsole(entry));
          displayLatestLogUI(history[history.length - 1]);
        }
      }
    } catch (err) {
      console.error("Failed to load initial log history:", err);
    }
  }

  // Listen for live backend logs
  if (window.electronAPI && window.electronAPI.onLogEntry) {
    window.electronAPI.onLogEntry((entry) => {
      handleLogEntry(entry, true);
    });
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
