const { app, BrowserWindow, ipcMain, screen } = require('electron');

let tooltipWin = null;

function createTooltipWindow() {
  tooltipWin = new BrowserWindow({
    width: 10,  // Dummy initial size
    height: 10,
    show: false,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    focusable: false,
    resizable: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  tooltipWin.loadFile('tooltip.html');
}

// Receive the auto-calculated dimension from the tooltip renderer
ipcMain.on('update-tooltip-size', (event, { width, height }) => {
  if (!tooltipWin || tooltipWin.isDestroyed()) return;
  
  // Update secondary window dimensions to fit content exactly
  tooltipWin.setSize(width, height);
});

// Show and position relative to screen/cursor
ipcMain.on('show-tooltip', (event, { text, x, y }) => {
  if (!tooltipWin) createTooltipWindow();

  tooltipWin.webContents.send('set-text', text);

  // Get current cursor display boundaries to avoid going off-screen
  const display = screen.getDisplayNearestPoint({ x, y }).workArea;
  const [winWidth, winHeight] = tooltipWin.getSize();

  // Clamp position inside visible screen work area
  let finalX = Math.min(x + 10, display.x + display.width - winWidth);
  let finalY = y + 20 > display.y + display.height ? y - winHeight - 10 : y + 20;

  tooltipWin.setPosition(Math.round(finalX), Math.round(finalY));
  tooltipWin.showInactive(); // Shows without taking focus from active window
});

ipcMain.on('hide-tooltip', () => {
  if (tooltipWin) tooltipWin.hide();
});