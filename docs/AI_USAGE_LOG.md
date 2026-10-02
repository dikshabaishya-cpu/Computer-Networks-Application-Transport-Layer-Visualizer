# AI Usage Documentation Log
### Academic Integrity & Iterative Development Tracking

This document provides a transparent, verifiable record of Artificial Intelligence usage during the conception, design, implementation, and testing of the **Application Layer Protocol Visualizer**.

---

## 1. Tool & Model Identification

- **Primary AI Platform**: Antigravity (Google DeepMind Agentic Coding Framework)
- **Primary Reasoning Model**: Gemini 3.8 Flash (High) / Advanced Agentic Assistant
- **Development Date**: September 16–17, 2026
- **Workspace**: Local Windows 11 Environment (`C:\Users\Dikshabaishya\.gemini\antigravity\scratch\network-protocol-visualizer`)

---

## 2. Structured AI Interaction Log

| Date | Phase / Task | Prompt / Objective | What AI Generated | Accepted / Modified / Rejected | Bugs Discovered & Corrections Made |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **2026-09-16** | **Architecture & Planning** | Prompted AI with full assignment specification to establish system architecture, strict two-panel layout, and RFC protocols. | Complete implementation plan covering FastAPI backend, vanilla JS reactive frontend, RFC 1035/7230/5321/8216 data models, and verification strategy. | **Accepted**: Approved plan as single source of truth (`implementation_plan.md`). | None. Plan adhered strictly to the dual-panel requirement. |
| **2026-09-16** | **Backend Modeling** | Generate Pydantic models for protocol steps, important fields, and simulation response payloads. | `backend/models.py` with `ProtocolStep`, `ProtocolField`, and `SimulationResponse`. | **Modified**: Initial code used deprecated Pydantic v1 `Field(..., example=...)`. Updated to Pydantic v2 `json_schema_extra`. | Deprecation warnings in Pydantic v2 resolved by updating schema attributes. |
| **2026-09-16** | **Protocol Simulator** | Implement realistic simulation generators for Browsing (DNS A record + HTTP/1.1), Mail (DNS MX + RFC 5321 SMTP), and Streaming (DNS + HLS playlists + .ts segments). | `backend/simulator.py` containing deterministic IP hashing, RFC 5321 15-step dialog, and HLS manifest generation. | **Accepted**: Verified message ordering (Server greeting 220, EHLO, MAIL FROM, RCPT TO, DATA, dot-termination, QUIT). | When testing in PowerShell terminal, `charmap cp1252` crashed on Unicode arrow `\u2192`. Sanitized terminal log printouts. |
| **2026-09-16** | **Frontend Engine & Playback** | Build reusable protocol playback engine with boundary checking, timeline scrubber, and step cards. | `frontend/playback.js` and `frontend/protocol_data.js`. | **Accepted**: Tested nextStep, prevStep, play, pause, replay, and timer cleanup on activity switch. | Guarded against duplicate `setInterval` instances by clearing active timers before launching new ones. |
| **2026-09-17** | **UI Layout & Styling** | Create presentation-ready CSS with dark slate theme, responsive dual-panel layout, lifelines, and status pills. | `frontend/styles.css` and `frontend/index.html`. | **Accepted**: Strict 38% left / 62% right desktop layout with responsive stacking on tablet/mobile. | Enhanced high-contrast styling for classroom projector visibility. |
| **2026-09-17** | **Automated Testing** | Create Pytest suite testing all boundary conditions, invalid inputs, and protocol sequence orders. | `tests/test_simulator.py` and `tests/test_api.py`. | **Modified**: Added `httpx` dependency required by Starlette `TestClient`. | 15 of 15 tests passing with 100% pass rate. |

---

## 3. Actual Antigravity Prompts & Session Evidence

The following section is reserved for verbatim user prompts executed during this development session:

### Initial Assignment Prompt
```text
You are acting as a senior full-stack engineer, computer networks engineer, UI/UX engineer, and software testing engineer.
I need you to DESIGN, IMPLEMENT, TEST, DEBUG, and POLISH a complete working academic project from the assignment specification below.
PROJECT TITLE: Computer Networks – Application Layer Dual-Panel Activity & Protocol Visualizer
[Full Specification provided in conversation]
```

### Resume & Packaging Prompt
```text
give me the working dashboard in a zip file to extract in vs code and run it on vs code
```

---

## 4. Student Verification Statement

I confirm that the AI tool was used as an interactive pair-programming and design assistant. All technical protocol sequences (DNS, HTTP, SMTP, HLS) were verified against official IETF RFC documents (RFC 1035, RFC 7230, RFC 5321, RFC 8216) and validated through automated testing.

## Assignment 2 — Transport Layer Extension
- Date: 2026-10-02
- AI platform/model: **[fill in exact platform/model actually used]**
- Original prompt: Use the submitted Assignment 2 extension prompt/evidence from the development session.
- Iterations/corrections: **[paste genuine iteration notes]**
- Screenshots/artifacts: **[attach genuine evidence]**
- Final verification: Existing Assignment 1 tests plus TCP arithmetic/API tests were executed; record your own final demo verification here.
