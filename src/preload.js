const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  toggleAlwaysOnTop: () => ipcRenderer.invoke("window:toggle-always-on-top"),
  toggleClickThrough: () => ipcRenderer.invoke("window:toggle-click-through"),
  setOpacity: (opacity) => ipcRenderer.invoke("window:set-opacity", opacity),
  closeWindow: () => ipcRenderer.invoke("window:close"),
  hideWindow: () => ipcRenderer.invoke("window:hide"),
});
