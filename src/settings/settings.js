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

  // Streamer Form Elements
  const streamerForm = document.getElementById("streamer-form");
  const editStreamerIdInput = document.getElementById("edit-streamer-id");
  const formSectionTitle = document.getElementById("form-section-title");
  const btnCancelEdit = document.getElementById("btn-cancel-edit");
  const btnSubmitText = document.getElementById("btn-submit-text");

  const streamerNameInput = document.getElementById("streamer-name-input");
  const streamerAvatarInput = document.getElementById("streamer-avatar-input");
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
  const chkClickThrough = document.getElementById("chk-click-through");
  const opacityRadios = document.querySelectorAll('input[name="opacity"]');

  const btnCenterOverlay = document.getElementById("btn-center-overlay");
  const btnToggleOverlay = document.getElementById("btn-toggle-overlay");
  const btnQuitApp = document.getElementById("btn-quit-app");
  const btnOpenDevTools = document.getElementById("btn-open-devtools");
  const btnClearLogs = document.getElementById("btn-clear-logs");
  const logTerminal = document.getElementById("log-terminal");

  let localStreamers = [];
  const petTaskStates = new Map();

  // Logging helper
  function appendLog(message, type = "info", tag = "LiveCheck") {
    const timestamp = new Date().toLocaleTimeString();

    if (type === "error") {
      console.error(`[${tag} ${timestamp}]`, message);
    } else {
      console.log(`[${tag} ${timestamp}]`, message);
    }

    if (window.electronAPI && window.electronAPI.logTerminal) {
      window.electronAPI.logTerminal(tag, message, type === "error");
    }

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

  // Clear logs
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

  // Format viewer count
  function formatViewerCount(num) {
    if (num === null || num === undefined) return "";
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Number(num).toLocaleString();
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

  // URL builder row management with per-link frequency in minutes
  function createUrlRow(entry = { url: "", freqMinutes: 1 }) {
    const rawUrl = typeof entry === "string" ? entry : entry?.url || "";
    const rawFreq =
      typeof entry === "object" && entry?.freqMinutes ? entry.freqMinutes : 1;

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

    // Frequency in minutes input
    const freqWrapper = document.createElement("div");
    freqWrapper.className = "url-freq-wrapper";
    freqWrapper.title =
      "Check frequency for this link in minutes (Checks at minute counter % freq == 0)";

    const freqLabel = document.createElement("span");
    freqLabel.className = "url-freq-label";
    freqLabel.textContent = "Freq:";

    const freqInput = document.createElement("input");
    freqInput.type = "number";
    freqInput.className = "input-url-freq";
    freqInput.min = "1";
    freqInput.step = "1";
    freqInput.value = String(Math.max(1, parseInt(rawFreq, 10) || 1));

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
        freqInput.value = "1";
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
      urlsInputList.appendChild(createUrlRow({ url: "", freqMinutes: 1 }));
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
          ? Math.max(1, parseInt(freqInp.value, 10) || 1)
          : 1;
        return { url, freqMinutes };
      })
      .filter((item) => item.url.length > 0);
  }

  if (btnAddUrlRow) {
    btnAddUrlRow.addEventListener("click", () => {
      urlsInputList.appendChild(createUrlRow({ url: "", freqMinutes: 1 }));
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
    setFormUrls([{ url: "", freqMinutes: 1 }]);

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

    appendLog(
      `[${streamerName}] Start Sleep - Dispatched to Node.js backend (2s async task)...`,
      "info",
      "PetTask",
    );

    try {
      if (window.electronAPI && window.electronAPI.runPetAvatarTask) {
        const result = await window.electronAPI.runPetAvatarTask(streamerName);
        if (result.success) {
          petTaskStates.set(streamer.id, "success");
          updateItemPetTaskUI(itemElement, streamer.id);
          appendLog(
            `[${streamerName}] End Sleep - Success! [Node.js Crypto: ${result.cryptoRandom}]`,
            "success",
            "PetTask",
          );
        } else {
          petTaskStates.set(streamer.id, "error");
          updateItemPetTaskUI(itemElement, streamer.id);
          appendLog(
            `[${streamerName}] Error sleep - ${result.error}`,
            "error",
            "PetTask",
          );
        }
      }
    } catch (err) {
      petTaskStates.set(streamer.id, "error");
      updateItemPetTaskUI(itemElement, streamer.id);
      appendLog(
        `[${streamerName}] Error sleep - ${err.message}`,
        "error",
        "PetTask",
      );
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
        snoozeBtn.innerHTML = `💤 Snoozed (Click to Un-snooze)`;
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
        statusBadgeHtml = `<span class="status-indicator status-offline">⚪ Offline (${lastCheckedStr})</span>`;
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
        setFormUrls([
          { url: "https://www.youtube.com/@LofiGirl/live", freqMinutes: 1 },
        ]);
      } else if (preset === "shroud") {
        streamerNameInput.value = "Shroud";
        streamerAvatarInput.value = "";
        setFormUrls([
          { url: "https://www.twitch.tv/shroud", freqMinutes: 1 },
          { url: "https://www.youtube.com/@shroud/live", freqMinutes: 2 },
        ]);
      } else if (preset === "xqc") {
        streamerNameInput.value = "xQc";
        streamerAvatarInput.value = "";
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

  // Reset defaults
  btnResetDefaults.addEventListener("click", async () => {
    const defaultStreamers = [
      {
        id: "yt-lofigirl",
        name: "Lofi Girl",
        avatarImage: "",
        urls: [
          { url: "https://www.youtube.com/@LofiGirl/live", freqMinutes: 1 },
        ],
        triggers: {
          titleChange: true,
          viewerCountEnabled: false,
          viewerCountThreshold: 5000,
          goingLive: true,
          categoryChange: true,
        },
      },
      {
        id: "tw-shroud",
        name: "Shroud",
        avatarImage: "",
        urls: [
          { url: "https://www.twitch.tv/shroud", freqMinutes: 1 },
          { url: "https://www.youtube.com/@shroud/live", freqMinutes: 2 },
        ],
        triggers: {
          titleChange: true,
          viewerCountEnabled: false,
          viewerCountThreshold: 10000,
          goingLive: true,
          categoryChange: true,
        },
      },
      {
        id: "kc-xqc",
        name: "xQc",
        avatarImage: "",
        urls: [
          { url: "https://kick.com/xqc", freqMinutes: 1 },
          { url: "https://www.twitch.tv/xqcow", freqMinutes: 1 },
          { url: "https://www.youtube.com/@xQcOW/live", freqMinutes: 3 },
        ],
        triggers: {
          titleChange: true,
          viewerCountEnabled: true,
          viewerCountThreshold: 20000,
          goingLive: true,
          categoryChange: true,
        },
      },
    ];

    petTaskStates.clear();
    if (window.electronAPI && window.electronAPI.updateStreamers) {
      const updated =
        await window.electronAPI.updateStreamers(defaultStreamers);
      renderStreamersList(updated);
      appendLog(
        "Reset streamers to defaults (Lofi Girl, Shroud, xQc).",
        "info",
        "Streamer",
      );
    }
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

    if (typeof settings.showNicknameTag === "boolean" && chkShowNicknameTag) {
      chkShowNicknameTag.checked = settings.showNicknameTag;
    }

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

  // Initial load
  setFormUrls([{ url: "", freqMinutes: 1 }]);
  if (window.electronAPI) {
    try {
      if (window.electronAPI.getSettings) {
        const initialSettings = await window.electronAPI.getSettings();
        applySettingsToUI(initialSettings);
      }
    } catch (err) {
      console.error("Failed to load initial settings:", err);
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
