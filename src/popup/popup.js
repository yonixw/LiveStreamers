document.addEventListener("DOMContentLoaded", async () => {
  const popupAvatar = document.getElementById("popup-avatar");
  const popupAvatarFallback = document.getElementById("popup-avatar-fallback");
  const popupAvatarImg = document.getElementById("popup-avatar-img");
  const popupStreamerName = document.getElementById("popup-streamer-name");
  const popupStatusBadge = document.getElementById("popup-status-badge");
  const linksContainer = document.getElementById("links-container");
  const btnCloseWindow = document.getElementById("btn-close-window");
  const popupSnoozeStatus = document.getElementById("popup-snooze-status");
  const btnSnoozeOptions = document.querySelectorAll(".btn-snooze-option");
  const btnUnsnooze = document.getElementById("btn-unsnooze");

  // Session History carousel elements
  const popupHistorySection = document.getElementById("popup-history-section");
  const btnHistoryPrev = document.getElementById("btn-history-prev");
  const btnHistoryNext = document.getElementById("btn-history-next");
  const popupHistoryCounter = document.getElementById("popup-history-counter");
  const popupHistoryCategory = document.getElementById(
    "popup-history-category",
  );
  const popupHistoryViewers = document.getElementById("popup-history-viewers");
  const popupHistoryTitle = document.getElementById("popup-history-title");
  const popupHistoryTime = document.getElementById("popup-history-time");
  const popupHistoryRuntime = document.getElementById("popup-history-runtime");

  let currentStreamerId = null;
  let historyEntries = [];
  let currentHistoryIdx = 0;

  function updateHistoryCard(idx) {
    if (!historyEntries || historyEntries.length === 0) {
      if (popupHistorySection) popupHistorySection.style.display = "none";
      return;
    }
    currentHistoryIdx = Math.max(0, Math.min(historyEntries.length - 1, idx));
    const entry = historyEntries[currentHistoryIdx];
    if (!entry) return;

    const [cat, title, viewer, localTime, liveTime] = entry;

    if (popupHistoryCategory) {
      popupHistoryCategory.textContent = cat || "(no category)";
    }
    if (popupHistoryViewers) {
      const vNum = Number(viewer);
      popupHistoryViewers.textContent =
        !isNaN(vNum) && vNum > 0 ? `👥 ${vNum.toLocaleString()}` : "👥 0";
    }
    if (popupHistoryTitle) {
      popupHistoryTitle.textContent = title || "No Title";
    }
    if (popupHistoryTime) {
      popupHistoryTime.textContent = `🕒 ${localTime || "--:--:--"}`;
    }
    if (popupHistoryRuntime) {
      popupHistoryRuntime.textContent = `⏱️ ${liveTime || "0m"}`;
    }
    if (popupHistoryCounter) {
      popupHistoryCounter.textContent = `Entry ${currentHistoryIdx + 1}/${historyEntries.length}`;
    }
    if (btnHistoryPrev) {
      btnHistoryPrev.disabled = currentHistoryIdx === 0;
    }
    if (btnHistoryNext) {
      btnHistoryNext.disabled = currentHistoryIdx === historyEntries.length - 1;
    }
  }

  if (btnHistoryPrev) {
    btnHistoryPrev.addEventListener("click", () => {
      updateHistoryCard(currentHistoryIdx - 1);
    });
  }

  if (btnHistoryNext) {
    btnHistoryNext.addEventListener("click", () => {
      updateHistoryCard(currentHistoryIdx + 1);
    });
  }

  // Helper to detect platform
  function detectPlatform(url) {
    if (!url || typeof url !== "string") return "other";
    const lower = url.toLowerCase();
    if (lower.includes("kick.com")) return "kick";
    if (lower.includes("twitch.tv")) return "twitch";
    if (lower.includes("youtube.com") || lower.includes("youtu.be"))
      return "youtube";
    return "other";
  }

  function getPlatformPillClass(plat) {
    switch (plat) {
      case "youtube":
        return "pill-youtube";
      case "twitch":
        return "pill-twitch";
      case "kick":
        return "pill-kick";
      default:
        return "pill-other";
    }
  }

  function getInitials(name) {
    if (!name) return "?";
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

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

  if (btnCloseWindow) {
    btnCloseWindow.addEventListener("click", () => {
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      }
    });
  }

  // Close on Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      }
    }
  });

  // Snooze Button Handlers
  btnSnoozeOptions.forEach((btn) => {
    btn.addEventListener("click", async () => {
      const durationMs = parseInt(btn.getAttribute("data-duration"), 10);
      if (
        currentStreamerId &&
        window.electronAPI &&
        window.electronAPI.snoozeStreamer
      ) {
        await window.electronAPI.snoozeStreamer(currentStreamerId, durationMs);
      }
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      }
    });
  });

  if (btnUnsnooze) {
    btnUnsnooze.addEventListener("click", async () => {
      if (
        currentStreamerId &&
        window.electronAPI &&
        window.electronAPI.snoozeStreamer
      ) {
        await window.electronAPI.snoozeStreamer(currentStreamerId, null);
      }
      if (window.electronAPI && window.electronAPI.closeWindow) {
        window.electronAPI.closeWindow();
      }
    });
  }

  // Render streamer details and link cards
  function renderStreamerData(data) {
    if (!data || !data.streamer) return;
    const { streamer, isLive, activeUrl, isSnoozed, snoozedUntil, history } =
      data;
    currentStreamerId = streamer.id;

    const name = streamer.name || "Streamer";
    popupStreamerName.textContent = name;

    // Session Timeline History Carousel
    if (Array.isArray(history) && history.length > 0) {
      historyEntries = history;
      if (popupHistorySection) popupHistorySection.style.display = "flex";
      updateHistoryCard(historyEntries.length - 1);
    } else if (isLive && streamer.cachedInfo) {
      const cached = streamer.cachedInfo;
      const cat = (cached.category || cached.game || "").trim();
      const title = (cached.title || "").trim();
      const viewer = Number(cached.viewerCount) || 0;
      const localTime = new Date().toLocaleTimeString();
      const liveTime = "Live";
      historyEntries = [[cat, title, viewer, localTime, liveTime]];
      if (popupHistorySection) popupHistorySection.style.display = "flex";
      updateHistoryCard(0);
    } else {
      historyEntries = [];
      if (popupHistorySection) popupHistorySection.style.display = "none";
    }

    // Snooze status badge
    if (isSnoozed && snoozedUntil) {
      const untilDate = new Date(snoozedUntil);
      popupSnoozeStatus.textContent = `(Snoozed until ${untilDate.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })})`;
      popupSnoozeStatus.style.display = "inline";
      if (btnUnsnooze) btnUnsnooze.style.display = "inline-block";
    } else {
      popupSnoozeStatus.style.display = "none";
      if (btnUnsnooze) btnUnsnooze.style.display = "none";
    }

    if (isLive) {
      popupStatusBadge.textContent = "🔴 LIVE NOW";
      popupStatusBadge.className = "popup-status-badge badge-live";
    } else {
      popupStatusBadge.textContent = "⚪ Offline";
      popupStatusBadge.className = "popup-status-badge";
    }

    // Avatar image
    const imgSrc = formatImageSrc(streamer.avatarImage);
    if (imgSrc) {
      popupAvatarImg.src = imgSrc;
      popupAvatarImg.style.display = "block";
      popupAvatarFallback.style.display = "none";
      popupAvatarImg.onerror = () => {
        popupAvatarImg.style.display = "none";
        popupAvatarFallback.style.display = "block";
        popupAvatarFallback.textContent = getInitials(name);
      };
    } else {
      popupAvatarImg.style.display = "none";
      popupAvatarFallback.style.display = "block";
      popupAvatarFallback.textContent = getInitials(name);
    }

    // Links
    linksContainer.innerHTML = "";
    const urls = Array.isArray(streamer.urls)
      ? streamer.urls
      : streamer.url
        ? [{ url: streamer.url }]
        : [];

    if (urls.length === 0) {
      const emptyDiv = document.createElement("div");
      emptyDiv.className = "popup-instruction";
      emptyDiv.textContent = "No URLs configured.";
      linksContainer.appendChild(emptyDiv);
      return;
    }

    urls.forEach((entry, idx) => {
      let urlStr = typeof entry === "string" ? entry : entry?.url || "";
      if (!urlStr) return;
      if (urlStr.startsWith("!")) urlStr = urlStr.slice(1);

      const plat = detectPlatform(urlStr);
      const isLiveLink = isLive && activeUrl === urlStr;

      const card = document.createElement("div");
      card.className = `link-card ${isLiveLink ? "is-live-card" : ""}`;
      card.setAttribute("tabindex", "0");

      const left = document.createElement("div");
      left.className = "link-card-left";

      const pill = document.createElement("span");
      pill.className = `platform-icon-pill ${getPlatformPillClass(plat)}`;
      pill.textContent = plat.toUpperCase();

      const info = document.createElement("div");
      info.className = "link-card-info";

      const platTitle = document.createElement("span");
      platTitle.className = "link-platform-name";
      platTitle.textContent = `#${idx + 1} ${plat.toUpperCase()}`;

      const urlText = document.createElement("span");
      urlText.className = "link-url-text";
      urlText.textContent = urlStr;

      info.appendChild(platTitle);
      info.appendChild(urlText);

      left.appendChild(pill);
      left.appendChild(info);

      const right = document.createElement("div");
      right.className = "link-card-right";

      if (isLiveLink) {
        const liveBadge = document.createElement("span");
        liveBadge.className = "link-live-badge";
        liveBadge.textContent = "LIVE 🔴";
        right.appendChild(liveBadge);
      }

      const arrow = document.createElement("span");
      arrow.className = "link-open-arrow";
      arrow.textContent = "↗";
      right.appendChild(arrow);

      card.appendChild(left);
      card.appendChild(right);

      const openLink = () => {
        if (window.electronAPI) {
          if (window.electronAPI.openExternal) {
            window.electronAPI.openExternal(urlStr);
          }
          if (window.electronAPI.closeWindow) {
            window.electronAPI.closeWindow();
          }
        }
      };

      card.addEventListener("click", openLink);
      card.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          openLink();
        }
      });

      linksContainer.appendChild(card);
    });
  }

  // Load active streamer data from Electron main process
  if (window.electronAPI && window.electronAPI.getActivePopupStreamer) {
    try {
      const data = await window.electronAPI.getActivePopupStreamer();
      renderStreamerData(data);
    } catch (err) {
      console.error("Failed to load popup data:", err);
    }
  }
});
