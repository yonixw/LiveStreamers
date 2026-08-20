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

let mainWindow = null;
let tray = null;
let isAlwaysOnTop = true;
let isIgnoringMouseEvents = false;

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
        buffer[idx] = 64; // R
        buffer[idx + 1] = 158; // G
        buffer[idx + 2] = 255; // B
        buffer[idx + 3] = 255; // Alpha
      } else {
        buffer[idx + 3] = 0; // Transparent
      }
    }
  }
  return nativeImage.createFromBuffer(buffer, { width: size, height: size });
}

function createWindow() {
  const windowSize = 260;

  mainWindow = new BrowserWindow({
    width: windowSize,
    height: windowSize,
    transparent: true,
    frame: false,
    hasShadow: false,
    resizable: false,
    alwaysOnTop: isAlwaysOnTop,
    skipTaskbar: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  mainWindow.loadFile(path.join(__dirname, "renderer", "index.html"));

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function createTray() {
  const icon = createDefaultTrayIcon();
  tray = new Tray(icon);
  tray.setToolTip("LiveStreamer Circle UI");

  buildTrayMenu();

  tray.on("click", () => {
    if (!mainWindow) {
      createWindow();
      return;
    }
    if (mainWindow.isVisible()) {
      mainWindow.hide();
    } else {
      mainWindow.show();
      mainWindow.focus();
    }
    buildTrayMenu();
  });
}

function buildTrayMenu() {
  if (!tray) return;

  const isVisible = mainWindow ? mainWindow.isVisible() : false;

  const contextMenu = Menu.buildFromTemplate([
    {
      label: "LiveStreamer Circle Overlay",
      enabled: false,
    },
    { type: "separator" },
    {
      label: isVisible ? "Hide Window" : "Show Window",
      click: () => {
        if (!mainWindow) {
          createWindow();
          return;
        }
        if (isVisible) {
          mainWindow.hide();
        } else {
          mainWindow.show();
        }
        buildTrayMenu();
      },
    },
    {
      label: "Always on Top",
      type: "checkbox",
      checked: isAlwaysOnTop,
      click: (menuItem) => {
        isAlwaysOnTop = menuItem.checked;
        if (mainWindow) {
          mainWindow.setAlwaysOnTop(isAlwaysOnTop);
        }
      },
    },
    {
      label: "Click-Through (Ignore Mouse)",
      type: "checkbox",
      checked: isIgnoringMouseEvents,
      click: (menuItem) => {
        isIgnoringMouseEvents = menuItem.checked;
        if (mainWindow) {
          mainWindow.setIgnoreMouseEvents(isIgnoringMouseEvents, {
            forward: true,
          });
        }
      },
    },
    {
      label: "Center on Screen",
      click: () => {
        if (mainWindow) {
          mainWindow.center();
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

// IPC Handlers
ipcMain.handle("window:toggle-always-on-top", () => {
  if (!mainWindow) return isAlwaysOnTop;
  isAlwaysOnTop = !isAlwaysOnTop;
  mainWindow.setAlwaysOnTop(isAlwaysOnTop);
  buildTrayMenu();
  return isAlwaysOnTop;
});

ipcMain.handle("window:toggle-click-through", () => {
  if (!mainWindow) return isIgnoringMouseEvents;
  isIgnoringMouseEvents = !isIgnoringMouseEvents;
  mainWindow.setIgnoreMouseEvents(isIgnoringMouseEvents, { forward: true });
  buildTrayMenu();
  return isIgnoringMouseEvents;
});

ipcMain.handle("window:close", () => {
  if (mainWindow) {
    mainWindow.close();
  }
});

ipcMain.handle("window:hide", () => {
  if (mainWindow) {
    mainWindow.hide();
    buildTrayMenu();
  }
});

// App lifecycle
app.whenReady().then(() => {
  createWindow();
  createTray();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  // Keep app active in background if tray exists, standard for tray utilities
  // If platform is macOS (darwin), staying open is standard too.
});
