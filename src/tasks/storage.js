const fs = require("fs");
const path = require("path");
const yaml = require("js-yaml");

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

function getSettingsYamlPath() {
  return path.join(getDataDir(), "settings.yaml");
}

function getStatusPath() {
  return path.join(getDataDir(), "status.json");
}

function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

const defaultStreamers = [
  {
    id: "yt-lofigirl",
    name: "Lofi Girl",
    avatarImage: "",
    followingDate: "2026-08-20",
    note: "Cozy lo-fi beats stream",
    checkFreqOfflineMinutes: 5,
    checkFreqOnlineMinutes: 2,
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
    followingDate: "2026-08-20",
    note: "FPS / shooter gameplay",
    checkFreqOfflineMinutes: 5,
    checkFreqOnlineMinutes: 2,
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
    followingDate: "2026-08-20",
    note: "Variety / gaming",
    checkFreqOfflineMinutes: 5,
    checkFreqOnlineMinutes: 2,
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
  hideOfflineEnabled: false,
  hideOfflineDays: 7,
  hideOfflineHours: 0,
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
  tooltipOpacity: 1.0,
  overlayVisible: true,
  overlayBounds: {
    x: null,
    y: null,
    width: 280,
    height: 460,
  },
  popupBounds: null,
  actionRules: [],
  colorRules: [],
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
 * Normalizes an action rule object ({ id, name, enabled, command, streamerIds }).
 */
function normalizeActionRule(rule, index = 0) {
  if (!rule || typeof rule !== "object") {
    return {
      id: `action-rule-${Date.now()}-${index}`,
      name: `Action Rule ${index + 1}`,
      enabled: true,
      command: "",
      streamerIds: [],
    };
  }
  return {
    id:
      typeof rule.id === "string" && rule.id.trim()
        ? rule.id.trim()
        : `action-rule-${Date.now()}-${index}`,
    name:
      typeof rule.name === "string" && rule.name.trim()
        ? rule.name.trim()
        : `Action Rule ${index + 1}`,
    enabled: rule.enabled !== false,
    command: typeof rule.command === "string" ? rule.command.trim() : "",
    streamerIds: Array.isArray(rule.streamerIds)
      ? rule.streamerIds.map((id) => String(id).trim()).filter(Boolean)
      : [],
  };
}

/**
 * Normalizes a color rule object ({ id, name, enabled, color, streamerIds }).
 */
function normalizeColorRule(rule, index = 0) {
  const allowedPatterns = [
    "solid",
    "dashed",
    "dotted",
    "double",
    "dual-gradient",
    "striped",
  ];

  if (!rule || typeof rule !== "object") {
    return {
      id: `color-rule-${Date.now()}-${index}`,
      name: `Color Rule ${index + 1}`,
      enabled: true,
      color: "#22c55e",
      secondaryColor: "#a855f7",
      borderPattern: "solid",
      streamerIds: [],
    };
  }

  const borderPattern =
    typeof rule.borderPattern === "string" &&
    allowedPatterns.includes(rule.borderPattern.toLowerCase())
      ? rule.borderPattern.toLowerCase()
      : "solid";

  return {
    id:
      typeof rule.id === "string" && rule.id.trim()
        ? rule.id.trim()
        : `color-rule-${Date.now()}-${index}`,
    name:
      typeof rule.name === "string" && rule.name.trim()
        ? rule.name.trim()
        : `Color Rule ${index + 1}`,
    enabled: rule.enabled !== false,
    color:
      typeof rule.color === "string" && rule.color.trim()
        ? rule.color.trim()
        : "#22c55e",
    secondaryColor:
      typeof rule.secondaryColor === "string" && rule.secondaryColor.trim()
        ? rule.secondaryColor.trim()
        : "#a855f7",
    borderPattern,
    streamerIds: Array.isArray(rule.streamerIds)
      ? rule.streamerIds.map((id) => String(id).trim()).filter(Boolean)
      : [],
  };
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
      followingDate: getTodayDateString(),
      note: "",
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
    viewerStepEnabled: streamer.triggers?.viewerStepEnabled ?? false,
    viewerStepCount:
      typeof streamer.triggers?.viewerStepCount !== "undefined"
        ? Math.max(2, parseInt(streamer.triggers.viewerStepCount, 10) || 100)
        : 100,
    runtimeMinutesEnabled: streamer.triggers?.runtimeMinutesEnabled ?? false,
    runtimeMinutesThreshold:
      Number(streamer.triggers?.runtimeMinutesThreshold) || 30,
    runtimeIntervalEnabled: streamer.triggers?.runtimeIntervalEnabled ?? false,
    runtimeIntervalMinutes:
      typeof streamer.triggers?.runtimeIntervalMinutes !== "undefined"
        ? Math.max(
            1,
            parseInt(streamer.triggers.runtimeIntervalMinutes, 10) || 30,
          )
        : 30,
    goingLive: streamer.triggers?.goingLive ?? true,
    categoryChange: streamer.triggers?.categoryChange ?? true,
  };

  const followingDate =
    typeof streamer.followingDate === "string" && streamer.followingDate.trim()
      ? streamer.followingDate.trim()
      : getTodayDateString();
  const note = typeof streamer.note === "string" ? streamer.note.trim() : "";
  const customTag =
    typeof streamer.customTag === "string" ? streamer.customTag.trim() : "";
  const snoozedUntil =
    typeof streamer.snoozedUntil === "string" && streamer.snoozedUntil.trim()
      ? streamer.snoozedUntil.trim()
      : null;

  const checkFreqOfflineMinutes =
    typeof streamer.checkFreqOfflineMinutes !== "undefined"
      ? Math.max(1, parseInt(streamer.checkFreqOfflineMinutes, 10) || 5)
      : 5;
  const checkFreqOnlineMinutes =
    typeof streamer.checkFreqOnlineMinutes !== "undefined"
      ? Math.max(1, parseInt(streamer.checkFreqOnlineMinutes, 10) || 2)
      : 2;

  return {
    id: streamer.id || `streamer-${Date.now()}-${index}`,
    name:
      streamer.name && streamer.name.trim() ? streamer.name.trim() : "Streamer",
    avatarImage:
      typeof streamer.avatarImage === "string"
        ? streamer.avatarImage.trim()
        : "",
    followingDate,
    note,
    customTag,
    snoozedUntil,
    checkFreqOfflineMinutes,
    checkFreqOnlineMinutes,
    urls,
    triggers,
  };
}

/**
 * Loads settings from settings.yaml (fallback: settings.json) or initializes default.
 */
function loadSettings() {
  const yamlPath = getSettingsYamlPath();
  const jsonPath = getSettingsPath();
  let data = null;

  try {
    if (fs.existsSync(yamlPath)) {
      const raw = fs.readFileSync(yamlPath, "utf-8");
      data = yaml.load(raw);
    } else if (fs.existsSync(jsonPath)) {
      const raw = fs.readFileSync(jsonPath, "utf-8");
      data = JSON.parse(raw);
    }
  } catch (err) {
    console.error(
      "[Storage] Error reading settings file, using defaults:",
      err,
    );
  }

  if (data && typeof data === "object") {
    try {
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

      const normalizedActionRules = Array.isArray(data.actionRules)
        ? data.actionRules.map((r, i) => normalizeActionRule(r, i))
        : [];
      const normalizedColorRules = Array.isArray(data.colorRules)
        ? data.colorRules.map((r, i) => normalizeColorRule(r, i))
        : [];

      return {
        ...defaultSettings,
        ...data,
        smartClickThrough: Boolean(data.smartClickThrough),
        showBoundaryCorners: Boolean(data.showBoundaryCorners),
        hideOfflineEnabled: Boolean(data.hideOfflineEnabled),
        hideOfflineDays:
          typeof data.hideOfflineDays !== "undefined"
            ? Math.max(0, parseInt(data.hideOfflineDays, 10) || 0)
            : 7,
        hideOfflineHours:
          typeof data.hideOfflineHours !== "undefined"
            ? Math.max(
                0,
                Math.min(23, parseInt(data.hideOfflineHours, 10) || 0),
              )
            : 0,
        windowStatesCount,
        currentWindowStateIndex,
        windowStates,
        overlayBounds:
          windowStates[currentWindowStateIndex] ||
          data.overlayBounds ||
          defaultSettings.overlayBounds,
        actionRules: normalizedActionRules,
        colorRules: normalizedColorRules,
        streamers: normalizedStreamers,
      };
    } catch (err) {
      console.error("[Storage] Error parsing settings data:", err);
    }
  }

  saveSettings(defaultSettings);
  return { ...defaultSettings };
}

/**
 * Saves settings to settings.yaml atomically using YAML format.
 */
function saveSettings(settings) {
  const filePath = getSettingsYamlPath();
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
      hideOfflineEnabled: Boolean(settings.hideOfflineEnabled),
      hideOfflineDays:
        typeof settings.hideOfflineDays !== "undefined"
          ? Math.max(0, parseInt(settings.hideOfflineDays, 10) || 0)
          : 7,
      hideOfflineHours:
        typeof settings.hideOfflineHours !== "undefined"
          ? Math.max(
              0,
              Math.min(23, parseInt(settings.hideOfflineHours, 10) || 0),
            )
          : 0,
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
      actionRules: Array.isArray(settings.actionRules)
        ? settings.actionRules.map((r, i) => normalizeActionRule(r, i))
        : [],
      colorRules: Array.isArray(settings.colorRules)
        ? settings.colorRules.map((r, i) => normalizeColorRule(r, i))
        : [],
      streamers: Array.isArray(settings.streamers)
        ? settings.streamers.map((s, idx) => normalizeStreamerConfig(s, idx))
        : defaultStreamers,
    };
    const yamlString = yaml.dump(toSave, { indent: 2, quotingType: '"' });
    fs.writeFileSync(filePath, yamlString, "utf-8");
    return true;
  } catch (err) {
    console.error("[Storage] Failed to save settings.yaml:", err);
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
  getSettingsYamlPath,
  getStatusPath,
  defaultStreamers,
  defaultSettings,
  normalizeUrlEntry,
  normalizeStreamerConfig,
  normalizeActionRule,
  normalizeColorRule,
  loadSettings,
  saveSettings,
  loadStatus,
  saveStatus,
};
