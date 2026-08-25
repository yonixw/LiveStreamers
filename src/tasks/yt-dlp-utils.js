const fs = require("fs");
const path = require("path");
const os = require("os");
const YTDlpWrapModule = require("yt-dlp-wrap-plus");

// Handle ESM default export or CommonJS module export
const YTDlpWrap = YTDlpWrapModule.default || YTDlpWrapModule;

/**
 * Gets the standard yt-dlp binary name for the current platform and architecture.
 * @param {string} [platform=os.platform()]
 * @param {string} [arch=os.arch()]
 * @returns {string} Executable file name
 */
function getBinaryName(platform = os.platform(), arch = os.arch()) {
  let fileName = "yt-dlp";
  if (platform === "win32") {
    if (arch === "ia32") {
      fileName += "_x86.exe";
    } else if (arch === "arm64") {
      fileName += "_arm64.exe";
    } else {
      fileName += ".exe";
    }
  } else if (platform === "linux") {
    if (arch === "arm64") {
      fileName += "_linux_aarch64";
    } else if (arch === "arm") {
      fileName += "_linux_armv7l";
    } else {
      fileName += "_linux";
    }
  } else if (platform === "darwin") {
    fileName += "_macos";
  }
  return fileName;
}

/**
 * Resolves the cache directory path.
 * Defaults to `<projectRoot>/cache` or `./cache`.
 * @param {string} [customCacheDir]
 * @returns {string}
 */
function getCacheDir(customCacheDir) {
  if (customCacheDir) {
    return path.resolve(customCacheDir);
  }
  return path.resolve(process.cwd(), "cache");
}

/**
 * Gets the full path to the cached yt-dlp binary.
 * @param {object} [options]
 * @param {string} [options.cacheDir]
 * @param {string} [options.binaryName]
 * @returns {string}
 */
function getBinaryPath(options = {}) {
  const cacheDir = getCacheDir(options.cacheDir);
  const binaryName = options.binaryName || getBinaryName();
  return path.join(cacheDir, binaryName);
}

/**
 * Ensures the yt-dlp binary exists in cache folder, downloading it if not present.
 * @param {object} [options]
 * @param {string} [options.cacheDir]
 * @param {string} [options.binaryPath]
 * @param {string} [options.version]
 * @param {Function} [options.onProgress]
 * @returns {Promise<string>} Path to the valid yt-dlp executable
 */
async function ensureBinary(options = {}) {
  const binaryPath = options.binaryPath || getBinaryPath(options);
  const cacheDir = path.dirname(binaryPath);

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, { recursive: true });
  }

  if (!fs.existsSync(binaryPath)) {
    console.log(
      `[yt-dlp-utils] Binary not found at ${binaryPath}. Downloading latest release...`,
    );
    await YTDlpWrap.downloadFromGithub(
      binaryPath,
      options.version,
      options.platform || os.platform(),
      options.onProgress,
    );

    if (os.platform() !== "win32" && fs.existsSync(binaryPath)) {
      try {
        fs.chmodSync(binaryPath, 0o755);
      } catch {
        // Ignore chmod error if already executable
      }
    }
    console.log(
      `[yt-dlp-utils] Successfully downloaded yt-dlp binary to ${binaryPath}`,
    );
  }

  return binaryPath;
}

/**
 * Creates and returns an initialized YTDlpWrap instance with the binary ready.
 * @param {object} [options]
 * @returns {Promise<YTDlpWrap>}
 */
async function getYtDlpInstance(options = {}) {
  const binaryPath = await ensureBinary(options);
  return new YTDlpWrap(binaryPath);
}

/**
 * Cleans dynamic trailing timestamps / date strings automatically added by yt-dlp to live stream titles.
 * E.g. "lofi hip hop radio 📚 beats to relax/study to 2026-08-25 04:35" -> "lofi hip hop radio 📚 beats to relax/study to"
 * @param {string|null|undefined} rawTitle
 * @returns {string|null} Clean title
 */
function cleanStreamTitle(rawTitle) {
  if (!rawTitle || typeof rawTitle !== "string") return null;
  let cleaned = rawTitle.trim();

  // 1. Remove trailing date + optional time (e.g. " 2026-08-25 04:35:12" or " 2026-08-25 04:35" or " 2026-08-25")
  cleaned = cleaned.replace(
    /\s+[-–—]?\s*\d{4}[-/.]\d{2}[-/.]\d{2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?\s*$/i,
    "",
  );

  // 2. Remove bracketed / parenthesized date times (e.g. " [2026-08-25 04:35]" or " (2026-08-25)")
  cleaned = cleaned.replace(
    /\s*[\(\[]\d{4}[-/.]\d{2}[-/.]\d{2}(?:\s+\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)?[\)\]]\s*$/i,
    "",
  );

  // 3. Remove trailing time stamp only (e.g. " - 04:35:12")
  cleaned = cleaned.replace(
    /\s+[-–—]\s*\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?\s*$/i,
    "",
  );

  return cleaned.trim() || rawTitle.trim();
}

/**
 * Formats a timestamp/epoch to ISO 8601 string or returns null.
 * @param {number|string|null|undefined} value
 * @returns {string|null}
 */
function formatIsoTime(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }
  if (typeof value === "number") {
    if (value < 10000000000) {
      return new Date(value * 1000).toISOString();
    }
    return new Date(value).toISOString();
  }
  if (typeof value === "string") {
    const num = Number(value);
    if (!isNaN(num) && num > 0) {
      if (num < 10000000000) {
        return new Date(num * 1000).toISOString();
      }
      return new Date(num).toISOString();
    }
    const d = new Date(value);
    if (!isNaN(d.getTime())) {
      return d.toISOString();
    }
  }
  return null;
}

/**
 * Normalizes raw yt-dlp info into stream metadata structure.
 * Returns null for properties that do not exist.
 * @param {object} info - Raw JSON output from yt-dlp
 * @returns {object} Normalized metadata object
 */
function extractStreamMetadata(info) {
  if (!info || typeof info !== "object") {
    return {
      title: null,
      startTime: null,
      liveTime: null,
      description: null,
      videoId: null,
      game: null,
      category: null,
      viewerCount: null,
      isLive: null,
      liveStatus: null,
      channel: null,
      channelId: null,
      channelUrl: null,
      thumbnail: null,
      url: null,
      raw: null,
    };
  }

  const item =
    Array.isArray(info.entries) && info.entries.length > 0
      ? info.entries[0]
      : info;

  // Clean dynamic timestamp from title
  const rawTitle = item.title ?? item.fulltitle ?? null;
  const title = cleanStreamTitle(rawTitle);

  // Video ID
  const videoId = item.id ?? null;

  // Description
  const description = item.description ?? null;

  // Start Time / Live Time
  const rawStartTime =
    item.release_timestamp ??
    item.start_time ??
    item.live_time ??
    item.timestamp ??
    null;

  const startTime = formatIsoTime(rawStartTime);
  const liveTime = startTime;

  // Game / Category
  const game = item.game ?? null;
  let category = null;
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    category = item.categories[0];
  } else if (typeof item.category === "string" && item.category) {
    category = item.category;
  } else if (game) {
    category = game;
  }

  // Viewer Count
  let viewerCount = null;
  if (
    item.concurrent_view_count !== undefined &&
    item.concurrent_view_count !== null
  ) {
    viewerCount = Number(item.concurrent_view_count);
  } else if (item.live_viewers !== undefined && item.live_viewers !== null) {
    viewerCount = Number(item.live_viewers);
  } else if (
    item.view_count !== undefined &&
    item.view_count !== null &&
    (item.is_live || item.live_status === "is_live")
  ) {
    viewerCount = Number(item.view_count);
  }

  // Live status
  const isLive = item.is_live === true || item.live_status === "is_live";
  const liveStatus = item.live_status ?? (isLive ? "is_live" : null);

  // Channel details
  const channel = item.channel ?? item.uploader ?? item.channel_id ?? null;
  const channelId = item.channel_id ?? item.uploader_id ?? null;
  const channelUrl = item.channel_url ?? item.uploader_url ?? null;

  // Thumbnail
  let thumbnail = item.thumbnail ?? null;
  if (
    !thumbnail &&
    Array.isArray(item.thumbnails) &&
    item.thumbnails.length > 0
  ) {
    thumbnail = item.thumbnails[item.thumbnails.length - 1].url || null;
  }

  // URL
  const url = item.webpage_url ?? item.original_url ?? item.url ?? null;

  return {
    title: title !== undefined ? title : null,
    startTime: startTime !== undefined ? startTime : null,
    liveTime: liveTime !== undefined ? liveTime : null,
    description: description !== undefined ? description : null,
    videoId: videoId !== undefined ? videoId : null,
    game: game !== undefined ? game : null,
    category: category !== undefined ? category : null,
    viewerCount: viewerCount !== undefined ? viewerCount : null,
    isLive: isLive !== undefined ? isLive : null,
    liveStatus: liveStatus !== undefined ? liveStatus : null,
    channel: channel !== undefined ? channel : null,
    channelId: channelId !== undefined ? channelId : null,
    channelUrl: channelUrl !== undefined ? channelUrl : null,
    thumbnail: thumbnail !== undefined ? thumbnail : null,
    url: url !== undefined ? url : null,
    raw: item,
  };
}

/**
 * Fetches raw metadata for a stream or video URL using yt-dlp.
 * @param {string} targetUrl - URL of live stream, video or channel
 * @param {object} [options]
 * @param {string[]} [options.args] - Additional yt-dlp CLI arguments
 * @param {string} [options.cacheDir] - Custom cache directory
 * @param {string} [options.binaryPath] - Custom binary path
 * @returns {Promise<object>} Raw yt-dlp JSON metadata
 */
async function getRawStreamInfo(targetUrl, options = {}) {
  const ytDlp = await getYtDlpInstance(options);
  const extraArgs = options.args || [];

  const defaultArgs = [
    targetUrl,
    "--dump-single-json",
    "--no-playlist",
    "--no-warnings",
    "--no-call-home",
    "--skip-download",
  ];

  const args = [...defaultArgs, ...extraArgs];
  const output = await ytDlp.execPromise(args);

  try {
    return JSON.parse(output);
  } catch (err) {
    const lines = output.trim().split(/\r?\n/);
    for (const line of lines) {
      try {
        return JSON.parse(line);
      } catch {
        // Continue searching
      }
    }
    throw new Error(`Failed to parse yt-dlp output as JSON: ${err.message}`);
  }
}

/**
 * Gets normalized metadata for a live stream, video, or channel.
 * Returns null for missing properties.
 * @param {string} targetUrl - Stream URL, channel URL, or video ID
 * @param {object} [options]
 * @returns {Promise<object>} Normalized metadata object
 */
async function getStreamMetadata(targetUrl, options = {}) {
  const rawInfo = await getRawStreamInfo(targetUrl, options);
  return extractStreamMetadata(rawInfo);
}

module.exports = {
  YTDlpWrap,
  getBinaryName,
  getCacheDir,
  getBinaryPath,
  ensureBinary,
  cleanStreamTitle,
  getYtDlpInstance,
  formatIsoTime,
  extractStreamMetadata,
  getRawStreamInfo,
  getStreamMetadata,
};
