/**
 * Reusable Protocol Playback & Animation Engine
 * Computer Networks - Application Layer Visualizer
 *
 * Implements strict boundary checking, progressive animation,
 * endpoint lifeline rendering, and timer race condition guards.
 */

class ProtocolPlaybackEngine {
  constructor(options = {}) {
    this.container = options.container || null;
    this.sequence = null;
    this.currentStepIndex = 0;
    this.isPlaying = false;
    this.timer = null;
    this.speed = 1.0; // 1x, 0.5x, 2x
    this.baseDelay = 2200; // ms per step at 1x
    this.listeners = {
      stepChange: [],
      stateChange: [],
      sequenceLoaded: [],
      completed: []
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  notify(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(fn => fn(data));
    }
  }

  loadSequence(seq, autoPlay = false) {
    this.pause();
    this.sequence = seq;
    this.currentStepIndex = 0;
    this.notify("sequenceLoaded", this.sequence);
    this.render();
    this.notify("stepChange", this.getCurrentStep());

    if (autoPlay) {
      this.play();
    }
  }

  getCurrentStep() {
    if (!this.sequence || !this.sequence.steps || this.sequence.steps.length === 0) {
      return null;
    }
    return this.sequence.steps[this.currentStepIndex];
  }

  getTotalSteps() {
    return this.sequence && this.sequence.steps ? this.sequence.steps.length : 0;
  }

  play() {
    if (!this.sequence || this.getTotalSteps() === 0) return;
    if (this.isPlaying) return; // Prevent multiple simultaneous timers

    // If already at end, replay from beginning
    if (this.currentStepIndex >= this.getTotalSteps() - 1) {
      this.currentStepIndex = 0;
      this.render();
      this.notify("stepChange", this.getCurrentStep());
    }

    this.isPlaying = true;
    this.notify("stateChange", { state: "RUNNING", isPlaying: true });

    const stepInterval = Math.max(500, Math.round(this.baseDelay / this.speed));
    this.timer = setInterval(() => {
      if (this.currentStepIndex < this.getTotalSteps() - 1) {
        this.currentStepIndex++;
        this.render();
        this.notify("stepChange", this.getCurrentStep());
      } else {
        this.pause();
        this.notify("completed", { sequence: this.sequence });
        this.notify("stateChange", { state: "COMPLETED", isPlaying: false });
      }
    }, stepInterval);
  }

  pause() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    const wasPlaying = this.isPlaying;
    this.isPlaying = false;
    if (wasPlaying) {
      this.notify("stateChange", { state: "PAUSED", isPlaying: false });
    }
  }

  nextStep() {
    this.pause();
    if (!this.sequence || this.getTotalSteps() === 0) return;
    if (this.currentStepIndex < this.getTotalSteps() - 1) {
      this.currentStepIndex++;
      this.render();
      this.notify("stepChange", this.getCurrentStep());
    } else {
      this.notify("stateChange", { state: "COMPLETED", isPlaying: false });
    }
  }

  prevStep() {
    this.pause();
    if (!this.sequence || this.getTotalSteps() === 0) return;
    if (this.currentStepIndex > 0) {
      this.currentStepIndex--;
      this.render();
      this.notify("stepChange", this.getCurrentStep());
      this.notify("stateChange", { state: "RUNNING", isPlaying: false });
    }
  }

  goToStep(index) {
    this.pause();
    if (!this.sequence || this.getTotalSteps() === 0) return;
    const clamped = Math.max(0, Math.min(this.getTotalSteps() - 1, index));
    this.currentStepIndex = clamped;
    this.render();
    this.notify("stepChange", this.getCurrentStep());
    if (clamped === this.getTotalSteps() - 1) {
      this.notify("stateChange", { state: "COMPLETED", isPlaying: false });
    }
  }

  replay() {
    this.pause();
    this.currentStepIndex = 0;
    this.render();
    this.notify("stepChange", this.getCurrentStep());
    this.play();
  }

  reset() {
    this.pause();
    this.currentStepIndex = 0;
    this.render();
    this.notify("stepChange", this.getCurrentStep());
    this.notify("stateChange", { state: "READY", isPlaying: false });
  }

  setSpeed(newSpeed) {
    this.speed = parseFloat(newSpeed) || 1.0;
    if (this.isPlaying) {
      this.pause();
      this.play();
    }
  }

  render() {
    if (!this.container || !this.sequence) return;

    const endpoints = this.sequence.endpoints || ["Client", "DNS Server", "Server"];
    const totalSteps = this.getTotalSteps();
    const currentStep = this.getCurrentStep();

    // Render Scrubber / Timeline bar
    const scrubberEl = this.container.querySelector("#timelineScrubber");
    if (scrubberEl) {
      let dotsHtml = "";
      for (let i = 0; i < totalSteps; i++) {
        const stepObj = this.sequence.steps[i];
        const statusClass = i === this.currentStepIndex ? "active" : (i < this.currentStepIndex ? "passed" : "pending");
        dotsHtml += `
          <button class="step-dot ${statusClass}" data-step="${i}" title="Step ${i + 1}: ${stepObj.messageType || stepObj.protocol}" aria-label="Go to Step ${i + 1}">
            <span class="dot-num">${i + 1}</span>
            <span class="dot-label">${stepObj.messageType || stepObj.protocol}</span>
          </button>
        `;
      }
      scrubberEl.innerHTML = dotsHtml;
      scrubberEl.querySelectorAll(".step-dot").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const idx = parseInt(btn.getAttribute("data-step"), 10);
          this.goToStep(idx);
        });
      });
    }

    // Render Endpoint Lifelines Header
    const endpointsEl = this.container.querySelector("#endpointLifelines");
    if (endpointsEl) {
      endpointsEl.innerHTML = endpoints.map((ep, idx) => {
        const isClient = idx === 0;
        const isDns = ep.includes("DNS");
        const icon = isClient ? "💻" : (isDns ? "🌐" : "🖧");
        return `
          <div class="endpoint-column" data-endpoint-index="${idx}">
            <div class="endpoint-node ${isClient ? 'endpoint-client' : (isDns ? 'endpoint-dns' : 'endpoint-server')}">
              <span class="ep-icon">${icon}</span>
              <span class="ep-name">${ep}</span>
            </div>
            <div class="lifeline-track"></div>
          </div>
        `;
      }).join("");
    }

    // Render Progressive Sequence Messages Ladder
    const ladderEl = this.container.querySelector("#sequenceLadder");
    if (ladderEl) {
      // Progressively reveal messages up to currentStepIndex
      const revealedSteps = this.sequence.steps.slice(0, this.currentStepIndex + 1);
      
      ladderEl.innerHTML = revealedSteps.map((step, idx) => {
        const isLatest = idx === this.currentStepIndex;
        const isClientToDns = step.direction === "client-to-dns";
        const isDnsToClient = step.direction === "dns-to-client";
        const isClientToServer = step.direction === "client-to-server";
        const isServerToClient = step.direction === "server-to-client";

        let dirClass = "dir-right";
        let fromCol = 0;
        let toCol = 1;
        
        if (isClientToDns) { fromCol = 0; toCol = 1; dirClass = "client-to-dns"; }
        else if (isDnsToClient) { fromCol = 1; toCol = 0; dirClass = "dns-to-client"; }
        else if (isClientToServer) { fromCol = 0; toCol = 2; dirClass = "client-to-server"; }
        else if (isServerToClient) { fromCol = 2; toCol = 0; dirClass = "server-to-client"; }

        const protocolBadgeClass = step.protocol.toLowerCase();

        return `
          <div class="ladder-step-card ${isLatest ? 'step-active' : 'step-passed'} ${dirClass}" data-step-id="${step.id}" id="card-step-${idx}">
            <div class="step-meta-header">
              <div class="step-badge-group">
                <span class="step-number-badge">Step ${idx + 1}/${totalSteps}</span>
                <span class="protocol-badge badge-${protocolBadgeClass}">${step.protocol}</span>
                <span class="message-type-badge">${step.messageType}</span>
              </div>
              <div class="direction-indicator">
                <span class="dir-from">${step.fromEndpoint}</span>
                <span class="dir-arrow-symbol">${dirClass.includes("client-to") ? "──────►" : "◄──────"}</span>
                <span class="dir-to">${step.toEndpoint}</span>
              </div>
            </div>

            <div class="step-summary-line">
              <strong>${step.summary}</strong>
            </div>

            <div class="step-content-preview">
              <pre class="raw-preview-box"><code>${escapeHtml(step.rawMessage)}</code></pre>
            </div>
          </div>
        `;
      }).join("");

      // Auto-scroll to latest revealed step
      const latestEl = ladderEl.querySelector(`#card-step-${this.currentStepIndex}`);
      if (latestEl) {
        latestEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }

    // Render Deep Inspector Panel for current step
    const inspectorEl = this.container.querySelector("#messageInspector");
    if (inspectorEl && currentStep) {
      const fieldsHtml = (currentStep.importantFields || []).map(f => `
        <div class="field-chip ${f.highlight ? 'field-highlight' : ''}">
          <span class="field-name">${escapeHtml(f.name)}:</span>
          <span class="field-val">${escapeHtml(f.value)}</span>
        </div>
      `).join("");

      inspectorEl.innerHTML = `
        <div class="inspector-card">
          <div class="inspector-header">
            <div class="inspector-title">
              <span class="inspector-step-title">Message Inspector: Step ${this.currentStepIndex + 1} of ${totalSteps}</span>
              <span class="inspector-route">${currentStep.fromEndpoint} ➔ ${currentStep.toEndpoint}</span>
            </div>
            <button class="btn-copy-raw" id="btnCopyRaw" title="Copy raw message to clipboard">
              📋 Copy Payload
            </button>
          </div>

          <div class="inspector-explanation">
            <div class="expl-label">💡 What is happening at this step?</div>
            <p class="expl-text">${escapeHtml(currentStep.explanation)}</p>
          </div>

          <div class="inspector-fields-list">
            <div class="fields-label">Key Protocol Fields & Semantics:</div>
            <div class="fields-grid">${fieldsHtml}</div>
          </div>

          <div class="inspector-raw-container">
            <div class="raw-label">Raw Application Layer Protocol PDU:</div>
            <pre class="raw-code-block" id="rawMessageBlock"><code>${escapeHtml(currentStep.rawMessage)}</code></pre>
          </div>
        </div>
      `;

      const copyBtn = inspectorEl.querySelector("#btnCopyRaw");
      if (copyBtn) {
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(currentStep.rawMessage).then(() => {
            copyBtn.textContent = "✓ Copied!";
            setTimeout(() => { copyBtn.textContent = "📋 Copy Payload"; }, 1800);
          }).catch(err => {
            console.error("Clipboard copy failed:", err);
          });
        });
      }
    }

    // Update Counter & Controls State
    const counterEl = this.container.querySelector("#stepCounter");
    if (counterEl) {
      counterEl.textContent = `Step ${this.currentStepIndex + 1} / ${totalSteps}`;
    }

    const playPauseBtn = this.container.querySelector("#btnPlayPause");
    if (playPauseBtn) {
      playPauseBtn.innerHTML = this.isPlaying ? '⏸ Pause' : '▶ Play';
      playPauseBtn.setAttribute("aria-label", this.isPlaying ? "Pause protocol playback" : "Play protocol playback");
    }

    const prevBtn = this.container.querySelector("#btnPrev");
    if (prevBtn) {
      prevBtn.disabled = this.currentStepIndex === 0;
    }

    const nextBtn = this.container.querySelector("#btnNext");
    if (nextBtn) {
      nextBtn.disabled = this.currentStepIndex >= totalSteps - 1;
    }
  }
}

function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

window.ProtocolPlaybackEngine = ProtocolPlaybackEngine;
