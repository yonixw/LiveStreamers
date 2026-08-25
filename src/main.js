const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
  shell,
  dialog,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const util = require("node:util");

const pkg = require("../package.json");

// Centralized log capture & history
const logHistory = [];
const MAX_LOG_HISTORY = 500;
let logCounter = 0;

const originalConsole = {
  log: console.log.bind(console),
  error: console.error.bind(console),
  warn: console.warn.bind(console),
  info: console.info.bind(console),
  debug: (console.debug || console.log).bind(console),
};

function parseLogMessage(level, formattedText) {
  let timestamp = new Date().toLocaleTimeString();
  let tag = level === "error" ? "Error" : level === "warn" ? "Warn" : "System";
  let message = formattedText;
  let type = level === "error" ? "error" : level === "warn" ? "warn" : "info";

  // Match pattern 1: "[12:34:56 PM] [Some Tag] message content..."
  const fullMatch = formattedText.match(
    /^\[([\d: APMapm]+)\]\s*\[([^\]]+)\]\s*([\s\S]*)$/,
  );
  if (fullMatch) {
    timestamp = fullMatch[1].trim();
    tag = fullMatch[2].trim();
    message = fullMatch[3].trim();
  } else {
    // Match pattern 2: "[Some Tag] message content..."
    const tagMatch = formattedText.match(/^\[([^\]]+)\]\s*([\s\S]*)$/);
    if (tagMatch) {
      tag = tagMatch[1].trim();
      message = tagMatch[2].trim();
    }
  }

  // Detect success type if not already error/warn
  if (type === "info") {
    if (
      message.includes("is LIVE!") ||
      message.includes("Success!") ||
      message.includes("Successfully downloaded")
    ) {
      type = "success";
    }
  }

  return { timestamp, tag, message, type };
}

function captureLog(level, args) {
  // Always invoke original console for terminal / cmd visibility
  if (originalConsole[level]) {
    originalConsole[level](...args);
  }

  try {
    const formatted = util.format(...args);
    const parsed = parseLogMessage(level, formatted);
    const entry = {
      id: ++logCounter,
      timestamp: parsed.timestamp,
      tag: parsed.tag,
      message: parsed.message,
      type: parsed.type,
    };

    logHistory.push(entry);
    if (logHistory.length > MAX_LOG_HISTORY) {
      logHistory.shift();
    }

    if (
      settingsWindow &&
      !settingsWindow.isDestroyed() &&
      !settingsWindow.webContents.isDestroyed()
    ) {
      settingsWindow.webContents.send("log:entry", entry);
    }
  } catch (_e) {
    // Prevent recursive logging failures
  }
}

// Global console hook across all backend tasks and modules
console.log = (...args) => captureLog("log", args);
console.error = (...args) => captureLog("error", args);
console.warn = (...args) => captureLog("warn", args);
console.info = (...args) => captureLog("info", args);
console.debug = (...args) => captureLog("debug", args);
const { petTask } = require("./tasks/example");
const {
  loadSettings,
  saveSettings,
  loadStatus,
  saveStatus,
  defaultStreamers,
  normalizeStreamerConfig,
  normalizeUrlEntry,
} = require("./tasks/storage");
const {
  StreamLiveCheckerService,
  checkStreamerLiveTask,
  detectPlatform,
  extractStreamerName,
  normalizeUrl,
} = require("./tasks/stream-checker");

let overlayWindow = null;
let settingsWindow = null;
let linksPopupWindow = null;
let activePopupStreamerId = null;
let tray = null;
let liveCheckerService = null;
let saveBoundsTimeout = null;

// Load persisted configuration and latest status on startup
const persistedSettings = loadSettings();
const persistedStatus = loadStatus();

// Application state
const state = {
  sortBy: persistedSettings.sortBy || "last-triggered",
  avatarSize: persistedSettings.avatarSize || 80,
  avatarAlignment: persistedSettings.avatarAlignment || "left",
  fontSize: persistedSettings.fontSize || 12,
  layoutOrientation: persistedSettings.layoutOrientation || "vertical",
  layoutReversed: persistedSettings.layoutReversed ?? false,
  showNicknameTag: persistedSettings.showNicknameTag ?? false,
  isAlwaysOnTop: persistedSettings.isAlwaysOnTop ?? true,
  isIgnoringMouseEvents: persistedSettings.isIgnoringMouseEvents ?? false,
  smartClickThrough: persistedSettings.smartClickThrough ?? false,
  windowStatesCount: persistedSettings.windowStatesCount || 1,
  currentWindowStateIndex: persistedSettings.currentWindowStateIndex || 0,
  windowStates:
    Array.isArray(persistedSettings.windowStates) &&
    persistedSettings.windowStates.length > 0
      ? persistedSettings.windowStates
      : [
          persistedSettings.overlayBounds || {
            x: null,
            y: null,
            width: 280,
            height: 460,
          },
        ],
  currentOpacity: persistedSettings.currentOpacity ?? 1.0,
  overlayVisible: persistedSettings.overlayVisible ?? true,
  overlayBounds: persistedSettings.overlayBounds || null,
  popupBounds: persistedSettings.popupBounds || null,
  streamers: Array.isArray(persistedSettings.streamers)
    ? persistedSettings.streamers
    : defaultStreamers,
  statusMap: persistedStatus || {},
};

function createDefaultTrayIcon() {
  const iconPath = path.join(__dirname, "assets", "tray-icon.png");
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // 16x16 fallback RGBA icon buffer
  const size = 16;
  const buffer = Buffer.alloc(size * size * 4);
  const radius = size / 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - radius + 0.5;
      const dy = y - radius + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const idx = (y * size + x) * 4;
      if (dist <= radius - 0.5) {
        buffer[idx] = 99; // R
        buffer[idx + 1] = 102; // G
        buffer[idx + 2] = 241; // B
        buffer[idx + 3] = 255; // Alpha
      } else {
        buffer[idx + 3] = 0; // Transparent
      }
    }
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

// Calculate dimensions for vertical avatar list layout
function calculateOverlayDimensions(itemCount) {
  const count = Math.max(1, itemCount || 1);
  const avatarSize = state.avatarSize || 80;
  const width = Math.max(200, Math.min(400, avatarSize + 120));
  const cardHeight = avatarSize + 48;
  const height = Math.max(200, Math.min(1080, count * cardHeight + 60));
  return { width, height };
}

function updateOverlayBounds() {
  // Preserve user-defined window position and dimensions strictly.
  // Resizing/moving by the user is preserved and persisted across all streamer updates.
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
}

function debounceSaveOverlayBounds() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  if (saveBoundsTimeout) clearTimeout(saveBoundsTimeout);

  saveBoundsTimeout = setTimeout(() => {
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      const bounds = overlayWindow.getBounds();
      state.overlayBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };

      if (!Array.isArray(state.windowStates)) {
        state.windowStates = [];
      }
      const idx = Math.max(
        0,
        Math.min(
          state.windowStatesCount - 1,
          state.currentWindowStateIndex || 0,
        ),
      );
      state.windowStates[idx] = { ...state.overlayBounds };

      saveSettings(state);
      broadcastStateUpdate();
    }
  }, 400);
}

function setWindowStateIndex(index) {
  if (!overlayWindow || overlayWindow.isDestroyed()) return false;
  const count = Math.max(1, parseInt(state.windowStatesCount, 10) || 1);
  const targetIdx = Math.max(0, Math.min(count - 1, parseInt(index, 10) || 0));

  if (!Array.isArray(state.windowStates)) {
    state.windowStates = [];
  }
  while (state.windowStates.length < count) {
    state.windowStates.push(
      state.overlayBounds
        ? { ...state.overlayBounds }
        : { x: null, y: null, width: 280, height: 460 },
    );
  }

  state.currentWindowStateIndex = targetIdx;
  const targetBounds = state.windowStates[targetIdx];

  if (targetBounds) {
    if (
      typeof targetBounds.x === "number" &&
      typeof targetBounds.y === "number" &&
      typeof targetBounds.width === "number" &&
      typeof targetBounds.height === "number"
    ) {
      overlayWindow.setBounds(targetBounds);
    } else if (
      typeof targetBounds.width === "number" &&
      typeof targetBounds.height === "number"
    ) {
      overlayWindow.setSize(targetBounds.width, targetBounds.height);
      overlayWindow.center();
      state.windowStates[targetIdx] = overlayWindow.getBounds();
    }
    state.overlayBounds = { ...overlayWindow.getBounds() };
  }

  console.log(
    `[WindowState] Switched to State ${state.currentWindowStateIndex + 1}/${count} (Width: ${state.overlayBounds.width}px, Height: ${state.overlayBounds.height}px)`,
  );
  saveSettings(state);
  broadcastStateUpdate();
  return state.currentWindowStateIndex;
}

function rotateWindowState() {
  const count = Math.max(1, parseInt(state.windowStatesCount, 10) || 1);
  if (count <= 1) return 0;
  const nextIdx = ((state.currentWindowStateIndex || 0) + 1) % count;
  return setWindowStateIndex(nextIdx);
}

let savePopupBoundsTimeout = null;
function debounceSavePopupBounds() {
  if (!linksPopupWindow || linksPopupWindow.isDestroyed()) return;
  if (savePopupBoundsTimeout) clearTimeout(savePopupBoundsTimeout);

  savePopupBoundsTimeout = setTimeout(() => {
    if (linksPopupWindow && !linksPopupWindow.isDestroyed()) {
      const bounds = linksPopupWindow.getBounds();
      state.popupBounds = {
        x: bounds.x,
        y: bounds.y,
        width: bounds.width,
        height: bounds.height,
      };
      saveSettings(state);
    }
  }, 400);
}

function resetOverlayUI() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
  } else {
    const count = state.streamers ? state.streamers.length : 1;
    const { width, height } = calculateOverlayDimensions(count);
    state.overlayBounds = { x: null, y: null, width, height };
    overlayWindow.setSize(width, height);
    overlayWindow.center();
  }

  state.popupBounds = null;
  if (linksPopupWindow && !linksPopupWindow.isDestroyed()) {
    linksPopupWindow.setSize(340, 440);
    linksPopupWindow.center();
  }

  saveSettings(state);
  return true;
}

function isSnoozed(streamer) {
  return Boolean(
    streamer &&
    streamer.snoozedUntil &&
    new Date(streamer.snoozedUntil).getTime() > Date.now(),
  );
}

/**
 * Merges streamer config with its live status record.
 */
function getEnrichedStreamer(streamer) {
  const status = state.statusMap[streamer.id] || {};
  const firstUrlObj = streamer.urls && streamer.urls[0];
  const primaryUrl =
    typeof firstUrlObj === "string" ? firstUrlObj : firstUrlObj?.url || "";
  const activeUrl = status.activeUrl || primaryUrl;
  const activePlatform = status.activePlatform || detectPlatform(activeUrl);

  return {
    ...streamer,
    isLive: Boolean(status.isLive),
    activeUrl,
    activePlatform,
    platform: activePlatform,
    url: activeUrl,
    checkStatus: status.checkStatus || "idle",
    cachedInfo: status.cachedInfo || null,
    lastChecked: status.lastChecked || null,
    lastError: status.lastError || null,
    lastTrigger: status.lastTrigger || null,
    lastTriggeredAt: status.lastTriggeredAt || null,
    checkedUrlsCount: status.checkedUrlsCount || 0,
  };
}

/**
 * Returns streamers list enriched with status and sorted according to current sortBy mode.
 */
function getSortedEnrichedStreamers(sortBy = state.sortBy) {
  const enriched = state.streamers.map((s) => getEnrichedStreamer(s));

  switch (sortBy) {
    case "last-triggered": {
      return [...enriched].sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

        const snoozedA = isSnoozed(a);
        const snoozedB = isSnoozed(b);
        if (snoozedA !== snoozedB) return snoozedA ? 1 : -1;

        const timeA = a.lastTriggeredAt
          ? new Date(a.lastTriggeredAt).getTime()
          : 0;
        const timeB = b.lastTriggeredAt
          ? new Date(b.lastTriggeredAt).getTime()
          : 0;
        if (timeA !== timeB) return timeB - timeA;

        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "viewers": {
      return [...enriched].sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        const viewersA = Number(a.cachedInfo?.viewerCount) || 0;
        const viewersB = Number(b.cachedInfo?.viewerCount) || 0;
        if (viewersA !== viewersB) return viewersB - viewersA;
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "longest-live": {
      return [...enriched].sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

        if (a.isLive && b.isLive) {
          const startA = a.cachedInfo?.startTime
            ? new Date(a.cachedInfo.startTime).getTime()
            : Date.now();
          const startB = b.cachedInfo?.startTime
            ? new Date(b.cachedInfo.startTime).getTime()
            : Date.now();
          return startA - startB; // Earliest start = longest live
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "last-started": {
      return [...enriched].sort((a, b) => {
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;

        const snoozedA = isSnoozed(a);
        const snoozedB = isSnoozed(b);
        if (snoozedA !== snoozedB) return snoozedA ? 1 : -1;

        if (a.isLive && b.isLive) {
          const startA = a.cachedInfo?.startTime
            ? new Date(a.cachedInfo.startTime).getTime()
            : 0;
          const startB = b.cachedInfo?.startTime
            ? new Date(b.cachedInfo.startTime).getTime()
            : 0;
          return startB - startA; // Latest start = most recently live
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "name": {
      return [...enriched].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    }

    case "manual": {
      return [...enriched].sort((a, b) => {
        const snoozedA = isSnoozed(a);
        const snoozedB = isSnoozed(b);
        if (snoozedA !== snoozedB) return snoozedA ? 1 : -1;
        return 0;
      });
    }

    default:
      return enriched;
  }
}

function createOverlayWindow() {
  const count = state.streamers ? state.streamers.length : 1;
  const defaultDim = calculateOverlayDimensions(count);

  let initialBounds = {
    width: defaultDim.width,
    height: defaultDim.height,
  };

  // Restore saved position & dimensions if available
  if (state.overlayBounds && typeof state.overlayBounds.width === "number") {
    initialBounds.width = state.overlayBounds.width;
    initialBounds.height = state.overlayBounds.height;
    if (
      typeof state.overlayBounds.x === "number" &&
      typeof state.overlayBounds.y === "number"
    ) {
      initialBounds.x = state.overlayBounds.x;
      initialBounds.y = state.overlayBounds.y;
    }
  }

  overlayWindow = new BrowserWindow({
    ...initialBounds,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    alwaysOnTop: state.isAlwaysOnTop,
    opacity: state.currentOpacity,
    skipTaskbar: true,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (state.isIgnoringMouseEvents || state.smartClickThrough) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  if (!state.overlayVisible) {
    overlayWindow.hide();
  }

  // Save position and dimensions on move and resize
  overlayWindow.on("moved", debounceSaveOverlayBounds);
  overlayWindow.on("resized", debounceSaveOverlayBounds);

  overlayWindow.on("closed", () => {
    overlayWindow = null;
  });
}

function createSettingsWindow() {
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.show();
    settingsWindow.focus();
    return settingsWindow;
  }

  settingsWindow = new BrowserWindow({
    width: 740,
    height: 880,
    minWidth: 540,
    minHeight: 650,
    autoHideMenuBar: true,
    title: `Settings - ${pkg.name} - ${pkg.version}`,
    backgroundColor: "#0f172a",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  settingsWindow.loadFile(path.join(__dirname, "settings", "settings.html"));

  settingsWindow.on("closed", () => {
    settingsWindow = null;
  });

  return settingsWindow;
}

function createLinksPopupWindow(streamerId) {
  activePopupStreamerId = streamerId;

  let initialBounds = { width: 340, height: 440 };
  let shouldCenter = true;

  if (state.popupBounds && typeof state.popupBounds.width === "number") {
    initialBounds.width = state.popupBounds.width;
    initialBounds.height = state.popupBounds.height;
    if (
      typeof state.popupBounds.x === "number" &&
      typeof state.popupBounds.y === "number"
    ) {
      initialBounds.x = state.popupBounds.x;
      initialBounds.y = state.popupBounds.y;
      shouldCenter = false;
    }
  }

  if (linksPopupWindow && !linksPopupWindow.isDestroyed()) {
    if (shouldCenter) {
      linksPopupWindow.center();
    }
    linksPopupWindow.show();
    linksPopupWindow.focus();
    linksPopupWindow.webContents.reload();
    return linksPopupWindow;
  }

  linksPopupWindow = new BrowserWindow({
    ...initialBounds,
    frame: false,
    resizable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    backgroundColor: "#0f172a",
    title: "Stream Links",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  if (shouldCenter) {
    linksPopupWindow.center();
  }

  linksPopupWindow.loadFile(path.join(__dirname, "popup", "popup.html"));

  linksPopupWindow.on("moved", debounceSavePopupBounds);
  linksPopupWindow.on("resized", debounceSavePopupBounds);

  linksPopupWindow.on("closed", () => {
    linksPopupWindow = null;
  });

  return linksPopupWindow;
}

function createTray() {
  const icon = createDefaultTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("LiveStreamers Overlay");

  buildTrayMenu();

  tray.on("click", () => {
    createSettingsWindow();
  });
}

function buildTrayMenu() {
  if (!tray) return;

  const isOverlayOpen =
    overlayWindow && !overlayWindow.isDestroyed() && overlayWindow.isVisible();

  const sortedList = getSortedEnrichedStreamers();
  const liveCount = sortedList.filter((s) => s.isLive).length;
  const statusSummary =
    sortedList.length > 0
      ? `${liveCount}/${sortedList.length} Live`
      : "No Streamers";

  const contextMenu = Menu.buildFromTemplate([
    {
      label: `LiveStreamers (${statusSummary})`,
      enabled: false,
    },
    { type: "separator" },
    {
      label: "Open Settings...",
      click: () => {
        createSettingsWindow();
      },
    },
    {
      label: "Check Live Status Now",
      click: () => {
        if (liveCheckerService) {
          liveCheckerService.checkAll(true);
        }
      },
    },
    {
      label: isOverlayOpen ? "Hide Overlay" : "Show Overlay",
      click: () => {
        toggleOverlayVisibility();
      },
    },
    {
      label: "Reset UI",
      click: () => {
        resetOverlayUI();
      },
    },
    { type: "separator" },
    {
      label: "Quit",
      click: () => {
        app.quit();
      },
    },
  ]);

  tray.setContextMenu(contextMenu);
}

function broadcastStateUpdate() {
  const sortedStreamers = getSortedEnrichedStreamers();

  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send("settings:updated", state);
    overlayWindow.webContents.send("streamers:updated", sortedStreamers);
    overlayWindow.webContents.send("status:updated", state.statusMap);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send("settings:updated", state);
    settingsWindow.webContents.send("streamers:updated", sortedStreamers);
    settingsWindow.webContents.send("status:updated", state.statusMap);
  }
  buildTrayMenu();
}

function toggleOverlayVisibility() {
  if (!overlayWindow || overlayWindow.isDestroyed()) {
    createOverlayWindow();
    state.overlayVisible = true;
  } else if (overlayWindow.isVisible()) {
    overlayWindow.hide();
    state.overlayVisible = false;
  } else {
    overlayWindow.show();
    state.overlayVisible = true;
  }
  saveSettings(state);
  broadcastStateUpdate();
}

function logToWindows(tag, message, isError = false) {
  const timestamp = new Date().toLocaleTimeString();
  if (isError) {
    console.error(`[${timestamp}] [${tag}]`, message);
  } else {
    console.log(`[${timestamp}] [${tag}]`, message);
  }
}

// Background Live Checker Service Initialization
function initBackgroundChecker() {
  liveCheckerService = new StreamLiveCheckerService({
    getStreamers: () => state.streamers,
    getStatusMap: () => state.statusMap,
    onStatusUpdate: (update) => {
      const { streamerId } = update;
      if (!streamerId) return;

      const current = state.statusMap[streamerId] || {};
      state.statusMap[streamerId] = {
        ...current,
        streamerId,
        isLive: update.isLive !== undefined ? update.isLive : current.isLive,
        activeUrl: update.activeUrl || current.activeUrl,
        activePlatform: update.activePlatform || current.activePlatform,
        checkStatus: update.checkStatus || current.checkStatus,
        cachedInfo: update.isLive
          ? update.cachedInfo
          : update.cachedInfo || current.cachedInfo,
        lastChecked: update.lastChecked || current.lastChecked,
        lastError:
          update.lastError !== undefined ? update.lastError : current.lastError,
        lastTrigger: update.lastTrigger || current.lastTrigger || null,
        lastTriggeredAt:
          update.lastTriggeredAt || current.lastTriggeredAt || null,
        checkedUrlsCount: update.checkedUrlsCount ?? current.checkedUrlsCount,
      };

      saveStatus(state.statusMap);
      broadcastStateUpdate();
    },
    onLog: (tag, msg, isError) => {
      logToWindows(tag, msg, isError);
    },
    intervalMs: 60000,
  });

  liveCheckerService.start();
}

// IPC Handlers
ipcMain.handle("settings:get", () => {
  return {
    ...state,
    streamers: getSortedEnrichedStreamers(),
  };
});

ipcMain.handle("status:get", () => {
  return state.statusMap;
});

ipcMain.handle("streamers:get", () => {
  return getSortedEnrichedStreamers();
});

ipcMain.handle("streamers:update", (_event, newStreamers) => {
  if (Array.isArray(newStreamers)) {
    state.streamers = newStreamers.map((s, idx) =>
      normalizeStreamerConfig(s, idx),
    );
    saveSettings(state);
    updateOverlayBounds();
    broadcastStateUpdate();
  }
  return getSortedEnrichedStreamers();
});

ipcMain.handle("streamers:add", (_event, streamerData) => {
  if (!streamerData) return getSortedEnrichedStreamers();

  const rawUrls = Array.isArray(streamerData.urls)
    ? streamerData.urls
    : streamerData.url
      ? [streamerData.url]
      : [];

  const urls = rawUrls.map(normalizeUrlEntry).filter(Boolean);
  if (urls.length === 0) return getSortedEnrichedStreamers();

  const name =
    streamerData.name && streamerData.name.trim()
      ? streamerData.name.trim()
      : extractStreamerName(urls[0].url);

  const id = `streamer-${Date.now()}-${crypto.randomInt(100, 999)}`;

  const newStreamer = normalizeStreamerConfig({
    id,
    name,
    avatarImage: streamerData.avatarImage || "",
    urls,
    triggers: streamerData.triggers || {
      titleChange: true,
      viewerCountEnabled: false,
      viewerCountThreshold: 5000,
      goingLive: true,
      categoryChange: true,
    },
  });

  state.streamers.push(newStreamer);
  saveSettings(state);

  updateOverlayBounds();
  broadcastStateUpdate();

  if (liveCheckerService) {
    liveCheckerService.checkSingleStreamer(newStreamer, true);
  }

  return getSortedEnrichedStreamers();
});

ipcMain.handle("streamers:remove", (_event, streamerId) => {
  state.streamers = state.streamers.filter((s) => s.id !== streamerId);
  delete state.statusMap[streamerId];

  saveSettings(state);
  saveStatus(state.statusMap);

  updateOverlayBounds();
  broadcastStateUpdate();
  return getSortedEnrichedStreamers();
});

ipcMain.handle("streamers:check-now", async (_event, streamerId) => {
  if (streamerId) {
    const streamer = state.streamers.find((s) => s.id === streamerId);
    if (streamer && liveCheckerService) {
      return await liveCheckerService.checkSingleStreamer(streamer, true);
    }
  } else if (liveCheckerService) {
    liveCheckerService.checkAll(true);
    return true;
  }
  return false;
});

ipcMain.handle("settings:update", (_event, partialSettings) => {
  if (!partialSettings || typeof partialSettings !== "object") return state;

  if (typeof partialSettings.sortBy === "string") {
    state.sortBy = partialSettings.sortBy;
  }

  if (
    typeof partialSettings.avatarSize === "number" ||
    typeof partialSettings.avatarSize === "string"
  ) {
    const size = parseInt(partialSettings.avatarSize, 10);
    if (!isNaN(size) && size >= 40 && size <= 200) {
      state.avatarSize = size;
    }
  }

  if (typeof partialSettings.avatarAlignment === "string") {
    if (["left", "right", "center"].includes(partialSettings.avatarAlignment)) {
      state.avatarAlignment = partialSettings.avatarAlignment;
    }
  }

  if (
    typeof partialSettings.fontSize === "number" ||
    typeof partialSettings.fontSize === "string"
  ) {
    const fsize = parseInt(partialSettings.fontSize, 10);
    if (!isNaN(fsize) && fsize >= 8 && fsize <= 32) {
      state.fontSize = fsize;
    }
  }

  if (typeof partialSettings.layoutOrientation === "string") {
    if (
      ["vertical", "horizontal"].includes(partialSettings.layoutOrientation)
    ) {
      state.layoutOrientation = partialSettings.layoutOrientation;
    }
  }

  if (typeof partialSettings.layoutReversed === "boolean") {
    state.layoutReversed = partialSettings.layoutReversed;
  }

  if (typeof partialSettings.showNicknameTag === "boolean") {
    state.showNicknameTag = partialSettings.showNicknameTag;
  }

  if (typeof partialSettings.isAlwaysOnTop === "boolean") {
    state.isAlwaysOnTop = partialSettings.isAlwaysOnTop;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setAlwaysOnTop(state.isAlwaysOnTop);
    }
  }

  if (typeof partialSettings.isIgnoringMouseEvents === "boolean") {
    state.isIgnoringMouseEvents = partialSettings.isIgnoringMouseEvents;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (state.isIgnoringMouseEvents) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      } else if (state.smartClickThrough) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        overlayWindow.setIgnoreMouseEvents(false);
      }
    }
  }

  if (typeof partialSettings.smartClickThrough === "boolean") {
    state.smartClickThrough = partialSettings.smartClickThrough;
    if (
      overlayWindow &&
      !overlayWindow.isDestroyed() &&
      !state.isIgnoringMouseEvents
    ) {
      if (state.smartClickThrough) {
        overlayWindow.setIgnoreMouseEvents(true, { forward: true });
      } else {
        overlayWindow.setIgnoreMouseEvents(false);
      }
    }
    console.log(
      `[SmartClickThrough] Setting updated to: ${state.smartClickThrough ? "Enabled" : "Disabled"}`,
    );
  }

  if (
    typeof partialSettings.windowStatesCount === "number" ||
    typeof partialSettings.windowStatesCount === "string"
  ) {
    const cnt = Math.max(
      1,
      parseInt(partialSettings.windowStatesCount, 10) || 1,
    );
    state.windowStatesCount = cnt;
    if (!Array.isArray(state.windowStates)) state.windowStates = [];
    while (state.windowStates.length < cnt) {
      state.windowStates.push(
        state.overlayBounds
          ? { ...state.overlayBounds }
          : { x: null, y: null, width: 280, height: 460 },
      );
    }
    if (state.currentWindowStateIndex >= cnt) {
      state.currentWindowStateIndex = 0;
    }
  }

  if (typeof partialSettings.currentWindowStateIndex === "number") {
    setWindowStateIndex(partialSettings.currentWindowStateIndex);
  }

  if (typeof partialSettings.currentOpacity === "number") {
    state.currentOpacity = Math.max(
      0.05,
      Math.min(1.0, partialSettings.currentOpacity),
    );
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      overlayWindow.setOpacity(state.currentOpacity);
    }
  }

  if (typeof partialSettings.overlayVisible === "boolean") {
    state.overlayVisible = partialSettings.overlayVisible;
    if (overlayWindow && !overlayWindow.isDestroyed()) {
      if (state.overlayVisible) {
        overlayWindow.show();
      } else {
        overlayWindow.hide();
      }
    } else if (state.overlayVisible) {
      createOverlayWindow();
    }
  }

  if (Array.isArray(partialSettings.streamers)) {
    state.streamers = partialSettings.streamers.map((s, idx) =>
      normalizeStreamerConfig(s, idx),
    );
    updateOverlayBounds();
  }

  saveSettings(state);
  broadcastStateUpdate();
  return {
    ...state,
    streamers: getSortedEnrichedStreamers(),
  };
});

// File picker for selecting local avatar image
ipcMain.handle("popup:open-streamer-links", (_event, streamerId) => {
  createLinksPopupWindow(streamerId);
  return true;
});

ipcMain.handle("popup:get-active-streamer", () => {
  if (!activePopupStreamerId) return null;
  const streamer = state.streamers.find((s) => s.id === activePopupStreamerId);
  if (!streamer) return null;
  const enriched = getEnrichedStreamer(streamer);
  return {
    streamer: enriched,
    isLive: enriched.isLive,
    activeUrl: enriched.activeUrl,
    isSnoozed: isSnoozed(streamer),
    snoozedUntil: streamer.snoozedUntil || null,
  };
});

ipcMain.handle(
  "popup:snooze-streamer",
  (_event, { streamerId, durationMs }) => {
    const id = streamerId || activePopupStreamerId;
    if (!id) return false;
    const streamer = state.streamers.find((s) => s.id === id);
    if (streamer) {
      streamer.snoozedUntil = durationMs
        ? new Date(Date.now() + durationMs).toISOString()
        : null;
      saveSettings(state);
      broadcastStateUpdate();
      return true;
    }
    return false;
  },
);

ipcMain.handle("dialog:select-avatar-image", async () => {
  const result = await dialog.showOpenDialog({
    title: "Select Avatar Image",
    properties: ["openFile"],
    filters: [
      {
        name: "Images",
        extensions: ["png", "jpg", "jpeg", "webp", "gif", "svg"],
      },
      { name: "All Files", extensions: ["*"] },
    ],
  });

  if (!result.canceled && result.filePaths.length > 0) {
    return result.filePaths[0];
  }
  return null;
});

ipcMain.handle("settings:open", () => {
  createSettingsWindow();
  return true;
});

ipcMain.handle("settings:toggle-devtools", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    if (win.webContents.isDevToolsOpened()) {
      win.webContents.closeDevTools();
    } else {
      win.webContents.openDevTools({ mode: "detach" });
    }
  }
  return true;
});

// Open external URL safely in user default browser
ipcMain.handle("app:open-external", async (_event, url) => {
  if (url && typeof url === "string" && /^https?:\/\//i.test(url)) {
    try {
      await shell.openExternal(url);
      return true;
    } catch (err) {
      console.error("Failed to open external URL:", err);
      return false;
    }
  }
  return false;
});

ipcMain.handle("task:run-streamer-check", async (_event, streamer) => {
  return await checkStreamerLiveTask(streamer, state.statusMap[streamer?.id], {
    isManual: true,
  });
});

ipcMain.handle("task:run-pet-avatar", async (_event, userName) => {
  return await petTask({ userName });
});

ipcMain.handle("log:terminal", (_event, { tag, message, isError }) => {
  logToWindows(tag, message, isError);
  return true;
});

ipcMain.handle("log:get-history", () => {
  return logHistory;
});

ipcMain.handle("log:clear", () => {
  logHistory.length = 0;
  return true;
});

ipcMain.handle("window:center-overlay", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.center();
    debounceSaveOverlayBounds();
  }
  return true;
});

ipcMain.handle("window:toggle-always-on-top", () => {
  state.isAlwaysOnTop = !state.isAlwaysOnTop;
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setAlwaysOnTop(state.isAlwaysOnTop);
  }
  saveSettings(state);
  broadcastStateUpdate();
  return state.isAlwaysOnTop;
});

ipcMain.handle("window:toggle-click-through", () => {
  state.isIgnoringMouseEvents = !state.isIgnoringMouseEvents;
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    if (state.isIgnoringMouseEvents || state.smartClickThrough) {
      overlayWindow.setIgnoreMouseEvents(true, {
        forward: true,
      });
    } else {
      overlayWindow.setIgnoreMouseEvents(false);
    }
  }
  saveSettings(state);
  broadcastStateUpdate();
  return state.isIgnoringMouseEvents;
});

ipcMain.handle("window:set-ignore-mouse-events", (_event, ignore, options) => {
  if (
    overlayWindow &&
    !overlayWindow.isDestroyed() &&
    !state.isIgnoringMouseEvents
  ) {
    overlayWindow.setIgnoreMouseEvents(
      Boolean(ignore),
      options || { forward: true },
    );
    console.log(
      `[SmartClickThrough] Mode changed: ${ignore ? "Click-Through enabled (transparent region)" : "Interactive enabled (hovering element)"}`,
    );
  }
  return true;
});

ipcMain.handle("window:rotate-state", () => {
  return rotateWindowState();
});

ipcMain.handle("window:set-state-index", (_event, index) => {
  return setWindowStateIndex(index);
});

ipcMain.handle("window:set-opacity", (_event, opacity) => {
  state.currentOpacity = Math.max(0.05, Math.min(1.0, opacity));
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setOpacity(state.currentOpacity);
  }
  saveSettings(state);
  broadcastStateUpdate();
  return state.currentOpacity;
});

ipcMain.handle("window:close", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) win.close();
});

ipcMain.handle("window:hide", (event) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.hide();
    if (win === overlayWindow) {
      state.overlayVisible = false;
    }
    saveSettings(state);
    broadcastStateUpdate();
  }
});

ipcMain.handle("app:quit", () => {
  if (liveCheckerService) {
    liveCheckerService.stop();
  }
  app.quit();
});

// App lifecycle
app.whenReady().then(() => {
  createOverlayWindow();
  createTray();
  initBackgroundChecker();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Stay active in tray
});
