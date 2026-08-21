// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const avatarsContainer = document.getElementById("avatars-container");
  const overlayRoot = document.getElementById("overlay-root");
  const btnOpenSettings = document.getElementById("btn-open-settings");

  let streamersList = [];

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
  function getPlatformIcon(platform) {
    const plat = (platform || "other").toLowerCase();
    switch (plat) {
      case "youtube":
        return `<span class="platform-mini-badge badge-yt" title="YouTube">YT</span>`;
      case "twitch":
        return `<span class="platform-mini-badge badge-ttv" title="Twitch">TTV</span>`;
      case "kick":
        return `<span class="platform-mini-badge badge-kc" title="Kick">KICK</span>`;
      default:
        return `<span class="platform-mini-badge badge-web" title="Web">LIVE</span>`;
    }
  }

  // Render multiple circle avatars with mouse-over cached stream info
  function renderAvatars(streamers) {
    avatarsContainer.innerHTML = "";
    if (!streamers || streamers.length === 0) return;

    streamers.forEach((item) => {
      // Handle both object streamer structure and legacy string user names
      const streamer =
        typeof item === "string"
          ? {
              name: item,
              url: "",
              platform: "other",
              isLive: false,
              cachedInfo: null,
            }
          : item;

      const streamerName = streamer.name || "Streamer";
      const isLive = Boolean(streamer.isLive);
      const cached = streamer.cachedInfo || null;

      const card = document.createElement("div");
      card.className = `avatar-card ${isLive ? "card-live" : "card-offline"}`;
      card.setAttribute("tabindex", "0");

      // Circle Frame
      const frame = document.createElement("div");
      frame.className = `circle-frame ${isLive ? "live-glow" : ""}`;

      // Avatar Inner
      const inner = document.createElement("div");
      inner.className = "avatar-inner";
      inner.style.background = getAvatarGradient(streamerName);
      inner.textContent = getInitials(streamerName);

      // Platform corner badge
      const platformBadge = document.createElement("div");
      platformBadge.className = "avatar-platform-corner";
      platformBadge.innerHTML = getPlatformIcon(streamer.platform);

      // Status Badge (Bottom right)
      const statusBadge = document.createElement("div");
      statusBadge.className = `status-badge ${isLive ? "status-badge-live" : "status-badge-offline"}`;
      statusBadge.title = isLive ? "Live now" : "Offline";

      frame.appendChild(inner);
      frame.appendChild(platformBadge);
      frame.appendChild(statusBadge);

      // Name Tag
      const nameTag = document.createElement("div");
      nameTag.className = `user-name-tag ${isLive ? "tag-live" : ""}`;
      nameTag.textContent = streamerName;

      // Mouse-over Popover / Hover Card (shows cached info)
      const hoverCard = document.createElement("div");
      hoverCard.className = "stream-hover-card";

      // Hover Card Header
      const headerDiv = document.createElement("div");
      headerDiv.className = "hover-header";

      const headerTitle = document.createElement("span");
      headerTitle.className = "hover-streamer-name";
      headerTitle.textContent = streamerName;

      const headerStatus = document.createElement("span");
      headerStatus.className = `hover-status-pill ${isLive ? "pill-live" : "pill-offline"}`;
      headerStatus.textContent = isLive ? "🔴 LIVE" : "⚪ OFFLINE";

      headerDiv.appendChild(headerTitle);
      headerDiv.appendChild(headerStatus);
      hoverCard.appendChild(headerDiv);

      // Hover Card Body - Cached Stream Info
      const bodyDiv = document.createElement("div");
      bodyDiv.className = "hover-body";

      if (isLive && cached) {
        // Stream Title
        if (cached.title) {
          const titleEl = document.createElement("div");
          titleEl.className = "hover-stream-title";
          titleEl.textContent = cached.title;
          bodyDiv.appendChild(titleEl);
        }

        // Details Row: Viewers & Game/Category
        const detailsRow = document.createElement("div");
        detailsRow.className = "hover-meta-row";

        if (cached.viewerCount != null) {
          const viewersEl = document.createElement("span");
          viewersEl.className = "hover-meta-item";
          viewersEl.innerHTML = `👁️ <strong>${formatViewers(cached.viewerCount)}</strong> viewers`;
          detailsRow.appendChild(viewersEl);
        }

        const game = cached.game || cached.category;
        if (game) {
          const gameEl = document.createElement("span");
          gameEl.className = "hover-meta-item";
          gameEl.innerHTML = `🎮 ${game}`;
          detailsRow.appendChild(gameEl);
        }

        if (detailsRow.children.length > 0) {
          bodyDiv.appendChild(detailsRow);
        }

        // Started Time / Uptime
        const startTime = cached.startTime || cached.liveTime;
        if (startTime) {
          const timeEl = document.createElement("div");
          timeEl.className = "hover-time-info";
          const relTime = formatRelativeTime(startTime);
          timeEl.textContent = `⏱️ Started: ${relTime}`;
          bodyDiv.appendChild(timeEl);
        }

        // Thumbnail Preview
        if (cached.thumbnail) {
          const thumbEl = document.createElement("div");
          thumbEl.className = "hover-thumbnail-box";
          const img = document.createElement("img");
          img.src = cached.thumbnail;
          img.alt = "Stream preview";
          img.className = "hover-thumbnail-img";
          img.onerror = () => {
            thumbEl.style.display = "none";
          };
          thumbEl.appendChild(img);
          bodyDiv.appendChild(thumbEl);
        }
      } else {
        // Offline info
        const offlineInfo = document.createElement("div");
        offlineInfo.className = "hover-offline-text";
        if (streamer.lastChecked) {
          offlineInfo.textContent = `Last checked: ${new Date(streamer.lastChecked).toLocaleTimeString()}`;
        } else {
          offlineInfo.textContent = "Stream is currently offline.";
        }
        bodyDiv.appendChild(offlineInfo);
      }

      // Platform & URL footer in hover card
      const footerDiv = document.createElement("div");
      footerDiv.className = "hover-footer";
      const platformName = (streamer.platform || "stream").toUpperCase();
      footerDiv.textContent = streamer.url
        ? `Open on ${platformName} ↗`
        : `Platform: ${platformName}`;

      hoverCard.appendChild(bodyDiv);
      hoverCard.appendChild(footerDiv);

      // Card Click Handler - Opens streamer URL in browser if available
      card.addEventListener("click", (e) => {
        // Don't trigger if dragging
        if (streamer.url && /^https?:\/\//i.test(streamer.url)) {
          window.open(streamer.url, "_blank");
        }
      });

      card.appendChild(frame);
      card.appendChild(nameTag);
      card.appendChild(hoverCard);
      avatarsContainer.appendChild(card);
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

  // Double click to toggle pin / always on top
  overlayRoot.addEventListener("dblclick", async (e) => {
    // Avoid double clicking specific buttons or cards
    if (e.target.closest("button")) return;
    if (window.electronAPI && window.electronAPI.toggleAlwaysOnTop) {
      const isPinned = await window.electronAPI.toggleAlwaysOnTop();
      overlayRoot.style.transform = isPinned ? "scale(1.02)" : "scale(1)";
      setTimeout(() => {
        overlayRoot.style.transform = "scale(1)";
      }, 300);
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
        streamersList = await window.electronAPI.getStreamers();
        renderAvatars(streamersList);
      } else if (window.electronAPI.getUsers) {
        const users = await window.electronAPI.getUsers();
        renderAvatars(users);
      }
    } catch (err) {
      console.error("Failed to load initial streamers/users:", err);
    }
  }

  // Listen for live updates
  if (window.electronAPI && window.electronAPI.onStreamersUpdated) {
    window.electronAPI.onStreamersUpdated((updatedStreamers) => {
      streamersList = updatedStreamers;
      renderAvatars(updatedStreamers);
    });
  }

  if (window.electronAPI && window.electronAPI.onUsersUpdated) {
    window.electronAPI.onUsersUpdated((updatedUsers) => {
      if (!streamersList || streamersList.length === 0) {
        renderAvatars(updatedUsers);
      }
    });
  }
});
