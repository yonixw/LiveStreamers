// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const overlayRoot = document.getElementById("overlay-root");
  const avatarsContainer = document.getElementById("avatars-container");
  const btnOpenSettings = document.getElementById("btn-open-settings");
  const btnRefresh = document.getElementById("btn-refresh");
  const headerLiveBadge = document.getElementById("header-live-badge");

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
  const bannerOpenBtn = document.getElementById("banner-open-btn");
  const bannerTitleLine = document.getElementById("banner-title-line");

  let streamersList = [];
  let currentHoveredStreamer = null;

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
    return String(num);
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
        return { text: "LIVE", className: "badge-web" };
    }
  }

  // Update Top Banner Summary
  function updateDefaultBannerSummary() {
    if (!streamersList || streamersList.length === 0) {
      headerLiveBadge.textContent = "0 Live";
      headerLiveBadge.className = "header-live-badge";
      bannerDefaultText.textContent =
        "No streamers added yet. Click ⚙️ to add.";
      return;
    }

    const liveCount = streamersList.filter((s) => s.isLive).length;
    headerLiveBadge.textContent = `${liveCount}/${streamersList.length} Live`;

    if (liveCount > 0) {
      headerLiveBadge.className = "header-live-badge badge-active";
      bannerDefaultText.innerHTML = `🟢 <strong>${liveCount} Live Now</strong> • Hover any avatar to view live details • Click to open stream`;
    } else {
      headerLiveBadge.className = "header-live-badge";
      bannerDefaultText.textContent = `⚪ All streamers offline • Hover an avatar for details • Drag top bar to move`;
    }
  }

  // Show hovered streamer info in the shared top banner
  function showStreamerHoverBanner(streamer) {
    currentHoveredStreamer = streamer;
    bannerDefaultView.classList.remove("active");
    bannerHoverView.classList.add("active");

    const platData = getPlatformBadgeData(streamer.platform);
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
        bannerTitleLine.textContent = `${streamer.name || "Streamer"} is currently streaming live!`;
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
      bannerTitleLine.textContent = `${lastCheckedStr} • Target URL: ${streamer.url || "N/A"}`;
      bannerTitleLine.className = "banner-title-line title-offline";
    }

    bannerOpenBtn.onclick = (e) => {
      e.stopPropagation();
      if (
        streamer.url &&
        window.electronAPI &&
        window.electronAPI.openExternal
      ) {
        window.electronAPI.openExternal(streamer.url);
      }
    };
  }

  // Reset top banner to default view
  function hideStreamerHoverBanner() {
    currentHoveredStreamer = null;
    bannerHoverView.classList.remove("active");
    bannerDefaultView.classList.add("active");
    updateDefaultBannerSummary();
  }

  // Perform In-Place Reconciliation to avoid DOM flashes & repaints
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];
    updateDefaultBannerSummary();

    // If currently hovered streamer exists, update hover banner with fresh data
    if (currentHoveredStreamer) {
      const freshHovered = streamersList.find(
        (s) =>
          s.id === currentHoveredStreamer.id ||
          s.url === currentHoveredStreamer.url,
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

    streamersList.forEach((item, index) => {
      const streamer =
        typeof item === "string"
          ? {
              id: `user-${index}`,
              name: item,
              url: "",
              platform: "other",
              isLive: false,
              cachedInfo: null,
            }
          : item;

      const streamerId = String(
        streamer.id || streamer.url || `streamer-${index}`,
      );
      newIds.add(streamerId);

      let card = existingMap.get(streamerId);

      if (!card) {
        // Create new card node
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

        // Hover events
        card.addEventListener("mouseenter", () => {
          showStreamerHoverBanner(streamer);
        });

        card.addEventListener("mouseleave", () => {
          hideStreamerHoverBanner();
        });

        // Click opens stream URL
        card.addEventListener("click", (e) => {
          e.stopPropagation();
          if (
            streamer.url &&
            window.electronAPI &&
            window.electronAPI.openExternal
          ) {
            window.electronAPI.openExternal(streamer.url);
          }
        });

        avatarsContainer.appendChild(card);
      }

      // Update Card In-Place
      const isLive = Boolean(streamer.isLive);
      card.className = `avatar-card ${isLive ? "card-live" : "card-offline"}`;
      card.title = `${streamer.name || "Streamer"} - Click to open stream (${isLive ? "LIVE" : "Offline"})`;

      const frame = card.querySelector(".circle-frame");
      if (frame) {
        frame.className = `circle-frame ${isLive ? "live-glow" : ""}`;
      }

      const inner = card.querySelector(".avatar-inner");
      if (inner) {
        inner.style.background = getAvatarGradient(streamer.name);
        inner.textContent = getInitials(streamer.name);
      }

      const platformBadge = card.querySelector(".avatar-platform-corner");
      if (platformBadge) {
        const platData = getPlatformBadgeData(streamer.platform);
        platformBadge.innerHTML = `<span class="platform-mini-badge ${platData.className}">${platData.text}</span>`;
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

    // Remove any old cards that are no longer in the list
    existingCards.forEach((card) => {
      const id = card.getAttribute("data-id");
      if (!newIds.has(id)) {
        card.remove();
      }
    });
  }

  // Refresh live status button
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

  // Double click header to toggle pin / always on top
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

  // Right-click opens the Settings window
  overlayRoot.addEventListener("contextmenu", (e) => {
    e.preventDefault();
    if (window.electronAPI && window.electronAPI.openSettings) {
      window.electronAPI.openSettings();
    }
  });

  // Initial load
  if (window.electronAPI) {
    try {
      if (window.electronAPI.getStreamers) {
        const streamers = await window.electronAPI.getStreamers();
        renderAvatarsInPlace(streamers);
      } else if (window.electronAPI.getUsers) {
        const users = await window.electronAPI.getUsers();
        renderAvatarsInPlace(users);
      }
    } catch (err) {
      console.error("Failed to load initial streamers/users:", err);
    }
  }

  // Listen for live updates
  if (window.electronAPI && window.electronAPI.onStreamersUpdated) {
    window.electronAPI.onStreamersUpdated((updatedStreamers) => {
      renderAvatarsInPlace(updatedStreamers);
    });
  }

  if (window.electronAPI && window.electronAPI.onUsersUpdated) {
    window.electronAPI.onUsersUpdated((updatedUsers) => {
      if (!streamersList || streamersList.length === 0) {
        renderAvatarsInPlace(updatedUsers);
      }
    });
  }
});
