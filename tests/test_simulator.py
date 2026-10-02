import pytest
from backend.simulator import simulate_browsing, simulate_mail, simulate_streaming

class TestBrowsingSimulation:
    def test_browsing_valid_url(self):
        res = simulate_browsing("https://example.com")
        assert res.activity == "browsing"
        assert res.endpoints == ["Client", "DNS Server", "Web Server"]
        assert len(res.steps) >= 4
        
        # Step 1: DNS Query
        s1 = res.steps[0]
        assert s1.protocol == "DNS"
        assert s1.direction == "client-to-dns"
        assert s1.message_type == "QUERY"
        assert "example.com" in s1.summary

        # Step 2: DNS Response
        s2 = res.steps[1]
        assert s2.protocol == "DNS"
        assert s2.direction == "dns-to-client"
        assert s2.message_type == "RESPONSE"
        assert "93.184.216." in s2.summary

        # Step 3: HTTP GET
        s3 = res.steps[2]
        assert s3.protocol == "HTTP"
        assert s3.direction == "client-to-server"
        assert s3.message_type == "GET"

        # Step 4: HTTP 200 OK
        s4 = res.steps[3]
        assert s4.protocol == "HTTP"
        assert s4.direction == "server-to-client"
        assert s4.message_type == "200 OK"

    def test_browsing_empty_url_raises_error(self):
        with pytest.raises(ValueError):
            simulate_browsing("")

    def test_browsing_url_without_scheme_auto_prefixes(self):
        res = simulate_browsing("networklab.edu/path")
        assert res.activity_metadata["hostname"] == "networklab.edu"

class TestMailSimulation:
    def test_mail_valid_exchange(self):
        res = simulate_mail(
            to_addr="student@example.com",
            from_addr="sender@test.org",
            subject="Lab 1 Test",
            body="Simulating RFC 5321"
        )
        assert res.activity == "mail"
        assert res.endpoints == ["Client", "DNS Server", "Mail Server"]
        assert len(res.steps) == 15

        # Verify exact SMTP command sequence order
        types = [s.message_type for s in res.steps]
        expected_sequence = [
            "QUERY", "RESPONSE", "220 GREETING", "EHLO", "250 CAPABILITIES",
            "MAIL FROM", "250 OK", "RCPT TO", "250 OK", "DATA",
            "354 PROCEED", "MAIL BODY", "250 OK", "QUIT", "221 BYE"
        ]
        assert types == expected_sequence

        # Verify directions
        assert res.steps[2].direction == "server-to-client"  # 220 Server Greeting speaks first
        assert res.steps[3].direction == "client-to-server"  # EHLO
        assert res.steps[5].direction == "client-to-server"  # MAIL FROM
        assert res.steps[7].direction == "client-to-server"  # RCPT TO
        assert res.steps[9].direction == "client-to-server"  # DATA
        assert res.steps[10].direction == "server-to-client" # 354 Start mail input
        assert res.steps[11].direction == "client-to-server" # Mail Body + '.'
        assert res.steps[13].direction == "client-to-server" # QUIT
        assert res.steps[14].direction == "server-to-client" # 221 Bye

    def test_mail_empty_to_raises_error(self):
        with pytest.raises(ValueError):
            simulate_mail(to_addr="")

    def test_mail_invalid_email_format_raises_error(self):
        with pytest.raises(ValueError):
            simulate_mail(to_addr="invalid-email-address")

class TestStreamingSimulation:
    def test_streaming_hls_structure(self):
        res = simulate_streaming("https://video.networklab.org/live/lecture.m3u8", quality="720p")
        assert res.activity == "streaming"
        assert res.endpoints == ["Client", "DNS Server", "Media Server"]
        assert len(res.steps) == 12

        # Step 1-2: DNS Query/Response
        assert res.steps[0].message_type == "QUERY"
        assert res.steps[1].message_type == "RESPONSE"

        # Step 3-4: Master Playlist
        assert res.steps[2].summary == "HTTP GET /master.m3u8 (HLS Master Playlist)"
        assert "EXT-X-STREAM-INF" in res.steps[3].raw_message

        # Step 5-6: Media Playlist for 720p
        assert "720p" in res.steps[4].summary
        assert "EXT-X-TARGETDURATION" in res.steps[5].raw_message

        # Step 7+: Sequential Segments
        seg1_req = res.steps[6]
        assert seg1_req.message_type == "GET"
        assert "segment_001_720p.ts" in seg1_req.raw_message

        seg1_resp = res.steps[7]
        assert seg1_resp.message_type == "200 OK"
        assert "video/mp2t" in seg1_resp.raw_message

    def test_streaming_quality_changes_metadata(self):
        res_360 = simulate_streaming(quality="360p")
        res_1080 = simulate_streaming(quality="1080p")
        assert res_360.activity_metadata["bitrate"] == "800 Kbps"
        assert res_1080.activity_metadata["bitrate"] == "5.0 Mbps"
        assert "360p" in res_360.steps[6].raw_message
        assert "1080p" in res_1080.steps[6].raw_message
