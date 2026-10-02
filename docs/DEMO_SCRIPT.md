# 2–4 Minute Demo Script
1. Open the dashboard and point out the unchanged dual-panel Assignment 1 layout.
2. In **Browsing**, enter a URL and click **Visit URL**. Show DNS/HTTP in **Application Layer**.
3. Switch to **Transport Layer** without changing the activity. Show SYN (Seq 1000), SYN-ACK (Seq 5000, Ack 1001), then ACK (Ack 5001).
4. Step through HTTP GET carried as TCP payload, response segmentation, and the cumulative ACK. Point out Seq + Length arithmetic.
5. Show FIN/ACK teardown and the compact client/server TCP state indicator.
6. Select **Mail**, Send, show SMTP at Application Layer, then switch to Transport Layer and show EHLO/MAIL FROM/RCPT TO/DATA/QUIT carried as TCP payload on one connection.
7. Select **Streaming**, Play, then show HLS at Application Layer and the transport view. Highlight the 3600-byte example split into three 1200-byte TCP segments and cumulative ACK.
8. Demonstrate **Pause, Previous, Next, Replay, 0.5x/1x/2x**, and the timeline scrubber.
9. End by emphasizing that both views are synchronized to the same left-panel activity/session.
