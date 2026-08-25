// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const overlayRoot = document.getElementById("overlay-root");
  const avatarsContainer = document.getElementById("avatars-container");

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

  // Extract clean URL list from streamer object
  function getStreamerUrlsList(streamer) {
    if (!streamer) return [];
    let list = [];
    if (Array.isArray(streamer.urls) && streamer.urls.length > 0) {
      list = streamer.urls;
    } else if (streamer.url) {
      list = [{ url: streamer.url }];
    }
    return list.filter((u) => {
      const str = typeof u === "string" ? u : u?.url;
      return str && str.trim().length > 0;
    });
  }

  // Handle avatar click logic: direct open if 1 link, dedicated popup window if multiple links
  function handleAvatarClick(streamer) {
    if (!streamer) return;
    const urls = getStreamerUrlsList(streamer);

    if (urls.length <= 1) {
      const targetUrl =
        streamer.activeUrl ||
        (urls[0]
          ? typeof urls[0] === "string"
            ? urls[0]
            : urls[0].url
          : streamer.url);
      if (targetUrl && window.electronAPI && window.electronAPI.openExternal) {
        window.electronAPI.openExternal(targetUrl);
      }
    } else {
      if (window.electronAPI && window.electronAPI.openStreamerLinksPopup) {
        window.electronAPI.openStreamerLinksPopup(streamer.id);
      }
    }
  }

  // Fine-grained Non-Flashing In-Place Reconciliation (Vertical Stack)
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];

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

        // 2 info lines under avatar (Line 1: Category, Line 2: Live time / run time)
        const infoLines = document.createElement("div");
        infoLines.className = "streamer-info-lines";

        const line1 = document.createElement("div");
        line1.className = "streamer-line-1";

        const categorySpan = document.createElement("span");
        categorySpan.className = "streamer-category";

        line1.appendChild(categorySpan);

        const line2 = document.createElement("div");
        line2.className = "streamer-line-2";

        const runtimeSpan = document.createElement("span");
        runtimeSpan.className = "streamer-runtime";

        line2.appendChild(runtimeSpan);

        infoLines.appendChild(line1);
        infoLines.appendChild(line2);

        card.appendChild(frame);
        card.appendChild(infoLines);

        card.addEventListener("click", (e) => {
          e.stopPropagation();
          const target = card._streamer || streamer;
          handleAvatarClick(target);
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

      // Line 1: Category or "(no game)"
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

      // Line 2: Live time / run time
      const runtimeSpan = card.querySelector(".streamer-runtime");
      if (runtimeSpan) {
        if (isLive) {
          const startTime = cached ? cached.startTime || cached.liveTime : null;
          const duration = formatLiveDuration(startTime);
          const runtimeText = duration ? duration : "Live";
          if (runtimeSpan.textContent !== runtimeText) {
            runtimeSpan.textContent = runtimeText;
          }
        } else {
          if (runtimeSpan.textContent !== "Offline") {
            runtimeSpan.textContent = "Offline";
          }
        }
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
        applyLayoutSettings(newSettings);
      }
    });
  }
});
