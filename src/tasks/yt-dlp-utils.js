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

  const isTwitch =
    item.extractor === "twitch:stream" ||
    item.extractor_key === "TwitchStream" ||
    (typeof item.webpage_url_domain === "string" &&
      item.webpage_url_domain.includes("twitch.tv")) ||
    (typeof item.webpage_url === "string" &&
      item.webpage_url.includes("twitch.tv")) ||
    (typeof item.url === "string" && item.url.includes("twitch.tv"));

  // Description
  const rawDescription = item.description ?? null;
  const description =
    typeof rawDescription === "string" && rawDescription.trim().length > 0
      ? rawDescription.trim()
      : null;

  // Title extraction:
  // For Twitch streams, yt-dlp produces a placeholder title like "user (live) 2026-08-25 21:01",
  // while the actual stream broadcast title is provided in item.description.
  let rawTitle = item.title ?? item.fulltitle ?? null;
  if (isTwitch && description) {
    rawTitle = description;
  }
  const title =
    cleanStreamTitle(rawTitle) || description || cleanStreamTitle(item.title);

  // Video ID
  const videoId = item.id ?? null;

  // Start Time / Live Time
  const rawStartTime =
    item.release_timestamp ??
    item.start_time ??
    item.live_time ??
    item.timestamp ??
    null;

  const startTime = formatIsoTime(rawStartTime);
  const liveTime = startTime;

  // Game / Category extraction
  let game = item.game ?? item.game_name ?? null;
  let category = null;
  if (Array.isArray(item.categories) && item.categories.length > 0) {
    category = item.categories[0];
  } else if (typeof item.category === "string" && item.category.trim()) {
    category = item.category.trim();
  } else if (Array.isArray(item.tags) && item.tags.length > 0) {
    category = item.tags[0];
  } else if (game) {
    category = game;
  }

  // Check manifest_url token for Twitch if game not directly populated
  if (!game || !category) {
    const manifestUrl =
      item.manifest_url ||
      (Array.isArray(item.formats) &&
        item.formats.find((f) => f && f.manifest_url)?.manifest_url);
    if (manifestUrl && typeof manifestUrl === "string") {
      const tokenMatch = manifestUrl.match(/token=([^&]+)/);
      if (tokenMatch) {
        try {
          const tokenObj = JSON.parse(decodeURIComponent(tokenMatch[1]));
          if (
            tokenObj &&
            typeof tokenObj.game === "string" &&
            tokenObj.game.trim()
          ) {
            const tokenGame = tokenObj.game.trim();
            if (!game) game = tokenGame;
            if (!category) category = tokenGame;
          }
        } catch {
          // Ignore JSON parse error in token
        }
      }
    }
  }

  if (!category && game) {
    category = game;
  }
  if (!game && category) {
    game = category;
  }

  // Viewer Count extraction across all known yt-dlp platform keys
  let viewerCount = null;
  const potentialViewerCounts = [
    item.concurrent_view_count,
    item.live_viewers,
    item.viewer_count,
    item.viewers,
    item.live_viewer_count,
    item.view_count,
  ];

  for (const countVal of potentialViewerCounts) {
    if (countVal !== undefined && countVal !== null && countVal !== "") {
      const num = Number(countVal);
      if (!isNaN(num) && num >= 0) {
        viewerCount = num;
        break;
      }
    }
  }

  // Live status
  const isLive =
    item.is_live === true ||
    item.live_status === "is_live" ||
    (viewerCount !== null && viewerCount > 0) ||
    (isTwitch && Boolean(item.id || item.timestamp));
  const liveStatus = item.live_status ?? (isLive ? "is_live" : null);

  // Channel details
  const channel =
    item.channel ??
    item.uploader ??
    item.channel_id ??
    item.uploader_id ??
    null;
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
 * Fallback fetcher for Twitch.tv stream details (viewerCount, game/category, title)
 * using public Twitch web client GraphQL API.
 * @param {string} channelLogin
 * @returns {Promise<{ viewerCount: number|null, game: string|null, category: string|null, title: string|null }|null>}
 */
async function fetchTwitchLiveDetails(channelLogin) {
  if (!channelLogin || typeof channelLogin !== "string") return null;
  const cleanLogin = channelLogin.trim().toLowerCase().replace(/^@+/, "");
  try {
    const res = await fetch("https://gql.twitch.tv/gql", {
      method: "POST",
      headers: {
        "Client-ID": "kimne78kx3ncx6brgo4mv6wki5h1ko",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query: `query { user(login: "${cleanLogin}") { stream { title viewersCount game { name } } } }`,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (!res.ok) return null;
    const data = await res.json();
    const stream = data?.data?.user?.stream;
    if (!stream) return null;

    const viewerCount =
      typeof stream.viewersCount === "number" ? stream.viewersCount : null;
    const gameName =
      typeof stream.game?.name === "string" && stream.game.name.trim()
        ? stream.game.name.trim()
        : null;
    const title =
      typeof stream.title === "string" && stream.title.trim()
        ? stream.title.trim()
        : null;

    return {
      viewerCount,
      game: gameName,
      category: gameName,
      title,
    };
  } catch {
    return null;
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
  const metadata = extractStreamMetadata(rawInfo);

  // If Twitch stream has null game or null viewer count, supplement using native fetch
  const isTwitch =
    (typeof targetUrl === "string" && targetUrl.includes("twitch.tv")) ||
    (typeof metadata.url === "string" && metadata.url.includes("twitch.tv")) ||
    (typeof metadata.channelUrl === "string" &&
      metadata.channelUrl.includes("twitch.tv"));

  if (isTwitch && (metadata.game === null || metadata.viewerCount === null)) {
    const channelName =
      metadata.channel ||
      metadata.channelId ||
      targetUrl.split("/").filter(Boolean).pop() ||
      "";

    const twitchDetails = await fetchTwitchLiveDetails(channelName);
    if (twitchDetails) {
      if (metadata.viewerCount === null && twitchDetails.viewerCount !== null) {
        metadata.viewerCount = twitchDetails.viewerCount;
      }
      if (metadata.game === null && twitchDetails.game) {
        metadata.game = twitchDetails.game;
        metadata.category = twitchDetails.category;
      }
      if (!metadata.title && twitchDetails.title) {
        metadata.title = twitchDetails.title;
      }
      if (twitchDetails.viewerCount !== null && !metadata.isLive) {
        metadata.isLive = true;
        metadata.liveStatus = "is_live";
      }
    }
  }

  // Print structured metadata JSON (the schema saved in status.json) for debugging
  console.log(
    `[yt-dlp-utils] Stream metadata for ${targetUrl}:`,
    JSON.stringify(
      {
        title: metadata.title,
        startTime: metadata.startTime,
        liveTime: metadata.liveTime,
        description: metadata.description,
        videoId: metadata.videoId,
        game: metadata.game,
        category: metadata.category,
        viewerCount: metadata.viewerCount,
        isLive: metadata.isLive,
        liveStatus: metadata.liveStatus,
        channel: metadata.channel,
        channelId: metadata.channelId,
        channelUrl: metadata.channelUrl,
        thumbnail: metadata.thumbnail,
        url: metadata.url,
      },
      null,
      2,
    ),
  );

  return metadata;
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
