// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const overlayRoot = document.getElementById("overlay-root");
  const avatarsContainer = document.getElementById("avatars-container");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const btnRefresh = document.getElementById("btn-refresh");
  const headerLiveBadge = document.getElementById("header-live-badge");

  // Sort buttons on header
  const btnSortTriggered = document.getElementById("btn-sort-triggered");
  const btnSortLive = document.getElementById("btn-sort-live");
  const btnSortAz = document.getElementById("btn-sort-az");
  const sortButtons = [btnSortTriggered, btnSortLive, btnSortAz].filter(
    Boolean,
  );

  let streamersList = [];
  let currentSortBy = "last-triggered";

  // Helper to get initials
  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  // Generate pleasant gradient colors for avatar based on name hash
  function getAvatarGradient(name) {
    let hash = 0;
    const str = name || "Streamer";
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const hue1 = Math.abs(hash % 360);
    const hue2 = (hue1 + 45) % 360;
    return `linear-gradient(135deg, hsl(${hue1}, 75%, 52%), hsl(${hue2}, 80%, 42%))`;
  }

  // Format viewer count
  function formatViewers(num) {
    if (num === null || num === undefined) return null;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Number(num).toLocaleString();
  }

  // Format live duration / uptime
  function formatLiveDuration(isoString) {
    if (!isoString) return "";
    try {
      const start = new Date(isoString).getTime();
      const now = Date.now();
      const diffMs = now - start;
      if (diffMs < 0 || isNaN(diffMs)) return "";

      const totalMins = Math.floor(diffMs / 60000);
      const hours = Math.floor(totalMins / 60);
      const mins = totalMins % 60;
      if (hours > 0) {
        return `${hours}h ${mins}m`;
      }
      return `${Math.max(1, mins)}m`;
    } catch {
      return "";
    }
  }

  // Format image URL or file path for <img> src
  function formatImageSrc(pathOrUrl) {
    if (!pathOrUrl || typeof pathOrUrl !== "string") return null;
    const trimmed = pathOrUrl.trim();
    if (!trimmed) return null;
    if (
      /^https?:\/\//i.test(trimmed) ||
      trimmed.startsWith("data:") ||
      trimmed.startsWith("file://")
    ) {
      return trimmed;
    }
    return `file:///${trimmed.replace(/\\/g, "/")}`;
  }

  // Apply layout settings (avatar size, alignment)
  function applyLayoutSettings(settings) {
    if (!settings) return;

    if (settings.avatarSize) {
      const size = parseInt(settings.avatarSize, 10) || 80;
      document.documentElement.style.setProperty("--avatar-size", `${size}px`);
    }

    if (settings.avatarAlignment) {
      const align = settings.avatarAlignment;
      avatarsContainer.classList.remove(
        "align-left",
        "align-right",
        "align-center",
      );
      if (align === "right") {
        avatarsContainer.classList.add("align-right");
      } else if (align === "center") {
        avatarsContainer.classList.add("align-center");
      } else {
        avatarsContainer.classList.add("align-left");
      }
    }
  }

  // Update Sort Button Active States
  function updateSortButtonsUI(sortBy) {
    currentSortBy = sortBy || "last-triggered";
    sortButtons.forEach((btn) => {
      const sortMode = btn.getAttribute("data-sort");
      if (
        sortMode === currentSortBy ||
        (sortMode === "longest-live" &&
          (currentSortBy === "longest-live" ||
            currentSortBy === "last-started"))
      ) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    });
  }

  // Header quick sort button click handlers
  sortButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const newSort = btn.getAttribute("data-sort");
      updateSortButtonsUI(newSort);
      if (window.electronAPI && window.electronAPI.updateSettings) {
        window.electronAPI.updateSettings({ sortBy: newSort });
      }
    });
  });

  // Update Header Live Badge
  function updateHeaderBadge() {
    if (!streamersList || streamersList.length === 0) {
      if (headerLiveBadge.textContent !== "0 Live") {
        headerLiveBadge.textContent = "0 Live";
        headerLiveBadge.className = "header-live-badge";
      }
      return;
    }

    const liveCount = streamersList.filter((s) => s.isLive).length;
    const badgeText = `${liveCount}/${streamersList.length} Live`;
    if (headerLiveBadge.textContent !== badgeText) {
      headerLiveBadge.textContent = badgeText;
    }

    if (liveCount > 0) {
      headerLiveBadge.className = "header-live-badge badge-active";
    } else {
      headerLiveBadge.className = "header-live-badge";
    }
  }

  // Fine-grained Non-Flashing In-Place Reconciliation (Vertical Stack)
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];
    updateHeaderBadge();

    const existingChildren = Array.from(avatarsContainer.children);
    const existingMap = new Map();
    existingChildren.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (id) existingMap.set(id, card);
    });

    const newIds = streamersList.map((s, idx) =>
      String(s.id || `streamer-${idx}`),
    );
    const newIdSet = new Set(newIds);

    // 1. Remove obsolete cards
    existingChildren.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (!newIdSet.has(id)) {
        card.remove();
      }
    });

    // 2. Update or create cards
    streamersList.forEach((streamer, index) => {
      const streamerId = newIds[index];
      let card = existingMap.get(streamerId);
      const isNew = !card;

      if (isNew) {
        card = document.createElement("div");
        card.className = "avatar-card";
        card.setAttribute("data-id", streamerId);
        card.setAttribute("tabindex", "0");

        const frame = document.createElement("div");
        frame.className = "circle-frame";

        const inner = document.createElement("div");
        inner.className = "avatar-inner";

        const viewerTag = document.createElement("div");
        viewerTag.className = "avatar-viewer-tag";

        frame.appendChild(inner);
        frame.appendChild(viewerTag);

        // 2 info lines under avatar
        const infoLines = document.createElement("div");
        infoLines.className = "streamer-info-lines";

        const line1 = document.createElement("div");
        line1.className = "streamer-line-1";

        const nicknameSpan = document.createElement("span");
        nicknameSpan.className = "streamer-nickname";

        const runtimeSpan = document.createElement("span");
        runtimeSpan.className = "streamer-runtime";

        line1.appendChild(nicknameSpan);
        line1.appendChild(runtimeSpan);

        const line2 = document.createElement("div");
        line2.className = "streamer-line-2";

        const categorySpan = document.createElement("span");
        categorySpan.className = "streamer-category";

        line2.appendChild(categorySpan);

        infoLines.appendChild(line1);
        infoLines.appendChild(line2);

        card.appendChild(frame);
        card.appendChild(infoLines);

        card.addEventListener("click", (e) => {
          e.stopPropagation();
          const target = card._streamer || streamer;
          const urlToOpen =
            target.activeUrl || (target.urls && target.urls[0]) || target.url;
          if (
            urlToOpen &&
            window.electronAPI &&
            window.electronAPI.openExternal
          ) {
            window.electronAPI.openExternal(urlToOpen);
          }
        });
      }

      // Check DOM position in vertical container: only move if index changed
      const currentChildAtIndex = avatarsContainer.children[index];
      if (currentChildAtIndex !== card) {
        avatarsContainer.insertBefore(card, currentChildAtIndex || null);
      }

      card._streamer = streamer;

      const isLive = Boolean(streamer.isLive);
      const cached = streamer.cachedInfo || null;

      // Update Card Live/Offline Class
      const desiredCardClass = `avatar-card ${isLive ? "card-live" : "card-offline"}`;
      if (card.className !== desiredCardClass) {
        card.className = desiredCardClass;
      }

      const frame = card.querySelector(".circle-frame");
      if (frame) {
        const desiredFrameClass = `circle-frame ${isLive ? "live-glow" : ""}`;
        if (frame.className !== desiredFrameClass) {
          frame.className = desiredFrameClass;
        }
      }

      // Stream Title for Tooltip and alt
      const streamTitle =
        cached && cached.title ? cached.title : streamer.name || "Streamer";
      const fullTooltip = isLive
        ? cached && cached.title
          ? `${streamer.name}: ${cached.title}`
          : `${streamer.name} (Live)`
        : `${streamer.name || "Streamer"} (Offline)`;

      card.setAttribute("title", fullTooltip);
      if (frame) frame.setAttribute("title", fullTooltip);

      // Update Avatar Image / Initials without flash
      const inner = card.querySelector(".avatar-inner");
      if (inner) {
        const imgSrc = formatImageSrc(streamer.avatarImage);
        if (imgSrc) {
          let existingImg = inner.querySelector("img");
          if (!existingImg) {
            inner.textContent = "";
            inner.style.background = "#18181b";
            existingImg = document.createElement("img");
            existingImg.alt = streamTitle;
            existingImg.title = fullTooltip;
            existingImg.src = imgSrc;
            existingImg.onerror = () => {
              existingImg.remove();
              inner.style.background = getAvatarGradient(streamer.name);
              inner.textContent = getInitials(streamer.name);
            };
            inner.appendChild(existingImg);
          } else {
            if (existingImg.getAttribute("src") !== imgSrc) {
              existingImg.src = imgSrc;
            }
            if (existingImg.getAttribute("alt") !== streamTitle) {
              existingImg.alt = streamTitle;
            }
            if (existingImg.getAttribute("title") !== fullTooltip) {
              existingImg.title = fullTooltip;
            }
          }
        } else {
          const initials = getInitials(streamer.name);
          const hasImg = inner.querySelector("img");
          if (hasImg || inner.textContent !== initials) {
            inner.innerHTML = "";
            inner.style.background = getAvatarGradient(streamer.name);
            inner.textContent = initials;
          }
        }
      }

      // Viewer Count Tag on Avatar Circle
      const viewerTag = card.querySelector(".avatar-viewer-tag");
      if (viewerTag) {
        if (isLive && cached && cached.viewerCount != null) {
          viewerTag.classList.remove("tag-offline");
          viewerTag.innerHTML = `👁️ ${formatViewers(cached.viewerCount)}`;
        } else if (isLive) {
          viewerTag.classList.remove("tag-offline");
          viewerTag.innerHTML = `🔴 LIVE`;
        } else {
          viewerTag.classList.add("tag-offline");
          viewerTag.innerHTML = "";
        }
      }

      // Line 1: Nickname + Run time (live time)
      const nicknameSpan = card.querySelector(".streamer-nickname");
      if (nicknameSpan) {
        const nameText = streamer.name || "Streamer";
        if (nicknameSpan.textContent !== nameText) {
          nicknameSpan.textContent = nameText;
        }
      }

      const runtimeSpan = card.querySelector(".streamer-runtime");
      if (runtimeSpan) {
        if (isLive) {
          const startTime = cached ? cached.startTime || cached.liveTime : null;
          const duration = formatLiveDuration(startTime);
          const runtimeText = duration ? `• ${duration}` : "";
          if (runtimeSpan.textContent !== runtimeText) {
            runtimeSpan.textContent = runtimeText;
          }
          runtimeSpan.style.display = duration ? "inline" : "none";
        } else {
          runtimeSpan.textContent = "";
          runtimeSpan.style.display = "none";
        }
      }

      // Line 2: Category or "(no game)"
      const categorySpan = card.querySelector(".streamer-category");
      if (categorySpan) {
        let categoryText = "(no game)";
        if (isLive) {
          const game = cached ? cached.game || cached.category : null;
          categoryText = game && game.trim() ? game.trim() : "(no game)";
        } else {
          const game = cached ? cached.game || cached.category : null;
          categoryText = game && game.trim() ? game.trim() : "(no game)";
        }

        if (categorySpan.textContent !== categoryText) {
          categorySpan.textContent = categoryText;
        }
      }
    });
  }

  // Refresh live button
  if (btnRefresh) {
    btnRefresh.addEventListener("click", async (e) => {
      e.stopPropagation();
      btnRefresh.classList.add("spinning");
      if (window.electronAPI && window.electronAPI.checkStreamerLive) {
        await window.electronAPI.checkStreamerLive();
      }
      setTimeout(() => {
        btnRefresh.classList.remove("spinning");
      }, 1500);
    });
  }

  // Open settings button
  if (btnOpenSettings) {
    btnOpenSettings.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.openSettings) {
        window.electronAPI.openSettings();
      }
    });
  }

  // Double-click header toggles always on top
  overlayRoot.addEventListener("dblclick", async (e) => {
    if (e.target.closest("button") || e.target.closest(".avatar-card")) return;
    if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
      const isPinned = await window.electronAPI.toggleAlwaysOnTop();
      overlayRoot.style.transform = isPinned ? "scale(1.02)" : "scale(1)";
      setTimeout(() => {
        overlayRoot.style.transform = "scale(1)";
      }, 250);
    }
  });

  // Right-click opens Settings
  overlayRoot.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.openSettings) {
      window.electronAPI.openSettings();
    }
  });

  // Initial load
  if (window.electronAPI) {
    try {
      if (window.electronAPI.getSettings) {
        const initialSettings = await window.electronAPI.getSettings();
        if (initialSettings.sortBy) {
          updateSortButtonsUI(initialSettings.sortBy);
        }
        applyLayoutSettings(initialSettings);
      }
      if (window.electronAPI.getStreamers) {
        const streamers = await window.electronAPI.getStreamers();
        renderAvatarsInPlace(streamers);
      }
    } catch (err) {
      console.error("Failed to load initial overlay state:", err);
    }
  }

  // Live Listeners
  if (window.electronAPI && window.electronAPI.onStreamersUpdated) {
    window.electronAPI.onStreamersUpdated((updatedStreamers) => {
      renderAvatarsInPlace(updatedStreamers);
    });
  }

  if (window.electronAPI && window.electronAPI.onSettingsUpdated) {
    window.electronAPI.onSettingsUpdated((newSettings) => {
      if (newSettings) {
        if (newSettings.sortBy) {
          updateSortButtonsUI(newSettings.sortBy);
        }
        applyLayoutSettings(newSettings);
      }
    });
  }
});
