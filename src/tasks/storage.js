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
    urls: ["https://www.youtube.com/@LofiGirl/live"],
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
      "https://www.twitch.tv/shroud",
      "https://www.youtube.com/@shroud/live",
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
      "https://kick.com/xqc",
      "https://www.twitch.tv/xqcow",
      "https://www.youtube.com/@xQcOW/live",
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
  sortBy: "last-triggered", // "last-triggered" | "last-started" | "longest-live" | "manual" | "name"
  isAlwaysOnTop: true,
  isIgnoringMouseEvents: false,
  currentOpacity: 1.0,
  overlayVisible: true,
  streamers: defaultStreamers,
};

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

  // Handle URL vs URLs migration
  let urls = [];
  if (Array.isArray(streamer.urls)) {
    urls = streamer.urls.filter(
      (u) => typeof u === "string" && u.trim().length > 0,
    );
  } else if (
    typeof streamer.url === "string" &&
    streamer.url.trim().length > 0
  ) {
    urls = [streamer.url.trim()];
  }

  const triggers = {
    titleChange: streamer.triggers?.titleChange ?? true,
    viewerCountEnabled: streamer.triggers?.viewerCountEnabled ?? false,
    viewerCountThreshold: streamer.triggers?.viewerCountThreshold ?? 5000,
    goingLive: streamer.triggers?.goingLive ?? true,
    categoryChange: streamer.triggers?.categoryChange ?? true,
  };

  return {
    id: streamer.id || `streamer-${Date.now()}-${index}`,
    name:
      streamer.name && streamer.name.trim() ? streamer.name.trim() : "Streamer",
    avatarImage:
      typeof streamer.avatarImage === "string"
        ? streamer.avatarImage.trim()
        : "",
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

      return {
        ...defaultSettings,
        ...data,
        streamers: normalizedStreamers,
      };
    }
  } catch (err) {
    console.error(
      "[Storage] Error reading settings.json, using defaults:",
      err,
    );
  }

  // Save defaults if file did not exist
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
      isAlwaysOnTop: settings.isAlwaysOnTop ?? true,
      isIgnoringMouseEvents: settings.isIgnoringMouseEvents ?? false,
      currentOpacity: settings.currentOpacity ?? 1.0,
      overlayVisible: settings.overlayVisible ?? true,
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
  normalizeStreamerConfig,
  loadSettings,
  saveSettings,
  loadStatus,
  saveStatus,
};
