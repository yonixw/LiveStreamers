# LiveStreamers QA TODO Preparation & Implementation Specification

================================================================================
### [COMPLETED] TASK 01: Tooltip Flashing on Background Updates
================================================================================
1. **Type:** BUG
2. **Priority:** HIGH
3. **Complexity:** LOW-MEDIUM
4. **Implementation Suggestion:**
The flashing occurs in [`src/renderer/renderer.js:renderAvatarsInPlace()`](src/renderer/renderer.js:476) because `showTooltip()` is unconditionally dispatched whenever `currentlyHoveredCard === card` during periodic 30-second DOM reconciliations and live status crawl broadcasts, regardless of whether the pointer actually remains over the element. In [`src/renderer/renderer.js`](src/renderer/renderer.js:476), guard the re-render tooltip dispatch by checking `card.matches(':hover')` and verifying that the element is still attached to the DOM. Additionally, in [`src/main.js:ipcMain.handle('tooltip:show')`](src/main.js:1605), validate the current pointer coordinate using `screen.getCursorScreenPoint()` against `data.targetRect` or overlay bounds before calling `win.showInactive()` and `win.webContents.send('tooltip:set-data')`, preventing unnecessary redraws and flicker when the mouse has already exited.

================================================================================
### [COMPLETED] TASK 02: Tooltip Always-On-Top Reinforcement, Opacity Slider & Streamer Header Cleanup
================================================================================
1. **Type:** FEATURE / BUG
2. **Priority:** MEDIUM
3. **Complexity:** LOW-MEDIUM
4. **Implementation Suggestion:**
Ensure the tooltip window permanently maintains topmost z-index by setting `tooltipWindow.setAlwaysOnTop(true, "screen-saver")` in [`src/main.js:createTooltipWindow()`](src/main.js:774). In [`src/tasks/storage.js`](src/tasks/storage.js:88) and [`src/settings/settings.html`](src/settings/settings.html:520), add a `tooltipOpacity` setting (ranging from 10% to 100%) wired via [`src/preload.js`](src/preload.js:55) to a new IPC handler `tooltip:set-opacity` in [`src/main.js`](src/main.js:1605) that executes `tooltipWindow.setOpacity()`. In [`src/tooltip-win/tooltip.html`](src/tooltip-win/tooltip.html:16) and [`src/tooltip-win/tooltip.css`](src/tooltip-win/tooltip.css:60), remove the redundant `#tooltip-status-badge` (`.tooltip-badge`) element next to `#tooltip-name`, relying exclusively on the live border color accent and domain badge for clean, uncluttered visual hierarchy.

================================================================================
### [COMPLETED] TASK 03: Dual-Frequency Streamer Scheduling (Offline vs. Online Intervals & Live Link Lock)
================================================================================
1. **Type:** BUG
2. **Priority:** HIGH
3. **Complexity:** MEDIUM-HIGH
4. **Implementation Suggestion:**
The multi-URL checking logic in [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:529) currently evaluates link check frequencies independently per URL, causing false offline status flips when a secondary link is checked while the primary live link is skipped. Refactor the scheduler schema in [`src/tasks/storage.js:normalizeStreamerConfig()`](src/tasks/storage.js:250) to support streamer-level intervals: `checkFreqOfflineMinutes` (default e.g. 5m) and `checkFreqOnlineMinutes` (default e.g. 2m), maintaining backward compatibility with legacy `url.freqMinutes` entries. In [`src/tasks/stream-checker.js`](src/tasks/stream-checker.js:500), when a streamer is already flagged as `isLive`, lock checks strictly to `activeUrl` every `checkFreqOnlineMinutes`; only when `activeUrl` goes offline should the engine revert to sweeping all configured URLs sequentially at the `checkFreqOfflineMinutes` interval.

================================================================================
### [COMPLETED] TASK 04: Configurable Crawler Concurrency Limit & Per-Domain Throttling with PID Logging
================================================================================
1. **Type:** FEATURE
2. **Priority:** MEDIUM
3. **Complexity:** MEDIUM-HIGH
4. **Status:** COMPLETED
5. **Implementation Suggestion:**
Replace the single-threaded [`src/tasks/stream-checker.js:YtDlpSequentialQueue`](src/tasks/stream-checker.js:8) with a concurrent worker pool that supports a global concurrency limit (e.g. 4 parallel workers) combined with per-domain task queues (max 1 concurrent check for `twitch.tv`, `kick.com`, `youtube.com`) to eliminate IP rate limiting while enabling parallel sweeps across distinct streaming services. In [`src/tasks/yt-dlp-utils.js:getStreamMetadata()`](src/tasks/yt-dlp-utils.js:325), capture the spawned child process PID from the `yt-dlp` runner and record `performance.now()`, outputting structured console telemetry on process spawn and termination: `[yt-dlp] [PID: ${pid}] [START] ${url}` and `[yt-dlp] [PID: ${pid}] [DONE in ${elapsedMs}ms] ${url}` to mirror through the main process log ring buffer into the Settings DevTools console.

================================================================================
### [COMPLETED] TASK 05: Avatar Circle Border Patterns (Dotted, Dashed, Dual-Color Gradients) with Live Preview
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW-MEDIUM
3. **Complexity:** MEDIUM
4. **Implementation Suggestion:**
Extend `colorRules` in [`src/tasks/storage.js`](src/tasks/storage.js:88) and streamer settings to include a `borderPattern` property (`solid`, `dashed`, `dotted`, `double`, `dual-gradient`, `striped`). In [`src/renderer/style.css:.circle-frame`](src/renderer/style.css:122) and [`src/renderer/renderer.js:renderAvatarsInPlace()`](src/renderer/renderer.js:458), dynamically apply border styles or `conic-gradient` / `repeating-linear-gradient` masks on `.circle-frame` based on the configured pattern and color pair. In [`src/settings/settings.html`](src/settings/settings.html:600), [`src/settings/settings.css`](src/settings/settings.css:1730), and [`src/settings/settings.js`](src/settings/settings.js:1680), add a pattern dropdown selector and secondary color picker within the Color Rules editor alongside an interactive circular avatar preview widget rendering real-time pattern simulations.

================================================================================
### [COMPLETED] TASK 06: Trigger Debug Injection Simulator via JSON Metadata Payload
================================================================================
1. **Type:** FEATURE
2. **Priority:** MEDIUM
3. **Complexity:** LOW-MEDIUM
4. **Implementation Suggestion:**
In [`src/settings/settings.html`](src/settings/settings.html:480) and [`src/settings/settings.js`](src/settings/settings.js:550), add a "Debug Trigger Simulator" panel featuring a JSON textarea (pre-populated with `{ title, category, viewerCount, isLive, startTime }`) and a "Fire Mock Metadata" action button. Expose an IPC endpoint `debug:inject-streamer-metadata` in [`src/main.js`](src/main.js:1500) and [`src/preload.js`](src/preload.js:1) that forwards mock payloads directly into [`src/tasks/stream-checker.js:evaluateTriggers()`](src/tasks/stream-checker.js:250), bypassing network `yt-dlp` extraction to immediately trigger alert rules, action scripts, trigger diff logs, and overlay updates for rapid QA verification.

================================================================================
### [COMPLETED] TASK 07: YAML Configuration File Support (data/settings.yaml)
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW-MEDIUM
3. **Complexity:** MEDIUM
4. **Implementation Suggestion:**
Install `js-yaml` or `yaml` dependency in [`package.json`](package.json:13). In [`src/tasks/storage.js`](src/tasks/storage.js:18), add `getSettingsYamlPath()` pointing to `data/settings.yaml`. Update [`src/tasks/storage.js:loadSettings()`](src/tasks/storage.js:60) and `saveSettings()` to check for `settings.yaml` first (with fallback to `settings.json` for backward compatibility), serializing configuration objects using `yaml.dump(data, { indent: 2, quotingType: '"' })` to enable easy, comment-friendly human editing in external text editors.


================================================================================
### [COMPLETED] TASK 08: Live Session Timeline History in Links Popup & Tooltip Group Badges
================================================================================
1. **Type:** FEATURE
2. **Priority:** MEDIUM-HIGH
3. **Complexity:** MEDIUM-HIGH
4. **Implementation Suggestion:**
In [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:825), record streamlined session history entries structured as `[category, title, viewer, local_time, live_time, timestamp_ms]` for the active broadcast. Append a new record to the streamer's history array when `category` or `title` changes, upon the initial stream start event, and hourly (every 60 minutes) to track viewer counts over time. Cap the history array to a maximum of 24*7 entries (168 items) by trimming older entries to avoid memory/storage overflow on 24/7 channels, storing active sessions in `./data/history.json` via [`src/tasks/storage.js:saveHistory()`](src/tasks/storage.js:583). In [`src/popup/popup.html`](src/popup/popup.html:30), [`src/popup/popup.css`](src/popup/popup.css:129), and [`src/popup/popup.js`](src/popup/popup.js:30), display the "Session Timeline" carousel card with current category, title, viewers, and elapsed runtime with `[◀]`, `[▶]`, and dynamic `Entry X/Y` navigation buttons allowing users to step through past transitions and hourly checkpoints of the session. In [`src/tooltip-win/tooltip.html`](src/tooltip-win/tooltip.html:33) and [`src/tooltip-win/tooltip.css`](src/tooltip-win/tooltip.css:74), display the timeline event count tag (`📜 Timeline: ${historyCount}`), trigger chip (`⚡ ${trigger.message}`), and assigned color rule group tag (`🎨 Group: ${groupName}`) for compact hovering.

================================================================================
### [COMPLETED] TASK 09: Extended Snooze Presets (30 Days & 1 Year)
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/popup/popup.html:43`](src/popup/popup.html:43) and [`src/popup/popup.js`](src/popup/popup.js:105), add snooze duration buttons `<button data-snooze="30d">30d</button>` and `<button data-snooze="1y">1y</button>`. In [`src/main.js:ipcMain.handle('popup:snooze-streamer')`](src/main.js:740) and [`src/settings/settings.js`](src/settings/settings.js:726), extend duration calculation switch cases to calculate `30 * 24 * 60 * 60 * 1000` (30 days) and `365 * 24 * 60 * 60 * 1000` (1 year) from `Date.now()`, saving `snoozedUntil` in [`src/tasks/storage.js`](src/tasks/storage.js:169) and sinking snoozed streamers to the bottom of the overlay list.

================================================================================
### [COMPLETED] TASK 10: Header State Indicator Formatting ("01" - "99" Zero-Padded Layout)
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/renderer/renderer.js`](src/renderer/renderer.js:16) and [`src/settings/settings.js`](src/settings/settings.js:1235), modify the drag header state badge rendering logic from the fractional format (`${stateIndex + 1}/${totalStates}`) to a uniform two-digit zero-padded index: `String(stateIndex + 1).padStart(2, "0")` (e.g. `"01"`, `"02"`, up to `"99"`). In [`src/renderer/style.css:#header-state-indicator`](src/renderer/style.css:60), set a fixed character width with `font-variant-numeric: tabular-nums` to ensure stable layout alignment without width shifts when rotating between saved window presets.


================================================================================
### [COMPLETED] TASK 11: Unified Streamer Search Modal with Context Highlight & Tag Pickers
================================================================================
1. **Type:** FEATURE / UX ENHANCEMENT
2. **Priority:** HIGH
3. **Complexity:** MEDIUM
4. **Implementation:**
Created a reusable, unified Streamer Search Modal (`#streamer-search-modal`) in [`src/settings/settings.html`](src/settings/settings.html:1050), [`src/settings/settings.css`](src/settings/settings.css:2395), and [`src/settings/settings.js:openStreamerSearchModal()`](src/settings/settings.js:650). The modal requires an active text search before rendering results, limits output to max 20 matches for optimal performance, and renders streamer avatars, nicknames, names, and case-insensitive context matching with up to 250 characters of highlighted text snippets (`... <mark class="search-match-highlight"> ...`). Integrated search buttons into:
- **Debug Trigger Simulator**: Added quick-search buttons (`#btn-search-simulator-streamer`, `#btn-open-simulator-search`) next to the target streamer dropdown with note context search.
- **Group Rules (Action Rules & Color Rules)**: Replaced massive full-streamer checkbox lists with a tag/chip manager and "+ Add Streamer" search modal buttons (`#btn-search-add-action-streamer`, `#btn-search-add-color-streamer`) with note context search.

================================================================================
### [COMPLETED] TASK 12: Keyword-Based Automated Stream Snoozing (Against 24/7 Re-Runs in Title & Game)
================================================================================
1. **Type:** FEATURE
2. **Priority:** MEDIUM
3. **Complexity:** MEDIUM
4. **Implementation Suggestion:**
In [`src/tasks/storage.js:defaultSettings`](src/tasks/storage.js:88), introduce global and per-streamer auto-snooze keyword configurations: `autoSnoozeKeywordsEnabled` (boolean), `autoSnoozeKeywords` (comma-separated string, e.g. `"rerun, re-run, vod, 24/7"`), and `autoSnoozeDurationHours` (default 24h). In [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:580), inspect live stream metadata `title` and `category/game`; if any case-insensitive keyword matches, set `streamer.snoozedUntil = Date.now() + durationMs` with status flag `autoSnoozed: true`, logging the auto-snooze event to the Activity Log and sinking the streamer in [`src/main.js:getSortedEnrichedStreamers()`](src/main.js:205). Add corresponding configuration fields in [`src/settings/settings.html`](src/settings/settings.html:340) and [`src/settings/settings.js`](src/settings/settings.js:460).

================================================================================
### [COMPLETED] TASK 13: Minus Sign Prefix for Offline Elapsed Time Display ("-3h 40m")
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/renderer/renderer.js:formatOfflineDuration()`](src/renderer/renderer.js:74), update the formatting return values to prepend `"- "` (minus sign with spacing) before non-fallback duration outputs: return `"- ${days}d ${hours}h"`, `"-${hours}h ${mins}m"`, or `"- ${Math.max(1, mins)}m"` (leaving `"Offline"` as the fallback when timestamps are missing). This creates an immediate visual distinction on Line 2 (`.streamer-runtime` in [`src/renderer/style.css`](src/renderer/style.css:204)) between positive live uptime (`2h 15m`) and elapsed time elapsed since the channel went offline (`- 2h 15m`).

================================================================================
### TASK 14: Links Popup Visual Opening Accent (2-Second High-Contrast Yellow Flash)
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/popup/popup.css`](src/popup/popup.css:15), define a CSS keyframe animation `@keyframes popupYellowFlash { 0% { box-shadow: 0 0 0 3px #ffe600, 0 0 25px rgba(255, 230, 0, 0.6); border-color: #ffe600; } 100% { box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6); border-color: rgba(255, 255, 255, 0.12); } }` applied to `.popup-container.highlight-flash` with a 2-second ease-out duration. In [`src/popup/popup.js`](src/popup/popup.js:1), add the `.highlight-flash` class on `DOMContentLoaded` and whenever [`src/preload.js:onPopupData`](src/preload.js:45) delivers new streamer metadata to ensure the popup instantly grabs user focus against dark desktop backgrounds.

================================================================================
### TASK 15: Periodic Topmost Z-Order Re-Assertion for Desktop Overlay
================================================================================
1. **Type:** BUG
2. **Priority:** MEDIUM
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/main.js`](src/main.js:150), establish a recurring 60-second interval timer `setInterval(() => assertOverlayTopmost(), 60000)` (or hook into `StreamLiveCheckerService` in [`src/tasks/stream-checker.js:716`](src/tasks/stream-checker.js:716)). In `assertOverlayTopmost()`, verify `if (state.isAlwaysOnTop && overlayWindow && !overlayWindow.isDestroyed() && state.overlayVisible)`, invoking `overlayWindow.setAlwaysOnTop(true, "screen-saver")` and `overlayWindow.moveTop()` to re-assert OS-level z-order whenever third-party fullscreen applications or Windows Explorer shell resets cause the transparent overlay to drop behind background windows.

================================================================================
### TASK 16: Translucent Dark Backdrop Container & Color Theme for Avatar Info Lines
================================================================================
1. **Type:** FEATURE
2. **Priority:** LOW-MEDIUM
3. **Complexity:** LOW
4. **Implementation Suggestion:**
In [`src/renderer/style.css:.streamer-info-lines`](src/renderer/style.css:204), add a sleek translucent dark backdrop pill: `background: rgba(0, 0, 0, 0.72); border-radius: 4px; padding: 2px 6px; margin-top: 4px; pointer-events: none; width: max-content; max-width: 100%; box-sizing: border-box;`. In [`src/tasks/storage.js`](src/tasks/storage.js:88), [`src/settings/settings.html`](src/settings/settings.html:120), and [`src/settings/settings.js`](src/settings/settings.js:1200), add an `infoLinesTheme` option (`dark-badge`, `plain-white`, `plain-dark`) allowing users to choose between high-contrast dark badge styling and raw text-stroke modes for optimum readability over varied desktop wallpaper backgrounds.

================================================================================
### TASK 17: Automatic Trigger State Cleanup on Transition to Offline
================================================================================
1. **Type:** BUG / FEATURE
2. **Priority:** MEDIUM
3. **Complexity:** LOW-MEDIUM
4. **Implementation Suggestion:**
In [`src/tasks/stream-checker.js:checkStreamerLiveTask()`](src/tasks/stream-checker.js:620), detect the exact live-to-offline state transition when `!isLive && previousStatus?.isLive`. When this transition occurs, reset active trigger cache fields: set `status.lastTrigger = null`, `status.lastTriggeredAt = null`, `status.runtimeTriggerMilestones = []`, and `status.viewerSurgeFired = false`. This guarantees stale trigger badges and trigger diff comparisons from past live sessions are cleared upon disconnect, ensuring a clean baseline ready to evaluate triggers when the broadcaster goes live next.
