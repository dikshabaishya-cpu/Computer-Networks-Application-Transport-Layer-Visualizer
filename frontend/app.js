/**
 * Master Application Controller & Dual-Panel Synchronizer
 * Computer Networks - Application Layer Visualizer
 *
 * Enforces single source of truth state, live bidirectional synchronization,
 * robust error handling, activity logging, and responsive presets.
 */

const AppState = {
  currentActivity: "browsing", // "browsing" | "mail" | "streaming"
  playbackState: "READY",      // "READY" | "RUNNING" | "PAUSED" | "COMPLETED" | "ERROR"
  backendOnline: false,
  playbackEngine: null,
  activeSequence: null,
  applicationSequence: null,
  transportSequence: null,
  selectedLayer: "application"
};

// Activity Presets
const PRESETS = {
  browsing: [
    { label: "Example.com (Standard)", url: "https://example.com" },
    { label: "University Network Lab", url: "https://networklab.edu/lectures/app-layer.html" },
    { label: "IETF RFC Standards", url: "https://www.ietf.org/rfc/rfc2616.txt" }
  ],
  mail: [
    {
      label: "Assignment Submission",
      to: "professor@university.edu",
      subject: "CS420: Lab 1 Application Layer Submission",
      body: "Dear Professor,\n\nHere is my completed Application Layer protocol visualizer assignment.\n\nRespectfully,\nNetwork Student"
    },
    {
      label: "Lab Partner Test",
      to: "student@example.com",
      subject: "Computer Networks Demo",
      body: "Testing SMTP protocol visualization with realistic envelope commands."
    },
    {
      label: "Postfix Ping",
      to: "postmaster@mail.ietf.org",
      subject: "HELO/EHLO RFC 5321 Verification",
      body: "Verifying SMTP transaction envelope state machine."
    }
  ],
  streaming: [
    { label: "Campus Lecture (720p)", url: "https://video.networklab.org/live/lecture.m3u8", quality: "720p" },
    { label: "High-Bitrate HD (1080p)", url: "https://video.networklab.org/vod/networks_hd.m3u8", quality: "1080p" },
    { label: "Mobile Adaptive (360p)", url: "https://video.networklab.org/live/mobile_feed.m3u8", quality: "360p" }
  ]
};

document.addEventListener("DOMContentLoaded", () => {
  initApp();
});

async function initApp() {
  setupPlaybackEngine();
  setupActivitySwitchers();
  setupLayerSwitcher();
  setupFormControls();
  setupPresets();
  setupKeyboardControls();
  await checkBackendStatus();
  
  // Initialize default activity (Browsing)
  switchActivity("browsing", false);
  logActivity("System initialized. Dual-panel dashboard ready.", "SYSTEM");
}

function setupPlaybackEngine() {
  const rightPanel = document.getElementById("protocolPanel");
  AppState.playbackEngine = new ProtocolPlaybackEngine({ container: rightPanel });

  AppState.playbackEngine.on("stateChange", ({ state }) => {
    setPlaybackStatus(state);
  });

  AppState.playbackEngine.on("completed", () => {
    logActivity(`Protocol exchange reached completion (${AppState.activeSequence.steps.length} steps).`, "SUCCESS");
  });

  AppState.playbackEngine.on("stepChange", (step) => {
    if (!step) return;
    const desc = `${step.protocol} ${step.messageType}: ${step.fromEndpoint} → ${step.toEndpoint}`;
    if (step.protocol === "TCP") {
      const f=Object.fromEntries((step.importantFields||[]).map(x=>[x.name,x.value]));
      const state=document.getElementById("tcpStateIndicator");
      if(state){state.innerHTML=`<strong>TCP State</strong><span>Client: ${f["Client State"]||"—"}</span><span>Server: ${f["Server State"]||"—"}</span>`; state.hidden=false;}
    }
    // Log important stage milestones
    if (step.stage === "dns" && step.stepNumber === 1) {
      logActivity(`DNS lookup initiated: ${step.summary}`, "INFO");
    } else if (step.stage === "dns" && step.stepNumber === 2) {
      logActivity(`DNS lookup resolved: ${step.summary}`, "INFO");
    } else if (step.stage === "http" && step.messageType === "GET") {
      logActivity(`HTTP GET dispatched: ${step.summary}`, "INFO");
    } else if (step.stage === "http" && step.messageType === "200 OK") {
      logActivity(`HTTP 200 OK received: ${step.summary}`, "INFO");
    } else if (step.stage === "smtp") {
      logActivity(`SMTP: ${step.summary}`, "INFO");
    } else if (step.stage === "segment") {
      logActivity(`HLS Streaming: ${step.summary}`, "INFO");
    }
  });

  // Playback control button listeners
  const btnPlayPause = document.getElementById("btnPlayPause");
  const btnPrev = document.getElementById("btnPrev");
  const btnNext = document.getElementById("btnNext");
  const btnReplay = document.getElementById("btnReplay");
  const selectSpeed = document.getElementById("selectSpeed");

  if (btnPlayPause) {
    btnPlayPause.addEventListener("click", () => {
      if (AppState.playbackEngine.isPlaying) {
        AppState.playbackEngine.pause();
        logActivity("Protocol playback paused by user.", "USER");
      } else {
        AppState.playbackEngine.play();
        logActivity("Protocol playback started.", "USER");
      }
    });
  }

  if (btnPrev) {
    btnPrev.addEventListener("click", () => {
      AppState.playbackEngine.prevStep();
      logActivity("Stepped backward.", "USER");
    });
  }

  if (btnNext) {
    btnNext.addEventListener("click", () => {
      AppState.playbackEngine.nextStep();
      logActivity("Stepped forward.", "USER");
    });
  }

  if (btnReplay) {
    btnReplay.addEventListener("click", () => {
      AppState.playbackEngine.replay();
      logActivity("Replaying protocol sequence from Step 1.", "USER");
    });
  }

  if (selectSpeed) {
    selectSpeed.addEventListener("change", (e) => {
      AppState.playbackEngine.setSpeed(e.target.value);
      logActivity(`Playback speed set to ${e.target.value}x.`, "USER");
    });
  }
}

function setupLayerSwitcher() {
  document.getElementById("btnApplicationLayer")?.addEventListener("click", () => switchLayer("application"));
  document.getElementById("btnTransportLayer")?.addEventListener("click", () => switchLayer("transport"));
}

function switchLayer(layer) {
  if (layer === AppState.selectedLayer) return;
  AppState.playbackEngine.pause();
  AppState.selectedLayer = layer;
  document.getElementById("btnApplicationLayer")?.classList.toggle("active", layer === "application");
  document.getElementById("btnTransportLayer")?.classList.toggle("active", layer === "transport");
  loadSelectedLayer(false);
  logActivity(`Switched right panel to ${layer === "application" ? "Application" : "Transport"} Layer for the same ${AppState.currentActivity} session.`, "STATE");
}

function loadSelectedLayer(autoPlay=false) {
  const seq = AppState.selectedLayer === "transport" ? AppState.transportSequence : AppState.applicationSequence;
  if (!seq) return;
  AppState.activeSequence = seq;
  AppState.playbackEngine.loadSequence(seq, autoPlay);
  const titleEl=document.getElementById("currentProtocolTitle"); if(titleEl) titleEl.textContent=seq.protocolTitle;
  const descEl=document.getElementById("currentProtocolDesc"); if(descEl) descEl.textContent=seq.description;
  const state=document.getElementById("tcpStateIndicator");
  if(state) state.hidden = AppState.selectedLayer !== "transport";
}

function setupActivitySwitchers() {
  const tabs = document.querySelectorAll(".activity-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      const activity = tab.getAttribute("data-activity");
      if (activity !== AppState.currentActivity) {
        switchActivity(activity, false);
      }
    });
  });
}

function switchActivity(activityName, autoPlay = false) {
  // 1. Immediately halt any running playback and clear previous timers
  if (AppState.playbackEngine) {
    AppState.playbackEngine.pause();
  }

  AppState.currentActivity = activityName;

  // 2. Update Left Panel active tab and view container
  document.querySelectorAll(".activity-tab").forEach(t => {
    const isActive = t.getAttribute("data-activity") === activityName;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", isActive ? "true" : "false");
  });

  document.querySelectorAll(".activity-view").forEach(v => {
    v.classList.toggle("active-view", v.id === `view-${activityName}`);
  });

  // 3. Clear any error alerts
  clearFormError();

  // 4. Synchronize Right Panel: immediately load sequence corresponding to activity
  let sequence = null;
  if (activityName === "browsing") {
    const url = document.getElementById("inputBrowseUrl")?.value || "https://example.com";
    sequence = window.ProtocolData.generateBrowsingSequence(url);
  } else if (activityName === "mail") {
    const to = document.getElementById("inputMailTo")?.value || "student@example.com";
    const sub = document.getElementById("inputMailSubject")?.value || "Computer Networks Demo";
    const body = document.getElementById("inputMailBody")?.value || "Testing SMTP protocol visualization.";
    sequence = window.ProtocolData.generateMailSequence(to, "student@example.com", sub, body);
  } else if (activityName === "streaming") {
    const url = document.getElementById("selectStreamUrl")?.value || "https://video.networklab.org/live/lecture.m3u8";
    const quality = document.getElementById("selectStreamQuality")?.value || "720p";
    sequence = window.ProtocolData.generateStreamingSequence(url, quality);
    updateStreamingMockPlayer(quality, false);
  }

  AppState.applicationSequence = sequence;
  AppState.transportSequence = window.TransportData.generate(activityName);
  loadSelectedLayer(autoPlay);

  // 5. Update titles & badges
  const titleEl = document.getElementById("currentProtocolTitle");
  if (titleEl) {
    titleEl.textContent = AppState.activeSequence.protocolTitle;
  }

  const descEl = document.getElementById("currentProtocolDesc");
  if (descEl) {
    descEl.textContent = AppState.activeSequence.description;
  }

  setPlaybackStatus("READY");
  logActivity(`Switched to [${activityName.toUpperCase()}] activity. Protocol panel synchronized.`, "STATE");
}

function setupFormControls() {
  // Browsing Form
  const btnBrowseVisit = document.getElementById("btnBrowseVisit");
  const btnBrowseReset = document.getElementById("btnBrowseReset");
  const inputBrowseUrl = document.getElementById("inputBrowseUrl");

  if (btnBrowseVisit) {
    btnBrowseVisit.addEventListener("click", () => handleBrowsingVisit());
  }
  if (inputBrowseUrl) {
    inputBrowseUrl.addEventListener("keydown", (e) => {
      if (e.key === "Enter") handleBrowsingVisit();
    });
  }
  if (btnBrowseReset) {
    btnBrowseReset.addEventListener("click", () => {
      if (inputBrowseUrl) inputBrowseUrl.value = "https://example.com";
      clearFormError();
      switchActivity("browsing", false);
      logActivity("Browsing input reset to default.", "USER");
    });
  }

  // Mail Form
  const btnMailSend = document.getElementById("btnMailSend");
  const btnMailReset = document.getElementById("btnMailReset");

  if (btnMailSend) {
    btnMailSend.addEventListener("click", () => handleMailSend());
  }
  if (btnMailReset) {
    btnMailReset.addEventListener("click", () => {
      document.getElementById("inputMailTo").value = "student@example.com";
      document.getElementById("inputMailSubject").value = "Computer Networks Demo";
      document.getElementById("inputMailBody").value = "Testing SMTP protocol visualization.";
      clearFormError();
      switchActivity("mail", false);
      logActivity("Mail composition reset to default.", "USER");
    });
  }

  // Streaming Form
  const btnStreamPlay = document.getElementById("btnStreamPlay");
  const btnStreamPause = document.getElementById("btnStreamPause");
  const btnStreamReset = document.getElementById("btnStreamReset");
  const selectStreamQuality = document.getElementById("selectStreamQuality");
  const selectStreamUrl = document.getElementById("selectStreamUrl");

  if (btnStreamPlay) {
    btnStreamPlay.addEventListener("click", () => handleStreamingPlay());
  }
  if (btnStreamPause) {
    btnStreamPause.addEventListener("click", () => {
      AppState.playbackEngine.pause();
      updateStreamingMockPlayer(selectStreamQuality?.value, false);
      logActivity("Streaming paused.", "USER");
    });
  }
  if (btnStreamReset) {
    btnStreamReset.addEventListener("click", () => {
      AppState.playbackEngine.reset();
      updateStreamingMockPlayer(selectStreamQuality?.value, false);
      logActivity("Streaming stopped and buffer reset.", "USER");
    });
  }
  if (selectStreamQuality) {
    selectStreamQuality.addEventListener("change", (e) => {
      const q = e.target.value;
      logActivity(`Streaming quality changed to ${q}.`, "USER");
      updateStreamingMetadataDisplay(q);
      // Re-synchronize protocol sequence with updated quality
      const url = selectStreamUrl?.value || "https://video.networklab.org/live/lecture.m3u8";
      const seq = window.ProtocolData.generateStreamingSequence(url, q);
      AppState.applicationSequence = seq;
      AppState.transportSequence = window.TransportData.generate("streaming");
      loadSelectedLayer(false);
    });
  }

  // Activity Log controls
  const btnClearLog = document.getElementById("btnClearLog");
  if (btnClearLog) {
    btnClearLog.addEventListener("click", () => {
      const logBody = document.getElementById("activityLogList");
      if (logBody) logBody.innerHTML = "";
      logActivity("Activity log cleared.", "SYSTEM");
    });
  }
}

async function handleBrowsingVisit() {
  clearFormError();
  const urlInput = document.getElementById("inputBrowseUrl")?.value || "";
  if (!urlInput.trim()) {
    showFormError("URL cannot be empty. Please enter a valid website address.");
    return;
  }

  logActivity(`Initiating browser visit for: ${urlInput}`, "USER");
  setPlaybackStatus("RUNNING");

  let sequence = null;
  if (AppState.backendOnline) {
    try {
      const resp = await fetch("/api/simulate/browsing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: urlInput })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Server simulation error");
      }
      const data = await resp.json();
      sequence = mapBackendResponseToClient(data);
    } catch (err) {
      console.warn("Backend request failed, falling back to client generator:", err);
      sequence = window.ProtocolData.generateBrowsingSequence(urlInput);
    }
  } else {
    sequence = window.ProtocolData.generateBrowsingSequence(urlInput);
  }

  AppState.applicationSequence = sequence;
  AppState.transportSequence = window.TransportData.generate(AppState.currentActivity);
  loadSelectedLayer(true);
}

async function handleMailSend() {
  clearFormError();
  const to = document.getElementById("inputMailTo")?.value || "";
  const sub = document.getElementById("inputMailSubject")?.value || "";
  const body = document.getElementById("inputMailBody")?.value || "";

  if (!to.trim()) {
    showFormError("Recipient 'To' address cannot be empty.");
    return;
  }
  if (!to.includes("@") || !to.split("@")[1].includes(".")) {
    showFormError("Invalid email recipient format. Expected: user@domain.com");
    return;
  }

  logActivity(`Sending mail to: <${to}> | Subject: "${sub}"`, "USER");
  setPlaybackStatus("RUNNING");

  let sequence = null;
  if (AppState.backendOnline) {
    try {
      const resp = await fetch("/api/simulate/mail", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: to,
          from_addr: "student@example.com",
          subject: sub,
          body: body
        })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Server simulation error");
      }
      const data = await resp.json();
      sequence = mapBackendResponseToClient(data);
    } catch (err) {
      console.warn("Backend request failed, falling back to client generator:", err);
      sequence = window.ProtocolData.generateMailSequence(to, "student@example.com", sub, body);
    }
  } else {
    sequence = window.ProtocolData.generateMailSequence(to, "student@example.com", sub, body);
  }

  AppState.applicationSequence = sequence;
  AppState.transportSequence = window.TransportData.generate(AppState.currentActivity);
  loadSelectedLayer(true);
}

async function handleStreamingPlay() {
  clearFormError();
  const url = document.getElementById("selectStreamUrl")?.value || "https://video.networklab.org/live/lecture.m3u8";
  const quality = document.getElementById("selectStreamQuality")?.value || "720p";

  logActivity(`Starting HLS media stream at ${quality} resolution.`, "USER");
  setPlaybackStatus("RUNNING");
  updateStreamingMockPlayer(quality, true);

  let sequence = null;
  if (AppState.backendOnline) {
    try {
      const resp = await fetch("/api/simulate/streaming", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stream_url: url, quality: quality })
      });
      if (!resp.ok) {
        const err = await resp.json();
        throw new Error(err.detail || "Server simulation error");
      }
      const data = await resp.json();
      sequence = mapBackendResponseToClient(data);
    } catch (err) {
      console.warn("Backend request failed, falling back to client generator:", err);
      sequence = window.ProtocolData.generateStreamingSequence(url, quality);
    }
  } else {
    sequence = window.ProtocolData.generateStreamingSequence(url, quality);
  }

  AppState.applicationSequence = sequence;
  AppState.transportSequence = window.TransportData.generate(AppState.currentActivity);
  loadSelectedLayer(true);
}

function mapBackendResponseToClient(data) {
  return {
    activity: data.activity,
    protocolTitle: data.protocol_title,
    description: data.description,
    endpoints: data.endpoints,
    steps: (data.steps || []).map(s => ({
      id: s.id,
      stepNumber: s.step_number,
      protocol: s.protocol,
      stage: s.stage,
      fromEndpoint: s.from_endpoint,
      toEndpoint: s.to_endpoint,
      direction: s.direction,
      messageType: s.message_type,
      summary: s.summary,
      rawMessage: s.raw_message,
      explanation: s.explanation,
      importantFields: (s.important_fields || []).map(f => ({
        name: f.name,
        value: f.value,
        highlight: f.highlight
      }))
    }))
  };
}

function logActivity(message, level = "INFO") {
  const listEl = document.getElementById("activityLogList");
  if (!listEl) return;

  const d = new Date();
  const timeStr = [
    String(d.getHours()).padStart(2, "0"),
    String(d.getMinutes()).padStart(2, "0"),
    String(d.getSeconds()).padStart(2, "0")
  ].join(":");

  const item = document.createElement("div");
  item.className = `log-entry log-${level.toLowerCase()}`;
  item.innerHTML = `
    <span class="log-time">${timeStr}</span>
    <span class="log-msg">${escapeHtml(message)}</span>
  `;

  listEl.appendChild(item);
  listEl.scrollTop = listEl.scrollHeight;
}

function setPlaybackStatus(statusName) {
  AppState.playbackState = statusName;

  const leftBadge = document.getElementById("activityStatusBadge");
  const rightBadge = document.getElementById("protocolStatusBadge");

  [leftBadge, rightBadge].forEach(badge => {
    if (!badge) return;
    badge.className = `status-pill status-${statusName.toLowerCase()}`;
    let icon = "●";
    if (statusName === "COMPLETED") icon = "✓";
    if (statusName === "ERROR") icon = "⚠";
    badge.innerHTML = `<span class="status-dot">${icon}</span> ${statusName}`;
  });
}

function showFormError(msg) {
  setPlaybackStatus("ERROR");
  const errBox = document.getElementById("activityErrorBox");
  if (errBox) {
    errBox.textContent = `⚠ ${msg}`;
    errBox.style.display = "block";
  }
  logActivity(`Validation Error: ${msg}`, "ERROR");
}

function clearFormError() {
  const errBox = document.getElementById("activityErrorBox");
  if (errBox) {
    errBox.textContent = "";
    errBox.style.display = "none";
  }
}

function updateStreamingMetadataDisplay(quality) {
  const metaMap = {
    "360p": { res: "640x360", rate: "~800 Kbps", codec: "H.264 / AAC", chunk: "~600 KB" },
    "480p": { res: "854x480", rate: "~1.4 Mbps", codec: "H.264 / AAC", chunk: "~1.05 MB" },
    "720p": { res: "1280x720", rate: "~2.5 Mbps", codec: "H.264 / AAC", chunk: "~1.88 MB" },
    "1080p": { res: "1920x1080", rate: "~5.0 Mbps", codec: "H.264 / High", chunk: "~3.75 MB" },
    "Auto": { res: "Adaptive (720p base)", rate: "~2.5 Mbps (Dynamic)", codec: "H.264 / Auto", chunk: "~1.88 MB" }
  };
  const info = metaMap[quality] || metaMap["720p"];
  const resEl = document.getElementById("metaStreamRes");
  const rateEl = document.getElementById("metaStreamRate");
  const chunkEl = document.getElementById("metaStreamChunk");
  if (resEl) resEl.textContent = info.res;
  if (rateEl) rateEl.textContent = info.rate;
  if (chunkEl) chunkEl.textContent = info.chunk;
}

function updateStreamingMockPlayer(quality, isBuffering) {
  const playerScreen = document.getElementById("simulatedPlayerScreen");
  const playerState = document.getElementById("playerScreenState");
  if (playerScreen && playerState) {
    if (isBuffering) {
      playerScreen.classList.add("playing");
      playerState.innerHTML = `
        <div class="stream-playing-anim">
          <div class="sound-wave"><span></span><span></span><span></span><span></span></div>
          <div class="stream-text">Streaming HLS (${quality})</div>
        </div>
      `;
    } else {
      playerScreen.classList.remove("playing");
      playerState.innerHTML = `<span class="idle-text">▶ Press Play to stream segments</span>`;
    }
  }
}

function setupPresets() {
  // Browsing Presets
  const browsePresetsEl = document.getElementById("browsePresetsList");
  if (browsePresetsEl) {
    browsePresetsEl.innerHTML = PRESETS.browsing.map((p, i) => `
      <button class="preset-btn" data-preset-idx="${i}" title="${p.url}">
        ${p.label}
      </button>
    `).join("");
    browsePresetsEl.querySelectorAll(".preset-btn").forEach(b => {
      b.addEventListener("click", () => {
        const idx = parseInt(b.getAttribute("data-preset-idx"), 10);
        const item = PRESETS.browsing[idx];
        const input = document.getElementById("inputBrowseUrl");
        if (input) input.value = item.url;
        handleBrowsingVisit();
      });
    });
  }

  // Mail Presets
  const mailPresetsEl = document.getElementById("mailPresetsList");
  if (mailPresetsEl) {
    mailPresetsEl.innerHTML = PRESETS.mail.map((p, i) => `
      <button class="preset-btn" data-preset-idx="${i}">
        ${p.label}
      </button>
    `).join("");
    mailPresetsEl.querySelectorAll(".preset-btn").forEach(b => {
      b.addEventListener("click", () => {
        const idx = parseInt(b.getAttribute("data-preset-idx"), 10);
        const item = PRESETS.mail[idx];
        document.getElementById("inputMailTo").value = item.to;
        document.getElementById("inputMailSubject").value = item.subject;
        document.getElementById("inputMailBody").value = item.body;
        handleMailSend();
      });
    });
  }
}

function setupKeyboardControls() {
  window.addEventListener("keydown", (e) => {
    // Only capture keys if not typing in form inputs
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement.tagName)) {
      return;
    }

    if (e.code === "Space") {
      e.preventDefault();
      if (AppState.playbackEngine.isPlaying) {
        AppState.playbackEngine.pause();
      } else {
        AppState.playbackEngine.play();
      }
    } else if (e.code === "ArrowRight") {
      e.preventDefault();
      AppState.playbackEngine.nextStep();
    } else if (e.code === "ArrowLeft") {
      e.preventDefault();
      AppState.playbackEngine.prevStep();
    } else if (e.key === "r" || e.key === "R") {
      e.preventDefault();
      AppState.playbackEngine.replay();
    }
  });
}

async function checkBackendStatus() {
  const backendBadge = document.getElementById("backendStatusPill");
  try {
    const res = await fetch("/api/health", { method: "GET" });
    if (res.ok) {
      AppState.backendOnline = true;
      if (backendBadge) {
        backendBadge.className = "backend-pill backend-connected";
        backendBadge.innerHTML = `<span class="dot">●</span> FastAPI Backend: Connected`;
      }
      return;
    }
  } catch (err) {
    // Expected when running purely via local static server
  }
  AppState.backendOnline = false;
  if (backendBadge) {
    backendBadge.className = "backend-pill backend-standalone";
    backendBadge.innerHTML = `<span class="dot">○</span> Simulator Engine: Standalone JS`;
  }
}
