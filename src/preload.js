const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Settings & State
  getSettings: () => ipcRenderer.invoke("settings:get"),
  updateSettings: (settings) => ipcRenderer.invoke("settings:update", settings),
  getUsers: () => ipcRenderer.invoke("users:get"),
  updateUsers: (users) => ipcRenderer.invoke("users:update", users),

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

  // Overlay actions
  centerOverlay: () => ipcRenderer.invoke("window:center-overlay"),
  openSettings: () => ipcRenderer.invoke("settings:open"),
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  toggleClickThrough: () => ipcRenderer.invoke("window:toggle-click-through"),
  setOpacity: (opacity) => ipcRenderer.invoke("window:set-opacity", opacity),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  hideWindow: () => ipcRenderer.invoke("window:hide"),
  quitApp: () => ipcRenderer.invoke("app:quit"),
});
