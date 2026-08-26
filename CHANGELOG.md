# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.9.0] - 2026-08-26

### Added
- **Streamer Search & Filter with Saturated Yellow Active State**:
  - Added filter / search textbox (`#input-search-streamers`) in the Settings streamers list header ([`src/settings/settings.html`](src/settings/settings.html:380)) to filter through large streamer lists in real-time.
  - Implemented saturated yellow background highlighting (`#ffe600` with high-contrast text and border) whenever active search terms are entered ([`src/settings/settings.css`](src/settings/settings.css:770)).
  - Added comprehensive multi-property search matching across nickname/name, notes, following date, platforms, URLs, stream title, and game/category in [`src/settings/settings.js:matchesStreamerFilter()`](src/settings/settings.js:790).
  - Added instant clear button (`#btn-clear-search`), Escape key reset, and global `Ctrl+F` / `Cmd+F` keyboard shortcut to focus and select the search filter input.
- **Offline Duration Tracking & In-Place Rendering**:
  - Implemented `offlineSince` timestamp tracking in [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:536), capturing when a streamer transitioned from Live to Offline or maintaining historical offline timestamps across checks and errors.
  - Enriched streamers with `offlineSince` in [`src/main.js:getEnrichedStreamer()`](src/main.js:357) and preserved offline history in `data/status.json`.
  - Added [`formatOfflineDuration()`](src/renderer/renderer.js:65) and [`formatLiveDuration()`](src/renderer/renderer.js:45) in [`src/renderer/renderer.js`](src/renderer/renderer.js:1), displaying human-readable offline elapsed time (e.g. `15m`, `3h 40m`, `2d 5h`) or fallback `"Offline"` on avatar Line 2 (`.streamer-runtime`) under the category title.
  - Added periodic in-place DOM interval in [`src/renderer/renderer.js`](src/renderer/renderer.js:540) to continuously refresh live and offline durations every 30 seconds.
- **Configurable Inactive Offline Streamer Hiding**:
  - Added `hideOfflineEnabled` and `hideOfflineDays` settings in [`src/tasks/storage.js:defaultSettings`](src/tasks/storage.js:88) and [`src/main.js`](src/main.js:140).
  - Added "Hide Inactive Offline Streamers" toggle and configurable threshold input (`input-hide-offline-days`) in [`src/settings/settings.html`](src/settings/settings.html:190) and [`src/settings/settings.js`](src/settings/settings.js:1280).
  - Implemented [`isStreamerHiddenByOfflineFilter()`](src/main.js:480) and [`getOverlayFilteredStreamers()`](src/main.js:505) in [`src/main.js`](src/main.js:480) to automatically hide streamers from the overlay window who have been offline longer than $X$ days (or with null/missing offline timestamp, treated as infinite time).
  - Added `👁️‍🗨️ Hidden in Overlay` badge in the Settings streamers list ([`src/settings/settings.js`](src/settings/settings.js:870), [`src/settings/settings.css`](src/settings/settings.css:1005)) to visually indicate when an offline streamer is filtered out of the overlay.
- **Streamer Profile Metadata (Following Date & Note)**:
  - Added `followingDate` and `note` fields to the streamer schema and normalization logic in [`src/tasks/storage.js:normalizeStreamerConfig()`](src/tasks/storage.js:136) and [`src/main.js`](src/main.js:826).
  - Added "Following Date" (`<input type="date">`) defaulting to `now()` (today's date) and "Note" (`<input type="text">` free single-line text) to the streamer profile form in [`src/settings/settings.html`](src/settings/settings.html:220).
  - Wired form reset, population for editing, submission, and quick presets in [`src/settings/settings.js`](src/settings/settings.js:456).
  - Rendered "Followed" badge (`📅 Followed: YYYY-MM-DD`) and "Note" tag (`💬 <text>`) in the Settings streamer list with tooltips and truncation in [`src/settings/settings.js:renderStreamersList()`](src/settings/settings.js:740) and styled in [`src/settings/settings.css`](src/settings/settings.css:928).

### Changed
- **Title trigger if contains**:
  - Updated to check also game/category and also split the keyword by ',' comma. [`src\tasks\stream-checker.js`](src/tasks/stream-checker.js:249)

## [1.8.0] - 2026-08-26

### Added
- **Popup-Only / Check-Ignored URL Prefix (`!`)**:
  - Added support for prefixing URLs with `!` (e.g., `!https://...`) to designate helper links, custom embeds, or third-party web players in [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:482).
  - Background live checker automatically ignores and skips network crawler checks for URLs marked with `!`.
  - Links popup window ([`src/popup/popup.js`](src/popup/popup.js:173)) strips the `!` prefix on render, allowing users to view and launch the link in an external browser seamlessly.

### Changed
- **Always-Open Links Popup on Avatar Click**:
  - Updated [`handleAvatarClick()`](src/renderer/renderer.js:193) in [`src/renderer/renderer.js`](src/renderer/renderer.js:193) to always launch the dedicated streamer links popup window upon clicking an avatar card, even when only a single URL is configured.
  - Ensures direct and consistent access to streamer metadata, platform URLs, and snooze controls for all streamers.

## [1.7.0] - 2026-08-25

### Added
- **Smart Click-Through Mode**:
  - Implemented dynamic cursor tracking in [`src/renderer/renderer.js`](src/renderer/renderer.js:430) detecting mouse movement over interactive targets (`.circle-frame` avatar circles and `.overlay-header` / `#header-drag-zone` drag anchor) vs transparent overlay regions.
  - Automatically activates transparent click-through via [`window.electronAPI.setIgnoreMouseEvents(true, { forward: true })`](src/preload.js:63) when cursor leaves interactive elements, and restores full mouse interactivity on hover.
  - Added single-line console logging on Smart Click-Through mode switches in [`src/main.js`](src/main.js:1040).
  - Added `smartClickThrough` toggle in Settings UI ([`src/settings/settings.html`](src/settings/settings.html:420), [`src/settings/settings.js`](src/settings/settings.js:1213)) and persistent storage schema in [`src/tasks/storage.js`](src/tasks/storage.js:84).
- **Multiple Window States (Form Position & Sizing)**:
  - Added `windowStatesCount`, `currentWindowStateIndex`, and `windowStates` array schema to [`src/tasks/storage.js`](src/tasks/storage.js:85) and [`src/main.js`](src/main.js:150).
  - Added configurable number of states (`> 0` integer) with active state badge and state preset selector buttons in Settings ([`src/settings/settings.html`](src/settings/settings.html:435), [`src/settings/settings.js`](src/settings/settings.js:1235)).
  - Enabled single-click rotation on the drag anchor grip ([`src/renderer/renderer.js`](src/renderer/renderer.js:456)) cycling through saved window states with dynamic header badge indicator (`1/2`, `1/3`, etc.).
  - Moving or resizing the window on screen automatically updates and saves coordinates and dimensions for the currently active state.
- **Window Boundary Corner Markers (Toggle Setting)**:
  - Added `showBoundaryCorners` setting to [`src/tasks/storage.js`](src/tasks/storage.js:84) and [`src/main.js`](src/main.js:151).
  - Added `"Show Window Boundary Corners"` toggle in Settings UI ([`src/settings/settings.html`](src/settings/settings.html:437), [`src/settings/settings.js`](src/settings/settings.js:1244)) that dynamically adds/removes `.show-boundary-corners` class on `document.body` in [`src/renderer/renderer.js`](src/renderer/renderer.js:150).
  - Configured 4 corner guide dots in [`src/renderer/style.css`](src/renderer/style.css:477) to assist with frameless window edge discovery and exact resizing, which can be hidden for clean everyday use.

## [1.6.0] - 2026-08-25

### Added
- **Global Console Logging Hook & DevTools Console Streaming**:
  - Intercepted global [`console.log()`](src/main.js:90), [`console.warn()`](src/main.js:92), and [`console.error()`](src/main.js:91) calls in the main process ([`src/main.js`](src/main.js:1)), capturing backend crawler, yt-dlp, and task output into an in-memory 500-entry ring buffer.
  - Streamed live and historical logs over IPC to the Settings window renderer, mirroring all output directly to the page's DevTools console ([`src/settings/settings.js`](src/settings/settings.js:76)).
  - Compacted the Settings UI log terminal ([`src/settings/settings.html`](src/settings/settings.html:334)) to display only the single latest activity line.
- **Streamer List Orientation & Reversal Controls**:
  - Added layout orientation options (`↕ Vertical` vs `↔ Horizontal`) and a `Reverse Order` toggle in [`src/settings/settings.html`](src/settings/settings.html:150) and [`src/settings/settings.js`](src/settings/settings.js:1145).
  - Implemented dynamic layout flex directions (`.layout-vertical`, `.layout-vertical-reverse`, `.layout-horizontal`, `.layout-horizontal-reverse`) in [`src/renderer/style.css`](src/renderer/style.css:98) and [`src/renderer/renderer.js`](src/renderer/renderer.js:110).
  - Persisted `layoutOrientation` and `layoutReversed` properties in [`src/tasks/storage.js`](src/tasks/storage.js:79) and [`src/main.js`](src/main.js:145).
- **Avatar Sources & Community Links Section**:
  - Added a dedicated resources card in [`src/settings/settings.html`](src/settings/settings.html:438) with interactive external link cards for 7TV (`https://7tv.app/emotes`), BetterTTV (`https://betterttv.com/emotes/popular`), and FrankerFaceZ (`https://www.frankerfacez.com/emoticons/`).
  - Wired link clicks in [`src/settings/settings.js`](src/settings/settings.js:1175) to launch the user's default browser via [`window.electronAPI.openExternal()`](src/preload.js:55).
- **Randomized Default Link Check Frequency (21–40m) & Minimum 5m Limit**:
  - Added [`getRandomDefaultFreq()`](src/settings/settings.js:262) in [`src/settings/settings.js`](src/settings/settings.js:262) setting new URL check intervals to `20 + Math.floor(Math.random() * 20) + 1` minutes.
  - Enforced `min="5"` minutes check interval across URL inputs and storage normalization.

### Fixed
- **Stream Checking Frequency Multiplier & Short-Circuiting**:
  - Fixed link scheduling in [`src/tasks/stream-checker.js`](src/tasks/stream-checker.js:447) so links are checked strictly when `minuteCounter % freqMinutes === 0`, eliminating an issue where live 5m links were being re-checked every 1 minute.
  - Short-circuited remaining link checks for a streamer immediately upon discovering a live link, advancing to the next streamer in the FIFO queue.
  - Preserved active status without unnecessary network crawler requests when a streamer's links are not due in the current minute.
- **Overlay Window Sizing Preservation on Streamer Updates**:
  - Removed automatic dimension recalculations in [`updateOverlayBounds()`](src/main.js:197) in [`src/main.js`](src/main.js:197) that were resetting the user's custom window size on streamer additions, edits, and deletions.
- **Main Overlay High-Contrast Readability & Tooltip Format**:
  - Replaced blurry `text-shadow` across main overlay text elements with crisp `-webkit-text-stroke: 1px #000000; paint-order: stroke fill;` and 1px borders in [`src/renderer/style.css`](src/renderer/style.css:204) for sharp contrast on white/bright backgrounds.
  - Updated avatar hover tooltip and image `alt` attributes in [`src/renderer/renderer.js`](src/renderer/renderer.js:260) to `${username nick} / ${domain} / ${game} / ${full title}`.
- **Twitch Stream Metadata Normalization & Extraction**:
  - Fixed Twitch stream title and description extraction in [`extractStreamMetadata()`](src/tasks/yt-dlp-utils.js:186) by mapping the broadcast status from `description` to `title` instead of the generic `<user> (live)` placeholder.
  - Added [`fetchTwitchLiveDetails()`](src/tasks/yt-dlp-utils.js:412) in [`src/tasks/yt-dlp-utils.js`](src/tasks/yt-dlp-utils.js:1) as a lightweight fallback using Node.js built-in `fetch` to retrieve Twitch live viewer count, game/category, and stream status when omitted by yt-dlp.
  - Enhanced category and game detection for Twitch streams across `game`, `game_name`, `categories`, `category`, `tags`, and embedded query token parameters in `manifest_url`.
  - Added robust viewer count resolution supporting multiple yt-dlp metric fields (`concurrent_view_count`, `live_viewers`, `viewer_count`, `viewers`, `live_viewer_count`, `view_count`).
  - Added debug logging in [`getStreamMetadata()`](src/tasks/yt-dlp-utils.js:456) printing the parsed metadata JSON structure on each stream check.

## [1.5.1] - 2026-08-25

### Removed
- **CPU-Intensive CSS Properties & Continuous Animations**:
  - **Blur & Backdrop Filters**: Removed `backdrop-filter: blur(8px)` on [`.overlay-header`](src/renderer/style.css:38) and `backdrop-filter: blur(4px)` on [`.avatar-nickname-tag`](src/renderer/style.css:235) in [`src/renderer/style.css`](src/renderer/style.css:1), eliminating continuous background blur compositing overhead in transparent Electron windows.
  - **Continuous Keyframe Animations**: Removed infinite rotation spinner animation (`animation: spin 0.8s linear infinite`, `@keyframes spin`) in [`src/settings/settings.css`](src/settings/settings.css:1210) and fade-in keyframes (`@keyframes fadeIn`) in [`src/renderer/style.css`](src/renderer/style.css:1).
  - **Hover Transforms & Transitions**: Removed CSS `transition` rules and hover translate/scale effects across [`src/renderer/style.css`](src/renderer/style.css:1), [`src/popup/popup.css`](src/popup/popup.css:1), and [`src/settings/settings.css`](src/settings/settings.css:1) for cards, buttons, badges, toggles, and inputs to minimize frame rendering and compositor workload.

## [1.5.0] - 2026-08-25

### Added
- **Dedicated Multi-URL Stream Links Popup Window**:
  - Created standalone popup window ([`src/popup/popup.html`](src/popup/popup.html:1), [`src/popup/popup.css`](src/popup/popup.css:1), [`src/popup/popup.js`](src/popup/popup.js:1)) that opens centered on screen when clicking an avatar with multiple streaming URLs.
  - Added window geometry persistence (`popupBounds: { x, y, width, height }`) in [`src/tasks/storage.js`](src/tasks/storage.js:89) and [`src/main.js`](src/main.js:140) with debounced auto-save on move and resize events.
- **Streamer Snooze Functionality (1h, 8h, 1d, 7d)**:
  - Added `snoozedUntil` target timestamp to streamer schema in [`src/tasks/storage.js`](src/tasks/storage.js:169).
  - Added snooze buttons (1h, 8h, 1d, 7d) and un-snooze option in the popup window with [`popup:snooze-streamer`](src/main.js:740) IPC handler in [`src/main.js`](src/main.js:1).
  - Updated sorting logic in [`getSortedEnrichedStreamers()`](src/main.js:205) for `last-triggered`, `manual`, and `last-started` modes to place snoozed streamers at the bottom of the list.
  - Added interactive `💤 Snoozed (Click to Un-snooze)` badge in the settings streamers list in [`src/settings/settings.js`](src/settings/settings.js:726) with click-to-unsnooze.
- **New Priority Triggers**:
  - **Title Keyword Matching**: Added `titleContainsEnabled` and `titleContainsText` to trigger schema in [`src/tasks/storage.js`](src/tasks/storage.js:153) and case-insensitive keyword evaluation in [`evaluateTriggers()`](src/tasks/stream-checker.js:250).
  - **Live Runtime Duration**: Added `runtimeMinutesEnabled` and `runtimeMinutesThreshold` to trigger schema in [`src/tasks/storage.js`](src/tasks/storage.js:160) and live duration threshold trigger evaluation in [`evaluateTriggers()`](src/tasks/stream-checker.js:280).
  - Added corresponding UI controls and persistence in [`src/settings/settings.html`](src/settings/settings.html:222) and [`src/settings/settings.js`](src/settings/settings.js:460).
- **Customizable Font Size & Appearance Settings**:
  - Added `fontSize` setting in [`src/tasks/storage.js`](src/tasks/storage.js:78) and preset buttons (10px, 12px, 14px, 16px) + range slider (9px–22px) in [`src/settings/settings.html`](src/settings/settings.html:108).
  - Added `showNicknameTag` setting in [`src/tasks/storage.js`](src/tasks/storage.js:79) and toggle in [`src/settings/settings.html`](src/settings/settings.html:134) displaying white nickname text on a 50% transparent black badge (`.avatar-nickname-tag`) above the viewer count.
  - Added `avatarSize` setting with preset buttons (60px, 80px, 100px, 120px) and range slider (50px–140px) in [`src/settings/settings.html`](src/settings/settings.html:98).
  - Added `avatarAlignment` toggle buttons ("Align Left" and "Align Right") in [`src/settings/settings.html`](src/settings/settings.html:120).
- **Viewer Count Sorting Strategy**:
  - Added `viewers` sorting option in [`src/main.js:getSortedEnrichedStreamers()`](src/main.js:215) and [`src/settings/settings.html`](src/settings/settings.html:48), sorting live streams by descending viewer count.
- **Bun Cross-Platform Build Scripts**:
  - Added platform build commands and `electron-builder` configuration in [`package.json`](package.json:10): `build:win`, `build:mac`, `build:linux`, `build:all`, and `dist` using Bun CLI.

### Changed
- **Main Overlay Drag Anchor & Header**:
  - Simplified [`overlay-header`](src/renderer/index.html:16) in [`src/renderer/index.html`](src/renderer/index.html:16) and [`src/renderer/style.css`](src/renderer/style.css:37) to exclusively display a centered `"LS v1.0"` title with drag grip icon.
- **Avatar Info Lines Redesign**:
  - Replaced the common top hover description bar with direct per-avatar metadata in [`src/renderer/renderer.js`](src/renderer/renderer.js:184):
    - **Line 1**: Stream category/game or `(no game)`.
    - **Line 2**: Live duration / runtime (e.g. `2h 15m`) or `Offline`.
    - Set avatar image/card `alt` and `title` tooltip attributes to the full stream title on mouse hover.
- **Avatar & Tag Horizontal Alignment**:
  - Updated [`.avatars-container.align-left`](src/renderer/style.css:258), [`.avatars-container.align-right`](src/renderer/style.css:264), and [`.avatars-container.align-center`](src/renderer/style.css:270) to align the nickname tag and viewer count badge along with avatar circles and info lines to the left, right, or center.
- **Offline Avatar Visual State**:
  - Applied full grayscale filter and dimmed opacity (`.avatar-card.card-offline .avatar-inner { filter: grayscale(100%); opacity: 0.65; }`) in [`src/renderer/style.css`](src/renderer/style.css:218) for offline streamers.
- **Window Taskbar Visibility & Startup Behavior**:
  - Set `skipTaskbar: true` on the main overlay window in [`src/main.js`](src/main.js:283) and links popup window.
  - Disabled automatic opening of the settings window on application launch in [`src/main.js:app.whenReady()`](src/main.js:865).
- **System Tray "Reset UI" Action**:
  - Renamed `"Center Overlay"` menu in [`src/main.js`](src/main.js:430) and settings quick action to `"Reset UI"`, which recalculates default window dimensions, re-centers both the overlay and popup windows, and resets saved window bounds.

### Removed
- Removed the shared top description banner (`#stream-info-banner`) from [`src/renderer/index.html`](src/renderer/index.html:1) and [`src/renderer/style.css`](src/renderer/style.css:1).
- Removed the platform corner badge from avatar cards.
- Removed in-page modal elements in favor of the dedicated popup window.
- Hid the scrollbar completely on the avatars container (`scrollbar-width: none`, `::-webkit-scrollbar { display: none; }`).

## [1.4.0] - 2026-08-25

### Added
- **Multi-URL Streamer Configuration & Short-Circuit Live Checking**:
  - Upgraded streamer schema in [`src/tasks/storage.js`](src/tasks/storage.js:1) and [`src/tasks/stream-checker.js`](src/tasks/stream-checker.js:1) to support ordered multi-platform stream URLs (`urls: [{ url, freqMinutes }]`).
  - Implemented sequential URL checking in [`checkStreamerLiveTask()`](src/tasks/stream-checker.js:250) that stops checking remaining platforms as soon as a live stream is found (short-circuiting).
  - Added custom nickname support, allowing custom display names instead of raw channel handles.
  - Added custom avatar image path/URL support with file browser picker dialog in settings and automatic 2-letter monogram fallback with hashed gradient backgrounds.
- **Per-Link Checking Frequency (in Minutes)**:
  - Added configurable integer check frequency per link (`freqMinutes >= 1`) in [`src/settings/settings.html`](src/settings/settings.html:84) and [`src/settings/settings.js`](src/settings/settings.js:145).
  - Implemented minute-counter scheduling in [`StreamLiveCheckerService`](src/tasks/stream-checker.js:347) executing link checks when `minuteCounter % freqMinutes === 0`.
- **Sequential FIFO Queue & Non-Concurrent yt-dlp Execution**:
  - Implemented [`YtDlpSequentialQueue`](src/tasks/stream-checker.js:7) with an enforced 5-second cooldown between consecutive `yt-dlp` metadata crawler calls.
  - Implemented streamer-level FIFO queue processing in [`StreamLiveCheckerService:processStreamerQueue()`](src/tasks/stream-checker.js:390), guaranteeing Avatar 1 completely finishes checking its links before Avatar 2 starts.
- **Priority Triggers & In-Depth Debugging**:
  - Added trigger detection engine in [`src/tasks/stream-checker.js:evaluateTriggers()`](src/tasks/stream-checker.js:141) covering: Going Live, Stream Title Change, Viewer Count Spike ($> X$ and increased from last status), and Category/Game Change.
  - Added [`cleanStreamTitle()`](src/tasks/yt-dlp-utils.js:106) in [`src/tasks/yt-dlp-utils.js`](src/tasks/yt-dlp-utils.js:1) to strip trailing date/timestamps appended by yt-dlp from live streams, eliminating false title-change triggers.
  - Added detailed trigger debug panels in [`src/settings/settings.html`](src/settings/settings.html:1) and [`src/settings/settings.js`](src/settings/settings.js:487) displaying trigger labels, timestamps, and explicit `[from] ➔ [to]` diff chips.
- **Dynamic Avatar Sorting & Drag Bar Quick-Sort Buttons**:
  - Added sorting strategies in [`src/main.js:getSortedEnrichedStreamers()`](src/main.js:132): `last-triggered`, `longest-live`, `last-started`, `name` (A-Z), and `manual`.
  - Added interactive quick-sort buttons directly onto the transparent overlay drag header bar in [`src/renderer/index.html`](src/renderer/index.html:31): `⚡` (Last Triggered), `⏱️` (Longest Live), and `🔤` (A-Z).
- **Persistent Storage & Window Geometry**:
  - Created [`src/tasks/storage.js`](src/tasks/storage.js:1) persisting all application configuration to `data/settings.json` and runtime crawler statuses to `data/status.json`.
  - Implemented transparent overlay window position (`x`, `y`) and dimension (`width`, `height`) persistence in [`src/main.js`](src/main.js:119) with debounced auto-save on `moved` and `resized` events.

### Changed
- **Overlay Window Layout & Avatar Orientation**:
  - Changed overlay avatar list orientation from horizontal to vertical stack in [`src/renderer/style.css`](src/renderer/style.css:300) with a compact `280px` width.
  - Updated window bounds calculations in [`src/main.js:calculateOverlayDimensions()`](src/main.js:106) for vertical stacking.
  - Replaced the animated pulsing/breathing green ring with a solid, static 5px green border (`+2px` thicker).
  - Standardized the hover stream info banner to a fixed 2-line height (`52px`) by default in [`src/renderer/index.html`](src/renderer/index.html:56) and [`src/renderer/style.css`](src/renderer/style.css:167), preventing layout shifts on avatar hover.
  - Refactored [`src/renderer/renderer.js:renderAvatarsInPlace()`](src/renderer/renderer.js:189) with strict DOM diffing and `<img>` element reuse, completely eliminating visual flashing during background crawl updates.
- **Settings Form UI**:
  - Replaced single-URL inputs with dynamic multi-URL lists featuring reorder up/down controls, frequency inputs, platform chips, and browse button for avatar images.
  - Updated viewer threshold validation to `min="0" step="1"` in [`src/settings/settings.html`](src/settings/settings.html:120) allowing any positive integer.

## [1.3.0] - 2026-08-21

### Added
- **Streamer URL Management & Multi-Platform Support**:
  - Added URL configuration for Kick (`kick.com`), Twitch (`twitch.tv`), and YouTube (`youtube.com` / `youtu.be`) in [`src/settings/settings.html`](src/settings/settings.html:1), [`src/settings/settings.js`](src/settings/settings.js:1), and [`src/settings/settings.css`](src/settings/settings.css:1).
  - Implemented automatic platform detection ([`detectPlatform()`](src/tasks/stream-checker.js:8)) and channel name extraction ([`extractStreamerName()`](src/tasks/stream-checker.js:34)).
  - Added preset quick-add buttons for YouTube, Twitch, and Kick example streamers in settings.
  - Added platform corner badges (`YT`, `TTV`, `KICK`) to streamer avatars and platform pill indicators in settings.
- **Background Live Stream Checker & Metadata Caching**:
  - Created [`src/tasks/stream-checker.js`](src/tasks/stream-checker.js:1) featuring [`StreamLiveCheckerService`](src/tasks/stream-checker.js:160) which checks streamer links every 60 seconds (1 minute per link) using [`src/tasks/yt-dlp-utils.js`](src/tasks/yt-dlp-utils.js:1).
  - Implemented [`checkStreamerLiveTask()`](src/tasks/stream-checker.js:69) to fetch and cache stream metadata (title, category/game, viewer count, start/live time, channel details, and thumbnail preview).
  - Handled offline responses and network failures gracefully without breaking the background loop.
- **Shared Live Info Banner & Persistent Drag Anchor in Overlay**:
  - Created an always-visible top drag & anchor bar ([`overlay-header`](src/renderer/index.html:17)) with `-webkit-app-region: drag` for smooth window movement.
  - Added non-draggable header action buttons: manual live check refresh ([`btnRefresh`](src/renderer/renderer.js:6)) with loading spinner and settings window launcher ([`btnOpenSettings`](src/renderer/renderer.js:5)).
  - Added an integrated non-clipping stream info banner ([`stream-info-banner`](src/renderer/index.html:43)) displaying real-time stream metadata on avatar mouse-over (title, viewer count, game/category, uptime, and direct `Open ↗` stream link).
  - Added [`app:open-external`](src/main.js:338) IPC handler using [`shell.openExternal`](src/main.js:341) to safely open stream URLs in default browser on avatar or link click.

### Changed
- **Overlay Window Rendering & Performance**:
  - Replaced full DOM rebuilds (`innerHTML = ""`) with in-place DOM reconciliation ([`renderAvatarsInPlace()`](src/renderer/renderer.js:154)) in [`src/renderer/renderer.js`](src/renderer/renderer.js:1), eliminating screen flashing on periodic status updates.
  - Updated [`updateOverlayBounds()`](src/main.js:83) in [`src/main.js`](src/main.js:1) to only execute `setBounds` when calculated window dimensions change.
  - Replaced floating tooltips with the dedicated top info banner to prevent popovers from being clipped by the window frame.
  - Upgraded internal state from simple string arrays to structured streamer objects (`id`, `name`, `url`, `platform`, `isLive`, `cachedInfo`, `lastChecked`, `checkStatus`, `lastError`), while maintaining backward compatibility with existing user state APIs.

### Fixed
- **Stale Streamer Reference on Avatar Hover**:
  - Fixed closure issue where reused avatar DOM elements retained stale initial streamer data, by binding [`card._streamer`](src/renderer/renderer.js:237) dynamically on each render update and looking up latest live data during `mouseenter` and background stream updates.

## [1.2.0] - 2026-08-21

### Added
- **yt-dlp Stream Metadata Utility & Binary Caching**:
  - Added [`yt-dlp-wrap-plus`](package.json:13) dependency to [`package.json`](package.json:1).
  - Created [`src/tasks/yt-dlp-utils.js`](src/tasks/yt-dlp-utils.js:1) providing cross-platform `yt-dlp` execution and automated binary downloading to the `./cache` folder on initial run.
  - Implemented [`getStreamMetadata()`](src/tasks/yt-dlp-utils.js:325), [`getRawStreamInfo()`](src/tasks/yt-dlp-utils.js:285), and [`extractStreamMetadata()`](src/tasks/yt-dlp-utils.js:160) for live stream metadata retrieval.
  - Normalized stream metadata extraction supporting `title`, `startTime`/`liveTime` (ISO formatted), `description`, `videoId`, `game`, `category`, `viewerCount`, `isLive`, `liveStatus`, `channel`, `channelId`, `channelUrl`, `thumbnail`, and `url`, with `null` fallbacks for missing properties.

## [1.1.0] - 2026-08-20

### Added
- **Dedicated Settings Window**:
  - Created [`src/settings/settings.html`](src/settings/settings.html:1), [`src/settings/settings.css`](src/settings/settings.css:1), and [`src/settings/settings.js`](src/settings/settings.js:1).
  - Checkbox controls for "Show Overlay Window", "Always on Top", and "Click-Through Mode".
  - Radio button group for opacity adjustment (100%, 75%, 50%, 25%, 10%).
  - Quick action buttons to center overlay, toggle visibility, toggle DevTools, and quit the application.
  - Interactive User / Streamer Names manager allowing adding, removing, and resetting streamer names.
  - Live Task Activity & Console Logs panel in the settings window with clear logs functionality.
- **Node.js Pet Avatar Task Scaffolding**:
  - Implemented Node.js backend task runner via [`task:run-pet-avatar`](src/main.js:274) IPC handler in [`src/main.js`](src/main.js:1) using built-in `node:crypto` random number generation (`crypto.randomInt`).
  - Added 2-second async sleep with 50% simulated failure rate throwing errors.
  - Multi-channel logging system mirroring start/success/error events to Node CLI terminal, Chrome DevTools console, and the in-app Activity Log panel.
  - Interactive "🐾 Pet" trigger per avatar row with animated CSS spinner (`.task-spinner`), green checkmark badge (`.task-status-success`), and red X badge (`.task-status-error`).
- **IPC Channels & Preload Methods**:
  - Extended [`src/preload.js`](src/preload.js:1) with `getSettings`, `updateSettings`, `getUsers`, `updateUsers`, `runPetAvatarTask`, `toggleDevTools`, and `logTerminal`.

### Changed
- **Overlay Window (Multi-Avatar Support)**:
  - Modified [`src/renderer/index.html`](src/renderer/index.html:1), [`src/renderer/style.css`](src/renderer/style.css:1), and [`src/renderer/renderer.js`](src/renderer/renderer.js:1) to support multiple circular avatars dynamically rendered from the settings user list.
  - Dynamic avatar generation with hashed color gradients, user initials, live status badges, and name tag badges.
  - Dynamic bounds calculation in [`src/main.js`](src/main.js:55) to resize the overlay window according to the number of active avatars.
  - Removed luminous glowing box shadows and pulsing rings (`.glow-ring`), switching to crisp bevels and gradients for clean visual depth.
- **System Tray**:
  - Simplified tray menu in [`src/main.js`](src/main.js:156) to focus on opening the Settings window, toggling overlay visibility, centering the overlay, and quitting.

## [1.0.0] - 2026-08-20

### Added
- **Electron Circular Overlay Boilerplate**:
  - Transparent, frameless, and always-on-top circular window configuration in [`src/main.js`](src/main.js:1).
  - Draggable window functionality using `-webkit-app-region: drag` with custom circular avatar styling in [`src/renderer/style.css`](src/renderer/style.css:1) and [`src/renderer/index.html`](src/renderer/index.html:1).
  - Secure IPC bridge using [`contextBridge`](src/preload.js:3) in [`src/preload.js`](src/preload.js:1).
  - Sample circular avatar illustration [`src/assets/sample-avatar.svg`](src/assets/sample-avatar.svg:1) and tray icon [`src/assets/tray-icon.svg`](src/assets/tray-icon.svg:1).
- **System Tray Integration**:
  - System tray icon with tooltips and click handling in [`src/main.js`](src/main.js:75).
  - Context menu options: Show/Hide, Always on Top, Click-Through (Ignore Mouse Events), Center on Screen, and Quit.
  - Submenu for window opacity/transparency adjustment (100%, 75%, 50%, 25%, 10%) with dynamic [`mainWindow.setOpacity()`](src/main.js:189).
- **Configuration & Documentation**:
  - [`package.json`](package.json:1) with Electron runner scripts compatible with Node.js 22+ and Bun 1.0 CLI.
  - [`.gitignore`](.gitignore:1) covering Node/Bun dependencies, Electron distribution outputs, logs, environment files, and OS metadata.
  - [`README.md`](README.md:1) with installation and startup instructions.
