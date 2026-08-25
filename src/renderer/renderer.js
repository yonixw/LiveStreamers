// Overlay renderer process
document.addEventListener("DOMContentLoaded", async () => {
  const overlayRoot = document.getElementById("overlay-root");
  const avatarsContainer = document.getElementById("avatars-container");

  let streamersList = [];
  let isNicknameTagEnabled = false;
  let isSmartClickThroughEnabled = false;
  let isStaticClickThroughEnabled = false;
  let isHoveringInteractive = false;
  const headerDragZone = document.getElementById("header-drag-zone");
  const headerStateIndicator = document.getElementById(
    "header-state-indicator",
  );

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

  // Apply layout settings (avatar size, alignment, font size, nickname tag)
  function applyLayoutSettings(settings) {
    if (!settings) return;

    if (settings.avatarSize) {
      const size = parseInt(settings.avatarSize, 10) || 80;
      document.documentElement.style.setProperty("--avatar-size", `${size}px`);
    }

    if (settings.fontSize) {
      const fsize = parseInt(settings.fontSize, 10) || 12;
      document.documentElement.style.setProperty(
        "--font-size-base",
        `${fsize}px`,
      );
    }

    if (typeof settings.showNicknameTag === "boolean") {
      isNicknameTagEnabled = settings.showNicknameTag;
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

    if (
      settings.layoutOrientation ||
      typeof settings.layoutReversed === "boolean"
    ) {
      const orientation = settings.layoutOrientation || "vertical";
      const reversed = Boolean(settings.layoutReversed);

      avatarsContainer.classList.remove(
        "layout-vertical",
        "layout-vertical-reverse",
        "layout-horizontal",
        "layout-horizontal-reverse",
      );

      if (orientation === "horizontal") {
        avatarsContainer.classList.add(
          reversed ? "layout-horizontal-reverse" : "layout-horizontal",
        );
      } else {
        avatarsContainer.classList.add(
          reversed ? "layout-vertical-reverse" : "layout-vertical",
        );
      }
    }

    if (typeof settings.smartClickThrough === "boolean") {
      isSmartClickThroughEnabled = settings.smartClickThrough;
    }

    if (typeof settings.isIgnoringMouseEvents === "boolean") {
      isStaticClickThroughEnabled = settings.isIgnoringMouseEvents;
    }

    if (typeof settings.showBoundaryCorners === "boolean") {
      document.body.classList.toggle(
        "show-boundary-corners",
        settings.showBoundaryCorners,
      );
    }

    // Update window state indicator badge in header
    if (headerStateIndicator) {
      const stateCount = Math.max(
        1,
        parseInt(settings.windowStatesCount, 10) || 1,
      );
      const currentIdx = Math.max(
        0,
        parseInt(settings.currentWindowStateIndex, 10) || 0,
      );
      if (stateCount > 1) {
        headerStateIndicator.textContent = `${currentIdx + 1}/${stateCount}`;
        headerStateIndicator.style.display = "inline-block";
      } else {
        headerStateIndicator.textContent = "";
        headerStateIndicator.style.display = "none";
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

    // Open popup always, even on 1 link, to allow snooze etc.
    if (window.electronAPI && window.electronAPI.openStreamerLinksPopup) {
      window.electronAPI.openStreamerLinksPopup(streamer.id);
    }
  }

  // Fine-grained Non-Flashing In-Place Reconciliation (Vertical Stack)
  function renderAvatarsInPlace(streamers) {
    streamersList = Array.isArray(streamers) ? streamers : [];

    const existingChildren = Array.from(avatarsContainer.children).slice(1);
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

        const nicknameTag = document.createElement("div");
        nicknameTag.className = "avatar-nickname-tag";

        const viewerTag = document.createElement("div");
        viewerTag.className = "avatar-viewer-tag";

        frame.appendChild(inner);
        frame.appendChild(nicknameTag);
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
      const currentChildAtIndex = avatarsContainer.children[index + 1];
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

      // Tooltip and ALT_TEXT: ${username nick} / ${domain} / ${game} / ${full title}
      const userNick = streamer.customTag || streamer.name || "Streamer";
      let domain = "offline";
      const activeOrFirstUrl =
        isLive && streamer.activeUrl
          ? streamer.activeUrl
          : Array.isArray(streamer.urls) && streamer.urls.length > 0
            ? typeof streamer.urls[0] === "string"
              ? streamer.urls[0]
              : streamer.urls[0].url
            : streamer.url || "";

      if (activeOrFirstUrl) {
        try {
          const parsed = new URL(
            activeOrFirstUrl.startsWith("http")
              ? activeOrFirstUrl
              : `https://${activeOrFirstUrl}`,
          );
          domain = parsed.hostname.replace(/^www\./, "");
        } catch (_e) {
          domain = streamer.activePlatform || "stream";
        }
      }

      const game =
        cached && (cached.category || cached.game)
          ? cached.category || cached.game
          : isLive
            ? "Live"
            : "Offline";

      const fullTitle =
        cached && cached.title ? cached.title : isLive ? "No Title" : "Offline";

      const fullTooltip = `${userNick} / ${domain} / ${game} / ${fullTitle}`;

      card.setAttribute("title", fullTooltip);
      if (frame) frame.setAttribute("title", fullTooltip);

      // Update Avatar Image / Initials without flash
      const inner = card.querySelector(".avatar-inner");
      if (inner) {
        inner.setAttribute("title", fullTooltip);
        const imgSrc = formatImageSrc(streamer.avatarImage);
        if (imgSrc) {
          let existingImg = inner.querySelector("img");
          if (!existingImg) {
            inner.textContent = "";
            inner.style.background = "#18181b";
            existingImg = document.createElement("img");
            existingImg.alt = fullTooltip;
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
            if (existingImg.getAttribute("alt") !== fullTooltip) {
              existingImg.alt = fullTooltip;
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

      // Nickname Tag on Avatar Circle (white text on 50% transparent black tag)
      const nicknameTag = card.querySelector(".avatar-nickname-tag");
      if (nicknameTag) {
        const tagText = streamer.customTag || streamer.name || "Streamer";
        if (nicknameTag.textContent !== tagText) {
          nicknameTag.textContent = tagText;
        }
        const shouldShowTag =
          isNicknameTagEnabled || Boolean(streamer.customTag);
        nicknameTag.style.display = shouldShowTag ? "block" : "none";
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

      // Line 1: Category or "(---)"
      const categorySpan = card.querySelector(".streamer-category");
      if (categorySpan) {
        let categoryText = "(---)";
        if (isLive) {
          const game = cached ? cached.game || cached.category : null;
          categoryText = game && game.trim() ? game.trim() : "(---)";
        } else {
          const game = cached ? cached.game || cached.category : null;
          categoryText = game && game.trim() ? game.trim() : "(---)";
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

  // Smart Click-Through mouse tracking (detects avatar circle/image and drag anchor)
  function handleSmartClickThrough(e) {
    if (!isSmartClickThroughEnabled || isStaticClickThroughEnabled) return;

    // Selected interactive elements: avatar circle/image (.circle-frame) and the drag anchor (.overlay-header / #header-drag-zone)
    const isOver = Boolean(
      e.target &&
      e.target.closest &&
      e.target.closest(".circle-frame, .overlay-header"),
    );

    if (isOver !== isHoveringInteractive) {
      isHoveringInteractive = isOver;
      const ignore = !isOver;
      if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
        window.electronAPI.setIgnoreMouseEvents(ignore, { forward: true });
      }
    }
  }

  window.addEventListener("mousemove", handleSmartClickThrough, {
    passive: true,
  });

  window.addEventListener("mouseleave", () => {
    if (!isSmartClickThroughEnabled || isStaticClickThroughEnabled) return;
    if (isHoveringInteractive) {
      isHoveringInteractive = false;
      if (window.electronAPI && window.electronAPI.setIgnoreMouseEvents) {
        window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
      }
    }
  });

  // Click on drag anchor rotates window state
  if (headerDragZone) {
    headerDragZone.addEventListener("click", (e) => {
      e.stopPropagation();
      if (window.electronAPI && window.electronAPI.rotateWindowState) {
        window.electronAPI.rotateWindowState();
      }
    });
  }

  // Double-click header toggles always on top
  overlayRoot.addEventListener("dblclick", async (e) => {
    if (
      e.target.closest("button") ||
      e.target.closest(".avatar-card") ||
      e.target.closest("#header-drag-zone")
    )
      return;
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
