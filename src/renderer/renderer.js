// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const overlayRoot = document.getElementById("overlay-root");
  const avatarsContainer = document.getElementById("avatars-container");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const btnRefresh = document.getElementById("btn-refresh");
  const headerLiveBadge = document.getElementById("header-live-badge");
  const headerSortBadge = document.getElementById("header-sort-badge");

  // Banner elements
  const streamInfoBanner = document.getElementById("stream-info-banner");
  const bannerDefaultView = document.getElementById("banner-default-view");
  const bannerDefaultText = document.getElementById("banner-default-text");
  const bannerHoverView = document.getElementById("banner-hover-view");

  const bannerPlatformPill = document.getElementById("banner-platform-pill");
  const bannerStreamerName = document.getElementById("banner-streamer-name");
  const bannerStatusPill = document.getElementById("banner-status-pill");
  const bannerViewers = document.getElementById("banner-viewers");
  const bannerGame = document.getElementById("banner-game");
  const bannerUptime = document.getElementById("banner-uptime");
  const bannerTriggerTag = document.getElementById("banner-trigger-tag");
  const bannerOpenBtn = document.getElementById("banner-open-btn");
  const bannerTitleLine = document.getElementById("banner-title-line");

  let streamersList = [];
  let currentHoveredStreamerId = null;
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

  // Format viewer count (e.g. 14.5K)
  function formatViewers(num) {
    if (num === null || num === undefined) return null;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Number(num).toLocaleString();
  }

  // Format relative time (e.g. "45m ago", "2h ago")
  function formatRelativeTime(isoString) {
    if (!isoString) return null;
    try {
      const date = new Date(isoString);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      if (diffMs < 0)
        return date.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ${diffMins % 60}m ago`;
      return date.toLocaleDateString();
    } catch {
      return null;
    }
  }

  // Get platform icon / badge markup
  function getPlatformBadgeData(platform) {
    const plat = (platform || "other").toLowerCase();
    switch (plat) {
      case "youtube":
        return { text: "YT", className: "badge-yt" };
      case "twitch":
        return { text: "TTV", className: "badge-ttv" };
      case "kick":
        return { text: "KICK", className: "badge-kc" };
      default:
        return { text: "WEB", className: "badge-web" };
    }
  }

  // Update Sort Mode Badge
  function updateSortBadge(sortBy) {
    currentSortBy = sortBy || "last-triggered";
    if (!headerSortBadge) return;

    switch (currentSortBy) {
      case "last-triggered":
        headerSortBadge.textContent = "⚡ Triggered";
        headerSortBadge.title = "Sorted by Last Triggered / Live events";
        break;
      case "longest-live":
        headerSortBadge.textContent = "⏱️ Longest Live";
        headerSortBadge.title = "Sorted by Longest Active Live Uptime";
        break;
      case "last-started":
        headerSortBadge.textContent = "🆕 Last Started";
        headerSortBadge.title = "Sorted by Most Recently Started Live";
        break;
      case "name":
        headerSortBadge.textContent = "🔤 A-Z";
        headerSortBadge.title = "Sorted Alphabetically by Nickname";
        break;
      case "manual":
      default:
        headerSortBadge.textContent = "📋 Custom";
        headerSortBadge.title = "Sorted by Manual List Order";
        break;
    }
  }

  // Update Top Banner Summary
  function updateDefaultBannerSummary() {
    if (!streamersList || streamersList.length === 0) {
      headerLiveBadge.textContent = "0 Live";
      headerLiveBadge.className = "header-live-badge";
      bannerDefaultText.textContent =
        "No streamers configured. Click ⚙️ to add.";
      return;
    }

    const liveCount = streamersList.filter((s) => s.isLive).length;
    headerLiveBadge.textContent = `${liveCount}/${streamersList.length} Live`;

    if (liveCount > 0) {
      headerLiveBadge.className = "header-live-badge badge-active";
      bannerDefaultText.innerHTML = `🟢 <strong>${liveCount} Live Now</strong> • Hover any avatar for details • Click to open`;
    } else {
      headerLiveBadge.className = "header-live-badge";
      bannerDefaultText.textContent = `⚪ All streamers offline • Hover an avatar for details • Drag top bar to move`;
    }
  }

  // Show hovered streamer info in the top banner
  function showStreamerHoverBanner(streamer) {
    if (!streamer) return;
    currentHoveredStreamerId = String(streamer.id);

    bannerDefaultView.classList.remove("active");
    bannerHoverView.classList.add("active");

    const plat =
      streamer.activePlatform ||
      (streamer.urls && streamer.urls[0] ? streamer.platform : "other");
    const platData = getPlatformBadgeData(plat);
    bannerPlatformPill.textContent = platData.text;
    bannerPlatformPill.className = `banner-platform-pill ${platData.className}`;

    bannerStreamerName.textContent = streamer.name || "Streamer";

    const isLive = Boolean(streamer.isLive);
    const cached = streamer.cachedInfo || null;

    if (isLive) {
      bannerStatusPill.textContent = "🔴 LIVE";
      bannerStatusPill.className = "banner-status-pill pill-live";

      if (cached && cached.viewerCount != null) {
        bannerViewers.style.display = "inline-flex";
        bannerViewers.innerHTML = `👁️ ${formatViewers(cached.viewerCount)}`;
      } else {
        bannerViewers.style.display = "none";
      }

      const game = cached ? cached.game || cached.category : null;
      if (game) {
        bannerGame.style.display = "inline-flex";
        bannerGame.textContent = `🎮 ${game}`;
      } else {
        bannerGame.style.display = "none";
      }

      const startTime = cached ? cached.startTime || cached.liveTime : null;
      if (startTime) {
        bannerUptime.style.display = "inline-flex";
        bannerUptime.textContent = `⏱️ ${formatRelativeTime(startTime)}`;
      } else {
        bannerUptime.style.display = "none";
      }

      if (cached && cached.title) {
        bannerTitleLine.textContent = `"${cached.title}"`;
        bannerTitleLine.className = "banner-title-line title-live";
      } else {
        bannerTitleLine.textContent = `${streamer.name || "Streamer"} is streaming live on ${plat.toUpperCase()}!`;
        bannerTitleLine.className = "banner-title-line title-live";
      }
    } else {
      bannerStatusPill.textContent = "⚪ OFFLINE";
      bannerStatusPill.className = "banner-status-pill pill-offline";
      bannerViewers.style.display = "none";
      bannerGame.style.display = "none";
      bannerUptime.style.display = "none";

      const lastCheckedStr = streamer.lastChecked
        ? `Last checked: ${new Date(streamer.lastChecked).toLocaleTimeString()}`
        : "Not checked yet";
      const primaryUrl =
        (streamer.urls && streamer.urls[0]) || streamer.url || "N/A";
      bannerTitleLine.textContent = `${lastCheckedStr} • Primary: ${primaryUrl}`;
      bannerTitleLine.className = "banner-title-line title-offline";
    }

    // Trigger info tag in banner
    if (streamer.lastTrigger) {
      bannerTriggerTag.style.display = "inline-flex";
      bannerTriggerTag.textContent = `⚡ ${streamer.lastTrigger.label || "Trigger"}`;
      bannerTriggerTag.title = `${streamer.lastTrigger.message || ""} (${new Date(streamer.lastTrigger.timestamp).toLocaleTimeString()})`;
    } else {
      bannerTriggerTag.style.display = "none";
    }

    // Open stream in browser
    const targetUrl =
      streamer.activeUrl || (streamer.urls && streamer.urls[0]) || streamer.url;
    bannerOpenBtn.onclick = (e) => {
      e.stopPropagation();
      if (targetUrl && window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(targetUrl);
      }
    };
  }

  // Reset top banner to default view
  function hideStreamerHoverBanner() {
    currentHoveredStreamerId = null;
    bannerHoverView.classList.remove("active");
    bannerDefaultView.classList.add("active");
    updateDefaultBannerSummary();
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
    // Local absolute path
    return `file:///${trimmed.replace(/\\/g, "/")}`;
  }

  // Render Avatars in Exact Sorted Order
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];
    updateDefaultBannerSummary();

    // If currently hovered streamer exists, refresh hover banner
    if (currentHoveredStreamerId) {
      const freshHovered = streamersList.find(
        (s) => String(s.id) === currentHoveredStreamerId,
      );
      if (freshHovered) {
        showStreamerHoverBanner(freshHovered);
      }
    }

    const existingCards = Array.from(
      avatarsContainer.querySelectorAll(".avatar-card"),
    );
    const existingMap = new Map();
    existingCards.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (id) existingMap.set(id, card);
    });

    const newIds = new Set();

    streamersList.forEach((streamer, index) => {
      const streamerId = String(streamer.id || `streamer-${index}`);
      newIds.add(streamerId);

      let card = existingMap.get(streamerId);

      if (!card) {
        card = document.createElement("div");
        card.className = "avatar-card";
        card.setAttribute("data-id", streamerId);
        card.setAttribute("tabindex", "0");

        const frame = document.createElement("div");
        frame.className = "circle-frame";

        const inner = document.createElement("div");
        inner.className = "avatar-inner";

        const platformBadge = document.createElement("div");
        platformBadge.className = "avatar-platform-corner";

        const triggerBadge = document.createElement("div");
        triggerBadge.className = "avatar-trigger-corner";

        const statusBadge = document.createElement("div");
        statusBadge.className = "status-badge";

        frame.appendChild(inner);
        frame.appendChild(platformBadge);
        frame.appendChild(triggerBadge);
        frame.appendChild(statusBadge);

        const nameTag = document.createElement("div");
        nameTag.className = "user-name-tag";

        card.appendChild(frame);
        card.appendChild(nameTag);

        // Hover & Click events
        card.addEventListener("mouseenter", () => {
          showStreamerHoverBanner(card._streamer || streamer);
        });

        card.addEventListener("mouseleave", () => {
          hideStreamerHoverBanner();
        });

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

        avatarsContainer.appendChild(card);
      } else {
        // Ensure DOM ordering matches the current sorted list position
        avatarsContainer.appendChild(card);
      }

      // Store fresh reference
      card._streamer = streamer;

      const isLive = Boolean(streamer.isLive);
      card.className = `avatar-card ${isLive ? "card-live" : "card-offline"}`;
      card.title = `${streamer.name || "Streamer"} - Click to open (${isLive ? `LIVE on ${(streamer.activePlatform || "stream").toUpperCase()}` : "Offline"})`;

      const frame = card.querySelector(".circle-frame");
      if (frame) {
        frame.className = `circle-frame ${isLive ? "live-glow" : ""}`;
      }

      const inner = card.querySelector(".avatar-inner");
      if (inner) {
        const imgSrc = formatImageSrc(streamer.avatarImage);
        if (imgSrc) {
          inner.style.background = "#18181b";
          inner.innerHTML = `<img src="${imgSrc}" alt="${streamer.name}" />`;
          const imgEl = inner.querySelector("img");
          if (imgEl) {
            imgEl.onerror = () => {
              inner.style.background = getAvatarGradient(streamer.name);
              inner.textContent = getInitials(streamer.name);
            };
          }
        } else {
          inner.style.background = getAvatarGradient(streamer.name);
          inner.textContent = getInitials(streamer.name);
        }
      }

      const platformBadge = card.querySelector(".avatar-platform-corner");
      if (platformBadge) {
        const plat =
          streamer.activePlatform ||
          (streamer.urls && streamer.urls[0] ? streamer.platform : "other");
        const platData = getPlatformBadgeData(plat);
        platformBadge.innerHTML = `<span class="platform-mini-badge ${platData.className}">${platData.text}</span>`;
      }

      const triggerBadge = card.querySelector(".avatar-trigger-corner");
      if (triggerBadge) {
        if (streamer.lastTrigger) {
          triggerBadge.innerHTML = `<span class="trigger-mini-badge" title="${streamer.lastTrigger.label}: ${streamer.lastTrigger.message}">⚡</span>`;
          triggerBadge.style.display = "block";
        } else {
          triggerBadge.innerHTML = "";
          triggerBadge.style.display = "none";
        }
      }

      const statusBadge = card.querySelector(".status-badge");
      if (statusBadge) {
        statusBadge.className = `status-badge ${isLive ? "status-badge-live" : "status-badge-offline"}`;
        statusBadge.title = isLive ? "Live now" : "Offline";
      }

      const nameTag = card.querySelector(".user-name-tag");
      if (nameTag) {
        nameTag.className = `user-name-tag ${isLive ? "tag-live" : ""}`;
        nameTag.textContent = streamer.name || "Streamer";
      }
    });

    // Remove deleted cards
    existingCards.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (!newIds.has(id)) {
        card.remove();
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
          updateSortBadge(initialSettings.sortBy);
        }
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
      if (newSettings && newSettings.sortBy) {
        updateSortBadge(newSettings.sortBy);
      }
    });
  }
});
