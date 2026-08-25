const fs = require("fs");
const path = require("path");

// Resolve data storage paths
function getDataDir() {
  const dataDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    try {
      fs.mkdirSync(dataDir, { recursive: true });
    } catch (err) {
      console.error("[Storage] Failed to create data directory:", err);
    }
  }
  return dataDir;
}

function getSettingsPath() {
  return path.join(getDataDir(), "settings.json");
}

function getStatusPath() {
  return path.join(getDataDir(), "status.json");
}

const defaultStreamers = [
  {
    id: "yt-lofigirl",
    name: "Lofi Girl",
    avatarImage: "",
    urls: [{ url: "https://www.youtube.com/@LofiGirl/live", freqMinutes: 1 }],
    triggers: {
      titleChange: true,
      viewerCountEnabled: false,
      viewerCountThreshold: 5000,
      goingLive: true,
      categoryChange: true,
    },
  },
  {
    id: "tw-shroud",
    name: "Shroud",
    avatarImage: "",
    urls: [
      { url: "https://www.twitch.tv/shroud", freqMinutes: 1 },
      { url: "https://www.youtube.com/@shroud/live", freqMinutes: 2 },
    ],
    triggers: {
      titleChange: true,
      viewerCountEnabled: false,
      viewerCountThreshold: 10000,
      goingLive: true,
      categoryChange: true,
    },
  },
  {
    id: "kc-xqc",
    name: "xQc",
    avatarImage: "",
    urls: [
      { url: "https://kick.com/xqc", freqMinutes: 1 },
      { url: "https://www.twitch.tv/xqcow", freqMinutes: 1 },
      { url: "https://www.youtube.com/@xQcOW/live", freqMinutes: 3 },
    ],
    triggers: {
      titleChange: true,
      viewerCountEnabled: true,
      viewerCountThreshold: 20000,
      goingLive: true,
      categoryChange: true,
    },
  },
];

const defaultSettings = {
  sortBy: "last-triggered",
  avatarSize: 80,
  avatarAlignment: "left",
  fontSize: 12,
  layoutOrientation: "vertical",
  layoutReversed: false,
  showNicknameTag: false,
  isAlwaysOnTop: true,
  isIgnoringMouseEvents: false,
  smartClickThrough: false,
  showBoundaryCorners: false,
  windowStatesCount: 1,
  currentWindowStateIndex: 0,
  windowStates: [
    {
      x: null,
      y: null,
      width: 280,
      height: 460,
    },
  ],
  currentOpacity: 1.0,
  overlayVisible: true,
  overlayBounds: {
    x: null,
    y: null,
    width: 280,
    height: 460,
  },
  popupBounds: null,
  streamers: defaultStreamers,
};

/**
 * Normalizes a URL entry to { url: string, freqMinutes: number }.
 */
function normalizeUrlEntry(entry) {
  if (!entry) return null;
  if (typeof entry === "string" && entry.trim().length > 0) {
    return {
      url: entry.trim(),
      freqMinutes: 1,
    };
  }
  if (
    typeof entry === "object" &&
    typeof entry.url === "string" &&
    entry.url.trim().length > 0
  ) {
    const freq = Math.max(1, parseInt(entry.freqMinutes, 10) || 1);
    return {
      url: entry.url.trim(),
      freqMinutes: freq,
    };
  }
  return null;
}

/**
 * Normalizes a single streamer object ensuring consistent schema.
 */
function normalizeStreamerConfig(streamer, index = 0) {
  if (!streamer || typeof streamer !== "object") {
    return {
      id: `streamer-${Date.now()}-${index}`,
      name: `Streamer ${index + 1}`,
      avatarImage: "",
      urls: [],
      triggers: {
        titleChange: true,
        viewerCountEnabled: false,
        viewerCountThreshold: 5000,
        goingLive: true,
        categoryChange: true,
      },
    };
  }

  // Handle URL vs URLs migration and frequency
  let rawUrls = [];
  if (Array.isArray(streamer.urls)) {
    rawUrls = streamer.urls;
  } else if (
    typeof streamer.url === "string" &&
    streamer.url.trim().length > 0
  ) {
    rawUrls = [streamer.url.trim()];
  }

  const urls = rawUrls.map(normalizeUrlEntry).filter(Boolean);

  const triggers = {
    titleChange: streamer.triggers?.titleChange ?? true,
    titleContainsEnabled: streamer.triggers?.titleContainsEnabled ?? false,
    titleContainsText:
      typeof streamer.triggers?.titleContainsText === "string"
        ? streamer.triggers.titleContainsText.trim()
        : "",
    viewerCountEnabled: streamer.triggers?.viewerCountEnabled ?? false,
    viewerCountThreshold: streamer.triggers?.viewerCountThreshold ?? 5000,
    runtimeMinutesEnabled: streamer.triggers?.runtimeMinutesEnabled ?? false,
    runtimeMinutesThreshold:
      Number(streamer.triggers?.runtimeMinutesThreshold) || 30,
    goingLive: streamer.triggers?.goingLive ?? true,
    categoryChange: streamer.triggers?.categoryChange ?? true,
  };

  const customTag =
    typeof streamer.customTag === "string" ? streamer.customTag.trim() : "";
  const snoozedUntil =
    typeof streamer.snoozedUntil === "string" && streamer.snoozedUntil.trim()
      ? streamer.snoozedUntil.trim()
      : null;

  return {
    id: streamer.id || `streamer-${Date.now()}-${index}`,
    name:
      streamer.name && streamer.name.trim() ? streamer.name.trim() : "Streamer",
    avatarImage:
      typeof streamer.avatarImage === "string"
        ? streamer.avatarImage.trim()
        : "",
    customTag,
    snoozedUntil,
    urls,
    triggers,
  };
}

/**
 * Loads settings from settings.json or initializes default.
 */
function loadSettings() {
  const filePath = getSettingsPath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const data = JSON.parse(raw);
      const normalizedStreamers = Array.isArray(data.streamers)
        ? data.streamers.map((s, idx) => normalizeStreamerConfig(s, idx))
        : defaultStreamers;

      const windowStatesCount = Math.max(
        1,
        parseInt(data.windowStatesCount, 10) || 1,
      );
      let windowStates = Array.isArray(data.windowStates)
        ? data.windowStates
        : [];
      if (windowStates.length === 0) {
        windowStates = [data.overlayBounds || defaultSettings.overlayBounds];
      }
      while (windowStates.length < windowStatesCount) {
        windowStates.push(
          windowStates[0]
            ? { ...windowStates[0] }
            : { ...defaultSettings.overlayBounds },
        );
      }
      const currentWindowStateIndex = Math.max(
        0,
        Math.min(
          windowStatesCount - 1,
          parseInt(data.currentWindowStateIndex, 10) || 0,
        ),
      );

      return {
        ...defaultSettings,
        ...data,
        smartClickThrough: Boolean(data.smartClickThrough),
        showBoundaryCorners: Boolean(data.showBoundaryCorners),
        windowStatesCount,
        currentWindowStateIndex,
        windowStates,
        overlayBounds:
          windowStates[currentWindowStateIndex] ||
          data.overlayBounds ||
          defaultSettings.overlayBounds,
        streamers: normalizedStreamers,
      };
    }
  } catch (err) {
    console.error(
      "[Storage] Error reading settings.json, using defaults:",
      err,
    );
  }

  saveSettings(defaultSettings);
  return { ...defaultSettings };
}

/**
 * Saves settings to settings.json atomically.
 */
function saveSettings(settings) {
  const filePath = getSettingsPath();
  try {
    const toSave = {
      sortBy: settings.sortBy || "last-triggered",
      avatarSize:
        typeof settings.avatarSize === "number"
          ? settings.avatarSize
          : parseInt(settings.avatarSize, 10) || 80,
      avatarAlignment:
        settings.avatarAlignment === "right"
          ? "right"
          : settings.avatarAlignment === "center"
            ? "center"
            : "left",
      fontSize:
        typeof settings.fontSize === "number"
          ? settings.fontSize
          : parseInt(settings.fontSize, 10) || 12,
      layoutOrientation:
        settings.layoutOrientation === "horizontal" ? "horizontal" : "vertical",
      layoutReversed: Boolean(settings.layoutReversed),
      showNicknameTag: settings.showNicknameTag ?? false,
      isAlwaysOnTop: settings.isAlwaysOnTop ?? true,
      isIgnoringMouseEvents: settings.isIgnoringMouseEvents ?? false,
      smartClickThrough: settings.smartClickThrough ?? false,
      showBoundaryCorners: settings.showBoundaryCorners ?? false,
      windowStatesCount: Math.max(
        1,
        parseInt(settings.windowStatesCount, 10) || 1,
      ),
      currentWindowStateIndex: Math.max(
        0,
        parseInt(settings.currentWindowStateIndex, 10) || 0,
      ),
      windowStates: Array.isArray(settings.windowStates)
        ? settings.windowStates
        : settings.overlayBounds
          ? [settings.overlayBounds]
          : defaultSettings.windowStates,
      currentOpacity: settings.currentOpacity ?? 1.0,
      overlayVisible: settings.overlayVisible ?? true,
      overlayBounds: settings.overlayBounds || null,
      popupBounds: settings.popupBounds || null,
      streamers: Array.isArray(settings.streamers)
        ? settings.streamers.map((s, idx) => normalizeStreamerConfig(s, idx))
        : defaultStreamers,
    };
    fs.writeFileSync(filePath, JSON.stringify(toSave, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Storage] Failed to save settings.json:", err);
    return false;
  }
}

/**
 * Loads latest statuses from status.json.
 */
function loadStatus() {
  const filePath = getStatusPath();
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error("[Storage] Error reading status.json:", err);
  }
  return {};
}

/**
 * Saves statuses to status.json atomically.
 */
function saveStatus(statusMap) {
  const filePath = getStatusPath();
  try {
    fs.writeFileSync(filePath, JSON.stringify(statusMap, null, 2), "utf-8");
    return true;
  } catch (err) {
    console.error("[Storage] Failed to save status.json:", err);
    return false;
  }
}

module.exports = {
  getDataDir,
  getSettingsPath,
  getStatusPath,
  defaultStreamers,
  defaultSettings,
  normalizeUrlEntry,
  normalizeStreamerConfig,
  loadSettings,
  saveSettings,
  loadStatus,
  saveStatus,
};
