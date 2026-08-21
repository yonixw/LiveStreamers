const {
  app,
  BrowserWindow,
  Tray,
  Menu,
  nativeImage,
  ipcMain,
  screen,
} = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const crypto = require("node:crypto");
const { petTask } = require("./tasks/example");
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

// Initial default streamers list (Kick, Twitch, YouTube)
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

// Application state
const state = {
  streamers: defaultStreamers,
  users: defaultStreamers.map((s) => s.name),
  isAlwaysOnTop: true,
  isIgnoringMouseEvents: false,
  currentOpacity: 1.0,
  overlayVisible: true,
};

function createDefaultTrayIcon() {
  const iconPath = path.join(__dirname, "assets", "tray-icon.png");
  if (fs.existsSync(iconPath)) {
    return nativeImage.createFromPath(iconPath);
  }

  // 16x16 fallback RGBA icon buffer (simple circle) if image file is missing
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
  const width = Math.max(280, Math.min(1600, count * 160 + 40));
  const height = 240;
  return { width, height };
}

function updateOverlayBounds() {
  if (!overlayWindow || overlayWindow.isDestroyed()) return;
  const count = state.streamers ? state.streamers.length : state.users.length;
  const { width, height } = calculateOverlayDimensions(count);
  const bounds = overlayWindow.getBounds();
  overlayWindow.setBounds({
    x: bounds.x,
    y: bounds.y,
    width,
    height,
  });
}

function createOverlayWindow() {
  const count = state.streamers ? state.streamers.length : state.users.length;
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
    width: 680,
    height: 840,
    minWidth: 500,
    minHeight: 600,
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

  const liveCount = state.streamers.filter((s) => s.isLive).length;
  const statusSummary =
    state.streamers.length > 0
      ? `${liveCount}/${state.streamers.length} Live`
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
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.webContents.send("settings:updated", state);
    overlayWindow.webContents.send("users:updated", state.users);
    overlayWindow.webContents.send("streamers:updated", state.streamers);
  }
  if (settingsWindow && !settingsWindow.isDestroyed()) {
    settingsWindow.webContents.send("settings:updated", state);
    settingsWindow.webContents.send("users:updated", state.users);
    settingsWindow.webContents.send("streamers:updated", state.streamers);
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
    onStatusUpdate: (update) => {
      const {
        streamerId,
        checkStatus,
        isLive,
        cachedInfo,
        lastChecked,
        lastError,
      } = update;
      const index = state.streamers.findIndex(
        (s) => s.id === streamerId || s.url === streamerId,
      );

      if (index !== -1) {
        const current = state.streamers[index];
        state.streamers[index] = {
          ...current,
          checkStatus: checkStatus ?? current.checkStatus,
          isLive: isLive !== undefined ? isLive : current.isLive,
          cachedInfo: isLive ? cachedInfo : cachedInfo || current.cachedInfo,
          lastChecked: lastChecked || current.lastChecked,
          lastError: lastError !== undefined ? lastError : current.lastError,
        };

        broadcastStateUpdate();
      }
    },
    onLog: (tag, msg, isError) => {
      logToWindows(tag, msg, isError);
    },
    intervalMs: 60000, // Check once a minute per link
  });

  liveCheckerService.start();
}

// IPC Handlers
ipcMain.handle("settings:get", () => {
  return state;
});

ipcMain.handle("streamers:get", () => {
  return state.streamers;
});

ipcMain.handle("streamers:update", (_event, newStreamers) => {
  if (Array.isArray(newStreamers)) {
    state.streamers = newStreamers;
    state.users = newStreamers.map((s) => s.name || s.url);
    updateOverlayBounds();
    broadcastStateUpdate();
  }
  return state.streamers;
});

ipcMain.handle("streamers:add", (_event, streamerData) => {
  if (!streamerData || !streamerData.url) return state.streamers;

  const url = normalizeUrl(streamerData.url);
  const platform = streamerData.platform || detectPlatform(url);
  const name =
    streamerData.name && streamerData.name.trim()
      ? streamerData.name.trim()
      : extractStreamerName(url);
  const id = `streamer-${Date.now()}-${crypto.randomInt(100, 999)}`;

  const newStreamer = {
    id,
    name,
    url,
    platform,
    isLive: false,
    cachedInfo: null,
    lastChecked: null,
    checkStatus: "idle",
    lastError: null,
  };

  state.streamers.push(newStreamer);
  state.users = state.streamers.map((s) => s.name);

  updateOverlayBounds();
  broadcastStateUpdate();

  // Trigger immediate check in background for newly added streamer
  if (liveCheckerService) {
    liveCheckerService.checkSingleStreamer(newStreamer);
  }

  return state.streamers;
});

ipcMain.handle("streamers:remove", (_event, streamerId) => {
  state.streamers = state.streamers.filter(
    (s) => s.id !== streamerId && s.url !== streamerId,
  );
  state.users = state.streamers.map((s) => s.name);
  updateOverlayBounds();
  broadcastStateUpdate();
  return state.streamers;
});

ipcMain.handle("streamers:check-now", async (_event, streamerId) => {
  if (streamerId) {
    const streamer = state.streamers.find(
      (s) => s.id === streamerId || s.url === streamerId,
    );
    if (streamer && liveCheckerService) {
      return await liveCheckerService.checkSingleStreamer(streamer);
    }
  } else if (liveCheckerService) {
    liveCheckerService.checkAll();
    return true;
  }
  return false;
});

ipcMain.handle("users:get", () => {
  return state.users;
});

ipcMain.handle("users:update", (_event, newUsers) => {
  if (Array.isArray(newUsers)) {
    // If array of strings, sync with streamers
    if (typeof newUsers[0] === "string") {
      state.users = newUsers;
      // Ensure streamer objects align
      state.streamers = newUsers.map((name, i) => {
        const existing = state.streamers[i];
        if (existing) {
          return { ...existing, name };
        }
        return {
          id: `streamer-${Date.now()}-${i}`,
          name,
          url: `https://www.youtube.com/@${name}`,
          platform: "youtube",
          isLive: false,
          cachedInfo: null,
          lastChecked: null,
          checkStatus: "idle",
          lastError: null,
        };
      });
    } else if (typeof newUsers[0] === "object") {
      state.streamers = newUsers;
      state.users = newUsers.map((s) => s.name || s.url);
    }
    updateOverlayBounds();
    broadcastStateUpdate();
  }
  return state.users;
});

ipcMain.handle("settings:update", (_event, partialSettings) => {
  if (!partialSettings || typeof partialSettings !== "object") return state;

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
    state.streamers = partialSettings.streamers;
    state.users = state.streamers.map((s) => s.name || s.url);
    updateOverlayBounds();
  } else if (Array.isArray(partialSettings.users)) {
    state.users = partialSettings.users;
    updateOverlayBounds();
  }

  broadcastStateUpdate();
  return state;
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

// Single Streamer Check Task Execution
ipcMain.handle("task:run-streamer-check", async (_event, streamer) => {
  return await checkStreamerLiveTask(streamer);
});

// Node.js Side Pet Avatar Task Execution
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
  broadcastStateUpdate();
  return state.isIgnoringMouseEvents;
});

ipcMain.handle("window:set-opacity", (_event, opacity) => {
  state.currentOpacity = Math.max(0.05, Math.min(1.0, opacity));
  if (overlayWindow && !overlayWindow.isDestroyed()) {
    overlayWindow.setOpacity(state.currentOpacity);
  }
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
