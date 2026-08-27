const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Settings & State
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (settings) => ipcRenderer.invoke("settings:update", settings),
  getStatus: () => ipcRenderer.invoke("status:get"),

  // Streamers Management & Live Info
  getStreamers: () => ipcRenderer.invoke("streamers:get"),
  updateStreamers: (streamers) =>
    ipcRenderer.invoke("streamers:update", streamers),
  addStreamer: (data) => ipcRenderer.invoke("streamers:add", data),
  removeStreamer: (streamerId) =>
    ipcRenderer.invoke("streamers:remove", streamerId),
  checkStreamerLive: (streamerId) =>
    ipcRenderer.invoke("streamers:check-now", streamerId),
  selectAvatarImage: () => ipcRenderer.invoke("dialog:select-avatar-image"),
  selectCommandFile: () => ipcRenderer.invoke("dialog:select-command-file"),
  testActionRule: (data) => ipcRenderer.invoke("action-rules:test", data),
  openStreamerLinksPopup: (streamerId) =>
    ipcRenderer.invoke("popup:open-streamer-links", streamerId),
  getActivePopupStreamer: () => ipcRenderer.invoke("popup:get-active-streamer"),
  snoozeStreamer: (streamerId, durationMs) =>
    ipcRenderer.invoke("popup:snooze-streamer", { streamerId, durationMs }),

  // Node.js Side Tasks
  runPetAvatarTask: (userName) =>
    ipcRenderer.invoke("task:run-pet-avatar", userName),
  runStreamerCheckTask: (streamer) =>
    ipcRenderer.invoke("task:run-streamer-check", streamer),

  // Event Listeners
  onSettingsUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("settings:updated", handler);
    return () => ipcRenderer.removeListener("settings:updated", handler);
  },
  onStreamersUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("streamers:updated", handler);
    return () => ipcRenderer.removeListener("streamers:updated", handler);
  },
  onStatusUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("status:updated", handler);
    return () => ipcRenderer.removeListener("status:updated", handler);
  },
  onLogEntry: (callback) => {
    const handler = (_event, entry) => callback(entry);
    ipcRenderer.on("log:entry", handler);
    return () => ipcRenderer.removeListener("log:entry", handler);
  },

  // Tooltip Window
  showTooltip: (data) => ipcRenderer.invoke("tooltip:show", data),
  hideTooltip: () => ipcRenderer.invoke("tooltip:hide"),
  updateTooltipSize: (size) => ipcRenderer.invoke("tooltip:update-size", size),
  onTooltipData: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("tooltip:set-data", handler);
    return () => ipcRenderer.removeListener("tooltip:set-data", handler);
  },

  // Overlay & System actions
  openExternal: (url) => ipcRenderer.invoke("app:open-external", url),
  centerOverlay: () => ipcRenderer.invoke("window:center-overlay"),
  openSettings: () => ipcRenderer.invoke("settings:open"),
  toggleDevTools: () => ipcRenderer.invoke("settings:toggle-devtools"),
  getLogHistory: () => ipcRenderer.invoke("log:get-history"),
  clearLogs: () => ipcRenderer.invoke("log:clear"),
  logTerminal: (tag, message, isError = false) =>
    ipcRenderer.invoke("log:terminal", { tag, message, isError }),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  toggleClickThrough: () => ipcRenderer.invoke("window:toggle-click-through"),
  setIgnoreMouseEvents: (ignore, options) =>
    ipcRenderer.invoke("window:set-ignore-mouse-events", ignore, options),
  rotateWindowState: () => ipcRenderer.invoke("window:rotate-state"),
  setWindowStateIndex: (index) =>
    ipcRenderer.invoke("window:set-state-index", index),
  setOpacity: (opacity) => ipcRenderer.invoke("window:set-opacity", opacity),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  hideWindow: () => ipcRenderer.invoke("window:hide"),
  quitApp: () => ipcRenderer.invoke("app:quit"),
});
