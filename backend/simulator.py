"""
Protocol simulation engine for Computer Networks Application Layer Visualizer.
Provides realistic, RFC-compliant protocol exchanges.
"""
import re
import hashlib
from datetime import datetime, timezone
from urllib.parse import urlparse
from typing import Dict, Any, List
from .models import ProtocolStep, ProtocolField, SimulationResponse

def _hash_ip(domain: str, prefix: str = "93.184.216.") -> str:
    h = int(hashlib.md5(domain.encode()).hexdigest()[:4], 16)
    last_octet = (h % 200) + 10
    return f"{prefix}{last_octet}"

def simulate_browsing(url: str) -> SimulationResponse:
    clean_url = (url or "").strip()
    if not clean_url:
        raise ValueError("URL cannot be empty.")
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url
    parsed = urlparse(clean_url)
    hostname = parsed.hostname or "example.com"
    path = parsed.path if parsed.path else "/"
    port = parsed.port or (443 if parsed.scheme == "https" else 80)
    resolved_ip = _hash_ip(hostname, "93.184.216.")
    dns_server_ip = "8.8.8.8"
    now_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S GMT")

    steps: List[ProtocolStep] = [
        ProtocolStep(
            id="browse-step-1",
            step_number=1,
            protocol="DNS",
            stage="dns",
            from_endpoint="Client",
            to_endpoint="DNS Server",
            direction="client-to-dns",
            message_type="QUERY",
            summary=f"Standard DNS Query: A record for {hostname}",
            raw_message=(
                f"Domain Name System (query)\n"
                f"Transaction ID: 0x2a7b\n"
                f"Flags: 0x0100 Standard query (RD=1)\n"
                f"Questions: 1\n"
                f"  Name: {hostname}\n"
                f"  Type: A (Host Address) (1)\n"
                f"  Class: IN (Internet) (1)\n"
                f"Transport: UDP Port 53"
            ),
            explanation=(
                f"The client needs to convert the domain name '{hostname}' into a routable IPv4 address. "
                f"It issues an RFC 1035 UDP query to the DNS resolver ({dns_server_ip}:53) with Recursion Desired (RD=1)."
            ),
            important_fields=[
                ProtocolField(name="Protocol", value="DNS over UDP/53", highlight=True),
                ProtocolField(name="Question Name", value=hostname, highlight=True),
                ProtocolField(name="Record Type", value="A (IPv4)", highlight=True),
                ProtocolField(name="Recursion Desired", value="True (RD=1)"),
            ],
            metadata={"hostname": hostname, "dns_ip": dns_server_ip}
        ),
        ProtocolStep(
            id="browse-step-2",
            step_number=2,
            protocol="DNS",
            stage="dns",
            from_endpoint="DNS Server",
            to_endpoint="Client",
            direction="dns-to-client",
            message_type="RESPONSE",
            summary=f"DNS Response: {hostname} -> {resolved_ip}",
            raw_message=(
                f"Domain Name System (response)\n"
                f"Transaction ID: 0x2a7b\n"
                f"Flags: 0x8180 Standard query response, No error (QR=1, RD=1, RA=1)\n"
                f"Questions: 1 ({hostname}: type A, class IN)\n"
                f"Answers: 1\n"
                f"  {hostname}: type A, class IN, TTL 300, addr {resolved_ip}"
            ),
            explanation=(
                f"The DNS server resolves the query and returns an authoritative A record with IPv4 address "
                f"{resolved_ip} (TTL 300s). The client caches this and can now initiate a TCP connection to {resolved_ip}:{port}."
            ),
            important_fields=[
                ProtocolField(name="Response Status", value="NOERROR (0)", highlight=True),
                ProtocolField(name="Resolved IP", value=resolved_ip, highlight=True),
                ProtocolField(name="TTL", value="300 seconds"),
            ],
            metadata={"hostname": hostname, "resolved_ip": resolved_ip}
        ),
        ProtocolStep(
            id="browse-step-3",
            step_number=3,
            protocol="HTTP",
            stage="http",
            from_endpoint="Client",
            to_endpoint="Web Server",
            direction="client-to-server",
            message_type="GET",
            summary=f"HTTP/1.1 GET {path}",
            raw_message=(
                f"GET {path} HTTP/1.1\r\n"
                f"Host: {hostname}\r\n"
                f"User-Agent: AcademicProtocolVisualizer/2.0\r\n"
                f"Accept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\n"
                f"Accept-Language: en-US,en;q=0.9\r\n"
                f"Connection: keep-alive\r\n\r\n"
            ),
            explanation=(
                f"With the destination IP known ({resolved_ip}), the client sends an HTTP/1.1 GET request. "
                f"The 'Host: {hostname}' header identifies the virtual host on the server (RFC 7230)."
            ),
            important_fields=[
                ProtocolField(name="Method", value="GET", highlight=True),
                ProtocolField(name="Path", value=path, highlight=True),
                ProtocolField(name="Host", value=hostname, highlight=True),
                ProtocolField(name="Version", value="HTTP/1.1"),
            ],
            metadata={"method": "GET", "path": path, "host": hostname}
        ),
        ProtocolStep(
            id="browse-step-4",
            step_number=4,
            protocol="HTTP",
            stage="http",
            from_endpoint="Web Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="200 OK",
            summary="HTTP/1.1 200 OK (HTML Document)",
            raw_message=(
                f"HTTP/1.1 200 OK\r\n"
                f"Date: {now_str}\r\n"
                f"Server: Apache/2.4.52 (Ubuntu)\r\n"
                f"Content-Type: text/html; charset=UTF-8\r\n"
                f"Content-Length: 482\r\n"
                f"Connection: keep-alive\r\n\r\n"
                f"<!DOCTYPE html>\n"
                f"<html><head><title>{hostname}</title></head>\n"
                f"<body><h1>Welcome to {hostname}</h1><p>Application Layer Protocol visualizer demo.</p></body></html>"
            ),
            explanation=(
                f"The web server responds with '200 OK', indicating successful retrieval of the HTML document."
            ),
            important_fields=[
                ProtocolField(name="Status Code", value="200 OK", highlight=True),
                ProtocolField(name="Content-Type", value="text/html; charset=UTF-8", highlight=True),
                ProtocolField(name="Content-Length", value="482 bytes"),
            ],
            metadata={"status_code": 200}
        ),
        ProtocolStep(
            id="browse-step-5",
            step_number=5,
            protocol="HTTP",
            stage="http",
            from_endpoint="Client",
            to_endpoint="Web Server",
            direction="client-to-server",
            message_type="GET",
            summary="HTTP/1.1 GET /styles.css (Secondary Resource)",
            raw_message=(
                f"GET /styles.css HTTP/1.1\r\n"
                f"Host: {hostname}\r\n"
                f"Accept: text/css,*/*;q=0.1\r\n"
                f"Referer: {clean_url}\r\n"
                f"Connection: keep-alive\r\n\r\n"
            ),
            explanation=(
                f"Modern web browsing involves secondary asset fetches. The browser requests the linked stylesheet "
                f"over the persistent HTTP/1.1 connection."
            ),
            important_fields=[
                ProtocolField(name="Method", value="GET", highlight=True),
                ProtocolField(name="Path", value="/styles.css", highlight=True),
            ]
        ),
        ProtocolStep(
            id="browse-step-6",
            step_number=6,
            protocol="HTTP",
            stage="http",
            from_endpoint="Web Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="200 OK",
            summary="HTTP/1.1 200 OK (CSS Stylesheet)",
            raw_message=(
                f"HTTP/1.1 200 OK\r\n"
                f"Date: {now_str}\r\n"
                f"Server: Apache/2.4.52 (Ubuntu)\r\n"
                f"Content-Type: text/css; charset=UTF-8\r\n"
                f"Content-Length: 184\r\n"
                f"Cache-Control: public, max-age=86400\r\n\r\n"
                f"body {{ font-family: sans-serif; margin: 2rem; color: #1e293b; }}\n"
                f"h1 {{ color: #2563eb; }}"
            ),
            explanation=(
                f"The server returns the CSS stylesheet. The client can now build the render tree and display the page."
            ),
            important_fields=[
                ProtocolField(name="Status Code", value="200 OK", highlight=True),
                ProtocolField(name="Content-Type", value="text/css; charset=UTF-8", highlight=True),
            ]
        )
    ]

    return SimulationResponse(
        activity="browsing",
        protocol_title="Browsing: DNS → HTTP/1.1",
        description="Resolution of host via DNS query/response, followed by HTTP/1.1 resource fetching.",
        endpoints=["Client", "DNS Server", "Web Server"],
        steps=steps,
        total_steps=len(steps),
        status="READY",
        activity_metadata={"url": clean_url, "hostname": hostname, "ip": resolved_ip}
    )

def simulate_mail(to_addr: str, from_addr: str = "student@example.com", subject: str = "Computer Networks Demo", body: str = "Testing SMTP protocol visualization.") -> SimulationResponse:
    clean_to = (to_addr or "").strip()
    if not clean_to:
        raise ValueError("Recipient 'To' address cannot be empty.")
    if "@" not in clean_to or "." not in clean_to.split("@")[-1]:
        raise ValueError(f"Invalid email address format: '{clean_to}'. Expected format: user@domain.com")
    
    clean_from = (from_addr or "student@example.com").strip()
    domain = clean_to.split("@")[-1]
    mail_server_host = f"mail.{domain}"
    mail_server_ip = _hash_ip(mail_server_host, "198.51.100.")
    client_fqdn = "client.networklab.edu"
    now_str = datetime.now(timezone.utc).strftime("%a, %d %b %Y %H:%M:%S +0000")
    queue_id = "4V9dZ81L9zZk3b"

    steps: List[ProtocolStep] = [
        ProtocolStep(
            id="mail-step-1",
            step_number=1,
            protocol="DNS",
            stage="dns",
            from_endpoint="Client",
            to_endpoint="DNS Server",
            direction="client-to-dns",
            message_type="QUERY",
            summary=f"DNS MX Query for {domain}",
            raw_message=(
                f"Domain Name System (query)\n"
                f"Transaction ID: 0x8a1c\n"
                f"Questions: 1\n"
                f"  Name: {domain}\n"
                f"  Type: MX (Mail Exchange) (15)\n"
                f"  Class: IN (1)"
            ),
            explanation=(
                f"Before initiating an SMTP conversation, the client looks up the Mail Exchanger (MX) records for "
                f"'{domain}' to find the authoritative mail host."
            ),
            important_fields=[
                ProtocolField(name="Record Type", value="MX (Mail Exchange)", highlight=True),
                ProtocolField(name="Domain", value=domain, highlight=True),
            ],
            metadata={"domain": domain}
        ),
        ProtocolStep(
            id="mail-step-2",
            step_number=2,
            protocol="DNS",
            stage="dns",
            from_endpoint="DNS Server",
            to_endpoint="Client",
            direction="dns-to-client",
            message_type="RESPONSE",
            summary=f"DNS MX Response: {mail_server_host} (pref 10)",
            raw_message=(
                f"Domain Name System (response)\n"
                f"Transaction ID: 0x8a1c\n"
                f"Answers: 1\n"
                f"  {domain}: type MX, class IN, preference 10, exchange {mail_server_host}\n"
                f"Additional Records: 1\n"
                f"  {mail_server_host}: type A, class IN, addr {mail_server_ip}"
            ),
            explanation=(
                f"The DNS server returns the MX record pointing to '{mail_server_host}' with priority 10, along "
                f"with the glue A record ({mail_server_ip}). The client connects over TCP on port 25."
            ),
            important_fields=[
                ProtocolField(name="Mail Exchanger", value=mail_server_host, highlight=True),
                ProtocolField(name="Preference", value="10"),
                ProtocolField(name="Glue IP", value=mail_server_ip, highlight=True),
            ],
            metadata={"mx_host": mail_server_host, "mx_ip": mail_server_ip}
        ),
        ProtocolStep(
            id="mail-step-3",
            step_number=3,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="220 GREETING",
            summary=f"S: 220 {mail_server_host} ESMTP Postfix Ready",
            raw_message=f"220 {mail_server_host} ESMTP Postfix (Academic Simulator Ready)",
            explanation=(
                f"In SMTP (RFC 5321 Section 3.1), the SERVER ALWAYS speaks first once the TCP connection is established. "
                f"Reply code 220 announces service readiness."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="220", highlight=True),
                ProtocolField(name="Server Host", value=mail_server_host),
                ProtocolField(name="Service", value="ESMTP"),
            ]
        ),
        ProtocolStep(
            id="mail-step-4",
            step_number=4,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="EHLO",
            summary=f"C: EHLO {client_fqdn}",
            raw_message=f"EHLO {client_fqdn}",
            explanation=(
                f"The client greets the server with 'EHLO' (Extended HELO), declaring its Fully Qualified Domain Name."
            ),
            important_fields=[
                ProtocolField(name="Command", value="EHLO", highlight=True),
                ProtocolField(name="Client FQDN", value=client_fqdn, highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-5",
            step_number=5,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="250 CAPABILITIES",
            summary="S: 250 (ESMTP Extension Capabilities)",
            raw_message=(
                f"250-{mail_server_host} greets {client_fqdn}\r\n"
                f"250-PIPELINING\r\n"
                f"250-SIZE 35882577\r\n"
                f"250-8BITMIME\r\n"
                f"250-ENHANCEDSTATUSCODES\r\n"
                f"250-SMTPUTF8\r\n"
                f"250 OK"
            ),
            explanation=(
                f"The server returns a multi-line 250 response advertising supported extensions (PIPELINING, SIZE, 8BITMIME)."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="250", highlight=True),
                ProtocolField(name="Extensions", value="PIPELINING, SIZE, 8BITMIME, SMTPUTF8"),
            ]
        ),
        ProtocolStep(
            id="mail-step-6",
            step_number=6,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="MAIL FROM",
            summary=f"C: MAIL FROM:<{clean_from}>",
            raw_message=f"MAIL FROM:<{clean_from}> BODY=8BITMIME",
            explanation=(
                f"The client initiates the mail envelope by declaring the sender reverse-path mailbox."
            ),
            important_fields=[
                ProtocolField(name="Command", value="MAIL FROM", highlight=True),
                ProtocolField(name="Reverse-Path", value=f"<{clean_from}>", highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-7",
            step_number=7,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="250 OK",
            summary=f"S: 250 2.1.0 Sender <{clean_from}> OK",
            raw_message=f"250 2.1.0 Sender <{clean_from}> OK",
            explanation=(
                f"The server validates and accepts the sender address (Code 250 2.1.0)."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="250", highlight=True),
                ProtocolField(name="Status", value="2.1.0 Sender OK"),
            ]
        ),
        ProtocolStep(
            id="mail-step-8",
            step_number=8,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="RCPT TO",
            summary=f"C: RCPT TO:<{clean_to}>",
            raw_message=f"RCPT TO:<{clean_to}>",
            explanation=(
                f"The client specifies the recipient forward-path mailbox."
            ),
            important_fields=[
                ProtocolField(name="Command", value="RCPT TO", highlight=True),
                ProtocolField(name="Forward-Path", value=f"<{clean_to}>", highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-9",
            step_number=9,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="250 OK",
            summary=f"S: 250 2.1.5 Recipient <{clean_to}> OK",
            raw_message=f"250 2.1.5 Recipient <{clean_to}> OK",
            explanation=(
                f"The server verifies that the destination mailbox exists and can be delivered."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="250", highlight=True),
                ProtocolField(name="Status", value="2.1.5 Recipient OK"),
            ]
        ),
        ProtocolStep(
            id="mail-step-10",
            step_number=10,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="DATA",
            summary="C: DATA",
            raw_message="DATA",
            explanation=(
                f"The client asks permission to stream the email content (headers and body)."
            ),
            important_fields=[
                ProtocolField(name="Command", value="DATA", highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-11",
            step_number=11,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="354 PROCEED",
            summary="S: 354 Start mail input; end with <CRLF>.<CRLF>",
            raw_message="354 Start mail input; end with <CRLF>.<CRLF>",
            explanation=(
                f"Code 354 is an intermediate response instructing the client to send message lines until "
                f"a line with a single period is sent."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="354", highlight=True),
                ProtocolField(name="End Marker", value="<CRLF>.<CRLF>"),
            ]
        ),
        ProtocolStep(
            id="mail-step-12",
            step_number=12,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="MAIL BODY",
            summary="C: [Message Headers & Body] + '.'",
            raw_message=(
                f"From: Sender <{clean_from}>\r\n"
                f"To: Recipient <{clean_to}>\r\n"
                f"Subject: {subject}\r\n"
                f"Date: {now_str}\r\n"
                f"Message-ID: <sim-{hashlib.md5(now_str.encode()).hexdigest()[:8]}@{client_fqdn}>\r\n"
                f"Content-Type: text/plain; charset=UTF-8\r\n\r\n"
                f"{body}\r\n"
                f"."
            ),
            explanation=(
                f"The client transmits RFC 5322 formatted email headers, a blank separator line, the message text, "
                f"and terminates with a single dot on its own line."
            ),
            important_fields=[
                ProtocolField(name="Subject", value=subject, highlight=True),
                ProtocolField(name="Date", value=now_str),
                ProtocolField(name="End of Data", value="'.' (period on single line)", highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-13",
            step_number=13,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="250 OK",
            summary=f"S: 250 2.0.0 OK: queued as {queue_id}",
            raw_message=f"250 2.0.0 OK: queued as {queue_id}",
            explanation=(
                f"The server commits the message to disk storage and returns the queue identifier."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="250", highlight=True),
                ProtocolField(name="Queue ID", value=queue_id, highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-14",
            step_number=14,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Client",
            to_endpoint="Mail Server",
            direction="client-to-server",
            message_type="QUIT",
            summary="C: QUIT",
            raw_message="QUIT",
            explanation=(
                f"The client terminates the SMTP session gracefully."
            ),
            important_fields=[
                ProtocolField(name="Command", value="QUIT", highlight=True),
            ]
        ),
        ProtocolStep(
            id="mail-step-15",
            step_number=15,
            protocol="SMTP",
            stage="smtp",
            from_endpoint="Mail Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="221 BYE",
            summary=f"S: 221 2.0.0 {mail_server_host} closing connection",
            raw_message=f"221 2.0.0 {mail_server_host} Service closing transmission channel",
            explanation=(
                f"The server acknowledges the QUIT command with status 221 and closes the channel."
            ),
            important_fields=[
                ProtocolField(name="Reply Code", value="221", highlight=True),
                ProtocolField(name="Status", value="Connection closing"),
            ]
        ),
    ]

    return SimulationResponse(
        activity="mail",
        protocol_title="Mail: DNS (MX) → SMTP (RFC 5321)",
        description="DNS resolution of Mail Exchanger (MX), followed by complete SMTP client-server dialog.",
        endpoints=["Client", "DNS Server", "Mail Server"],
        steps=steps,
        total_steps=len(steps),
        status="READY",
        activity_metadata={"to": clean_to, "from": clean_from, "subject": subject, "mx_host": mail_server_host}
    )

def simulate_streaming(stream_url: str = "https://video.networklab.org/live/lecture.m3u8", quality: str = "720p") -> SimulationResponse:
    clean_url = (stream_url or "https://video.networklab.org/live/lecture.m3u8").strip()
    if not clean_url.startswith(("http://", "https://")):
        clean_url = "https://" + clean_url
    
    parsed = urlparse(clean_url)
    cdn_host = parsed.hostname or "video.networklab.org"
    resolved_ip = _hash_ip(cdn_host, "104.26.12.")
    
    quality_profiles: Dict[str, Dict[str, Any]] = {
        "360p": {"bandwidth": 800000, "res": "640x360", "rate_str": "800 Kbps", "seg_bytes": 600000},
        "480p": {"bandwidth": 1400000, "res": "854x480", "rate_str": "1.4 Mbps", "seg_bytes": 1050000},
        "720p": {"bandwidth": 2500000, "res": "1280x720", "rate_str": "2.5 Mbps", "seg_bytes": 1875000},
        "1080p": {"bandwidth": 5000000, "res": "1920x1080", "rate_str": "5.0 Mbps", "seg_bytes": 3750000},
        "Auto": {"bandwidth": 2500000, "res": "1280x720 (Auto-adapted)", "rate_str": "2.5 Mbps (Adaptive)", "seg_bytes": 1875000},
    }
    
    selected_quality = quality if quality in quality_profiles else "720p"
    profile = quality_profiles[selected_quality]
    quality_label = selected_quality.lower().replace(" ", "")
    media_playlist_path = f"/media_{quality_label}.m3u8"
    
    steps: List[ProtocolStep] = [
        ProtocolStep(
            id="stream-step-1",
            step_number=1,
            protocol="DNS",
            stage="dns",
            from_endpoint="Client",
            to_endpoint="DNS Server",
            direction="client-to-dns",
            message_type="QUERY",
            summary=f"DNS Query: A record for CDN {cdn_host}",
            raw_message=(
                f"Domain Name System (query)\n"
                f"Transaction ID: 0x4f12\n"
                f"Questions: 1\n"
                f"  Name: {cdn_host}\n"
                f"  Type: A (Host Address) (1)\n"
                f"  Class: IN (1)"
            ),
            explanation=(
                f"The media player resolves the video CDN hostname '{cdn_host}' to an edge server IP address."
            ),
            important_fields=[
                ProtocolField(name="Query Name", value=cdn_host, highlight=True),
                ProtocolField(name="Type", value="A (IPv4)"),
            ]
        ),
        ProtocolStep(
            id="stream-step-2",
            step_number=2,
            protocol="DNS",
            stage="dns",
            from_endpoint="DNS Server",
            to_endpoint="Client",
            direction="dns-to-client",
            message_type="RESPONSE",
            summary=f"DNS Response: {cdn_host} -> {resolved_ip}",
            raw_message=(
                f"Domain Name System (response)\n"
                f"Transaction ID: 0x4f12\n"
                f"Answers: 1\n"
                f"  {cdn_host}: type A, class IN, TTL 120, addr {resolved_ip}"
            ),
            explanation=(
                f"The nearest CDN edge node IP ({resolved_ip}) is returned. Low TTL ensures dynamic CDN load balancing."
            ),
            important_fields=[
                ProtocolField(name="Edge IP", value=resolved_ip, highlight=True),
                ProtocolField(name="TTL", value="120 seconds"),
            ]
        ),
        ProtocolStep(
            id="stream-step-3",
            step_number=3,
            protocol="HTTP",
            stage="manifest",
            from_endpoint="Client",
            to_endpoint="Media Server",
            direction="client-to-server",
            message_type="GET",
            summary="HTTP GET /master.m3u8 (HLS Master Playlist)",
            raw_message=(
                f"GET /master.m3u8 HTTP/1.1\r\n"
                f"Host: {cdn_host}\r\n"
                f"User-Agent: HLSVideoPlayer/3.2 (Academic Simulator)\r\n"
                f"Accept: application/vnd.apple.mpegurl,application/x-mpegurl,*/*\r\n"
                f"Connection: keep-alive\r\n\r\n"
            ),
            explanation=(
                f"In HTTP Live Streaming (HLS - RFC 8216), the client first requests the Master Playlist. "
                f"The master playlist indexes all available bitrates and resolutions."
            ),
            important_fields=[
                ProtocolField(name="Method", value="GET", highlight=True),
                ProtocolField(name="Resource", value="/master.m3u8", highlight=True),
                ProtocolField(name="Accept", value="application/vnd.apple.mpegurl"),
            ]
        ),
        ProtocolStep(
            id="stream-step-4",
            step_number=4,
            protocol="HTTP",
            stage="manifest",
            from_endpoint="Media Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="200 OK",
            summary="HTTP 200 OK: Master Playlist with Variant Streams",
            raw_message=(
                f"HTTP/1.1 200 OK\r\n"
                f"Content-Type: application/vnd.apple.mpegurl\r\n"
                f"Content-Length: 395\r\n"
                f"Access-Control-Allow-Origin: *\r\n"
                f"Connection: keep-alive\r\n\r\n"
                f"#EXTM3U\n"
                f"#EXT-X-VERSION:3\n"
                f"#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\n"
                f"media_360p.m3u8\n"
                f"#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480\n"
                f"media_480p.m3u8\n"
                f"#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\n"
                f"media_720p.m3u8\n"
                f"#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\n"
                f"media_1080p.m3u8"
            ),
            explanation=(
                f"The server returns the multivariant playlist. The client player inspects network throughput "
                f"and selects the optimal representation (selected: {selected_quality} @ {profile['rate_str']})."
            ),
            important_fields=[
                ProtocolField(name="Content-Type", value="application/vnd.apple.mpegurl", highlight=True),
                ProtocolField(name="Variant Streams", value="360p, 480p, 720p, 1080p", highlight=True),
                ProtocolField(name="Selected Stream", value=f"{selected_quality} ({profile['res']})", highlight=True),
            ]
        ),
        ProtocolStep(
            id="stream-step-5",
            step_number=5,
            protocol="HTTP",
            stage="manifest",
            from_endpoint="Client",
            to_endpoint="Media Server",
            direction="client-to-server",
            message_type="GET",
            summary=f"HTTP GET {media_playlist_path} ({selected_quality} Media Playlist)",
            raw_message=(
                f"GET {media_playlist_path} HTTP/1.1\r\n"
                f"Host: {cdn_host}\r\n"
                f"Accept: application/vnd.apple.mpegurl\r\n"
                f"Connection: keep-alive\r\n\r\n"
            ),
            explanation=(
                f"The player requests the specific Media Playlist for '{selected_quality}'. This playlist indexes the "
                f"actual transport stream chunks (.ts) with exact durations."
            ),
            important_fields=[
                ProtocolField(name="Target Playlist", value=media_playlist_path, highlight=True),
                ProtocolField(name="Bitrate Selected", value=profile["rate_str"], highlight=True),
            ]
        ),
        ProtocolStep(
            id="stream-step-6",
            step_number=6,
            protocol="HTTP",
            stage="manifest",
            from_endpoint="Media Server",
            to_endpoint="Client",
            direction="server-to-client",
            message_type="200 OK",
            summary=f"HTTP 200 OK: Media Playlist ({selected_quality} Segment Index)",
            raw_message=(
                f"HTTP/1.1 200 OK\r\n"
                f"Content-Type: application/vnd.apple.mpegurl\r\n"
                f"Content-Length: 320\r\n"
                f"Connection: keep-alive\r\n\r\n"
                f"#EXTM3U\n"
                f"#EXT-X-VERSION:3\n"
                f"#EXT-X-TARGETDURATION:6\n"
                f"#EXT-X-MEDIA-SEQUENCE:1\n"
                f"#EXTINF:6.000000,\n"
                f"segment_001_{quality_label}.ts\n"
                f"#EXTINF:6.000000,\n"
                f"segment_002_{quality_label}.ts\n"
                f"#EXTINF:6.000000,\n"
                f"segment_003_{quality_label}.ts"
            ),
            explanation=(
                f"The server returns the segment index. Notice: streaming is NOT one massive download, but repeated "
                f"HTTP requests for small segmented video slices (#EXTINF:6.000 specifies each slice duration is 6.0s)."
            ),
            important_fields=[
                ProtocolField(name="Target Duration", value="6.0 seconds", highlight=True),
                ProtocolField(name="Segments Listed", value=f"segment_001..003 ({quality_label})", highlight=True),
            ]
        )
    ]

    for seg_idx in range(1, 4):
        seg_name = f"segment_{seg_idx:03d}_{quality_label}.ts"
        seg_path = f"/segments/{seg_name}"
        seg_bytes = profile["seg_bytes"]
        
        steps.append(
            ProtocolStep(
                id=f"stream-step-seg-{seg_idx}-req",
                step_number=len(steps) + 1,
                protocol="HTTP",
                stage="segment",
                from_endpoint="Client",
                to_endpoint="Media Server",
                direction="client-to-server",
                message_type="GET",
                summary=f"HTTP GET {seg_path} [Chunk #{seg_idx}]",
                raw_message=(
                    f"GET {seg_path} HTTP/1.1\r\n"
                    f"Host: {cdn_host}\r\n"
                    f"Accept: video/mp2t,*/*\r\n"
                    f"Range: bytes=0-{seg_bytes - 1}\r\n"
                    f"Connection: keep-alive\r\n\r\n"
                ),
                explanation=(
                    f"The client buffer needs continuous media data. The video decoder requests Segment #{seg_idx} "
                    f"({seg_name}) over HTTP/1.1 using persistent connection keep-alive."
                ),
                important_fields=[
                    ProtocolField(name="Segment File", value=seg_name, highlight=True),
                    ProtocolField(name="Chunk Index", value=f"#{seg_idx}"),
                    ProtocolField(name="Expected Size", value=f"~{seg_bytes // 1024} KB"),
                ],
                metadata={"segment_index": seg_idx, "segment_name": seg_name}
            )
        )
        
        steps.append(
            ProtocolStep(
                id=f"stream-step-seg-{seg_idx}-resp",
                step_number=len(steps) + 1,
                protocol="HTTP",
                stage="segment",
                from_endpoint="Media Server",
                to_endpoint="Client",
                direction="server-to-client",
                message_type="200 OK",
                summary=f"HTTP 200 OK: {seg_name} ({seg_bytes // 1024} KB Video Chunk)",
                raw_message=(
                    f"HTTP/1.1 200 OK\r\n"
                    f"Content-Type: video/mp2t\r\n"
                    f"Content-Length: {seg_bytes}\r\n"
                    f"Cache-Control: max-age=3600\r\n"
                    f"Connection: keep-alive\r\n\r\n"
                    f"[Binary MPEG-2 Transport Stream Payload: {seg_bytes} bytes of H.264/AAC data]"
                ),
                explanation=(
                    f"The CDN server streams the 6-second MPEG-2 Transport Stream binary chunk into the video decoder buffer."
                ),
                important_fields=[
                    ProtocolField(name="Status Code", value="200 OK", highlight=True),
                    ProtocolField(name="MIME Type", value="video/mp2t", highlight=True),
                    ProtocolField(name="Chunk Payload", value=f"{seg_bytes} bytes (~{seg_bytes // 1024} KB)", highlight=True),
                    ProtocolField(name="Playback Duration", value="6.0 seconds"),
                ],
                metadata={"segment_index": seg_idx, "quality": selected_quality, "bytes": seg_bytes}
            )
        )

    return SimulationResponse(
        activity="streaming",
        protocol_title=f"Streaming: DNS → HLS Manifest & Segments ({selected_quality})",
        description="Progressive HTTP Live Streaming: DNS query, multivariant playlist, media playlist, and chunked .ts segments.",
        endpoints=["Client", "DNS Server", "Media Server"],
        steps=steps,
        total_steps=len(steps),
        status="READY",
        activity_metadata={
            "stream_url": clean_url,
            "quality": selected_quality,
            "bitrate": profile["rate_str"],
            "resolution": profile["res"],
            "cdn_host": cdn_host
        }
    )
