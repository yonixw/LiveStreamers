const path = require("path");
const { getStreamMetadata } = require("./yt-dlp-utils");

/**
 * Detects the streaming platform from a given URL.
 * Supports Kick, Twitch, YouTube, and other web streams.
 * @param {string} url
 * @returns {"kick" | "twitch" | "youtube" | "other"}
 */
function detectPlatform(url) {
  if (!url || typeof url !== "string") return "other";
  const lower = url.toLowerCase();
  if (lower.includes("kick.com")) return "kick";
  if (lower.includes("twitch.tv")) return "twitch";
  if (lower.includes("youtube.com") || lower.includes("youtu.be"))
    return "youtube";
  return "other";
}

/**
 * Normalizes URL format (adds https:// if missing).
 * @param {string} url
 * @returns {string}
 */
function normalizeUrl(url) {
  if (!url || typeof url !== "string") return "";
  let trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }
  return trimmed;
}

/**
 * Extracts a sensible streamer or channel name from a URL if user didn't specify one.
 * @param {string} url
 * @returns {string}
 */
function extractStreamerName(url) {
  const norm = normalizeUrl(url);
  try {
    const parsed = new URL(norm);
    const pathname = parsed.pathname.replace(/^\/+|\/+$/g, "");
    const parts = pathname.split("/");

    if (parsed.hostname.includes("kick.com")) {
      return parts[0] || "Kick Streamer";
    }

    if (parsed.hostname.includes("twitch.tv")) {
      return parts[0] || "Twitch Streamer";
    }

    if (
      parsed.hostname.includes("youtube.com") ||
      parsed.hostname.includes("youtu.be")
    ) {
      if (parts[0] && parts[0].startsWith("@")) {
        return parts[0].substring(1);
      }
      if (parts[0] === "c" || parts[0] === "user" || parts[0] === "channel") {
        return parts[1] || parts[0];
      }
      return parts[0] || "YouTube Creator";
    }

    return parts[parts.length - 1] || parsed.hostname;
  } catch {
    return url;
  }
}

/**
 * Performs a single live check for a single URL using yt-dlp-utils.
 * @param {string} url
 * @param {string} [streamerName]
 * @returns {Promise<object>}
 */
async function checkSingleUrlLive(url, streamerName = "Streamer") {
  const targetUrl = normalizeUrl(url);
  const platform = detectPlatform(targetUrl);

  try {
    const metadata = await getStreamMetadata(targetUrl);

    const isLive = Boolean(
      metadata &&
      (metadata.isLive === true ||
        metadata.liveStatus === "is_live" ||
        (typeof metadata.viewerCount === "number" && metadata.viewerCount > 0)),
    );

    let cachedInfo = null;
    if (isLive && metadata) {
      cachedInfo = {
        title: metadata.title || `${streamerName} is Live!`,
        game: metadata.game || metadata.category || null,
        category: metadata.category || metadata.game || null,
        viewerCount: metadata.viewerCount ?? null,
        startTime:
          metadata.startTime || metadata.liveTime || new Date().toISOString(),
        liveTime:
          metadata.liveTime || metadata.startTime || new Date().toISOString(),
        description: metadata.description || null,
        thumbnail: metadata.thumbnail || null,
        channel: metadata.channel || streamerName,
        channelUrl: metadata.channelUrl || targetUrl,
        url: metadata.url || targetUrl,
        platform,
        cachedAt: new Date().toISOString(),
      };
    }

    return {
      success: true,
      isLive,
      cachedInfo,
      url: targetUrl,
      platform,
      error: null,
    };
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    const isOfflineIndicator =
      /offline|not currently live|no video formats found|is not live|does not exist/i.test(
        errMsg,
      );

    if (isOfflineIndicator) {
      return {
        success: true,
        isLive: false,
        cachedInfo: null,
        url: targetUrl,
        platform,
        error: null,
      };
    }

    return {
      success: false,
      isLive: false,
      cachedInfo: null,
      url: targetUrl,
      platform,
      error: errMsg,
    };
  }
}

/**
 * Evaluates trigger rules against previous status and detects triggers with detailed "from X to Y" messages.
 *
 * @param {object} streamer - Streamer config with triggers
 * @param {object} current - Current check result
 * @param {object} [previous] - Previous status record
 * @returns {object|null} Fired trigger info or null
 */
function evaluateTriggers(streamer, current, previous = null) {
  const triggers = streamer.triggers || {};
  const prev = previous || {};
  const prevInfo = prev.cachedInfo || {};
  const currInfo = current.cachedInfo || {};
  const nowIso = new Date().toISOString();

  // 1. Going Live Trigger
  if (triggers.goingLive !== false) {
    if (!prev.isLive && current.isLive) {
      const platStr = (current.activePlatform || "web").toUpperCase();
      return {
        type: "going_live",
        label: "Going Live",
        message: `Went Live on ${platStr} (changed from Offline)`,
        diff: {
          from: "Offline",
          to: `Live on ${platStr}`,
        },
        timestamp: nowIso,
      };
    }
  }

  // If both current and previous were live, check in-stream triggers
  if (current.isLive && prev.isLive) {
    // 2. Stream Title Change Trigger
    if (triggers.titleChange !== false) {
      const prevTitle = (prevInfo.title || "").trim();
      const currTitle = (currInfo.title || "").trim();
      if (prevTitle && currTitle && prevTitle !== currTitle) {
        return {
          type: "title_change",
          label: "Title Changed",
          message: `Title changed from "${prevTitle}" to "${currTitle}"`,
          diff: {
            from: prevTitle,
            to: currTitle,
          },
          timestamp: nowIso,
        };
      }
    }

    // 3. Category / Game Change Trigger
    if (triggers.categoryChange !== false) {
      const prevCat = (prevInfo.game || prevInfo.category || "").trim();
      const currCat = (currInfo.game || currInfo.category || "").trim();
      if (
        prevCat &&
        currCat &&
        prevCat.toLowerCase() !== currCat.toLowerCase()
      ) {
        return {
          type: "category_change",
          label: "Category Changed",
          message: `Category changed from "${prevCat}" to "${currCat}"`,
          diff: {
            from: prevCat,
            to: currCat,
          },
          timestamp: nowIso,
        };
      }
    }

    // 4. Viewer count above X (and bigger than last status)
    if (triggers.viewerCountEnabled) {
      const threshold = Number(triggers.viewerCountThreshold) || 0;
      const currViewers = Number(currInfo.viewerCount) || 0;
      const prevViewers = Number(prevInfo.viewerCount) || 0;

      if (currViewers >= threshold && currViewers > prevViewers) {
        return {
          type: "viewer_spike",
          label: "Viewer Spike",
          message: `Viewers surged from ${prevViewers.toLocaleString()} to ${currViewers.toLocaleString()} (Threshold: > ${threshold.toLocaleString()})`,
          diff: {
            from: `${prevViewers.toLocaleString()} viewers`,
            to: `${currViewers.toLocaleString()} viewers`,
          },
          timestamp: nowIso,
        };
      }
    }
  }

  return null;
}

/**
 * Checks a streamer across their list of URLs in order.
 * SHORT-CIRCUITS immediately upon finding the first live URL.
 *
 * @param {object} streamer - Streamer config with urls array
 * @param {object} [previousStatus] - Previous status record
 * @returns {Promise<object>} Full status result
 */
async function checkStreamerLiveTask(streamer, previousStatus = null) {
  const timestamp = new Date().toLocaleTimeString();
  const streamerName = streamer.name || "Streamer";
  const urls =
    Array.isArray(streamer.urls) && streamer.urls.length > 0
      ? streamer.urls
      : streamer.url
        ? [streamer.url]
        : [];

  if (urls.length === 0) {
    return {
      success: false,
      streamerId: streamer.id,
      isLive: false,
      activeUrl: "",
      activePlatform: "other",
      checkedUrlsCount: 0,
      cachedInfo: null,
      lastChecked: new Date().toISOString(),
      lastError: "No URLs configured for this streamer",
      lastTrigger: previousStatus?.lastTrigger || null,
      lastTriggeredAt: previousStatus?.lastTriggeredAt || null,
    };
  }

  console.log(
    `[${timestamp}] [Background Live Check] Checking streamer "${streamerName}" (${urls.length} configured URL${urls.length > 1 ? "s" : ""})...`,
  );

  let firstLiveResult = null;
  let lastCheckedUrl = urls[0];
  let lastPlatform = detectPlatform(urls[0]);
  let accumulatedErrors = [];
  let checkedCount = 0;

  // Check each URL sequentially, stopping at first live stream
  for (let i = 0; i < urls.length; i++) {
    const rawUrl = urls[i];
    checkedCount++;
    const plat = detectPlatform(rawUrl);
    console.log(
      `[${timestamp}] [Background Live Check] [${streamerName}] [Link ${i + 1}/${urls.length}] Checking ${plat.toUpperCase()}: ${rawUrl}...`,
    );

    const singleResult = await checkSingleUrlLive(rawUrl, streamerName);
    lastCheckedUrl = singleResult.url;
    lastPlatform = singleResult.platform;

    if (singleResult.isLive) {
      console.log(
        `[${timestamp}] [Background Live Check] [${streamerName}] Link ${i + 1} (${plat.toUpperCase()}) is LIVE! Short-circuiting remaining ${urls.length - i - 1} link(s).`,
      );
      firstLiveResult = singleResult;
      break; // Short-circuit: no need to check other links
    }

    if (!singleResult.success && singleResult.error) {
      accumulatedErrors.push(`${plat}: ${singleResult.error}`);
    }
  }

  const isLive = Boolean(firstLiveResult && firstLiveResult.isLive);
  const activeUrl = firstLiveResult
    ? firstLiveResult.url
    : normalizeUrl(urls[0]);
  const activePlatform = firstLiveResult
    ? firstLiveResult.platform
    : detectPlatform(urls[0]);
  const cachedInfo =
    isLive && firstLiveResult ? firstLiveResult.cachedInfo : null;
  const nowIso = new Date().toISOString();

  // Construct current check result
  const currentResult = {
    streamerId: streamer.id,
    success: true,
    isLive,
    activeUrl,
    activePlatform,
    checkedUrlsCount: checkedCount,
    cachedInfo,
    lastChecked: nowIso,
    lastError: isLive
      ? null
      : accumulatedErrors.length > 0
        ? accumulatedErrors.join(" | ")
        : null,
  };

  // Trigger evaluation
  const firedTrigger = evaluateTriggers(
    streamer,
    currentResult,
    previousStatus,
  );
  let lastTrigger = previousStatus?.lastTrigger || null;
  let lastTriggeredAt = previousStatus?.lastTriggeredAt || null;

  if (firedTrigger) {
    lastTrigger = firedTrigger;
    lastTriggeredAt = firedTrigger.timestamp;
    console.log(
      `[${timestamp}] [Trigger Alert] [${streamerName}] ⚡ ${firedTrigger.label}: ${firedTrigger.message}`,
    );
  }

  currentResult.lastTrigger = lastTrigger;
  currentResult.lastTriggeredAt = lastTriggeredAt;
  currentResult.newTriggerFired = Boolean(firedTrigger);

  return currentResult;
}

/**
 * Background Scheduler Class to check streamer links periodically.
 */
class StreamLiveCheckerService {
  constructor({
    getStreamers,
    getStatusMap,
    onStatusUpdate,
    onLog,
    intervalMs = 60000,
  }) {
    this.getStreamers = getStreamers;
    this.getStatusMap = getStatusMap;
    this.onStatusUpdate = onStatusUpdate;
    this.onLog = onLog || console.log;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isRunning = false;
    this.activeChecks = new Set();
  }

  /**
   * Starts the background checking loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onLog(
      "StreamChecker",
      `Background Live Checker started (Interval: ${this.intervalMs / 1000}s).`,
    );

    // Initial check
    this.checkAll();

    // Regular interval
    this.timer = setInterval(() => {
      this.checkAll();
    }, this.intervalMs);
  }

  /**
   * Stops the background checker.
   */
  stop() {
    this.isRunning = false;
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.onLog("StreamChecker", "Background Live Checker stopped.");
  }

  /**
   * Checks all streamers currently configured.
   */
  async checkAll() {
    const streamers = this.getStreamers ? this.getStreamers() : [];
    if (!streamers || streamers.length === 0) {
      return;
    }

    for (const streamer of streamers) {
      if (!streamer || !streamer.id) continue;
      this.checkSingleStreamer(streamer);
    }
  }

  /**
   * Checks a single streamer and notifies callback with status update.
   * @param {object} streamer
   * @returns {Promise<object>}
   */
  async checkSingleStreamer(streamer) {
    const streamerId = streamer.id;
    if (this.activeChecks.has(streamerId)) {
      return;
    }

    this.activeChecks.add(streamerId);
    if (this.onStatusUpdate) {
      this.onStatusUpdate({
        streamerId,
        checkStatus: "checking",
      });
    }

    try {
      const statusMap = this.getStatusMap ? this.getStatusMap() : {};
      const previousStatus = statusMap[streamerId] || null;

      const result = await checkStreamerLiveTask(streamer, previousStatus);

      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          ...result,
          checkStatus: result.isLive
            ? "live"
            : result.success
              ? "offline"
              : "error",
        });
      }
      return result;
    } catch (err) {
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          streamerId,
          checkStatus: "error",
          isLive: false,
          lastChecked: new Date().toISOString(),
          lastError: err.message,
        });
      }
    } finally {
      this.activeChecks.delete(streamerId);
    }
  }
}

module.exports = {
  detectPlatform,
  normalizeUrl,
  extractStreamerName,
  checkSingleUrlLive,
  evaluateTriggers,
  checkStreamerLiveTask,
  StreamLiveCheckerService,
};
