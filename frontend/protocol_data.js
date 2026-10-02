/**
 * Protocol Data & Client-Side Sequence Generator
 * Computer Networks - Application Layer Visualizer
 *
 * Provides RFC-faithful message structures for DNS, HTTP, SMTP, and HLS Streaming.
 * Acts as an offline/instant fallback generator if the backend is unreachable.
 */

function hashIp(str, prefix = "93.184.216.") {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash |= 0;
  }
  const last = Math.abs(hash % 200) + 10;
  return `${prefix}${last}`;
}

function parseUrl(urlStr) {
  let u = (urlStr || "").trim();
  if (!u) throw new Error("URL cannot be empty.");
  if (!u.startsWith("http://") && !u.startsWith("https://")) {
    u = "https://" + u;
  }
  try {
    const parsed = new URL(u);
    return {
      href: parsed.href,
      hostname: parsed.hostname || "example.com",
      pathname: parsed.pathname || "/",
      protocol: parsed.protocol,
      port: parsed.port || (parsed.protocol === "https:" ? "443" : "80")
    };
  } catch (e) {
    return {
      href: u,
      hostname: "example.com",
      pathname: "/",
      protocol: "https:",
      port: "443"
    };
  }
}

function generateBrowsingSequence(urlInput) {
  const parsed = parseUrl(urlInput);
  const hostname = parsed.hostname;
  const path = parsed.pathname;
  const resolvedIp = hashIp(hostname, "93.184.216.");
  const dnsServerIp = "8.8.8.8";
  const nowStr = new Date().toUTCString();

  return {
    activity: "browsing",
    protocolTitle: "Browsing: DNS → HTTP/1.1",
    description: "Domain resolution via DNS query/response, followed by HTTP/1.1 resource fetching.",
    endpoints: ["Client", "DNS Server", "Web Server"],
    steps: [
      {
        id: "browse-step-1",
        stepNumber: 1,
        protocol: "DNS",
        stage: "dns",
        fromEndpoint: "Client",
        toEndpoint: "DNS Server",
        direction: "client-to-dns",
        messageType: "QUERY",
        summary: `Standard DNS Query: A record for ${hostname}`,
        rawMessage: `Domain Name System (query)\nTransaction ID: 0x2a7b\nFlags: 0x0100 Standard query (RD=1)\nQuestions: 1\n  Name: ${hostname}\n  Type: A (Host Address) (1)\n  Class: IN (Internet) (1)\nTransport: UDP Port 53`,
        explanation: `The client needs to convert the human-readable domain name '${hostname}' into a machine-routable IPv4 address. It issues an RFC 1035 UDP query to the configured DNS resolver (${dnsServerIp}:53) with the Recursion Desired (RD) bit set.`,
        importantFields: [
          { name: "Protocol", value: "DNS over UDP/53", highlight: true },
          { name: "Question Name", value: hostname, highlight: true },
          { name: "Record Type", value: "A (IPv4)", highlight: true },
          { name: "Recursion Desired", value: "True (RD=1)" }
        ]
      },
      {
        id: "browse-step-2",
        stepNumber: 2,
        protocol: "DNS",
        stage: "dns",
        fromEndpoint: "DNS Server",
        toEndpoint: "Client",
        direction: "dns-to-client",
        messageType: "RESPONSE",
        summary: `DNS Response: ${hostname} → ${resolvedIp}`,
        rawMessage: `Domain Name System (response)\nTransaction ID: 0x2a7b\nFlags: 0x8180 Standard query response, No error (QR=1, RD=1, RA=1)\nQuestions: 1 (${hostname}: type A, class IN)\nAnswers: 1\n  ${hostname}: type A, class IN, TTL 300, addr ${resolvedIp}\nAuthoritative nameservers: 0\nAdditional records: 0`,
        explanation: `The DNS server resolves the query and returns an authoritative A record with the IPv4 address ${resolvedIp} and a Time-To-Live (TTL) of 300 seconds. The client caches this mapping and can now open a TCP connection to ${resolvedIp}.`,
        importantFields: [
          { name: "Response Status", value: "NOERROR (0)", highlight: true },
          { name: "Resolved IP", value: resolvedIp, highlight: true },
          { name: "TTL", value: "300 seconds" },
          { name: "Flags", value: "QR=1, RD=1, RA=1" }
        ]
      },
      {
        id: "browse-step-3",
        stepNumber: 3,
        protocol: "HTTP",
        stage: "http",
        fromEndpoint: "Client",
        toEndpoint: "Web Server",
        direction: "client-to-server",
        messageType: "GET",
        summary: `HTTP/1.1 GET ${path}`,
        rawMessage: `GET ${path} HTTP/1.1\r\nHost: ${hostname}\r\nUser-Agent: Mozilla/5.0 (AcademicVisualizer/2.0)\r\nAccept: text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8\r\nAccept-Language: en-US,en;q=0.9\r\nAccept-Encoding: gzip, deflate\r\nConnection: keep-alive\r\nUpgrade-Insecure-Requests: 1\r\n\r\n`,
        explanation: `With the destination IP address known (${resolvedIp}), the client sends an HTTP/1.1 GET request. The mandatory 'Host: ${hostname}' header identifies the virtual host requested on this server (RFC 7230).`,
        importantFields: [
          { name: "Method", value: "GET", highlight: true },
          { name: "Path", value: path, highlight: true },
          { name: "Host", value: hostname, highlight: true },
          { name: "Protocol Version", value: "HTTP/1.1" }
        ]
      },
      {
        id: "browse-step-4",
        stepNumber: 4,
        protocol: "HTTP",
        stage: "http",
        fromEndpoint: "Web Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "200 OK",
        summary: `HTTP/1.1 200 OK (HTML Document)`,
        rawMessage: `HTTP/1.1 200 OK\r\nDate: ${nowStr}\r\nServer: Apache/2.4.52 (Ubuntu)\r\nLast-Modified: Sun, 15 Sep 2026 12:00:00 GMT\r\nETag: "3147526947"\r\nAccept-Ranges: bytes\r\nContent-Type: text/html; charset=UTF-8\r\nContent-Length: 482\r\nConnection: keep-alive\r\n\r\n<!DOCTYPE html>\n<html>\n<head><title>${hostname}</title><link rel="stylesheet" href="/styles.css"></head>\n<body>\n  <h1>Welcome to ${hostname}</h1>\n  <p>Resource delivered via HTTP/1.1 simulated pipeline.</p>\n</body>\n</html>`,
        explanation: `The web server responds with status code '200 OK', indicating the requested HTML resource exists. The response headers communicate the content MIME type, byte length, caching tags, and keep-alive state.`,
        importantFields: [
          { name: "Status Code", value: "200 OK", highlight: true },
          { name: "Content-Type", value: "text/html; charset=UTF-8", highlight: true },
          { name: "Content-Length", value: "482 bytes" },
          { name: "Connection", value: "keep-alive" }
        ]
      },
      {
        id: "browse-step-5",
        stepNumber: 5,
        protocol: "HTTP",
        stage: "http",
        fromEndpoint: "Client",
        toEndpoint: "Web Server",
        direction: "client-to-server",
        messageType: "GET",
        summary: `HTTP/1.1 GET /styles.css (Secondary Resource)`,
        rawMessage: `GET /styles.css HTTP/1.1\r\nHost: ${hostname}\r\nUser-Agent: Mozilla/5.0 (AcademicVisualizer/2.0)\r\nAccept: text/css,*/*;q=0.1\r\nReferer: ${parsed.href}\r\nConnection: keep-alive\r\n\r\n`,
        explanation: `Browsing typically involves multiple sub-resources. After parsing the HTML, the browser encounters a linked stylesheet and requests it over the open TCP connection.`,
        importantFields: [
          { name: "Method", value: "GET", highlight: true },
          { name: "Path", value: "/styles.css", highlight: true },
          { name: "Referer", value: parsed.href }
        ]
      },
      {
        id: "browse-step-6",
        stepNumber: 6,
        protocol: "HTTP",
        stage: "http",
        fromEndpoint: "Web Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "200 OK",
        summary: `HTTP/1.1 200 OK (CSS Stylesheet)`,
        rawMessage: `HTTP/1.1 200 OK\r\nDate: ${nowStr}\r\nServer: Apache/2.4.52 (Ubuntu)\r\nContent-Type: text/css; charset=UTF-8\r\nContent-Length: 184\r\nCache-Control: public, max-age=86400\r\nConnection: keep-alive\r\n\r\nbody { font-family: system-ui, sans-serif; margin: 2rem; color: #1e293b; }\nh1 { color: #2563eb; font-weight: 700; }`,
        explanation: `The server returns the CSS stylesheet. The client can now build the render tree and display the styled webpage to the user.`,
        importantFields: [
          { name: "Status Code", value: "200 OK", highlight: true },
          { name: "Content-Type", value: "text/css; charset=UTF-8", highlight: true },
          { name: "Cache-Control", value: "public, max-age=86400" }
        ]
      }
    ]
  };
}

function generateMailSequence(toInput, fromInput = "student@example.com", subjectInput = "Computer Networks Demo", bodyInput = "Testing SMTP protocol visualization.") {
  const cleanTo = (toInput || "").trim();
  if (!cleanTo) throw new Error("Recipient 'To' address cannot be empty.");
  if (!cleanTo.includes("@") || !cleanTo.split("@")[1].includes(".")) {
    throw new Error(`Invalid recipient format: '${cleanTo}'. Expected user@domain.com`);
  }
  const cleanFrom = (fromInput || "student@example.com").trim();
  const domain = cleanTo.split("@")[1];
  const mailServerHost = `mail.${domain}`;
  const mailServerIp = hashIp(mailServerHost, "198.51.100.");
  const clientFqdn = "client.networklab.edu";
  const nowStr = new Date().toUTCString();
  const queueId = "4V9dZ81L9zZk3b";

  return {
    activity: "mail",
    protocolTitle: "Mail: DNS (MX) → SMTP (RFC 5321)",
    description: "DNS resolution of Mail Exchanger (MX), followed by complete RFC 5321 SMTP conversation.",
    endpoints: ["Client", "DNS Server", "Mail Server"],
    steps: [
      {
        id: "mail-step-1",
        stepNumber: 1,
        protocol: "DNS",
        stage: "dns",
        fromEndpoint: "Client",
        toEndpoint: "DNS Server",
        direction: "client-to-dns",
        messageType: "QUERY",
        summary: `DNS MX Query for ${domain}`,
        rawMessage: `Domain Name System (query)\nTransaction ID: 0x8a1c\nQuestions: 1\n  Name: ${domain}\n  Type: MX (Mail Exchange) (15)\n  Class: IN (1)`,
        explanation: `Before initiating an SMTP conversation, the client looks up the Mail Exchanger (MX) records for '${domain}' to find the destination mail host.`,
        importantFields: [
          { name: "Record Type", value: "MX (Mail Exchange)", highlight: true },
          { name: "Domain", value: domain, highlight: true }
        ]
      },
      {
        id: "mail-step-2",
        stepNumber: 2,
        protocol: "DNS",
        stage: "dns",
        fromEndpoint: "DNS Server",
        toEndpoint: "Client",
        direction: "dns-to-client",
        messageType: "RESPONSE",
        summary: `DNS MX Response: ${mailServerHost} (pref 10)`,
        rawMessage: `Domain Name System (response)\nTransaction ID: 0x8a1c\nAnswers: 1\n  ${domain}: type MX, class IN, preference 10, exchange ${mailServerHost}\nAdditional Records: 1\n  ${mailServerHost}: type A, class IN, addr ${mailServerIp}`,
        explanation: `The DNS server returns the MX record pointing to '${mailServerHost}' with priority 10, along with the glue A record (${mailServerIp}). The client connects over TCP on port 25/587.`,
        importantFields: [
          { name: "Mail Exchanger", value: mailServerHost, highlight: true },
          { name: "Preference", value: "10" },
          { name: "Glue IP", value: mailServerIp, highlight: true }
        ]
      },
      {
        id: "mail-step-3",
        stepNumber: 3,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "220 GREETING",
        summary: `S: 220 ${mailServerHost} ESMTP Postfix Ready`,
        rawMessage: `220 ${mailServerHost} ESMTP Postfix (Academic Simulator Ready)`,
        explanation: `In SMTP (RFC 5321 Section 3.1), the SERVER ALWAYS speaks first once the TCP connection is established. Reply code 220 announces service readiness.`,
        importantFields: [
          { name: "Reply Code", value: "220", highlight: true },
          { name: "Server Host", value: mailServerHost },
          { name: "Service", value: "ESMTP" }
        ]
      },
      {
        id: "mail-step-4",
        stepNumber: 4,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "EHLO",
        summary: `C: EHLO ${clientFqdn}`,
        rawMessage: `EHLO ${clientFqdn}`,
        explanation: `The client greets the server with 'EHLO' (Extended HELO), declaring its Fully Qualified Domain Name.`,
        importantFields: [
          { name: "Command", value: "EHLO", highlight: true },
          { name: "Client FQDN", value: clientFqdn, highlight: true }
        ]
      },
      {
        id: "mail-step-5",
        stepNumber: 5,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "250 CAPABILITIES",
        summary: "S: 250 (ESMTP Extension Capabilities)",
        rawMessage: `250-${mailServerHost} greets ${clientFqdn}\r\n250-PIPELINING\r\n250-SIZE 35882577\r\n250-8BITMIME\r\n250-ENHANCEDSTATUSCODES\r\n250-SMTPUTF8\r\n250 OK`,
        explanation: `The server returns a multi-line 250 response advertising supported extensions (PIPELINING, SIZE, 8BITMIME).`,
        importantFields: [
          { name: "Reply Code", value: "250", highlight: true },
          { name: "Extensions", value: "PIPELINING, SIZE, 8BITMIME, SMTPUTF8" }
        ]
      },
      {
        id: "mail-step-6",
        stepNumber: 6,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "MAIL FROM",
        summary: `C: MAIL FROM:<${cleanFrom}>`,
        rawMessage: `MAIL FROM:<${cleanFrom}> BODY=8BITMIME`,
        explanation: `The client initiates the mail envelope by declaring the sender reverse-path mailbox.`,
        importantFields: [
          { name: "Command", value: "MAIL FROM", highlight: true },
          { name: "Reverse-Path", value: `<${cleanFrom}>`, highlight: true }
        ]
      },
      {
        id: "mail-step-7",
        stepNumber: 7,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "250 OK",
        summary: `S: 250 2.1.0 Sender <${cleanFrom}> OK`,
        rawMessage: `250 2.1.0 Sender <${cleanFrom}> OK`,
        explanation: `The server validates and accepts the sender address (Code 250 2.1.0).`,
        importantFields: [
          { name: "Reply Code", value: "250", highlight: true },
          { name: "Status", value: "2.1.0 Sender OK" }
        ]
      },
      {
        id: "mail-step-8",
        stepNumber: 8,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "RCPT TO",
        summary: `C: RCPT TO:<${cleanTo}>`,
        rawMessage: `RCPT TO:<${cleanTo}>`,
        explanation: `The client specifies the recipient forward-path mailbox.`,
        importantFields: [
          { name: "Command", value: "RCPT TO", highlight: true },
          { name: "Forward-Path", value: `<${cleanTo}>`, highlight: true }
        ]
      },
      {
        id: "mail-step-9",
        stepNumber: 9,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "250 OK",
        summary: `S: 250 2.1.5 Recipient <${cleanTo}> OK`,
        rawMessage: `250 2.1.5 Recipient <${cleanTo}> OK`,
        explanation: `The server verifies that the destination mailbox exists and can be delivered.`,
        importantFields: [
          { name: "Reply Code", value: "250", highlight: true },
          { name: "Status", value: "2.1.5 Recipient OK" }
        ]
      },
      {
        id: "mail-step-10",
        stepNumber: 10,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "DATA",
        summary: "C: DATA",
        rawMessage: "DATA",
        explanation: `The client asks permission to stream the email content (headers and body).`,
        importantFields: [
          { name: "Command", value: "DATA", highlight: true }
        ]
      },
      {
        id: "mail-step-11",
        stepNumber: 11,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "354 PROCEED",
        summary: "S: 354 Start mail input; end with <CRLF>.<CRLF>",
        rawMessage: "354 Start mail input; end with <CRLF>.<CRLF>",
        explanation: `Code 354 is an intermediate response instructing the client to send message lines until a line with a single period is sent.`,
        importantFields: [
          { name: "Reply Code", value: "354", highlight: true },
          { name: "End Marker", value: "<CRLF>.<CRLF>" }
        ]
      },
      {
        id: "mail-step-12",
        stepNumber: 12,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "MAIL BODY",
        summary: "C: [Message Headers & Body] + '.'",
        rawMessage: `From: Sender <${cleanFrom}>\r\nTo: Recipient <${cleanTo}>\r\nSubject: ${subjectInput}\r\nDate: ${nowStr}\r\nMessage-ID: <sim-10824@${clientFqdn}>\r\nContent-Type: text/plain; charset=UTF-8\r\n\r\n${bodyInput}\r\n.`,
        explanation: `The client transmits RFC 5322 formatted email headers, a blank line, the message text, and terminates with a single dot on its own line.`,
        importantFields: [
          { name: "Subject", value: subjectInput, highlight: true },
          { name: "End of Data", value: "'.' (period on single line)", highlight: true }
        ]
      },
      {
        id: "mail-step-13",
        stepNumber: 13,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "250 OK",
        summary: `S: 250 2.0.0 OK: queued as ${queueId}`,
        rawMessage: `250 2.0.0 OK: queued as ${queueId}`,
        explanation: `The server commits the message to disk storage and returns the queue identifier.`,
        importantFields: [
          { name: "Reply Code", value: "250", highlight: true },
          { name: "Queue ID", value: queueId, highlight: true }
        ]
      },
      {
        id: "mail-step-14",
        stepNumber: 14,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Client",
        toEndpoint: "Mail Server",
        direction: "client-to-server",
        messageType: "QUIT",
        summary: "C: QUIT",
        rawMessage: "QUIT",
        explanation: `The client terminates the SMTP session gracefully.`,
        importantFields: [
          { name: "Command", value: "QUIT", highlight: true }
        ]
      },
      {
        id: "mail-step-15",
        stepNumber: 15,
        protocol: "SMTP",
        stage: "smtp",
        fromEndpoint: "Mail Server",
        toEndpoint: "Client",
        direction: "server-to-client",
        messageType: "221 BYE",
        summary: `S: 221 2.0.0 ${mailServerHost} closing connection`,
        rawMessage: `221 2.0.0 ${mailServerHost} Service closing transmission channel`,
        explanation: `The server acknowledges the QUIT command with status 221 and closes the channel.`,
        importantFields: [
          { name: "Reply Code", value: "221", highlight: true },
          { name: "Status", value: "Connection closing" }
        ]
      }
    ]
  };
}

function generateStreamingSequence(streamUrlInput = "https://video.networklab.org/live/lecture.m3u8", qualityInput = "720p") {
  const cleanUrl = (streamUrlInput || "https://video.networklab.org/live/lecture.m3u8").trim();
  const parsed = parseUrl(cleanUrl);
  const cdnHost = parsed.hostname || "video.networklab.org";
  const resolvedIp = hashIp(cdnHost, "104.26.12.");

  const qualityProfiles = {
    "360p": { bandwidth: 800000, res: "640x360", rateStr: "800 Kbps", segBytes: 600000 },
    "480p": { bandwidth: 1400000, res: "854x480", rateStr: "1.4 Mbps", segBytes: 1050000 },
    "720p": { bandwidth: 2500000, res: "1280x720", rateStr: "2.5 Mbps", segBytes: 1875000 },
    "1080p": { bandwidth: 5000000, res: "1920x1080", rateStr: "5.0 Mbps", segBytes: 3750000 },
    "Auto": { bandwidth: 2500000, res: "1280x720 (Auto-adapted)", rateStr: "2.5 Mbps (Adaptive)", segBytes: 1875000 }
  };

  const selectedQuality = qualityProfiles[qualityInput] ? qualityInput : "720p";
  const profile = qualityProfiles[selectedQuality];
  const qualityLabel = selectedQuality.toLowerCase().replace(" ", "");
  const mediaPlaylistPath = `/media_${qualityLabel}.m3u8`;

  const steps = [
    {
      id: "stream-step-1",
      stepNumber: 1,
      protocol: "DNS",
      stage: "dns",
      fromEndpoint: "Client",
      toEndpoint: "DNS Server",
      direction: "client-to-dns",
      messageType: "QUERY",
      summary: `DNS Query: A record for CDN ${cdnHost}`,
      rawMessage: `Domain Name System (query)\nTransaction ID: 0x4f12\nQuestions: 1\n  Name: ${cdnHost}\n  Type: A (Host Address) (1)\n  Class: IN (1)`,
      explanation: `The media player resolves the video CDN hostname '${cdnHost}' to an edge server IP address.`,
      importantFields: [
        { name: "Query Name", value: cdnHost, highlight: true },
        { name: "Type", value: "A (IPv4)" }
      ]
    },
    {
      id: "stream-step-2",
      stepNumber: 2,
      protocol: "DNS",
      stage: "dns",
      fromEndpoint: "DNS Server",
      toEndpoint: "Client",
      direction: "dns-to-client",
      messageType: "RESPONSE",
      summary: `DNS Response: ${cdnHost} → ${resolvedIp}`,
      rawMessage: `Domain Name System (response)\nTransaction ID: 0x4f12\nAnswers: 1\n  ${cdnHost}: type A, class IN, TTL 120, addr ${resolvedIp}`,
      explanation: `The nearest CDN edge node IP (${resolvedIp}) is returned. Low TTL ensures dynamic CDN load balancing.`,
      importantFields: [
        { name: "Edge IP", value: resolvedIp, highlight: true },
        { name: "TTL", value: "120 seconds" }
      ]
    },
    {
      id: "stream-step-3",
      stepNumber: 3,
      protocol: "HTTP",
      stage: "manifest",
      fromEndpoint: "Client",
      toEndpoint: "Media Server",
      direction: "client-to-server",
      messageType: "GET",
      summary: "HTTP GET /master.m3u8 (HLS Master Playlist)",
      rawMessage: `GET /master.m3u8 HTTP/1.1\r\nHost: ${cdnHost}\r\nUser-Agent: HLSVideoPlayer/3.2 (Academic Simulator)\r\nAccept: application/vnd.apple.mpegurl,application/x-mpegurl,*/*\r\nConnection: keep-alive\r\n\r\n`,
      explanation: `In HTTP Live Streaming (HLS - RFC 8216), the client first requests the Master Playlist. The master playlist indexes all available bitrates and resolutions.`,
      importantFields: [
        { name: "Method", value: "GET", highlight: true },
        { name: "Resource", value: "/master.m3u8", highlight: true },
        { name: "Accept", value: "application/vnd.apple.mpegurl" }
      ]
    },
    {
      id: "stream-step-4",
      stepNumber: 4,
      protocol: "HTTP",
      stage: "manifest",
      fromEndpoint: "Media Server",
      toEndpoint: "Client",
      direction: "server-to-client",
      messageType: "200 OK",
      summary: "HTTP 200 OK: Master Playlist with Variant Streams",
      rawMessage: `HTTP/1.1 200 OK\r\nContent-Type: application/vnd.apple.mpegurl\r\nContent-Length: 395\r\nAccess-Control-Allow-Origin: *\r\nConnection: keep-alive\r\n\r\n#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360\nmedia_360p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=1400000,RESOLUTION=854x480\nmedia_480p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=2500000,RESOLUTION=1280x720\nmedia_720p.m3u8\n#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080\nmedia_1080p.m3u8`,
      explanation: `The server returns the multivariant playlist. The client player selects the optimal representation (selected: ${selectedQuality} @ ${profile.rateStr}).`,
      importantFields: [
        { name: "Content-Type", value: "application/vnd.apple.mpegurl", highlight: true },
        { name: "Variant Streams", value: "360p, 480p, 720p, 1080p", highlight: true },
        { name: "Selected Stream", value: `${selectedQuality} (${profile.res})`, highlight: true }
      ]
    },
    {
      id: "stream-step-5",
      stepNumber: 5,
      protocol: "HTTP",
      stage: "manifest",
      fromEndpoint: "Client",
      toEndpoint: "Media Server",
      direction: "client-to-server",
      messageType: "GET",
      summary: `HTTP GET ${mediaPlaylistPath} (${selectedQuality} Media Playlist)`,
      rawMessage: `GET ${mediaPlaylistPath} HTTP/1.1\r\nHost: ${cdnHost}\r\nAccept: application/vnd.apple.mpegurl\r\nConnection: keep-alive\r\n\r\n`,
      explanation: `The player requests the specific Media Playlist for '${selectedQuality}'. This playlist indexes the actual transport stream chunks (.ts) with exact durations.`,
      importantFields: [
        { name: "Target Playlist", value: mediaPlaylistPath, highlight: true },
        { name: "Bitrate Selected", value: profile.rateStr, highlight: true }
      ]
    },
    {
      id: "stream-step-6",
      stepNumber: 6,
      protocol: "HTTP",
      stage: "manifest",
      fromEndpoint: "Media Server",
      toEndpoint: "Client",
      direction: "server-to-client",
      messageType: "200 OK",
      summary: `HTTP 200 OK: Media Playlist (${selectedQuality} Segment Index)`,
      rawMessage: `HTTP/1.1 200 OK\r\nContent-Type: application/vnd.apple.mpegurl\r\nContent-Length: 320\r\nConnection: keep-alive\r\n\r\n#EXTM3U\n#EXT-X-VERSION:3\n#EXT-X-TARGETDURATION:6\n#EXT-X-MEDIA-SEQUENCE:1\n#EXTINF:6.000000,\nsegment_001_${qualityLabel}.ts\n#EXTINF:6.000000,\nsegment_002_${qualityLabel}.ts\n#EXTINF:6.000000,\nsegment_003_${qualityLabel}.ts`,
      explanation: `The server returns the segment index. Notice: streaming is NOT one massive download, but repeated HTTP requests for small segmented video slices (#EXTINF:6.000 specifies each slice duration is 6.0s).`,
      importantFields: [
        { name: "Target Duration", value: "6.0 seconds", highlight: true },
        { name: "Segments Listed", value: `segment_001..003 (${qualityLabel})`, highlight: true }
      ]
    }
  ];

  for (let segIdx = 1; segIdx <= 3; segIdx++) {
    const segName = `segment_00${segIdx}_${qualityLabel}.ts`;
    const segPath = `/segments/${segName}`;
    const segBytes = profile.segBytes;

    steps.push({
      id: `stream-step-seg-${segIdx}-req`,
      stepNumber: steps.length + 1,
      protocol: "HTTP",
      stage: "segment",
      fromEndpoint: "Client",
      toEndpoint: "Media Server",
      direction: "client-to-server",
      messageType: "GET",
      summary: `HTTP GET ${segPath} [Chunk #${segIdx}]`,
      rawMessage: `GET ${segPath} HTTP/1.1\r\nHost: ${cdnHost}\r\nAccept: video/mp2t,*/*\r\nRange: bytes=0-${segBytes - 1}\r\nConnection: keep-alive\r\n\r\n`,
      explanation: `The client buffer needs continuous media data. The video decoder requests Segment #${segIdx} (${segName}) over HTTP/1.1 using persistent connection keep-alive.`,
      importantFields: [
        { name: "Segment File", value: segName, highlight: true },
        { name: "Chunk Index", value: `#${segIdx}` },
        { name: "Expected Size", value: `~${Math.round(segBytes / 1024)} KB` }
      ]
    });

    steps.push({
      id: `stream-step-seg-${segIdx}-resp`,
      stepNumber: steps.length + 1,
      protocol: "HTTP",
      stage: "segment",
      fromEndpoint: "Media Server",
      toEndpoint: "Client",
      direction: "server-to-client",
      messageType: "200 OK",
      summary: `HTTP 200 OK: ${segName} (${Math.round(segBytes / 1024)} KB Video Chunk)`,
      rawMessage: `HTTP/1.1 200 OK\r\nContent-Type: video/mp2t\r\nContent-Length: ${segBytes}\r\nCache-Control: max-age=3600\r\nConnection: keep-alive\r\n\r\n[Binary MPEG-2 Transport Stream Payload: ${segBytes} bytes of H.264/AAC data]`,
      explanation: `The CDN server streams the 6-second MPEG-2 Transport Stream binary chunk into the video decoder buffer.`,
      importantFields: [
        { name: "Status Code", value: "200 OK", highlight: true },
        { name: "MIME Type", value: "video/mp2t", highlight: true },
        { name: "Chunk Payload", value: `${segBytes} bytes (~${Math.round(segBytes / 1024)} KB)`, highlight: true },
        { name: "Playback Duration", value: "6.0 seconds" }
      ]
    });
  }

  return {
    activity: "streaming",
    protocolTitle: `Streaming: DNS → HLS Manifest & Segments (${selectedQuality})`,
    description: "Progressive HTTP Live Streaming: DNS query, multivariant playlist, media playlist, and chunked .ts segments.",
    endpoints: ["Client", "DNS Server", "Media Server"],
    steps: steps
  };
}

// Global scope export for browser
window.ProtocolData = {
  generateBrowsingSequence,
  generateMailSequence,
  generateStreamingSequence
};
