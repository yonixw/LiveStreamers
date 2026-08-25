const path = require("path");
const { getStreamMetadata, cleanStreamTitle } = require("./yt-dlp-utils");

/**
 * Sequential FIFO Execution Queue for yt-dlp with a 5-second cooldown between calls.
 * Prevents concurrent yt-dlp execution and rate-limiting across all streamers.
 */
class YtDlpSequentialQueue {
  constructor(cooldownMs = 5000) {
    this.cooldownMs = cooldownMs;
    this.queue = [];
    this.isProcessing = false;
    this.lastExecutedTime = 0;
  }

  /**
   * Enqueues an async task and returns a Promise for its result.
   * @param {() => Promise<any>} taskFn
   * @returns {Promise<any>}
   */
  enqueue(taskFn) {
    return new Promise((resolve, reject) => {
      this.queue.push({ taskFn, resolve, reject });
      this.processNext();
    });
  }

  async processNext() {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const { taskFn, resolve, reject } = this.queue.shift();

    // Enforce 5-second cooldown since last execution completed
    const now = Date.now();
    const timeSinceLast = now - this.lastExecutedTime;
    if (this.lastExecutedTime > 0 && timeSinceLast < this.cooldownMs) {
      const waitTime = this.cooldownMs - timeSinceLast;
      await new Promise((r) => setTimeout(r, waitTime));
    }

    try {
      const result = await taskFn();
      resolve(result);
    } catch (err) {
      reject(err);
    } finally {
      this.lastExecutedTime = Date.now();
      this.isProcessing = false;
      // Process next queued task
      if (this.queue.length > 0) {
        setTimeout(() => this.processNext(), 50);
      }
    }
  }
}

// Global shared yt-dlp queue with 5-second cooldown
const globalYtDlpQueue = new YtDlpSequentialQueue(5000);

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
 * Performs a single live check for a single URL using yt-dlp-utils via sequential queue.
 * @param {string} url
 * @param {string} [streamerName]
 * @returns {Promise<object>}
 */
async function checkSingleUrlLive(url, streamerName = "Streamer") {
  const targetUrl = normalizeUrl(url);
  const platform = detectPlatform(targetUrl);

  return await globalYtDlpQueue.enqueue(async () => {
    try {
      const metadata = await getStreamMetadata(targetUrl);

      const isLive = Boolean(
        metadata &&
        (metadata.isLive === true ||
          metadata.liveStatus === "is_live" ||
          (typeof metadata.viewerCount === "number" &&
            metadata.viewerCount > 0)),
      );

      let cachedInfo = null;
      if (isLive && metadata) {
        const cleanTitle =
          cleanStreamTitle(metadata.title) || `${streamerName} is Live!`;

        cachedInfo = {
          title: cleanTitle,
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
  });
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

  // If streamer is live, evaluate title keyword and in-stream triggers
  if (current.isLive) {
    // 2. Title Contains Text Trigger (case-insensitive)
    if (
      triggers.titleContainsEnabled &&
      triggers.titleContainsText &&
      triggers.titleContainsText.trim()
    ) {
      const keywords = (
        triggers.titleContainsText.trim().toLowerCase() || ""
      ).split(",");

      const currTitle = (
        currInfo.title + " " + currInfo.game || ""
      ).toLowerCase();
      const prevTitle = (
        prevInfo.title + " " + prevInfo.game || ""
      ).toLowerCase();

      // Check if current title contains keyword and it was not previously matching (or just went live)
      for (const keyword of keywords) {
        if (
          currTitle.includes(keyword) &&
          (!prev.isLive || !prevTitle.includes(keyword))
        ) {
          const rawKeyword = triggers.titleContainsText.trim();
          return {
            type: "title_keyword",
            label: `Title or game: "${rawKeyword}"`,
            message: `Stream title or game contains "${rawKeyword}": "${currInfo.title || ""}"`,
            diff: {
              from: prevTitle || "Offline",
              to: currTitle || rawKeyword,
            },
            timestamp: nowIso,
          };
        }
      }
    }

    // 3. Runtime Duration (X minutes live) Trigger
    if (triggers.runtimeMinutesEnabled) {
      const thresholdMins = Number(triggers.runtimeMinutesThreshold) || 30;
      const startTimeStr = currInfo.startTime || currInfo.liveTime;
      if (startTimeStr) {
        const startMs = new Date(startTimeStr).getTime();
        const currentRuntimeMins = Math.floor((Date.now() - startMs) / 60000);

        let prevRuntimeMins = 0;
        if (prev.isLive && (prevInfo.startTime || prevInfo.liveTime)) {
          const prevStartMs = new Date(
            prevInfo.startTime || prevInfo.liveTime,
          ).getTime();
          const prevCheckedMs = prev.lastChecked
            ? new Date(prev.lastChecked).getTime()
            : Date.now() - 60000;
          prevRuntimeMins = Math.floor((prevCheckedMs - prevStartMs) / 60000);
        }

        if (
          currentRuntimeMins >= thresholdMins &&
          prevRuntimeMins < thresholdMins
        ) {
          return {
            type: "runtime_reached",
            label: `Live ${thresholdMins}m+`,
            message: `Streamer has been live for ${currentRuntimeMins} minutes (Threshold: ${thresholdMins}m)`,
            diff: {
              from: `${prevRuntimeMins}m live`,
              to: `${currentRuntimeMins}m live`,
            },
            timestamp: nowIso,
          };
        }
      }
    }
  }

  // If both current and previous were live, check in-stream changes
  if (current.isLive && prev.isLive) {
    // 3. Stream Title Change Trigger (comparing cleaned titles)
    if (triggers.titleChange !== false) {
      const prevTitle = cleanStreamTitle(prevInfo.title || "") || "";
      const currTitle = cleanStreamTitle(currInfo.title || "") || "";
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
 * Normalizes url entries array into uniform objects { url, freqMinutes }.
 */
function getNormalizedUrlObjects(streamer) {
  if (Array.isArray(streamer.urls) && streamer.urls.length > 0) {
    return streamer.urls
      .map((entry) => {
        if (typeof entry === "string")
          return { url: entry.trim(), freqMinutes: 1 };
        if (typeof entry === "object" && entry.url) {
          return {
            url: entry.url.trim(),
            freqMinutes: Math.max(1, parseInt(entry.freqMinutes, 10) || 1),
          };
        }
        return null;
      })
      .filter((e) => e && e.url.length > 0);
  }
  if (streamer.url) {
    return [{ url: streamer.url.trim(), freqMinutes: 1 }];
  }
  return [];
}

/**
 * Checks a streamer across their list of URLs in order based on per-link minute frequencies.
 * SHORT-CIRCUITS immediately upon finding the first live URL.
 *
 * @param {object} streamer - Streamer config with urls array
 * @param {object} [previousStatus] - Previous status record
 * @param {object} [options]
 * @param {boolean} [options.isManual=false] - If true, checks all links regardless of minute counter
 * @param {number} [options.minuteCounter=0] - Current global minute counter
 * @returns {Promise<object>} Full status result
 */
async function checkStreamerLiveTask(
  streamer,
  previousStatus = null,
  options = {},
) {
  const isManual = Boolean(options.isManual);
  const minuteCounter =
    typeof options.minuteCounter === "number" ? options.minuteCounter : 0;
  const timestamp = new Date().toLocaleTimeString();
  const streamerName = streamer.name || "Streamer";
  const urlObjects = getNormalizedUrlObjects(streamer);

  if (urlObjects.length === 0) {
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

  // Filter links to check: check link strictly when (minuteCounter % freqMinutes === 0) or if isManual
  const linksToCheck = urlObjects.filter((linkObj) => {
    if (isManual) return true;
    const freq = Math.max(1, parseInt(linkObj.freqMinutes, 10) || 1);
    return minuteCounter % freq === 0;
  });

  // If no links for this streamer meet their frequency this minute, maintain previous status
  if (linksToCheck.length === 0) {
    return {
      ...previousStatus,
      streamerId: streamer.id,
      skippedThisMinute: true,
    };
  }

  if (typeof options.onCheckStart === "function") {
    options.onCheckStart();
  }

  console.log(
    `[${timestamp}] [Background Live Check] Checking streamer "${streamerName}" (${linksToCheck.length}/${urlObjects.length} link(s) due at minute #${minuteCounter})...`,
  );

  let firstLiveResult = null;
  let lastCheckedUrl = linksToCheck[0].url;
  let lastPlatform = detectPlatform(linksToCheck[0].url);
  let accumulatedErrors = [];
  let checkedCount = 0;

  // Check each due URL sequentially (with 5s cooldown handled by queue)
  for (let i = 0; i < linksToCheck.length; i++) {
    const linkObj = linksToCheck[i];
    checkedCount++;

    if (linkObj.url && linkObj.url.startsWith("!")) {
      // This is for popup only, skip.
      // Like links that are 3rd party embeds etc.
      continue;
    }

    const plat = detectPlatform(linkObj.url);
    console.log(
      `[${timestamp}] [Background Live Check] [${streamerName}] [Link ${i + 1}/${linksToCheck.length}] Checking ${plat.toUpperCase()} (freq: ${linkObj.freqMinutes}m): ${linkObj.url}...`,
    );

    console.log(`[${timestamp}] [Background Live Check] 1sec cooldown`);
    await new Promise((ok, _) => setTimeout(ok, 1_0000)); // 1sec cooldown

    const singleResult = await checkSingleUrlLive(linkObj.url, streamerName);
    lastCheckedUrl = singleResult.url;
    lastPlatform = singleResult.platform;

    if (singleResult.isLive) {
      console.log(
        `[${timestamp}] [Background Live Check] [${streamerName}] Link ${i + 1} (${plat.toUpperCase()}) is LIVE! Short-circuiting remaining ${linksToCheck.length - i - 1} due link(s).`,
      );
      firstLiveResult = singleResult;
      break; // Short-circuit: no need to check other links on this avatar, moves on to next streamer
    }

    if (!singleResult.success && singleResult.error) {
      accumulatedErrors.push(`${plat}: ${singleResult.error}`);
    }
  }

  // Determine isLive and active metadata
  let isLive = false;
  let activeUrl = normalizeUrl(urlObjects[0].url);
  let activePlatform = detectPlatform(urlObjects[0].url);
  let cachedInfo = null;

  if (firstLiveResult && firstLiveResult.isLive) {
    isLive = true;
    activeUrl = firstLiveResult.url;
    activePlatform = firstLiveResult.platform;
    cachedInfo = firstLiveResult.cachedInfo;
  } else if (
    previousStatus?.isLive &&
    !linksToCheck.some(
      (l) => normalizeUrl(l.url) === normalizeUrl(previousStatus.activeUrl),
    )
  ) {
    // If streamer was previously live on a link that wasn't due to be checked this minute, preserve status
    isLive = true;
    activeUrl = previousStatus.activeUrl;
    activePlatform = previousStatus.activePlatform;
    cachedInfo = previousStatus.cachedInfo;
  }
  const nowIso = new Date().toISOString();

  let offlineSince = null;
  if (!isLive) {
    if (previousStatus?.isLive) {
      offlineSince = nowIso;
    } else if (previousStatus?.offlineSince) {
      offlineSince = previousStatus.offlineSince;
    } else {
      offlineSince =
        previousStatus?.lastChecked ||
        previousStatus?.cachedInfo?.cachedAt ||
        nowIso;
    }
  }

  // Construct current check result
  const currentResult = {
    streamerId: streamer.id,
    success: true,
    isLive,
    offlineSince,
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
 * Background Scheduler Class to check streamer links with per-link frequencies and sequential FIFO across streamers.
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
    this.minuteCounter = 0;
    this.streamerQueue = [];
    this.isProcessingStreamerQueue = false;
  }

  /**
   * Starts the background checking loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.onLog(
      "StreamChecker",
      `Background Live Checker started (1m tick, sequential streamer FIFO, 5s yt-dlp cooldown).`,
    );

    // Initial check
    this.checkAll(false);

    // Regular 1-minute interval
    this.timer = setInterval(() => {
      this.minuteCounter++;
      this.checkAll(false);
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
   * Checks all streamers strictly sequentially in FIFO order.
   * Avatar 1 finishes all its links before Avatar 2 starts.
   * @param {boolean} [isManual=false]
   */
  async checkAll(isManual = false) {
    const streamers = this.getStreamers ? this.getStreamers() : [];
    if (!streamers || streamers.length === 0) {
      return;
    }

    for (const streamer of streamers) {
      if (!streamer || !streamer.id) continue;
      this.enqueueStreamerCheck(streamer, isManual);
    }
  }

  /**
   * Enqueues a single streamer check into the streamer FIFO queue.
   * @param {object} streamer
   * @param {boolean} [isManual=false]
   * @returns {Promise<object>}
   */
  enqueueStreamerCheck(streamer, isManual = false) {
    return new Promise((resolve, reject) => {
      this.streamerQueue.push({ streamer, isManual, resolve, reject });
      this.processStreamerQueue();
    });
  }

  /**
   * Single streamer check entry point.
   */
  async checkSingleStreamer(streamer, isManual = false) {
    return await this.enqueueStreamerCheck(streamer, isManual);
  }

  /**
   * Processes the streamer queue strictly in FIFO order.
   * Avatar 1 finishes completely before Avatar 2 starts.
   */
  async processStreamerQueue() {
    if (this.isProcessingStreamerQueue || this.streamerQueue.length === 0) {
      return;
    }

    this.isProcessingStreamerQueue = true;
    const { streamer, isManual, resolve, reject } = this.streamerQueue.shift();
    const streamerId = streamer.id;

    try {
      const statusMap = this.getStatusMap ? this.getStatusMap() : {};
      const previousStatus = statusMap[streamerId] || null;

      // Check streamer across all its links (Avatar 1 completes all links before next avatar)
      const result = await checkStreamerLiveTask(streamer, previousStatus, {
        isManual,
        minuteCounter: this.minuteCounter,
        onCheckStart: () => {
          if (this.onStatusUpdate) {
            this.onStatusUpdate({
              streamerId,
              checkStatus: "checking",
            });
          }
        },
      });

      if (!result.skippedThisMinute && this.onStatusUpdate) {
        this.onStatusUpdate({
          ...result,
          checkStatus: result.isLive
            ? "live"
            : result.success
              ? "offline"
              : "error",
        });
      }

      resolve(result);
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
      reject(err);
    } finally {
      this.isProcessingStreamerQueue = false;
      if (this.streamerQueue.length > 0) {
        setTimeout(() => this.processStreamerQueue(), 50);
      }
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
  globalYtDlpQueue,
};
