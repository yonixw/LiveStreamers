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
  const streamerCheckOfflineFreq = document.getElementById(
    "streamer-check-offline-freq",
  );
  const streamerCheckOnlineFreq = document.getElementById(
    "streamer-check-online-freq",
  );
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
  const trigViewerStepEnabled = document.getElementById(
    "trig-viewer-step-enabled",
  );
  const trigViewerStepCount = document.getElementById("trig-viewer-step-count");
  const trigRuntimeEnabled = document.getElementById("trig-runtime-enabled");
  const trigRuntimeThreshold = document.getElementById(
    "trig-runtime-threshold",
  );
  const trigRuntimeIntervalEnabled = document.getElementById(
    "trig-runtime-interval-enabled",
  );
  const trigRuntimeIntervalHours = document.getElementById(
    "trig-runtime-interval-hours",
  );
  const trigRuntimeIntervalMinutes = document.getElementById(
    "trig-runtime-interval-minutes",
  );
  const streamerAutoSnoozeEnabled = document.getElementById(
    "streamer-auto-snooze-enabled",
  );
  const streamerAutoSnoozeKeywords = document.getElementById(
    "streamer-auto-snooze-keywords",
  );
  const streamerAutoSnoozeDuration = document.getElementById(
    "streamer-auto-snooze-duration",
  );

  // Streamers List Elements
  const streamersListEl = document.getElementById("streamers-list");
  const streamerCountLabel = document.getElementById("streamer-count-label");
  const inputSearchStreamers = document.getElementById(
    "input-search-streamers",
  );
  const btnClearSearch = document.getElementById("btn-clear-search");
  const btnResetDefaults = document.getElementById("btn-reset-defaults");
  const btnCheckAll = document.getElementById("btn-check-all");
  const presetButtons = document.querySelectorAll(".btn-preset");

  // Delete Streamer Dialog Elements
  const deleteStreamerDialog = document.getElementById(
    "delete-streamer-dialog",
  );
  const deleteStreamerNameEl = document.getElementById("delete-streamer-name");
  const btnCancelDelete = document.getElementById("btn-cancel-delete");
  const btnConfirmDelete = document.getElementById("btn-confirm-delete");
  let streamerIdToDelete = null;

  // Window Controls
  const chkShowNicknameTag = document.getElementById("chk-show-nickname-tag");
  const selectInfoLinesTheme = document.getElementById(
    "select-info-lines-theme",
  );
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
  const inputHideOfflineHours = document.getElementById(
    "input-hide-offline-hours",
  );
  const chkAutoSnoozeKeywordsEnabled = document.getElementById(
    "chk-auto-snooze-keywords-enabled",
  );
  const inputAutoSnoozeKeywords = document.getElementById(
    "input-auto-snooze-keywords",
  );
  const inputAutoSnoozeDurationHours = document.getElementById(
    "input-auto-snooze-duration-hours",
  );
  const inputWindowStatesCount = document.getElementById(
    "input-window-states-count",
  );
  const windowStatesButtons = document.getElementById("window-states-buttons");
  const windowStateBadge = document.getElementById("window-state-badge");
  const opacitySlider = document.getElementById("opacity-slider");
  const opacityValDisplay = document.getElementById("opacity-val-display");
  const tooltipOpacitySlider = document.getElementById(
    "tooltip-opacity-slider",
  );
  const tooltipOpacityValDisplay = document.getElementById(
    "tooltip-opacity-val-display",
  );

  const btnCenterOverlay = document.getElementById("btn-center-overlay");
  const btnToggleOverlay = document.getElementById("btn-toggle-overlay");
  const btnQuitApp = document.getElementById("btn-quit-app");
  const btnOpenDevTools = document.getElementById("btn-open-devtools");
  const btnClearLogs = document.getElementById("btn-clear-logs");
  const logTerminal = document.getElementById("log-terminal");

  // Debug Trigger Simulator Elements
  const selectSimulatorStreamer = document.getElementById(
    "select-simulator-streamer",
  );
  const btnSearchSimulatorStreamer = document.getElementById(
    "btn-search-simulator-streamer",
  );
  const btnOpenSimulatorSearch = document.getElementById(
    "btn-open-simulator-search",
  );
  const selectSimulatorPreset = document.getElementById(
    "select-simulator-preset",
  );
  const simulatorJsonPayload = document.getElementById(
    "simulator-json-payload",
  );
  const btnResetSimulatorJson = document.getElementById(
    "btn-reset-simulator-json",
  );
  const btnFireMockMetadata = document.getElementById("btn-fire-mock-metadata");
  const simulatorResultBox = document.getElementById("simulator-result-box");
  const simulatorResultBadge = document.getElementById(
    "simulator-result-badge",
  );
  const simulatorResultContent = document.getElementById(
    "simulator-result-content",
  );

  // Common Group Rules Elements (Action -> Streamers[] & Color -> Streamers[])
  const btnAddActionRule = document.getElementById("btn-add-action-rule");
  const actionRuleEditor = document.getElementById("action-rule-editor");
  const actionRuleIdInput = document.getElementById("action-rule-id");
  const actionRuleNameInput = document.getElementById("action-rule-name");
  const actionRuleCommandInput = document.getElementById("action-rule-command");
  const btnBrowseCommand = document.getElementById("btn-browse-command");
  const btnActionDeselectAll = document.getElementById(
    "btn-action-deselect-all",
  );
  const btnSearchAddActionStreamer = document.getElementById(
    "btn-search-add-action-streamer",
  );
  const actionAssignedCount = document.getElementById("action-assigned-count");
  const actionAssignedStreamersContainer = document.getElementById(
    "action-assigned-streamers-container",
  );
  const btnTestActionRule = document.getElementById("btn-test-action-rule");
  const actionTestResult = document.getElementById("action-test-result");
  const btnCancelActionRule = document.getElementById("btn-cancel-action-rule");
  const btnSaveActionRule = document.getElementById("btn-save-action-rule");
  const actionRulesListEl = document.getElementById("action-rules-list");

  const btnAddColorRule = document.getElementById("btn-add-color-rule");
  const colorRuleEditor = document.getElementById("color-rule-editor");
  const colorRuleIdInput = document.getElementById("color-rule-id");
  const colorRuleNameInput = document.getElementById("color-rule-name");
  const colorRulePicker = document.getElementById("color-rule-picker");
  const colorRuleHex = document.getElementById("color-rule-hex");
  const colorRulePatternSelect = document.getElementById("color-rule-pattern");
  const colorRuleSecondaryPicker = document.getElementById(
    "color-rule-secondary-picker",
  );
  const colorRuleSecondaryHex = document.getElementById(
    "color-rule-secondary-hex",
  );
  const colorRulePreviewCircle = document.getElementById(
    "color-rule-preview-circle",
  );
  const colorRulePreviewTag = document.getElementById("color-rule-preview-tag");
  const colorPresetButtons = document.querySelectorAll(".btn-color-dot");
  const secondaryColorPresetButtons = document.querySelectorAll(
    ".btn-secondary-color-dot",
  );
  const btnColorDeselectAll = document.getElementById("btn-color-deselect-all");
  const btnSearchAddColorStreamer = document.getElementById(
    "btn-search-add-color-streamer",
  );
  const colorAssignedCount = document.getElementById("color-assigned-count");
  const colorAssignedStreamersContainer = document.getElementById(
    "color-assigned-streamers-container",
  );
  const btnCancelColorRule = document.getElementById("btn-cancel-color-rule");
  const btnSaveColorRule = document.getElementById("btn-save-color-rule");
  const colorRulesListEl = document.getElementById("color-rules-list");

  // Unified Streamer Search Modal Elements
  const streamerSearchModal = document.getElementById("streamer-search-modal");
  const streamerSearchModalTitle = document.getElementById(
    "streamer-search-modal-title",
  );
  const streamerSearchModalSubtitle = document.getElementById(
    "streamer-search-modal-subtitle",
  );
  const streamerSearchModalInput = document.getElementById(
    "streamer-search-modal-input",
  );
  const btnClearStreamerSearchModal = document.getElementById(
    "btn-clear-streamer-search-modal",
  );
  const streamerSearchResults = document.getElementById(
    "streamer-search-modal-results",
  );
  const btnCloseStreamerSearchModal = document.getElementById(
    "btn-close-streamer-search-modal",
  );
  const btnCancelStreamerSearch = document.getElementById(
    "btn-cancel-streamer-search",
  );

  let activeSearchModalCallback = null;
  let activeSearchModalGetContext = null;

  let editingActionStreamerIds = [];
  let editingColorStreamerIds = [];

  let localStreamers = [];
  let localActionRules = [];
  let localColorRules = [];
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

  // --- Debug Trigger Simulator Logic ---
  function getSimulatorPresetPayload(presetKey, targetStreamer = null) {
    const sName = targetStreamer ? targetStreamer.name : "Streamer";
    const nowIso = new Date().toISOString();

    switch (presetKey) {
      case "going-live":
        return {
          isLive: true,
          title: `🔴 LIVE! ${sName} Starting Community Stream`,
          category: "Just Chatting",
          viewerCount: 8500,
          startTime: nowIso,
        };
      case "title-change":
        return {
          isLive: true,
          title: `🏆 GRAND FINALS! ${sName} Match 5 Decider [Drops Enabled]`,
          category: "Valorant",
          viewerCount: 24500,
          startTime: new Date(Date.now() - 3600000).toISOString(),
        };
      case "category-change":
        return {
          isLive: true,
          title: `Switching games now! Testing new season patch`,
          category: "Apex Legends",
          viewerCount: 16800,
          startTime: new Date(Date.now() - 7200000).toISOString(),
        };
      case "viewer-spike":
        return {
          isLive: true,
          title: `RAID INCOMING! 50k Viewers Hype Train with ${sName}`,
          category: "Gaming",
          viewerCount: 52000,
          startTime: new Date(Date.now() - 5400000).toISOString(),
        };
      case "going-offline":
        return {
          isLive: false,
          title: null,
          category: null,
          viewerCount: null,
        };
      default:
        return {
          isLive: true,
          title: `${sName} Live Stream Simulation`,
          category: "Variety",
          viewerCount: 12000,
          startTime: nowIso,
        };
    }
  }

  function updateSimulatorJsonTextarea() {
    if (!simulatorJsonPayload) return;
    const preset = selectSimulatorPreset?.value || "going-live";
    const sId = selectSimulatorStreamer?.value;
    const streamer = localStreamers.find((s) => s.id === sId) || null;
    const payload = getSimulatorPresetPayload(preset, streamer);
    simulatorJsonPayload.value = JSON.stringify(payload, null, 2);
  }

  function populateSimulatorStreamers() {
    if (!selectSimulatorStreamer) return;
    const currentVal = selectSimulatorStreamer.value;
    selectSimulatorStreamer.innerHTML = "";
    if (localStreamers.length === 0) {
      const opt = document.createElement("option");
      opt.value = "";
      opt.textContent = "No streamers available";
      selectSimulatorStreamer.appendChild(opt);
      return;
    }
    localStreamers.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.id})`;
      selectSimulatorStreamer.appendChild(opt);
    });
    if (currentVal && localStreamers.some((s) => s.id === currentVal)) {
      selectSimulatorStreamer.value = currentVal;
    }
  }

  if (selectSimulatorPreset) {
    selectSimulatorPreset.addEventListener(
      "change",
      updateSimulatorJsonTextarea,
    );
  }
  if (selectSimulatorStreamer) {
    selectSimulatorStreamer.addEventListener(
      "change",
      updateSimulatorJsonTextarea,
    );
  }
  if (btnResetSimulatorJson) {
    btnResetSimulatorJson.addEventListener(
      "click",
      updateSimulatorJsonTextarea,
    );
  }

  function openSimulatorStreamerSearch() {
    openStreamerSearchModal({
      title: "Select Debug Target Streamer",
      subtitle: "Search streamer by name, nickname, or notes",
      getContext: (s) => s.note || "",
      onSelect: (streamer) => {
        if (selectSimulatorStreamer) {
          selectSimulatorStreamer.value = streamer.id;
          updateSimulatorJsonTextarea();
        }
      },
    });
  }

  if (btnSearchSimulatorStreamer) {
    btnSearchSimulatorStreamer.addEventListener(
      "click",
      openSimulatorStreamerSearch,
    );
  }
  if (btnOpenSimulatorSearch) {
    btnOpenSimulatorSearch.addEventListener(
      "click",
      openSimulatorStreamerSearch,
    );
  }

  if (btnFireMockMetadata) {
    btnFireMockMetadata.addEventListener("click", async () => {
      const streamerId = selectSimulatorStreamer?.value;
      if (!streamerId) {
        alert("Please select a target streamer for simulation.");
        return;
      }

      let payloadObj;
      try {
        payloadObj = JSON.parse(simulatorJsonPayload?.value || "{}");
      } catch (err) {
        alert(`Invalid JSON payload format: ${err.message}`);
        simulatorJsonPayload?.focus();
        return;
      }

      try {
        if (btnFireMockMetadata) {
          btnFireMockMetadata.disabled = true;
          btnFireMockMetadata.textContent = "Injecting...";
        }

        const res = await window.electronAPI.injectMockMetadata({
          streamerId,
          metadata: payloadObj,
        });

        if (simulatorResultBox) {
          simulatorResultBox.style.display = "block";
          if (res && res.success) {
            if (simulatorResultBadge) {
              simulatorResultBadge.className = `rule-card-badge ${res.isLive ? "status-live" : "status-offline"}`;
              simulatorResultBadge.textContent = res.isLive
                ? "Live Injected"
                : "Offline Injected";
            }
            if (simulatorResultContent) {
              let triggerHtml =
                "<span style='color:var(--text-muted);'>No trigger rule matched</span>";
              if (res.firedTrigger) {
                triggerHtml = `<strong style='color:#ffe600;'>⚡ ${res.firedTrigger.label}:</strong> ${res.firedTrigger.message}`;
              }
              simulatorResultContent.innerHTML = `
                <div><strong>Streamer:</strong> ${res.streamerName} (${res.streamerId})</div>
                <div><strong>Status:</strong> ${res.isLive ? "LIVE 🟢" : "OFFLINE ⚫"}</div>
                <div><strong>Trigger Evaluated:</strong> ${triggerHtml}</div>
                ${
                  res.autoSnooze
                    ? `<div><strong>Auto-Snooze:</strong> <span style='color:#f59e0b;'>💤 Auto-snoozed for ${res.autoSnooze.durationHours}h (matched "${res.autoSnooze.matchedKeyword}")</span></div>`
                    : ""
                }
                ${
                  res.cachedInfo
                    ? `<div><strong>Metadata:</strong> "${res.cachedInfo.title}" • <em>${res.cachedInfo.category || "No game"}</em> • ${res.cachedInfo.viewerCount ? Number(res.cachedInfo.viewerCount).toLocaleString() + " viewers" : "N/A"}</div>`
                    : ""
                }
              `;
            }
            appendLog(
              `[Simulator] Injected metadata for ${res.streamerName} (${res.isLive ? "LIVE" : "OFFLINE"})${res.firedTrigger ? ` - ⚡ Trigger: ${res.firedTrigger.label}` : ""}`,
              "info",
              "Simulator",
            );
          } else {
            if (simulatorResultBadge) {
              simulatorResultBadge.className = "rule-card-badge status-offline";
              simulatorResultBadge.textContent = "Error";
            }
            if (simulatorResultContent) {
              simulatorResultContent.textContent =
                res?.error || "Simulation failed";
            }
          }
        }
      } catch (err) {
        if (simulatorResultBox) {
          simulatorResultBox.style.display = "block";
          if (simulatorResultBadge) {
            simulatorResultBadge.className = "rule-card-badge status-offline";
            simulatorResultBadge.textContent = "Error";
          }
          if (simulatorResultContent) {
            simulatorResultContent.textContent = err.message || String(err);
          }
        }
      } finally {
        if (btnFireMockMetadata) {
          btnFireMockMetadata.disabled = false;
          btnFireMockMetadata.innerHTML = `
            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon>
            </svg>
            Fire Mock Metadata
          `;
        }
      }
    });
  }

  // Helper functions for escaping HTML and search highlights
  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  function highlightMatchHtml(text, query) {
    if (!text) return "";
    if (!query) return escapeHtml(text);
    const escapedText = escapeHtml(text);
    const escapedQuery = escapeHtml(query);
    const regex = new RegExp(
      `(${escapedQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`,
      "gi",
    );
    return escapedText.replace(
      regex,
      '<span class="search-match-highlight">$1</span>',
    );
  }

  function getContextSnippetHtml(contextStr, query, maxChars = 250) {
    if (!contextStr) return "";
    const str = String(contextStr).trim();
    if (!str) return "";
    if (!query) {
      const truncated =
        str.length > maxChars ? str.slice(0, maxChars) + "..." : str;
      return escapeHtml(truncated);
    }

    const queryLower = query.toLowerCase();
    const contextLower = str.toLowerCase();
    const idx = contextLower.indexOf(queryLower);

    if (idx === -1) {
      const truncated =
        str.length > maxChars ? str.slice(0, maxChars) + "..." : str;
      return escapeHtml(truncated);
    }

    const leadChars = 40;
    let start = Math.max(0, idx - leadChars);
    let end = Math.min(str.length, start + maxChars);
    if (end - start < maxChars && start > 0) {
      start = Math.max(0, end - maxChars);
    }

    const snippet = str.substring(start, end);
    const prefix = start > 0 ? "... " : "";
    const suffix = end < str.length ? " ..." : "";

    const highlightedSnippet = highlightMatchHtml(snippet, query);
    return `${prefix}${highlightedSnippet}${suffix}`;
  }

  // --- Unified Streamer Search Modal Controller ---
  function closeStreamerSearchModal() {
    if (
      streamerSearchModal &&
      typeof streamerSearchModal.close === "function"
    ) {
      streamerSearchModal.close();
    }
    activeSearchModalCallback = null;
    activeSearchModalGetContext = null;
  }

  if (btnCloseStreamerSearchModal) {
    btnCloseStreamerSearchModal.addEventListener(
      "click",
      closeStreamerSearchModal,
    );
  }
  if (btnCancelStreamerSearch) {
    btnCancelStreamerSearch.addEventListener("click", closeStreamerSearchModal);
  }
  if (btnClearStreamerSearchModal) {
    btnClearStreamerSearchModal.addEventListener("click", () => {
      if (streamerSearchModalInput) {
        streamerSearchModalInput.value = "";
        streamerSearchModalInput.focus();
        renderSearchModalResults();
      }
    });
  }

  function renderSearchModalResults() {
    if (!streamerSearchResults || !streamerSearchModalInput) return;
    const query = streamerSearchModalInput.value.trim();
    if (btnClearStreamerSearchModal) {
      btnClearStreamerSearchModal.style.display =
        query.length > 0 ? "block" : "none";
    }

    // Do not show the list until a search is in the text input, and do not show more than 20 for performance reasons.
    if (!query) {
      streamerSearchResults.innerHTML = `
        <div class="streamer-search-empty-prompt">
          🔍 Type in the search box above to find streamers by nickname, name, or notes.<br>
          <span style="font-size: 0.75rem; opacity: 0.8; margin-top: 4px; display: inline-block;">(Displays up to 20 matching results)</span>
        </div>
      `;
      return;
    }

    const queryLower = query.toLowerCase();
    const matches = [];

    for (let i = 0; i < localStreamers.length; i++) {
      const s = localStreamers[i];
      const name = s.name || "";
      const nickname = s.nickname || s.name || "";
      const id = s.id || "";
      let context = "";
      if (typeof activeSearchModalGetContext === "function") {
        context = activeSearchModalGetContext(s, i) || "";
      } else {
        context = s.note || "";
      }

      const nameMatch = name.toLowerCase().includes(queryLower);
      const nickMatch = nickname.toLowerCase().includes(queryLower);
      const idMatch = id.toLowerCase().includes(queryLower);
      const contextMatch = context.toLowerCase().includes(queryLower);

      if (nameMatch || nickMatch || idMatch || contextMatch) {
        matches.push({
          streamer: s,
          index: i,
          name,
          nickname,
          context,
          nameMatch,
          nickMatch,
          contextMatch,
        });
      }

      if (matches.length >= 20) {
        break;
      }
    }

    if (matches.length === 0) {
      streamerSearchResults.innerHTML = `
        <div class="streamer-search-empty-prompt">
          No streamers found matching <strong>"${escapeHtml(query)}"</strong>.
        </div>
      `;
      return;
    }

    streamerSearchResults.innerHTML = "";
    matches.forEach(
      ({ streamer, index, name, nickname, context, contextMatch }) => {
        const itemEl = document.createElement("div");
        itemEl.className = "streamer-search-item";

        const leftEl = document.createElement("div");
        leftEl.className = "streamer-search-item-left";

        // Mini Avatar
        const avatarDiv = document.createElement("div");
        avatarDiv.className = "streamer-search-avatar";
        if (streamer.avatarImage) {
          const img = document.createElement("img");
          let imgPath = streamer.avatarImage;
          if (
            !imgPath.startsWith("http") &&
            !imgPath.startsWith("data:") &&
            !imgPath.startsWith("file:")
          ) {
            imgPath = `file:///${imgPath.replace(/\\/g, "/")}`;
          }
          img.src = imgPath;
          img.alt = nickname || name;
          img.onerror = () => {
            img.remove();
            avatarDiv.textContent = getInitials(nickname || name);
          };
          avatarDiv.appendChild(img);
        } else {
          avatarDiv.textContent = getInitials(nickname || name);
        }
        leftEl.appendChild(avatarDiv);

        // Info
        const infoDiv = document.createElement("div");
        infoDiv.className = "streamer-search-info";

        const nameRow = document.createElement("div");
        nameRow.className = "streamer-search-name-row";

        const nickSpan = document.createElement("span");
        nickSpan.className = "streamer-search-nickname";
        nickSpan.innerHTML = highlightMatchHtml(nickname || name, query);
        nameRow.appendChild(nickSpan);

        if (nickname && name && nickname !== name) {
          const nameSpan = document.createElement("span");
          nameSpan.className = "streamer-search-name";
          nameSpan.innerHTML = `(${highlightMatchHtml(name, query)})`;
          nameRow.appendChild(nameSpan);
        }

        infoDiv.appendChild(nameRow);

        // Context snippet (if matched in context or has context)
        if (context) {
          const contextDiv = document.createElement("div");
          contextDiv.className = "streamer-search-context";
          contextDiv.innerHTML = getContextSnippetHtml(
            context,
            contextMatch ? query : "",
            250,
          );
          infoDiv.appendChild(contextDiv);
        }

        leftEl.appendChild(infoDiv);
        itemEl.appendChild(leftEl);

        // Select Button
        const btnSelect = document.createElement("button");
        btnSelect.type = "button";
        btnSelect.className = "btn btn-sm btn-primary";
        btnSelect.textContent = "Select";
        btnSelect.addEventListener("click", () => {
          if (typeof activeSearchModalCallback === "function") {
            activeSearchModalCallback(streamer, index);
          }
          closeStreamerSearchModal();
        });

        itemEl.appendChild(btnSelect);
        streamerSearchResults.appendChild(itemEl);
      },
    );
  }

  if (streamerSearchModalInput) {
    streamerSearchModalInput.addEventListener("input", () => {
      renderSearchModalResults();
    });
    streamerSearchModalInput.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        closeStreamerSearchModal();
      }
    });
  }

  function openStreamerSearchModal(options = {}) {
    activeSearchModalCallback = options.onSelect || null;
    activeSearchModalGetContext = options.getContext || ((s) => s.note || "");

    if (streamerSearchModalTitle) {
      streamerSearchModalTitle.textContent =
        options.title || "Search & Select Streamer";
    }
    if (streamerSearchModalSubtitle) {
      streamerSearchModalSubtitle.textContent =
        options.subtitle || "Type to search by nickname, name, or notes";
    }
    if (streamerSearchModalInput) {
      streamerSearchModalInput.value = "";
    }

    renderSearchModalResults();

    if (
      streamerSearchModal &&
      typeof streamerSearchModal.showModal === "function"
    ) {
      streamerSearchModal.showModal();
      setTimeout(() => {
        if (streamerSearchModalInput) streamerSearchModalInput.focus();
      }, 50);
    }
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

  function isStreamerOfflineHidden(streamer, hideEnabled, maxDays, maxHours) {
    if (!hideEnabled) return false;
    if (streamer.isLive) return false;
    if (!streamer.offlineSince) return true;
    try {
      const offlineTime = new Date(streamer.offlineSince).getTime();
      if (isNaN(offlineTime)) return true;
      const diffMs = Date.now() - offlineTime;
      const diffHours = diffMs / (1000 * 60 * 60);
      const days = Math.max(0, parseInt(maxDays, 10) || 0);
      const hours = Math.max(0, parseInt(maxHours, 10) || 0);
      const totalHours = days * 24 + hours;
      if (totalHours === 0) return true; // 0 days + 0 hours = hide all offline
      return diffHours > totalHours;
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

    // Deprecated old per url freq
    //freqWrapper.appendChild(freqLabel);
    //freqWrapper.appendChild(freqInput);
    //freqWrapper.appendChild(freqUnit);

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
    if (streamerCheckOfflineFreq) {
      streamerCheckOfflineFreq.value = "5";
    }
    if (streamerCheckOnlineFreq) {
      streamerCheckOnlineFreq.value = "2";
    }
    setFormUrls([{ url: "", freqMinutes: getRandomDefaultFreq() }]);

    trigGoingLive.checked = true;
    trigTitleChange.checked = true;
    if (trigTitleContainsEnabled) trigTitleContainsEnabled.checked = false;
    if (trigTitleContainsText) trigTitleContainsText.value = "";
    trigCategoryChange.checked = true;
    trigViewerEnabled.checked = false;
    trigViewerThreshold.value = "5000";
    if (trigViewerStepEnabled) trigViewerStepEnabled.checked = false;
    if (trigViewerStepCount) trigViewerStepCount.value = "100";
    if (trigRuntimeEnabled) trigRuntimeEnabled.checked = false;
    if (trigRuntimeThreshold) trigRuntimeThreshold.value = "30";
    if (trigRuntimeIntervalEnabled) trigRuntimeIntervalEnabled.checked = false;
    if (trigRuntimeIntervalHours) trigRuntimeIntervalHours.value = "0";
    if (trigRuntimeIntervalMinutes) trigRuntimeIntervalMinutes.value = "30";
    if (streamerAutoSnoozeEnabled) streamerAutoSnoozeEnabled.checked = false;
    if (streamerAutoSnoozeKeywords) streamerAutoSnoozeKeywords.value = "";
    if (streamerAutoSnoozeDuration) streamerAutoSnoozeDuration.value = "24";

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
    if (streamerCheckOfflineFreq) {
      streamerCheckOfflineFreq.value = String(
        streamer.checkFreqOfflineMinutes || 5,
      );
    }
    if (streamerCheckOnlineFreq) {
      streamerCheckOnlineFreq.value = String(
        streamer.checkFreqOnlineMinutes || 2,
      );
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
    if (trigViewerStepEnabled) {
      trigViewerStepEnabled.checked = Boolean(trig.viewerStepEnabled);
    }
    if (trigViewerStepCount) {
      trigViewerStepCount.value = String(trig.viewerStepCount || 100);
    }
    if (trigRuntimeEnabled) {
      trigRuntimeEnabled.checked = Boolean(trig.runtimeMinutesEnabled);
    }
    if (trigRuntimeThreshold) {
      trigRuntimeThreshold.value = String(trig.runtimeMinutesThreshold || 30);
    }
    if (trigRuntimeIntervalEnabled) {
      trigRuntimeIntervalEnabled.checked = Boolean(trig.runtimeIntervalEnabled);
    }
    const intervalTotalMins = Math.max(
      1,
      parseInt(trig.runtimeIntervalMinutes, 10) || 30,
    );
    if (trigRuntimeIntervalHours) {
      trigRuntimeIntervalHours.value = String(
        Math.floor(intervalTotalMins / 60),
      );
    }
    if (trigRuntimeIntervalMinutes) {
      trigRuntimeIntervalMinutes.value = String(intervalTotalMins % 60);
    }
    if (streamerAutoSnoozeEnabled) {
      streamerAutoSnoozeEnabled.checked = Boolean(
        streamer.autoSnoozeKeywordsEnabled,
      );
    }
    if (streamerAutoSnoozeKeywords) {
      streamerAutoSnoozeKeywords.value = streamer.autoSnoozeKeywords || "";
    }
    if (streamerAutoSnoozeDuration) {
      streamerAutoSnoozeDuration.value = String(
        streamer.autoSnoozeDurationHours || 24,
      );
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
    const checkFreqOfflineMinutes = streamerCheckOfflineFreq
      ? Math.max(1, parseInt(streamerCheckOfflineFreq.value, 10) || 5)
      : 5;
    const checkFreqOnlineMinutes = streamerCheckOnlineFreq
      ? Math.max(1, parseInt(streamerCheckOnlineFreq.value, 10) || 2)
      : 2;
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
      viewerStepEnabled: trigViewerStepEnabled
        ? trigViewerStepEnabled.checked
        : false,
      viewerStepCount: trigViewerStepCount
        ? Math.max(2, parseInt(trigViewerStepCount.value, 10) || 100)
        : 100,
      runtimeMinutesEnabled: trigRuntimeEnabled
        ? trigRuntimeEnabled.checked
        : false,
      runtimeMinutesThreshold: trigRuntimeThreshold
        ? Number(trigRuntimeThreshold.value) || 30
        : 30,
      runtimeIntervalEnabled: trigRuntimeIntervalEnabled
        ? trigRuntimeIntervalEnabled.checked
        : false,
      runtimeIntervalMinutes:
        Math.max(
          1,
          Math.max(0, parseInt(trigRuntimeIntervalHours?.value, 10) || 0) * 60 +
            Math.max(0, parseInt(trigRuntimeIntervalMinutes?.value, 10) || 0),
        ) || 30,
    };

    const autoSnoozeKeywordsEnabled = streamerAutoSnoozeEnabled
      ? streamerAutoSnoozeEnabled.checked
      : false;
    const autoSnoozeKeywords = streamerAutoSnoozeKeywords
      ? streamerAutoSnoozeKeywords.value.trim()
      : "";
    const autoSnoozeDurationHours = streamerAutoSnoozeDuration
      ? Math.max(1, parseInt(streamerAutoSnoozeDuration.value, 10) || 24)
      : 24;

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
            checkFreqOfflineMinutes,
            checkFreqOnlineMinutes,
            urls,
            triggers,
            autoSnoozeKeywordsEnabled,
            autoSnoozeKeywords,
            autoSnoozeDurationHours,
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
          checkFreqOfflineMinutes,
          checkFreqOnlineMinutes,
          urls,
          triggers,
          autoSnoozeKeywordsEnabled,
          autoSnoozeKeywords,
          autoSnoozeDurationHours,
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

  function escapeHtml(str) {
    if (!str) return "";
    const div = document.createElement("div");
    div.textContent = String(str);
    return div.innerHTML;
  }

  // Filter matching helper for streamer search
  function matchesStreamerFilter(streamer, query) {
    if (!query) return true;
    if (streamer.name && streamer.name.toLowerCase().includes(query))
      return true;
    if (streamer.note && streamer.note.toLowerCase().includes(query))
      return true;
    if (
      streamer.followingDate &&
      streamer.followingDate.toLowerCase().includes(query)
    )
      return true;
    if (
      streamer.activePlatform &&
      streamer.activePlatform.toLowerCase().includes(query)
    )
      return true;
    if (
      streamer.cachedInfo?.title &&
      streamer.cachedInfo.title.toLowerCase().includes(query)
    )
      return true;
    if (
      streamer.cachedInfo?.game &&
      streamer.cachedInfo.game.toLowerCase().includes(query)
    )
      return true;
    if (
      streamer.cachedInfo?.category &&
      streamer.cachedInfo.category.toLowerCase().includes(query)
    )
      return true;
    if (streamer.url && streamer.url.toLowerCase().includes(query)) return true;
    if (Array.isArray(streamer.urls)) {
      for (const entry of streamer.urls) {
        const urlStr = typeof entry === "string" ? entry : entry?.url || "";
        if (urlStr.toLowerCase().includes(query)) return true;
        const plat = detectPlatform(urlStr);
        if (plat && plat.toLowerCase().includes(query)) return true;
      }
    }
    return false;
  }

  // Render Streamers List with detailed Trigger Debugging, Per-Link Frequencies & Search Filter
  function renderStreamersList(streamers) {
    if (streamers != null) {
      localStreamers = Array.isArray(streamers) ? streamers : [];
      populateSimulatorStreamers();
      if (!simulatorJsonPayload || !simulatorJsonPayload.value) {
        updateSimulatorJsonTextarea();
      }
    }
    const query = (inputSearchStreamers?.value || "").trim().toLowerCase();
    const isSearching = query.length > 0;

    if (inputSearchStreamers) {
      inputSearchStreamers.classList.toggle("has-value", isSearching);
    }
    if (btnClearSearch) {
      btnClearSearch.style.display = isSearching ? "flex" : "none";
    }

    const liveCount = localStreamers.filter((s) => s.isLive).length;
    const filteredStreamers = isSearching
      ? localStreamers.filter((s) => matchesStreamerFilter(s, query))
      : localStreamers;

    if (isSearching) {
      streamerCountLabel.textContent = `Configured Streamers (${localStreamers.length}) • Filtered (${filteredStreamers.length}) • ${liveCount} Live`;
    } else {
      streamerCountLabel.textContent = `Configured Streamers (${localStreamers.length}) • ${liveCount} Live`;
    }

    streamersListEl.innerHTML = "";

    if (localStreamers.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-message";
      emptyLi.textContent = "No streamers added yet. Add streamer URLs above.";
      streamersListEl.appendChild(emptyLi);
      return;
    }

    if (filteredStreamers.length === 0) {
      const emptyLi = document.createElement("li");
      emptyLi.className = "empty-list-message";
      emptyLi.innerHTML = `No streamers match "<strong>${escapeHtml(inputSearchStreamers?.value.trim() || "")}</strong>". <button type="button" class="btn-link" id="btn-clear-empty-filter">Clear filter</button>`;
      streamersListEl.appendChild(emptyLi);

      const clearEmptyBtn = emptyLi.querySelector("#btn-clear-empty-filter");
      if (clearEmptyBtn) {
        clearEmptyBtn.addEventListener("click", () => {
          if (inputSearchStreamers) {
            inputSearchStreamers.value = "";
            inputSearchStreamers.classList.remove("has-value");
            if (btnClearSearch) btnClearSearch.style.display = "none";
            inputSearchStreamers.focus();
          }
          renderStreamersList(localStreamers);
        });
      }
      return;
    }

    filteredStreamers.forEach((streamer) => {
      const actualIndex = localStreamers.findIndex((s) => s.id === streamer.id);
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
          inputHideOfflineDays?.value || 0,
          inputHideOfflineHours?.value || 0,
        );
        const daysVal = parseInt(inputHideOfflineDays?.value, 10) || 0;
        const hoursVal = parseInt(inputHideOfflineHours?.value, 10) || 0;
        const durLabel =
          daysVal === 0 && hoursVal === 0
            ? "all"
            : `${daysVal > 0 ? daysVal + "d " : ""}${hoursVal > 0 ? hoursVal + "h" : ""}`.trim();
        const hiddenBadge = isHidden
          ? ` <span class="badge-hidden-offline" title="Hidden from overlay window (> ${durLabel} offline or unknown timestamp)">👁️‍🗨️ Hidden in Overlay</span>`
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
      btnUp.disabled = actualIndex <= 0;
      btnUp.addEventListener("click", () => moveStreamerOrder(actualIndex, -1));

      const btnDown = document.createElement("button");
      btnDown.type = "button";
      btnDown.className = "btn-icon-action";
      btnDown.title = "Move Down in list";
      btnDown.innerHTML = "▼";
      btnDown.disabled =
        actualIndex < 0 || actualIndex >= localStreamers.length - 1;
      btnDown.addEventListener("click", () =>
        moveStreamerOrder(actualIndex, 1),
      );

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
      deleteBtn.addEventListener("click", () => {
        streamerIdToDelete = streamer.id;
        if (deleteStreamerNameEl) {
          deleteStreamerNameEl.textContent = streamer.name || "this streamer";
        }
        if (
          deleteStreamerDialog &&
          typeof deleteStreamerDialog.showModal === "function"
        ) {
          deleteStreamerDialog.showModal();
        } else if (
          confirm(`Are you sure you want to remove "${streamer.name}"?`)
        ) {
          executeDeleteStreamer(streamer.id, streamer.name);
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

  // Execute Streamer Deletion
  async function executeDeleteStreamer(streamerId, streamerName) {
    if (!streamerId) return;
    if (editStreamerIdInput && editStreamerIdInput.value === streamerId) {
      resetStreamerForm();
    }
    if (window.electronAPI && window.electronAPI.removeStreamer) {
      const updated = await window.electronAPI.removeStreamer(streamerId);
      renderStreamersList(updated);
      appendLog(
        `Removed streamer: ${streamerName || streamerId}`,
        "info",
        "Streamer",
      );
    }
  }

  // Delete Streamer Dialog Event Listeners
  if (btnCancelDelete && deleteStreamerDialog) {
    btnCancelDelete.addEventListener("click", () => {
      streamerIdToDelete = null;
      deleteStreamerDialog.close();
    });
  }

  if (btnConfirmDelete && deleteStreamerDialog) {
    btnConfirmDelete.addEventListener("click", async () => {
      if (streamerIdToDelete) {
        const streamer = localStreamers.find(
          (s) => s.id === streamerIdToDelete,
        );
        const name = streamer ? streamer.name : streamerIdToDelete;
        const idToDelete = streamerIdToDelete;
        streamerIdToDelete = null;
        deleteStreamerDialog.close();
        await executeDeleteStreamer(idToDelete, name);
      }
    });
  }

  if (deleteStreamerDialog) {
    deleteStreamerDialog.addEventListener("click", (e) => {
      if (e.target === deleteStreamerDialog) {
        streamerIdToDelete = null;
        deleteStreamerDialog.close();
      }
    });
    deleteStreamerDialog.addEventListener("cancel", () => {
      streamerIdToDelete = null;
    });
  }

  // Search / Filter Streamers input events
  if (inputSearchStreamers) {
    inputSearchStreamers.addEventListener("input", () => {
      const hasVal = inputSearchStreamers.value.trim().length > 0;
      inputSearchStreamers.classList.toggle("has-value", hasVal);
      if (btnClearSearch) {
        btnClearSearch.style.display = hasVal ? "flex" : "none";
      }
      renderStreamersList(localStreamers);
    });

    inputSearchStreamers.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        inputSearchStreamers.value = "";
        inputSearchStreamers.classList.remove("has-value");
        if (btnClearSearch) btnClearSearch.style.display = "none";
        renderStreamersList(localStreamers);
      }
    });
  }

  if (btnClearSearch) {
    btnClearSearch.addEventListener("click", () => {
      if (inputSearchStreamers) {
        inputSearchStreamers.value = "";
        inputSearchStreamers.classList.remove("has-value");
        btnClearSearch.style.display = "none";
        inputSearchStreamers.focus();
      }
      renderStreamersList(localStreamers);
    });
  }

  // Global Ctrl+F / Cmd+F shortcut to focus search filter
  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key && e.key.toLowerCase() === "f") {
      if (inputSearchStreamers) {
        e.preventDefault();
        inputSearchStreamers.focus();
        inputSearchStreamers.select();
      }
    }
  });

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

  if (selectInfoLinesTheme) {
    selectInfoLinesTheme.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          infoLinesTheme: selectInfoLinesTheme.value,
        });
        appendLog(
          `Avatar info lines theme set to: ${selectInfoLinesTheme.value}`,
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

  const handleOfflineDurationChange = () => {
    const days = Math.max(
      0,
      Math.min(365, parseInt(inputHideOfflineDays?.value, 10) || 0),
    );
    const hours = Math.max(
      0,
      Math.min(23, parseInt(inputHideOfflineHours?.value, 10) || 0),
    );
    if (inputHideOfflineDays) inputHideOfflineDays.value = String(days);
    if (inputHideOfflineHours) inputHideOfflineHours.value = String(hours);

    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        hideOfflineDays: days,
        hideOfflineHours: hours,
      });
      appendLog(
        `Hide Offline threshold set to: ${days} day(s) ${hours} hour(s)`,
        "info",
        "Settings",
      );
      renderStreamersList(localStreamers);
    }
  };

  if (inputHideOfflineDays) {
    inputHideOfflineDays.addEventListener(
      "change",
      handleOfflineDurationChange,
    );
    inputHideOfflineDays.addEventListener("input", handleOfflineDurationChange);
  }
  if (inputHideOfflineHours) {
    inputHideOfflineHours.addEventListener(
      "change",
      handleOfflineDurationChange,
    );
    inputHideOfflineHours.addEventListener(
      "input",
      handleOfflineDurationChange,
    );
  }

  if (chkAutoSnoozeKeywordsEnabled) {
    chkAutoSnoozeKeywordsEnabled.addEventListener("change", () => {
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({
          autoSnoozeKeywordsEnabled: chkAutoSnoozeKeywordsEnabled.checked,
        });
        appendLog(
          `Auto-Snooze Keywords ${chkAutoSnoozeKeywordsEnabled.checked ? "enabled" : "disabled"}`,
          "info",
          "Settings",
        );
      }
    });
  }

  const handleAutoSnoozeSettingsChange = () => {
    const keywords = (inputAutoSnoozeKeywords?.value || "").trim();
    const duration = Math.max(
      1,
      parseInt(inputAutoSnoozeDurationHours?.value, 10) || 24,
    );
    if (inputAutoSnoozeDurationHours) {
      inputAutoSnoozeDurationHours.value = String(duration);
    }
    if (window.electronAPI && window.electronAPI.updateSettings) {
      window.electronAPI.updateSettings({
        autoSnoozeKeywords: keywords,
        autoSnoozeDurationHours: duration,
      });
      appendLog(
        `Auto-Snooze settings updated (Keywords: "${keywords}", Duration: ${duration}h)`,
        "info",
        "Settings",
      );
    }
  };

  if (inputAutoSnoozeKeywords) {
    inputAutoSnoozeKeywords.addEventListener(
      "change",
      handleAutoSnoozeSettingsChange,
    );
  }
  if (inputAutoSnoozeDurationHours) {
    inputAutoSnoozeDurationHours.addEventListener(
      "change",
      handleAutoSnoozeSettingsChange,
    );
    inputAutoSnoozeDurationHours.addEventListener(
      "input",
      handleAutoSnoozeSettingsChange,
    );
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

  // Opacity slider
  if (opacitySlider) {
    const handleOpacityChange = (e) => {
      const pct = Math.max(
        10,
        Math.min(100, parseInt(e.target.value, 10) || 100),
      );
      if (opacityValDisplay) {
        opacityValDisplay.textContent = `${pct}%`;
      }
      const opacityVal = pct / 100;
      if (window.electronAPI) {
        if (window.electronAPI.setOpacity) {
          window.electronAPI.setOpacity(opacityVal);
        }
        if (window.electronAPI.updateSettings) {
          window.electronAPI.updateSettings({
            currentOpacity: opacityVal,
          });
        }
      }
    };
    opacitySlider.addEventListener("input", handleOpacityChange);
    opacitySlider.addEventListener("change", handleOpacityChange);
  }

  // Tooltip Opacity slider
  if (tooltipOpacitySlider) {
    const handleTooltipOpacityChange = (e) => {
      const pct = Math.max(
        10,
        Math.min(100, parseInt(e.target.value, 10) || 100),
      );
      if (tooltipOpacityValDisplay) {
        tooltipOpacityValDisplay.textContent = `${pct}%`;
      }
      const opacityVal = pct / 100;
      if (window.electronAPI) {
        if (window.electronAPI.setTooltipOpacity) {
          window.electronAPI.setTooltipOpacity(opacityVal);
        }
        if (window.electronAPI.updateSettings) {
          window.electronAPI.updateSettings({
            tooltipOpacity: opacityVal,
          });
        }
      }
    };
    tooltipOpacitySlider.addEventListener("input", handleTooltipOpacityChange);
    tooltipOpacitySlider.addEventListener("change", handleTooltipOpacityChange);
  }

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

  // --- Assigned Streamers Tag/Chip Manager Helper ---
  function renderAssignedStreamersTags(
    containerEl,
    countEl,
    streamerIds,
    onRemove,
  ) {
    if (!containerEl) return;
    containerEl.innerHTML = "";
    if (countEl) countEl.textContent = String(streamerIds.length);

    if (streamerIds.length === 0) {
      const emptyMsg = document.createElement("span");
      emptyMsg.className = "empty-assigned-streamers-msg";
      emptyMsg.textContent =
        "No streamers assigned to this rule yet. Click '+ Add Streamer' to search and assign.";
      containerEl.appendChild(emptyMsg);
      return;
    }

    streamerIds.forEach((id) => {
      const streamer = localStreamers.find((s) => s.id === id);
      const displayName = streamer ? streamer.nickname || streamer.name : id;

      const chip = document.createElement("div");
      chip.className = "assigned-streamer-chip";

      // Mini avatar
      const avatarDiv = document.createElement("div");
      avatarDiv.className = "assigned-streamer-avatar";
      if (streamer && streamer.avatarImage) {
        const img = document.createElement("img");
        let imgPath = streamer.avatarImage;
        if (
          !imgPath.startsWith("http") &&
          !imgPath.startsWith("data:") &&
          !imgPath.startsWith("file:")
        ) {
          imgPath = `file:///${imgPath.replace(/\\/g, "/")}`;
        }
        img.src = imgPath;
        img.alt = displayName;
        img.onerror = () => {
          img.remove();
          avatarDiv.textContent = getInitials(displayName);
        };
        avatarDiv.appendChild(img);
      } else {
        avatarDiv.textContent = getInitials(displayName);
      }
      chip.appendChild(avatarDiv);

      const nameSpan = document.createElement("span");
      nameSpan.className = "assigned-streamer-name";
      nameSpan.textContent = displayName;
      chip.appendChild(nameSpan);

      const btnRemove = document.createElement("button");
      btnRemove.type = "button";
      btnRemove.className = "btn-remove-assigned-chip";
      btnRemove.title = `Remove ${displayName}`;
      btnRemove.textContent = "✕";
      btnRemove.addEventListener("click", () => {
        if (typeof onRemove === "function") {
          onRemove(id);
        }
      });
      chip.appendChild(btnRemove);

      containerEl.appendChild(chip);
    });
  }

  function renderAssignedActionStreamers() {
    renderAssignedStreamersTags(
      actionAssignedStreamersContainer,
      actionAssignedCount,
      editingActionStreamerIds,
      (removedId) => {
        editingActionStreamerIds = editingActionStreamerIds.filter(
          (id) => id !== removedId,
        );
        renderAssignedActionStreamers();
      },
    );
  }

  function renderAssignedColorStreamers() {
    renderAssignedStreamersTags(
      colorAssignedStreamersContainer,
      colorAssignedCount,
      editingColorStreamerIds,
      (removedId) => {
        editingColorStreamerIds = editingColorStreamerIds.filter(
          (id) => id !== removedId,
        );
        renderAssignedColorStreamers();
      },
    );
  }

  // --- Action Rules (Action -> Streamers[]) Logic ---
  function renderActionRules(rules) {
    localActionRules = Array.isArray(rules) ? rules : [];
    if (!actionRulesListEl) return;
    actionRulesListEl.innerHTML = "";

    if (localActionRules.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-rules-msg";
      emptyDiv.textContent =
        "No action rules configured yet. Click '+ Add Action Rule' to set up an on-live batch script.";
      actionRulesListEl.appendChild(emptyDiv);
      return;
    }

    localActionRules.forEach((rule) => {
      const item = document.createElement("div");
      item.className = `rule-card-item ${rule.enabled === false ? "rule-disabled" : ""}`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "rule-card-info";

      const titleRow = document.createElement("div");
      titleRow.className = "rule-card-title-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "rule-card-name";
      nameSpan.textContent = rule.name || "Action Rule";

      const enabledBadge = document.createElement("span");
      enabledBadge.className = `rule-card-badge ${rule.enabled !== false ? "status-live" : "status-offline"}`;
      enabledBadge.textContent = rule.enabled !== false ? "Active" : "Disabled";

      titleRow.appendChild(nameSpan);
      titleRow.appendChild(enabledBadge);

      const cmdSpan = document.createElement("div");
      cmdSpan.className = "rule-card-detail";
      cmdSpan.textContent = rule.command || "(no command specified)";
      cmdSpan.title = rule.command || "";

      // Streamers assigned list
      const streamersPillsDiv = document.createElement("div");
      streamersPillsDiv.className = "rule-streamers-pills";

      const assignedNames = (rule.streamerIds || [])
        .map((id) => {
          const found = localStreamers.find((s) => s.id === id);
          return found ? found.name : null;
        })
        .filter(Boolean);

      if (assignedNames.length === 0) {
        const noPill = document.createElement("span");
        noPill.className = "rule-streamer-pill";
        noPill.textContent = "0 streamers assigned";
        streamersPillsDiv.appendChild(noPill);
      } else {
        assignedNames.forEach((name) => {
          const pill = document.createElement("span");
          pill.className = "rule-streamer-pill";
          pill.textContent = name;
          streamersPillsDiv.appendChild(pill);
        });
      }

      infoDiv.appendChild(titleRow);
      infoDiv.appendChild(cmdSpan);
      infoDiv.appendChild(streamersPillsDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "rule-card-actions";

      // Edit button
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-icon-action";
      btnEdit.title = "Edit Action Rule";
      btnEdit.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      btnEdit.addEventListener("click", () => openActionRuleEditor(rule));

      // Toggle enable/disable button
      const btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "btn-sm-action";
      btnToggle.style.fontSize = "0.7rem";
      btnToggle.textContent = rule.enabled !== false ? "Disable" : "Enable";
      btnToggle.addEventListener("click", async () => {
        rule.enabled = rule.enabled === false;
        await saveActionRulesToBackend();
      });

      // Delete button
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-icon-action btn-delete";
      btnDelete.title = "Delete Action Rule";
      btnDelete.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      btnDelete.addEventListener("click", async () => {
        localActionRules = localActionRules.filter((r) => r.id !== rule.id);
        await saveActionRulesToBackend();
      });

      actionsDiv.appendChild(btnToggle);
      actionsDiv.appendChild(btnEdit);
      actionsDiv.appendChild(btnDelete);

      item.appendChild(infoDiv);
      item.appendChild(actionsDiv);
      actionRulesListEl.appendChild(item);
    });
  }

  async function saveActionRulesToBackend() {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      const updated = await window.electronAPI.updateSettings({
        actionRules: localActionRules,
      });
      if (updated && Array.isArray(updated.actionRules)) {
        localActionRules = updated.actionRules;
      }
      renderActionRules(localActionRules);
      appendLog("Action rules updated", "info", "Settings");
    }
  }

  function openActionRuleEditor(rule = null) {
    if (!actionRuleEditor) return;
    if (rule) {
      actionRuleIdInput.value = rule.id || "";
      actionRuleNameInput.value = rule.name || "";
      actionRuleCommandInput.value = rule.command || "";
      editingActionStreamerIds = Array.isArray(rule.streamerIds)
        ? [...rule.streamerIds]
        : [];
    } else {
      actionRuleIdInput.value = "";
      actionRuleNameInput.value = "";
      actionRuleCommandInput.value = "";
      editingActionStreamerIds = [];
    }
    renderAssignedActionStreamers();
    if (actionTestResult) {
      actionTestResult.style.display = "none";
      actionTestResult.textContent = "";
    }
    actionRuleEditor.style.display = "block";
    actionRuleCommandInput.focus();
  }

  function closeActionRuleEditor() {
    if (actionRuleEditor) {
      actionRuleEditor.style.display = "none";
      actionRuleIdInput.value = "";
      actionRuleNameInput.value = "";
      actionRuleCommandInput.value = "";
      editingActionStreamerIds = [];
    }
  }

  if (btnAddActionRule) {
    btnAddActionRule.addEventListener("click", () =>
      openActionRuleEditor(null),
    );
  }
  if (btnCancelActionRule) {
    btnCancelActionRule.addEventListener("click", closeActionRuleEditor);
  }
  if (btnSearchAddActionStreamer) {
    btnSearchAddActionStreamer.addEventListener("click", () => {
      openStreamerSearchModal({
        title: "Assign Streamer to Action Rule",
        subtitle: "Search streamer by nickname, name, or notes",
        getContext: (s) => s.note || "",
        onSelect: (streamer) => {
          if (!editingActionStreamerIds.includes(streamer.id)) {
            editingActionStreamerIds.push(streamer.id);
            renderAssignedActionStreamers();
          }
        },
      });
    });
  }
  if (btnActionDeselectAll) {
    btnActionDeselectAll.addEventListener("click", () => {
      editingActionStreamerIds = [];
      renderAssignedActionStreamers();
    });
  }

  if (btnBrowseCommand) {
    btnBrowseCommand.addEventListener("click", async () => {
      if (window.electronAPI && window.electronAPI.selectCommandFile) {
        const filePath = await window.electronAPI.selectCommandFile();
        if (filePath) {
          actionRuleCommandInput.value = `"${filePath}" %_1`;
        }
      }
    });
  }

  if (btnTestActionRule) {
    btnTestActionRule.addEventListener("click", async () => {
      const cmd = (actionRuleCommandInput?.value || "").trim();
      if (!cmd) {
        if (actionTestResult) {
          actionTestResult.className =
            "action-test-result-badge action-test-error";
          actionTestResult.textContent =
            "Please enter a command template first!";
          actionTestResult.style.display = "inline-block";
        }
        return;
      }
      btnTestActionRule.disabled = true;
      if (actionTestResult) {
        actionTestResult.className = "action-test-result-badge";
        actionTestResult.textContent = "Testing command...";
        actionTestResult.style.display = "inline-block";
      }

      try {
        if (window.electronAPI && window.electronAPI.testActionRule) {
          const res = await window.electronAPI.testActionRule({
            command: cmd,
            url: "https://www.youtube.com/@LofiGirl/live",
            streamerName: "Lofi Girl (Test)",
          });
          if (res.success) {
            actionTestResult.className =
              "action-test-result-badge action-test-success";
            actionTestResult.textContent = "✓ Executed successfully!";
          } else {
            actionTestResult.className =
              "action-test-result-badge action-test-error";
            actionTestResult.textContent = `✕ ${res.error || "Execution failed"}`;
          }
        }
      } catch (err) {
        if (actionTestResult) {
          actionTestResult.className =
            "action-test-result-badge action-test-error";
          actionTestResult.textContent = `✕ ${err.message}`;
        }
      } finally {
        btnTestActionRule.disabled = false;
      }
    });
  }

  if (btnSaveActionRule) {
    btnSaveActionRule.addEventListener("click", async () => {
      const command = (actionRuleCommandInput?.value || "").trim();
      if (!command) {
        alert("Please provide a command template (e.g. C:\\live.bat %_1)");
        actionRuleCommandInput?.focus();
        return;
      }

      const id = actionRuleIdInput.value || `action-rule-${Date.now()}`;
      const name = (actionRuleNameInput?.value || "").trim() || "Live Action";
      const streamerIds = [...editingActionStreamerIds];

      const existingIndex = localActionRules.findIndex((r) => r.id === id);
      const ruleObj = {
        id,
        name,
        enabled: true,
        command,
        streamerIds,
      };

      if (existingIndex >= 0) {
        localActionRules[existingIndex] = {
          ...localActionRules[existingIndex],
          ...ruleObj,
        };
      } else {
        localActionRules.push(ruleObj);
      }

      await saveActionRulesToBackend();
      closeActionRuleEditor();
    });
  }

  // --- Color Rules (Color -> Streamers[]) Logic ---
  function renderColorRules(rules) {
    localColorRules = Array.isArray(rules) ? rules : [];
    if (!colorRulesListEl) return;
    colorRulesListEl.innerHTML = "";

    if (localColorRules.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "empty-rules-msg";
      emptyDiv.textContent =
        "No custom color rules configured yet. Click '+ Add Color Rule' to assign custom avatar live borders.";
      colorRulesListEl.appendChild(emptyDiv);
      return;
    }

    localColorRules.forEach((rule) => {
      const item = document.createElement("div");
      item.className = `rule-card-item ${rule.enabled === false ? "rule-disabled" : ""}`;

      const infoDiv = document.createElement("div");
      infoDiv.className = "rule-card-info";

      const titleRow = document.createElement("div");
      titleRow.className = "rule-card-title-row";

      const nameSpan = document.createElement("span");
      nameSpan.className = "rule-card-name";
      nameSpan.textContent = rule.name || "Color Rule";

      const patternName = rule.borderPattern || "solid";
      const patternBadge = document.createElement("span");
      patternBadge.className = "rule-card-badge badge-color-preview";
      patternBadge.textContent = patternName.toUpperCase();

      const colorBadge = document.createElement("span");
      colorBadge.className = "rule-card-badge badge-color-preview";
      if (patternName === "dual-gradient" || patternName === "striped") {
        colorBadge.innerHTML = `<span class="color-swatch-mini" style="background:${rule.color || "#22c55e"};"></span><span class="color-swatch-mini" style="background:${rule.secondaryColor || "#a855f7"};"></span> ${rule.color || "#22c55e"}`;
      } else {
        colorBadge.innerHTML = `<span class="color-swatch-mini" style="background:${rule.color || "#22c55e"};"></span> ${rule.color || "#22c55e"}`;
      }

      const enabledBadge = document.createElement("span");
      enabledBadge.className = `rule-card-badge ${rule.enabled !== false ? "status-live" : "status-offline"}`;
      enabledBadge.textContent = rule.enabled !== false ? "Active" : "Disabled";

      titleRow.appendChild(nameSpan);
      titleRow.appendChild(patternBadge);
      titleRow.appendChild(colorBadge);
      titleRow.appendChild(enabledBadge);

      // Streamers assigned list
      const streamersPillsDiv = document.createElement("div");
      streamersPillsDiv.className = "rule-streamers-pills";

      const assignedNames = (rule.streamerIds || [])
        .map((id) => {
          const found = localStreamers.find((s) => s.id === id);
          return found ? found.name : null;
        })
        .filter(Boolean);

      if (assignedNames.length === 0) {
        const noPill = document.createElement("span");
        noPill.className = "rule-streamer-pill";
        noPill.textContent = "0 streamers assigned";
        streamersPillsDiv.appendChild(noPill);
      } else {
        assignedNames.forEach((name) => {
          const pill = document.createElement("span");
          pill.className = "rule-streamer-pill";
          pill.textContent = name;
          streamersPillsDiv.appendChild(pill);
        });
      }

      infoDiv.appendChild(titleRow);
      infoDiv.appendChild(streamersPillsDiv);

      const actionsDiv = document.createElement("div");
      actionsDiv.className = "rule-card-actions";

      // Edit button
      const btnEdit = document.createElement("button");
      btnEdit.type = "button";
      btnEdit.className = "btn-icon-action";
      btnEdit.title = "Edit Color Rule";
      btnEdit.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
        </svg>
      `;
      btnEdit.addEventListener("click", () => openColorRuleEditor(rule));

      // Toggle enable/disable button
      const btnToggle = document.createElement("button");
      btnToggle.type = "button";
      btnToggle.className = "btn-sm-action";
      btnToggle.style.fontSize = "0.7rem";
      btnToggle.textContent = rule.enabled !== false ? "Disable" : "Enable";
      btnToggle.addEventListener("click", async () => {
        rule.enabled = rule.enabled === false;
        await saveColorRulesToBackend();
      });

      // Delete button
      const btnDelete = document.createElement("button");
      btnDelete.type = "button";
      btnDelete.className = "btn-icon-action btn-delete";
      btnDelete.title = "Delete Color Rule";
      btnDelete.innerHTML = `
        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      `;
      btnDelete.addEventListener("click", async () => {
        localColorRules = localColorRules.filter((r) => r.id !== rule.id);
        await saveColorRulesToBackend();
      });

      actionsDiv.appendChild(btnToggle);
      actionsDiv.appendChild(btnEdit);
      actionsDiv.appendChild(btnDelete);

      item.appendChild(infoDiv);
      item.appendChild(actionsDiv);
      colorRulesListEl.appendChild(item);
    });
  }

  async function saveColorRulesToBackend() {
    if (window.electronAPI && window.electronAPI.updateSettings) {
      const updated = await window.electronAPI.updateSettings({
        colorRules: localColorRules,
      });
      if (updated && Array.isArray(updated.colorRules)) {
        localColorRules = updated.colorRules;
      }
      renderColorRules(localColorRules);
      appendLog("Color rules updated", "info", "Settings");
    }
  }

  function updateColorRulePreview() {
    if (!colorRulePreviewCircle) return;
    const color = (
      colorRuleHex?.value ||
      colorRulePicker?.value ||
      "#ef4444"
    ).trim();
    const secondaryColor = (
      colorRuleSecondaryHex?.value ||
      colorRuleSecondaryPicker?.value ||
      "#a855f7"
    ).trim();
    const pattern = colorRulePatternSelect?.value || "solid";

    colorRulePreviewCircle.style.boxShadow = `0 0 12px ${color}bf, 0 0 20px ${color}40, inset 0 0 6px ${color}80`;

    if (pattern === "dashed") {
      colorRulePreviewCircle.style.border = `4px dashed ${color}`;
      colorRulePreviewCircle.style.background = "#18181b";
    } else if (pattern === "dotted") {
      colorRulePreviewCircle.style.border = `4px dotted ${color}`;
      colorRulePreviewCircle.style.background = "#18181b";
    } else if (pattern === "double") {
      colorRulePreviewCircle.style.border = `5px double ${color}`;
      colorRulePreviewCircle.style.background = "#18181b";
    } else if (pattern === "dual-gradient") {
      colorRulePreviewCircle.style.border = `4px solid transparent`;
      colorRulePreviewCircle.style.background = `linear-gradient(#18181b, #18181b) padding-box, linear-gradient(135deg, ${color}, ${secondaryColor}) border-box`;
    } else if (pattern === "striped") {
      colorRulePreviewCircle.style.border = `4px solid transparent`;
      colorRulePreviewCircle.style.background = `linear-gradient(#18181b, #18181b) padding-box, repeating-linear-gradient(45deg, ${color}, ${color} 5px, ${secondaryColor} 5px, ${secondaryColor} 10px) border-box`;
    } else {
      colorRulePreviewCircle.style.border = `4px solid ${color}`;
      colorRulePreviewCircle.style.background = "#18181b";
    }

    if (colorRulePreviewTag) {
      colorRulePreviewTag.style.color = color;
      colorRulePreviewTag.style.borderColor = color;
      colorRulePreviewTag.style.background = `${color}25`;
    }
  }

  function openColorRuleEditor(rule = null) {
    if (!colorRuleEditor) return;
    if (rule) {
      colorRuleIdInput.value = rule.id || "";
      colorRuleNameInput.value = rule.name || "";
      const col = rule.color || "#ef4444";
      const secCol = rule.secondaryColor || "#a855f7";
      const pattern = rule.borderPattern || "solid";
      if (colorRulePicker) colorRulePicker.value = col;
      if (colorRuleHex) colorRuleHex.value = col;
      if (colorRuleSecondaryPicker) colorRuleSecondaryPicker.value = secCol;
      if (colorRuleSecondaryHex) colorRuleSecondaryHex.value = secCol;
      if (colorRulePatternSelect) colorRulePatternSelect.value = pattern;
      editingColorStreamerIds = Array.isArray(rule.streamerIds)
        ? [...rule.streamerIds]
        : [];
    } else {
      colorRuleIdInput.value = "";
      colorRuleNameInput.value = "";
      const defaultCol = "#ef4444";
      const defaultSecCol = "#a855f7";
      if (colorRulePicker) colorRulePicker.value = defaultCol;
      if (colorRuleHex) colorRuleHex.value = defaultCol;
      if (colorRuleSecondaryPicker)
        colorRuleSecondaryPicker.value = defaultSecCol;
      if (colorRuleSecondaryHex) colorRuleSecondaryHex.value = defaultSecCol;
      if (colorRulePatternSelect) colorRulePatternSelect.value = "solid";
      editingColorStreamerIds = [];
    }
    renderAssignedColorStreamers();
    updateColorRulePreview();
    colorRuleEditor.style.display = "block";
  }

  function closeColorRuleEditor() {
    if (colorRuleEditor) {
      colorRuleEditor.style.display = "none";
      colorRuleIdInput.value = "";
      colorRuleNameInput.value = "";
      editingColorStreamerIds = [];
    }
  }

  if (btnAddColorRule) {
    btnAddColorRule.addEventListener("click", () => openColorRuleEditor(null));
  }
  if (btnCancelColorRule) {
    btnCancelColorRule.addEventListener("click", closeColorRuleEditor);
  }
  if (btnSearchAddColorStreamer) {
    btnSearchAddColorStreamer.addEventListener("click", () => {
      openStreamerSearchModal({
        title: "Assign Streamer to Color Rule",
        subtitle: "Search streamer by nickname, name, or notes",
        getContext: (s) => s.note || "",
        onSelect: (streamer) => {
          if (!editingColorStreamerIds.includes(streamer.id)) {
            editingColorStreamerIds.push(streamer.id);
            renderAssignedColorStreamers();
          }
        },
      });
    });
  }
  if (btnColorDeselectAll) {
    btnColorDeselectAll.addEventListener("click", () => {
      editingColorStreamerIds = [];
      renderAssignedColorStreamers();
    });
  }

  if (colorRulePicker && colorRuleHex) {
    colorRulePicker.addEventListener("input", (e) => {
      colorRuleHex.value = e.target.value.toUpperCase();
      updateColorRulePreview();
    });
    colorRuleHex.addEventListener("input", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) val = `#${val}`;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        colorRulePicker.value = val;
      }
      updateColorRulePreview();
    });
  }

  if (colorRuleSecondaryPicker && colorRuleSecondaryHex) {
    colorRuleSecondaryPicker.addEventListener("input", (e) => {
      colorRuleSecondaryHex.value = e.target.value.toUpperCase();
      updateColorRulePreview();
    });
    colorRuleSecondaryHex.addEventListener("input", (e) => {
      let val = e.target.value.trim();
      if (!val.startsWith("#")) val = `#${val}`;
      if (/^#[0-9a-fA-F]{6}$/.test(val)) {
        colorRuleSecondaryPicker.value = val;
      }
      updateColorRulePreview();
    });
  }

  if (colorRulePatternSelect) {
    colorRulePatternSelect.addEventListener("change", () => {
      updateColorRulePreview();
    });
  }

  colorPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.getAttribute("data-color");
      if (col) {
        if (colorRulePicker) colorRulePicker.value = col;
        if (colorRuleHex) colorRuleHex.value = col.toUpperCase();
        updateColorRulePreview();
      }
    });
  });

  secondaryColorPresetButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const col = btn.getAttribute("data-color");
      if (col) {
        if (colorRuleSecondaryPicker) colorRuleSecondaryPicker.value = col;
        if (colorRuleSecondaryHex)
          colorRuleSecondaryHex.value = col.toUpperCase();
        updateColorRulePreview();
      }
    });
  });

  if (btnSaveColorRule) {
    btnSaveColorRule.addEventListener("click", async () => {
      let color = (colorRuleHex?.value || colorRulePicker?.value || "").trim();
      if (!color.startsWith("#")) color = `#${color}`;
      if (!/^#[0-9a-fA-F]{6}$/i.test(color)) {
        alert("Please select or enter a valid hex color (e.g. #EF4444)");
        colorRuleHex?.focus();
        return;
      }

      let secondaryColor = (
        colorRuleSecondaryHex?.value ||
        colorRuleSecondaryPicker?.value ||
        "#a855f7"
      ).trim();
      if (!secondaryColor.startsWith("#"))
        secondaryColor = `#${secondaryColor}`;
      if (!/^#[0-9a-fA-F]{6}$/i.test(secondaryColor)) {
        secondaryColor = "#a855f7";
      }

      const borderPattern = colorRulePatternSelect?.value || "solid";
      const id = colorRuleIdInput.value || `color-rule-${Date.now()}`;
      const name = (colorRuleNameInput?.value || "").trim() || "Color Group";
      const streamerIds = [...editingColorStreamerIds];

      const existingIndex = localColorRules.findIndex((r) => r.id === id);
      const ruleObj = {
        id,
        name,
        enabled: true,
        color,
        secondaryColor,
        borderPattern,
        streamerIds,
      };

      if (existingIndex >= 0) {
        localColorRules[existingIndex] = {
          ...localColorRules[existingIndex],
          ...ruleObj,
        };
      } else {
        localColorRules.push(ruleObj);
      }

      await saveColorRulesToBackend();
      closeColorRuleEditor();
    });
  }

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

    if (settings.infoLinesTheme && selectInfoLinesTheme) {
      selectInfoLinesTheme.value = settings.infoLinesTheme;
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
    if (
      typeof settings.hideOfflineDays !== "undefined" &&
      inputHideOfflineDays
    ) {
      inputHideOfflineDays.value = String(settings.hideOfflineDays);
    }
    if (
      typeof settings.hideOfflineHours !== "undefined" &&
      inputHideOfflineHours
    ) {
      inputHideOfflineHours.value = String(settings.hideOfflineHours);
    }
    if (
      typeof settings.autoSnoozeKeywordsEnabled === "boolean" &&
      chkAutoSnoozeKeywordsEnabled
    ) {
      chkAutoSnoozeKeywordsEnabled.checked = settings.autoSnoozeKeywordsEnabled;
    }
    if (
      typeof settings.autoSnoozeKeywords !== "undefined" &&
      inputAutoSnoozeKeywords
    ) {
      inputAutoSnoozeKeywords.value = settings.autoSnoozeKeywords;
    }
    if (
      typeof settings.autoSnoozeDurationHours !== "undefined" &&
      inputAutoSnoozeDurationHours
    ) {
      inputAutoSnoozeDurationHours.value = String(
        settings.autoSnoozeDurationHours,
      );
    }
    renderWindowStatesUI(
      settings.windowStatesCount || 1,
      settings.currentWindowStateIndex || 0,
    );
    if (typeof settings.currentOpacity === "number") {
      const pct = Math.max(
        10,
        Math.min(100, Math.round(settings.currentOpacity * 100)),
      );
      if (opacitySlider) {
        opacitySlider.value = String(pct);
      }
      if (opacityValDisplay) {
        opacityValDisplay.textContent = `${pct}%`;
      }
    }
    if (typeof settings.tooltipOpacity === "number") {
      const tipPct = Math.max(
        10,
        Math.min(100, Math.round(settings.tooltipOpacity * 100)),
      );
      if (tooltipOpacitySlider) {
        tooltipOpacitySlider.value = String(tipPct);
      }
      if (tooltipOpacityValDisplay) {
        tooltipOpacityValDisplay.textContent = `${tipPct}%`;
      }
    }
    if (Array.isArray(settings.streamers)) {
      renderStreamersList(settings.streamers);
    }
    if (Array.isArray(settings.actionRules)) {
      renderActionRules(settings.actionRules);
    }
    if (Array.isArray(settings.colorRules)) {
      renderColorRules(settings.colorRules);
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
      if (localActionRules.length > 0) {
        renderActionRules(localActionRules);
      }
      if (localColorRules.length > 0) {
        renderColorRules(localColorRules);
      }
    });
  }

  if (window.electronAPI && window.electronAPI.onSettingsUpdated) {
    window.electronAPI.onSettingsUpdated((newSettings) => {
      applySettingsToUI(newSettings);
    });
  }

  // Initialize dynamic Table of Contents (TOC) sidebar
  initTableOfContents();
});

/**
 * Dynamically builds a Table of Contents (TOC) sidebar navigation from page headings (h2, h3).
 * Provides smooth scrolling to sections and scroll-spy active state highlighting.
 */
function initTableOfContents() {
  const tocNav = document.getElementById("toc-nav");
  if (!tocNav) return;

  const headings = document.querySelectorAll(
    ".settings-content h2, .settings-content h3",
  );
  if (!headings.length) return;

  tocNav.innerHTML = "";
  const tocEntries = [];

  headings.forEach((heading, index) => {
    // Generate a unique ID if not present
    let targetId = heading.id;
    if (!targetId) {
      const card = heading.closest(".settings-card, .group-rule-box");
      if (card && card.id) {
        targetId = card.id;
      } else {
        const rawText = heading.textContent || `section-${index}`;
        const slug = rawText
          .toLowerCase()
          .replace(/[^\w\s-]/g, "")
          .trim()
          .replace(/\s+/g, "-")
          .substring(0, 32);
        targetId = `sec-${slug || index}`;
        heading.id = targetId;
      }
    }

    const isSub = heading.tagName.toLowerCase() === "h3";
    let text = heading.textContent.trim().replace(/\s+/g, " ");

    const link = document.createElement("a");
    link.className = `toc-link ${isSub ? "toc-link-sub" : "toc-link-main"}`;
    link.href = `#${targetId}`;
    link.dataset.targetId = targetId;
    link.title = text;

    const dot = document.createElement("span");
    dot.className = "toc-dot";

    const textSpan = document.createElement("span");
    textSpan.className = "toc-text";
    textSpan.textContent = text;

    link.appendChild(dot);
    link.appendChild(textSpan);

    link.addEventListener("click", (e) => {
      e.preventDefault();
      const target =
        document.getElementById(targetId) ||
        document.querySelector(`[id="${targetId}"]`);
      if (target) {
        const card = target.closest(".settings-card") || target;
        card.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveTocLink(link);
      }
    });

    tocNav.appendChild(link);
    tocEntries.push({ heading, link, targetId });
  });

  function setActiveTocLink(activeLink) {
    tocNav.querySelectorAll(".toc-link").forEach((l) => {
      l.classList.remove("active");
    });
    if (activeLink) {
      activeLink.classList.add("active");
    }
  }

  if (tocEntries.length > 0) {
    tocEntries[0].link.classList.add("active");
  }

  // Scroll-spy listener to highlight current visible section
  let isScrollingTimeout = null;
  const onScroll = () => {
    if (isScrollingTimeout) return;
    isScrollingTimeout = setTimeout(() => {
      isScrollingTimeout = null;
      const scrollPos = window.scrollY + 120;
      let currentActive = null;

      for (let i = 0; i < tocEntries.length; i++) {
        const entry = tocEntries[i];
        const target = document.getElementById(entry.targetId) || entry.heading;
        if (target) {
          const rect = target.getBoundingClientRect();
          const elemTop = window.scrollY + rect.top;
          if (scrollPos >= elemTop - 30) {
            currentActive = entry.link;
          }
        }
      }

      if (currentActive) {
        setActiveTocLink(currentActive);
      } else if (tocEntries.length > 0) {
        setActiveTocLink(tocEntries[0].link);
      }
    }, 40);
  };

  window.addEventListener("scroll", onScroll, { passive: true });
}
