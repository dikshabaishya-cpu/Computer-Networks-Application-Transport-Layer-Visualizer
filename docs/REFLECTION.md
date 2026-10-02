# Assignment 2 Reflection — Application & Transport Layer Visualizer

## AI platform/model used
Fill in the actual platform and model used: **[PLATFORM / MODEL]**. Attach genuine prompt history, screenshots, exports, or agent artifacts in the evidence submission.

## Synchronizing the two layers
Assignment 2 extends the existing Assignment 1 dual-panel dashboard rather than replacing it. The left activity remains the source of the current session. Each Browsing, Mail, or Streaming action creates an Application Layer sequence and a corresponding Transport Layer TCP sequence. The right-panel layer switch changes only which representation is displayed; it does not change the selected activity. Playback is paused and old timers are cleared before changing activity/layer, preventing overlapping animations.

## TCP correctness and manual verification
The transport simulator uses deterministic initial sequence numbers (client 1000, server 5000). SYN and FIN consume one sequence number. Payload advances sequence numbers by its exact byte length, and ACK always represents the next byte expected. Handshake, payload transfer, and four-message FIN/ACK teardown were checked with automated tests.

**Student evidence placeholder:** If AI produced an incorrect sequence/ACK value or TCP state during your actual development, describe it here: **[WHAT AI PRODUCED] → [HOW I CHECKED IT] → [HOW I CORRECTED IT]**. If no such mistake occurred, write that no specific AI arithmetic mistake was observed and describe the verification you performed. Do not invent an error.

## Differences observed
**Browsing** is comparatively short request/response traffic: a TCP connection is established, HTTP request data is sent, response bytes may be segmented, and acknowledgements track received bytes. **Mail** is conversational: many SMTP commands and server replies share one established TCP byte stream before QUIT and teardown. **Streaming** is repetitive and data-heavy: manifest traffic is followed by larger media payloads split across multiple TCP segments; cumulative ACKs show reliable byte delivery.

## What I learned
The key distinction is that HTTP, SMTP, and HLS messages are application data, while TCP provides ordered, reliable transport. TCP flags are not application acknowledgements. Watching the same activity at both layers makes encapsulation, segmentation, byte-oriented sequence numbers, acknowledgements, and connection states easier to relate.
