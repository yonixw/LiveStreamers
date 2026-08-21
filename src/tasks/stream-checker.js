const path = require("path");
const { getStreamMetadata } = require("./yt-dlp-utils");

/**
 * Detects the streaming platform from a given URL.
 * Supports Kick, Twitch, and YouTube.
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
 * Performs a single live check for a streamer URL using yt-dlp-utils.
 * @param {object} streamer - Streamer object { id, url, name, platform }
 * @returns {Promise<object>} Check result with isLive and cachedInfo
 */
async function checkStreamerLiveTask(streamer) {
  const timestamp = new Date().toLocaleTimeString();
  const streamerName = streamer.name || extractStreamerName(streamer.url);
  const platform = streamer.platform || detectPlatform(streamer.url);
  const targetUrl = normalizeUrl(streamer.url);

  console.log(
    `[${timestamp}] [Background Live Check] Checking ${platform.toUpperCase()} streamer "${streamerName}" (${targetUrl})...`,
  );

  try {
    const metadata = await getStreamMetadata(targetUrl);

    // Determine live status
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

    console.log(
      `[${timestamp}] [Background Live Check] Result for "${streamerName}": ${
        isLive
          ? `LIVE (${cachedInfo.viewerCount ?? "?"} viewers - ${cachedInfo.title})`
          : "OFFLINE"
      }`,
    );

    return {
      success: true,
      isLive,
      cachedInfo,
      lastChecked: new Date().toISOString(),
      error: null,
    };
  } catch (err) {
    const errMsg = err && err.message ? err.message : String(err);
    const isOfflineIndicator =
      /offline|not currently live|no video formats found|is not live|does not exist/i.test(
        errMsg,
      );

    if (isOfflineIndicator) {
      console.log(
        `[${timestamp}] [Background Live Check] "${streamerName}" is currently OFFLINE.`,
      );
      return {
        success: true,
        isLive: false,
        cachedInfo: null,
        lastChecked: new Date().toISOString(),
        error: null,
      };
    }

    console.warn(
      `[${timestamp}] [Background Live Check] Warning/Error checking "${streamerName}": ${errMsg}`,
    );

    return {
      success: false,
      isLive: false,
      cachedInfo: null,
      lastChecked: new Date().toISOString(),
      error: errMsg,
    };
  }
}

/**
 * Background Scheduler Class to check streamer links once a minute.
 */
class StreamLiveCheckerService {
  constructor({ getStreamers, onStatusUpdate, onLog, intervalMs = 60000 }) {
    this.getStreamers = getStreamers;
    this.onStatusUpdate = onStatusUpdate;
    this.onLog = onLog || console.log;
    this.intervalMs = intervalMs;
    this.timer = null;
    this.isRunning = false;
    this.activeChecks = new Set();
  }

  /**
   * Starts the background checking loop (runs once a minute).
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onLog(
      "StreamChecker",
      `Background Live Checker started (Interval: ${this.intervalMs / 1000}s per link).`,
    );

    // Run initial check immediately
    this.checkAll();

    // Schedule regular 1-minute interval checks
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
      if (!streamer || !streamer.url) continue;
      // Stagger or run checks without duplicate active checks
      this.checkSingleStreamer(streamer);
    }
  }

  /**
   * Checks a single streamer and notifies callback.
   * @param {object} streamer
   * @returns {Promise<object>}
   */
  async checkSingleStreamer(streamer) {
    const streamerId = streamer.id || streamer.url;
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
      const result = await checkStreamerLiveTask(streamer);
      if (this.onStatusUpdate) {
        this.onStatusUpdate({
          streamerId,
          checkStatus: result.isLive
            ? "live"
            : result.success
              ? "offline"
              : "error",
          isLive: result.isLive,
          cachedInfo: result.cachedInfo,
          lastChecked: result.lastChecked,
          lastError: result.error,
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
  checkStreamerLiveTask,
  StreamLiveCheckerService,
};
