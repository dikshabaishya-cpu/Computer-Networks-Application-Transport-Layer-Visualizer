# Computer Networks – Application Layer Dual-Panel Visualizer
### Interactive Visualizer of DNS, HTTP, SMTP, and HLS Streaming Protocols

An educational, presentation-grade web dashboard designed for Computer Networks laboratory demonstrations and classroom walkthroughs. The application maps real-world user activities (Browsing, Composing Email, Streaming Video) to progressive, message-by-message application-layer protocol transactions adhering strictly to official IETF standards.

---

## 📌 Architecture: Strict Dual-Panel Layout

The dashboard structurally consists of **exactly two primary panels**:

```
+-------------------------------------------------------------------------------+
|             HEADER: Application Layer Protocol Visualizer                     |
|       "Interactive visualization of DNS, HTTP, SMTP, and HLS Streaming"       |
+---------------------------------------+---------------------------------------+
|  LEFT PANEL: Activity Panel (38%)     |  RIGHT PANEL: Protocol Visualizer(62%)|
|  [ Browsing | Mail | Streaming ]      |  [ CLIENT ]   [ DNS ]   [ WEB/MAIL ]  |
|                                       |       |          |            |       |
|  - Activity-specific form controls    |       +--- DNS Query ------>  |       |
|  - Realistic presets & validation     |       |<-- DNS Resp --------+ |       |
|  - Action Trigger (Visit / Send / Play)       +--------- HTTP GET ----------> |
|  - Live Status Badge (READY/RUNNING)  |       |<-------- HTTP 200 ----------+ |
|  - Timestamped Activity Event Log     |                                       |
|  - Simulated Video Player (Streaming) |  Controls: [ |< ] [ < ] [ Play ] [ > ]|
|                                       |  Timeline Scrubber: Step 3 / 8        |
|                                       |  Message Detail & RFC Payload Card    |
+---------------------------------------+---------------------------------------+
|  FOOTER: Protocol Reference Legend | Network Layer Info | Academic Attribution |
+-------------------------------------------------------------------------------+
```

- **LEFT PANEL (Activity Panel - 38% desktop width)**:
  - User controls for 3 distinct application activities: **Browsing**, **Mail**, and **Streaming**.
  - Form validation with error banners.
  - Activity-specific preset selector buttons.
  - Live activity status indicator (`READY`, `RUNNING`, `PAUSED`, `COMPLETED`, `ERROR`).
  - Real-time timestamped event log (`HH:MM:SS`).
- **RIGHT PANEL (Protocol Visualization Panel - 62% desktop width)**:
  - Communicating endpoint lifelines (`Client`, `DNS Server`, `Web Server / Mail Server / Media Server`).
  - Progressive sequence ladder displaying arrows with explicit directions (`Client → Server`, `Server → Client`).
  - Step-by-step playback engine: **Play**, **Pause**, **Next Step**, **Previous Step**, **Replay**, and playback speed (0.5x, 1x, 2x).
  - Interactive clickable timeline scrubber dots (`Step X / Y`).
  - Deep Message Inspector: "What is happening at this step?", key protocol fields chip breakdown, and raw ASCII protocol payload with one-click clipboard copying.

---

## ⚡ Live Synchronization Engine

The Left and Right panels share a single source of truth state model:
1. **Instant Mapping**: Clicking **Visit** (Browsing), **Send** (Mail), or **Play** (Streaming) immediately reconfigures the Right Panel's communicating endpoints, timeline, and loads the corresponding protocol sequence.
2. **Race Condition Prevention**: Switching activity tabs instantly halts any running playback timers, resets sequence pointers, clears errors, and synchronizes the protocol panel.
3. **Boundary Protection**: Previous at Step 0 is disabled; Next at final step safely concludes execution and updates status to `COMPLETED`; Replay cleanly rewinds to Step 1.

---

## 🛠️ Technology Stack

- **Backend**: Python 3.10+ / 3.14, FastAPI, Uvicorn, Pydantic V2, Pytest.
- **Frontend**: HTML5, CSS3 (Custom Properties, Flexbox, CSS Grid), Vanilla JavaScript (ES2022, zero heavy frameworks, zero node_modules needed to run).
- **Dual Server Mode**:
  - **Full Mode**: FastAPI backend provides REST simulation endpoints (`/api/simulate/*`).
  - **Standalone Mode**: Zero-dependency offline fallback. Runs in any browser or with Python's built-in `http.server`.

---

## 📁 Project Structure

```
network-protocol-visualizer/
├── backend/
│   ├── __init__.py           # Backend package initialization
│   ├── main.py               # FastAPI application & static file mount
│   ├── models.py             # Pydantic schemas for protocol steps & requests
│   └── simulator.py          # RFC-compliant protocol simulation generators
├── frontend/
│   ├── index.html            # Semantic two-panel HTML5 dashboard
│   ├── styles.css            # Presentation-grade responsive CSS
│   ├── app.js                # Master application controller & synchronizer
│   ├── playback.js           # Reusable sequence animation & playback engine
│   └── protocol_data.js      # Client-side protocol models & offline fallback
├── tests/
│   ├── __init__.py
│   ├── test_simulator.py     # Unit tests for protocol generators & boundaries
│   └── test_api.py           # Integration tests for FastAPI endpoints
├── docs/
│   ├── README.md             # Documentation index
│   ├── AI_USAGE_LOG.md       # AI prompts, iterations, and review table
│   ├── AI_EVIDENCE_CHECKLIST.md # Checklist for submission artifacts
│   ├── REFLECTION.md         # 1-2 page academic reflection report
│   └── DEMO_SCRIPT.md        # 2-4 minute presentation walkthrough script
├── requirements.txt          # Python dependencies (fastapi, uvicorn, pydantic, pytest)
├── run.py                    # Multi-mode unified launcher script
└── README.md                 # Project README
```

---

## 🚀 How to Run (Step-by-Step for Beginners)

### Step 1: Open Terminal in VS Code
Open VS Code, press `Ctrl + \`` (or go to **Terminal -> New Terminal**).

### Step 2: (Optional) Create Virtual Environment
```bash
python -m venv .venv
# On Windows PowerShell:
.venv\Scripts\Activate.ps1
# On macOS / Linux:
source .venv/bin/activate
```

### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Run the Application
Simply run the unified launcher:
```bash
python run.py
```
*The script will automatically detect FastAPI and launch your default web browser at `http://127.0.0.1:8000`!*

### Running Tests
To execute the automated verification test suite:
```bash
python -m pytest tests/
```

---

## 📖 How to Use the Dashboard

### 1. Browsing Activity (Web)
1. Select the **🌐 Browsing** tab on the left panel.
2. Enter a URL (or click a quick preset like `https://example.com`).
3. Click **Visit URL**.
4. Observe the synchronized exchange in the right panel:
   - **Step 1**: DNS Query for A record to resolver (`UDP/53`).
   - **Step 2**: DNS Response mapping hostname to IP address.
   - **Step 3**: HTTP/1.1 `GET / HTTP/1.1` request with `Host` and `Accept` headers.
   - **Step 4**: HTTP/1.1 `200 OK` response with HTML document payload.
   - **Step 5-6**: Secondary resource fetch (`GET /styles.css`) illustrating how browsers fetch linked assets.

### 2. Mail Activity (Electronic Mail)
1. Select the **✉ Mail** tab on the left panel.
2. Fill in recipient email (`student@example.com`), subject, and body (or click a preset).
3. Click **Send Mail**.
4. Observe the RFC 5321 SMTP conversation:
   - **Step 1-2**: DNS Query and Response for Mail Exchanger (`MX`) records.
   - **Step 3**: Server Greeting (`220 mail.example.com ESMTP Postfix Ready`) — *Server speaks first!*
   - **Step 4-5**: Client `EHLO` and Server `250` capabilities extension list.
   - **Step 6-7**: `MAIL FROM:<...>` and Server `250 2.1.0 Sender OK`.
   - **Step 8-9**: `RCPT TO:<...>` and Server `250 2.1.5 Recipient OK`.
   - **Step 10-11**: `DATA` command and Server `354 Start mail input`.
   - **Step 12**: Transmission of email headers + body text + single dot (`.`) termination line.
   - **Step 13**: Server `250 2.0.0 OK: queued as ...`.
   - **Step 14-15**: `QUIT` command and Server `221 2.0.0 Bye`.

### 3. Streaming Activity (HTTP Live Streaming - HLS)
1. Select the **▶ Streaming** tab on the left panel.
2. Choose a stream and select your target quality (`360p`, `480p`, `720p`, `1080p`, or `Auto`).
3. Click **Play Stream**.
4. Observe that streaming is **not** a single file download, but a segmented series of requests:
   - **Step 1-2**: DNS Query and Response for CDN edge node.
   - **Step 3-4**: HTTP GET for Master Multivariant Playlist (`master.m3u8`).
   - **Step 5-6**: HTTP GET for Media Playlist matching chosen resolution (`media_720p.m3u8`).
   - **Step 7-12**: Repeated HTTP GET requests and 200 OK responses for 6-second MPEG-2 Transport Stream chunks (`segment_001.ts`, `segment_002.ts`, etc.) reflecting the selected bitrate!

---

## 🔬 Protocol Accuracy Notes

- **DNS (RFC 1035)**: Resolves hostnames to IP addresses over UDP port 53. Distinguishes between A (IPv4 host) and MX (Mail Exchange) queries. DNS does **not** transport HTTP data.
- **HTTP/1.1 (RFC 7230 / 7231)**: Client-initiated text protocol over TCP. Illustrates persistent connections (`Connection: keep-alive`), mandatory `Host` headers, MIME types, and status lines.
- **SMTP (RFC 5321)**: Push-based message delivery over TCP. Demonstrates strict state-machine ordering where the server initiates the greeting (`220`), followed by `EHLO`, `MAIL FROM`, `RCPT TO`, `DATA`, dot-termination, and `QUIT`.
- **HLS Streaming (RFC 8216)**: Demonstrates modern chunked streaming over HTTP. Manifests index variant bitrates and durations, followed by progressive transport stream downloads.

---

## 🛡️ Simulation Disclaimer
This software is an educational protocol visualizer. All protocol exchanges, headers, and timings are realistically simulated based on official IETF RFC standards. It does not perform packet sniffing or live socket injections, making it 100% safe to demonstrate in any academic environment.
