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
const { petTask } = require("./tasks/example");
const {
  loadSettings,
  saveSettings,
  loadStatus,
  saveStatus,
  defaultStreamers,
  normalizeStreamerConfig,
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
let tray = null;
let liveCheckerService = null;

// Load persisted configuration and latest status on startup
const persistedSettings = loadSettings();
const persistedStatus = loadStatus();

// Application state
const state = {
  sortBy: persistedSettings.sortBy || "last-triggered",
  isAlwaysOnTop: persistedSettings.isAlwaysOnTop ?? true,
  isIgnoringMouseEvents: persistedSettings.isIgnoringMouseEvents ?? false,
  currentOpacity: persistedSettings.currentOpacity ?? 1.0,
  overlayVisible: persistedSettings.overlayVisible ?? true,
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

function calculateOverlayDimensions(itemCount) {
  const count = Math.max(1, itemCount || 1);
  const width = Math.max(400, Math.min(1800, count * 155 + 60));
  const height = 270;
  return { width, height };
}

function updateOverlayBounds() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const count = state.streamers ? state.streamers.length : 1;
  const { width, height } = calculateOverlayDimensions(count);
  const bounds = overlayWindow.getBounds();
  if (bounds.width !== width || bounds.height !== height) {
    overlayWindow.setBounds({
      x: bounds.x,
      y: bounds.y,
      width,
      height,
    });
  }
}

/**
 * Merges streamer config with its live status record.
 */
function getEnrichedStreamer(streamer) {
  const status = state.statusMap[streamer.id] || {};
  const primaryUrl = (streamer.urls && streamer.urls[0]) || "";
  const activeUrl = status.activeUrl || primaryUrl;
  const activePlatform = status.activePlatform || detectPlatform(activeUrl);

  return {
    ...streamer,
    isLive: Boolean(status.isLive),
    activeUrl,
    activePlatform,
    platform: activePlatform,
    url: activeUrl, // compatibility
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
      // Sort priority:
      // 1. Streamers with lastTriggeredAt (most recent first)
      // 2. Currently live streamers
      // 3. Offline streamers
      return [...enriched].sort((a, b) => {
        const timeA = a.lastTriggeredAt
          ? new Date(a.lastTriggeredAt).getTime()
          : 0;
        const timeB = b.lastTriggeredAt
          ? new Date(b.lastTriggeredAt).getTime()
          : 0;
        if (timeA !== timeB) return timeB - timeA;
        if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "longest-live": {
      // Sort priority:
      // 1. Live streamers with earliest startTime (longest live uptime first)
      // 2. Offline streamers
      return [...enriched].sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isLive && b.isLive) {
          const startA = a.cachedInfo?.startTime
            ? new Date(a.cachedInfo.startTime).getTime()
            : Date.now();
          const startB = b.cachedInfo?.startTime
            ? new Date(b.cachedInfo.startTime).getTime()
            : Date.now();
          return startA - startB; // Earliest start = longest live uptime
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "last-started": {
      // Sort priority:
      // 1. Live streamers with latest startTime (most recently went live first)
      // 2. Offline streamers
      return [...enriched].sort((a, b) => {
        if (a.isLive && !b.isLive) return -1;
        if (!a.isLive && b.isLive) return 1;
        if (a.isLive && b.isLive) {
          const startA = a.cachedInfo?.startTime
            ? new Date(a.cachedInfo.startTime).getTime()
            : 0;
          const startB = b.cachedInfo?.startTime
            ? new Date(b.cachedInfo.startTime).getTime()
            : 0;
          return startB - startA; // Latest start = most recently started
        }
        return (a.name || "").localeCompare(b.name || "");
      });
    }

    case "name": {
      return [...enriched].sort((a, b) =>
        (a.name || "").localeCompare(b.name || ""),
      );
    }

    case "manual":
    default:
      return enriched;
  }
}

function createOverlayWindow() {
  const count = state.streamers ? state.streamers.length : 1;
  const { width, height } = calculateOverlayDimensions(count);

  overlayWindow = new BrowserWindow({
    width,
    height,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: true,
    alwaysOnTop: state.isAlwaysOnTop,
    opacity: state.currentOpacity,
    skipTaskbar: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  overlayWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  if (state.isIgnoringMouseEvents) {
    overlayWindow.setIgnoreMouseEvents(true, { forward: true });
  }

  if (!state.overlayVisible) {
    overlayWindow.hide();
  }

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
    title: "LiveStreamers Settings",
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
          liveCheckerService.checkAll();
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
      label: "Center Overlay",
      click: () => {
        if (overlayWindow && !overlayWindow.isDestroyed()) {
          overlayWindow.center();
        }
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

      // Persist status updates to status.json
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

  const urls = Array.isArray(streamerData.urls)
    ? streamerData.urls.map((u) => normalizeUrl(u)).filter(Boolean)
    : streamerData.url
      ? [normalizeUrl(streamerData.url)]
      : [];

  if (urls.length === 0) return getSortedEnrichedStreamers();

  const name =
    streamerData.name && streamerData.name.trim()
      ? streamerData.name.trim()
      : extractStreamerName(urls[0]);

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
    liveCheckerService.checkSingleStreamer(newStreamer);
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
      return await liveCheckerService.checkSingleStreamer(streamer);
    }
  } else if (liveCheckerService) {
    liveCheckerService.checkAll();
    return true;
  }
  return false;
});

ipcMain.handle("settings:update", (_event, partialSettings) => {
  if (!partialSettings || typeof partialSettings !== "object") return state;

  if (typeof partialSettings.sortBy === "string") {
    state.sortBy = partialSettings.sortBy;
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
      overlayWindow.setIgnoreMouseEvents(state.isIgnoringMouseEvents, {
        forward: true,
      });
    }
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
  return await checkStreamerLiveTask(streamer, state.statusMap[streamer?.id]);
});

ipcMain.handle("task:run-pet-avatar", async (_event, userName) => {
  return await petTask({ userName });
});

ipcMain.handle("log:terminal", (_event, { tag, message, isError }) => {
  logToWindows(tag, message, isError);
  return true;
});

ipcMain.handle("window:center-overlay", () => {
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.center();
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
    overlayWindow.setIgnoreMouseEvents(state.isIgnoringMouseEvents, {
      forward: true,
    });
  }
  saveSettings(state);
  broadcastStateUpdate();
  return state.isIgnoringMouseEvents;
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
  createSettingsWindow();
  createTray();
  initBackgroundChecker();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createOverlayWindow();
      createSettingsWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Stay active in tray
});
