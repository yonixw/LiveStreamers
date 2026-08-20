# Electron Circle Overlay Boilerplate

A cross-platform Electron boilerplate displaying a transparent, circular UI overlay with a system tray menu. Built for Windows and cross-platform desktop use (compatible with Node.js 22+ and Bun CLI).

## Features

- **Transparent Frameless Window**: Only the circular element and its glow/drop-shadow are visible.
- **Draggable UI**: Move the circle anywhere across your desktop with drag-and-drop.
- **System Tray Menu**:
  - Show / Hide Overlay
  - Opacity / Transparency adjustment (100%, 75%, 50%, 25%, 10%)
  - Toggle Always on Top (Pinning)
  - Toggle Click-Through (Mouse pass-through)
  - Center on Screen
  - Quit
- **Cross-Platform**: Windows, macOS, and Linux support.
- **Secure Architecture**: Context isolation enabled, preload script with safe IPC bridge.

## Project Structure

```text
├── package.json
├── src/
│   ├── main.js             # Electron main process & Tray menu configuration
│   ├── preload.js          # Secure IPC contextBridge
│   ├── assets/
│   │   ├── sample-avatar.svg
│   │   └── tray-icon.svg
│   └── renderer/
│       ├── index.html      # Circular overlay markup
│       ├── style.css       # Transparent background & circular styling
│       └── renderer.js     # Renderer-side interactions
└── README.md
```

## Getting Started

### 1. Install Dependencies

Using Bun:
```bash
bun install
```

Or using npm:
```bash
npm install
```

### 2. Run Application

Using Bun:
```bash
bun run start
```

Or using npx:
```bash
npx electron .
```

## Customization

- To change the circular image, replace [`src/assets/sample-avatar.svg`](src/assets/sample-avatar.svg:1) or point [`src/renderer/index.html`](src/renderer/index.html:12) to your desired image or stream feed.
- To adjust window dimensions or initial overlay settings, edit [`src/main.js`](src/main.js:38).
