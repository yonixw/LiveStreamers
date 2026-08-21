const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Settings & State
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (settings) => ipcRenderer.invoke("settings:update", settings),
  getUsers: () => ipcRenderer.invoke("users:get"),
  updateUsers: (users) => ipcRenderer.invoke("users:update", users),

  // Streamers Management & Live Info
  getStreamers: () => ipcRenderer.invoke("streamers:get"),
  updateStreamers: (streamers) =>
    ipcRenderer.invoke("streamers:update", streamers),
  addStreamer: (data) => ipcRenderer.invoke("streamers:add", data),
  removeStreamer: (streamerId) =>
    ipcRenderer.invoke("streamers:remove", streamerId),
  checkStreamerLive: (streamerId) =>
    ipcRenderer.invoke("streamers:check-now", streamerId),

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
  onUsersUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("users:updated", handler);
    return () => ipcRenderer.removeListener("users:updated", handler);
  },
  onStreamersUpdated: (callback) => {
    const handler = (_event, data) => callback(data);
    ipcRenderer.on("streamers:updated", handler);
    return () => ipcRenderer.removeListener("streamers:updated", handler);
  },

  // Overlay & System actions
  centerOverlay: () => ipcRenderer.invoke("window:center-overlay"),
  openSettings: () => ipcRenderer.invoke("settings:open"),
  toggleDevTools: () => ipcRenderer.invoke("settings:toggle-devtools"),
  logTerminal: (tag, message, isError = false) =>
    ipcRenderer.invoke("log:terminal", { tag, message, isError }),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  toggleClickThrough: () => ipcRenderer.invoke("window:toggle-click-through"),
  setOpacity: (opacity) => ipcRenderer.invoke("window:set-opacity", opacity),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  hideWindow: () => ipcRenderer.invoke("window:hide"),
  quitApp: () => ipcRenderer.invoke("app:quit"),
});
