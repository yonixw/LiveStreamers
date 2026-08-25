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

  // Banner elements
  const streamInfoBanner = document.getElementById("stream-info-banner");
  const bannerDefaultView = document.getElementById("banner-default-view");
  const bannerDefaultHeader = document.getElementById("banner-default-header");
  const bannerDefaultStatus = document.getElementById("banner-default-status");
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

  // Format viewer count
  function formatViewers(num) {
    if (num === null || num === undefined) return null;
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return Number(num).toLocaleString();
  }

  // Format relative time
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

  // Get platform badge data
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

  // Update Top Banner Summary (Always 2 Lines)
  function updateDefaultBannerSummary() {
    if (!streamersList || streamersList.length === 0) {
      if (headerLiveBadge.textContent !== "0 Live") {
        headerLiveBadge.textContent = "0 Live";
        headerLiveBadge.className = "header-live-badge";
      }
      if (bannerDefaultHeader)
        bannerDefaultHeader.textContent = "LiveStreamers";
      if (bannerDefaultStatus) {
        bannerDefaultStatus.textContent = "Empty";
        bannerDefaultStatus.className = "banner-status-pill pill-offline";
      }
      if (bannerDefaultText)
        bannerDefaultText.textContent =
          "No streamers added. Click ⚙️ to configure.";
      return;
    }

    const liveCount = streamersList.filter((s) => s.isLive).length;
    const badgeText = `${liveCount}/${streamersList.length} Live`;
    if (headerLiveBadge.textContent !== badgeText) {
      headerLiveBadge.textContent = badgeText;
    }

    if (liveCount > 0) {
      headerLiveBadge.className = "header-live-badge badge-active";
      if (bannerDefaultHeader)
        bannerDefaultHeader.textContent = `${liveCount} Live`;
      if (bannerDefaultStatus) {
        bannerDefaultStatus.textContent = "Streaming";
        bannerDefaultStatus.className = "banner-status-pill pill-live";
      }
      if (bannerDefaultText)
        bannerDefaultText.textContent =
          "Hover any avatar for details • Click to open";
    } else {
      headerLiveBadge.className = "header-live-badge";
      if (bannerDefaultHeader)
        bannerDefaultHeader.textContent = "LiveStreamers";
      if (bannerDefaultStatus) {
        bannerDefaultStatus.textContent = "Offline";
        bannerDefaultStatus.className = "banner-status-pill pill-offline";
      }
      if (bannerDefaultText)
        bannerDefaultText.textContent =
          "All streamers offline • Hover avatar for details";
    }
  }

  // Show hovered streamer info in top banner
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

    if (streamer.lastTrigger) {
      bannerTriggerTag.style.display = "inline-flex";
      bannerTriggerTag.textContent = `⚡ ${streamer.lastTrigger.label || "Trigger"}`;
      bannerTriggerTag.title = `${streamer.lastTrigger.message || ""} (${new Date(streamer.lastTrigger.timestamp).toLocaleTimeString()})`;
    } else {
      bannerTriggerTag.style.display = "none";
    }

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

  // Fine-grained Non-Flashing In-Place Reconciliation (Vertical Stack)
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];
    updateDefaultBannerSummary();

    if (currentHoveredStreamerId) {
      const freshHovered = streamersList.find(
        (s) => String(s.id) === currentHoveredStreamerId,
      );
      if (freshHovered) {
        showStreamerHoverBanner(freshHovered);
      }
    }

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

        const platformBadge = document.createElement("div");
        platformBadge.className = "avatar-platform-corner";

        const statusBadge = document.createElement("div");
        statusBadge.className = "status-badge";

        frame.appendChild(inner);
        frame.appendChild(platformBadge);
        frame.appendChild(statusBadge);

        const nameTag = document.createElement("div");
        nameTag.className = "user-name-tag";

        card.appendChild(frame);
        card.appendChild(nameTag);

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
      }

      // Check DOM position in vertical container: only move if index changed
      const currentChildAtIndex = avatarsContainer.children[index];
      if (currentChildAtIndex !== card) {
        avatarsContainer.insertBefore(card, currentChildAtIndex || null);
      }

      card._streamer = streamer;

      // Update Card Live Class
      const isLive = Boolean(streamer.isLive);
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
            existingImg.alt = streamer.name || "Streamer";
            existingImg.src = imgSrc;
            existingImg.onerror = () => {
              existingImg.remove();
              inner.style.background = getAvatarGradient(streamer.name);
              inner.textContent = getInitials(streamer.name);
            };
            inner.appendChild(existingImg);
          } else if (existingImg.getAttribute("src") !== imgSrc) {
            existingImg.src = imgSrc;
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

      // Update Platform Corner Badge
      const platformBadge = card.querySelector(".avatar-platform-corner");
      if (platformBadge) {
        const plat =
          streamer.activePlatform ||
          (streamer.urls && streamer.urls[0] ? streamer.platform : "other");
        const platData = getPlatformBadgeData(plat);
        const desiredBadgeHtml = `<span class="platform-mini-badge ${platData.className}">${platData.text}</span>`;
        if (platformBadge.innerHTML !== desiredBadgeHtml) {
          platformBadge.innerHTML = desiredBadgeHtml;
        }
      }

      // Update Status Badge Dot
      const statusBadge = card.querySelector(".status-badge");
      if (statusBadge) {
        const desiredStatusClass = `status-badge ${isLive ? "status-badge-live" : "status-badge-offline"}`;
        if (statusBadge.className !== desiredStatusClass) {
          statusBadge.className = desiredStatusClass;
        }
      }

      // Update Name Tag
      const nameTag = card.querySelector(".user-name-tag");
      if (nameTag) {
        const desiredTagClass = `user-name-tag ${isLive ? "tag-live" : ""}`;
        if (nameTag.className !== desiredTagClass) {
          nameTag.className = desiredTagClass;
        }
        const nameText = streamer.name || "Streamer";
        if (nameTag.textContent !== nameText) {
          nameTag.textContent = nameText;
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
        updateSortButtonsUI(newSettings.sortBy);
      }
    });
  }
});
