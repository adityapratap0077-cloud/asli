#!/usr/bin/env python3
"""Screenshot via Chrome DevTools Protocol, no third-party deps."""
import base64, hashlib, json, os, socket, struct, subprocess, sys, time, urllib.request

CHROME = "/opt/meta-chromium/chrome"
PORT = 9223
PROFILE = "/tmp/cdp-shot"

def ws_connect(url):
    # minimal websocket client
    from urllib.parse import urlparse
    u = urlparse(url)
    key = base64.b64encode(os.urandom(16)).decode()
    s = socket.create_connection((u.hostname, u.port), timeout=15)
    host = u.hostname if u.port in (80, 443) else f"{u.hostname}:{u.port}"
    s.sendall(f"GET {u.path} HTTP/1.1\r\nHost: {host}\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Key: {key}\r\nSec-WebSocket-Version: 13\r\n\r\n".encode())
    resp = b""
    while b"\r\n\r\n" not in resp:
        resp += s.recv(4096)
    if b"101" not in resp.split(b"\r\n")[0]:
        raise RuntimeError("WS handshake failed: " + resp[:200].decode(errors="replace"))
    return s

def ws_send(s, obj):
    data = json.dumps(obj).encode()
    hdr = bytes([0x81])
    n = len(data)
    if n < 126:
        hdr += struct.pack("!B", 0x80 | n)
    elif n < 65536:
        hdr += struct.pack("!BH", 0x80 | 126, n)
    else:
        hdr += struct.pack("!BQ", 0x80 | 127, n)
    mask = os.urandom(4)
    hdr += mask
    s.sendall(hdr + bytes(b ^ mask[i % 4] for i, b in enumerate(data)))

def ws_recv(s, timeout=30):
    s.settimeout(timeout)
    buf = b""
    def rd(n):
        nonlocal buf
        while len(buf) < n:
            chunk = s.recv(65536)
            if not chunk: raise RuntimeError("socket closed")
            buf += chunk
        out, buf = buf[:n], buf[n:]
        return out
    hdr = rd(2)
    fin_op, ln = hdr[0], hdr[1] & 0x7F
    if ln == 126: ln = struct.unpack("!H", rd(2))[0]
    elif ln == 127: ln = struct.unpack("!Q", rd(8))[0]
    if hdr[1] & 0x80: rd(4)  # server->client unmasked, ignore mask if present
    payload = rd(ln)
    return json.loads(payload.decode())

def shoot(url, outfile, width, height):
    proc = subprocess.Popen([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
                             f"--remote-debugging-port={PORT}", f"--user-data-dir={PROFILE}",
                             f"--window-size={width},{height}",
                             "--disable-features=LocalNetworkAccessChecks",
                             "--hide-scrollbars", url],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        target = None
        for _ in range(60):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list", timeout=3) as r:
                    for t in json.load(r):
                        if t.get("type") == "page":
                            target = t; break
                if target: break
            except Exception:
                pass
            time.sleep(0.5)
        if not target: raise RuntimeError("no page target")
        s = ws_connect(target["webSocketDebuggerUrl"])
        mid = [0]
        def send(method, params=None):
            mid[0] += 1
            ws_send(s, {"id": mid[0], "method": method, "params": params or {}})
            while True:
                m = ws_recv(s)
                if m.get("id") == mid[0]: return m
        send("Page.enable")
        send("Page.navigate", {"url": url})
        # wait for load + a beat for fonts/images
        deadline = time.time() + 25
        loaded = False
        while time.time() < deadline:
            m = ws_recv(s, timeout=5)
            if m.get("method") == "Page.loadEventFired":
                loaded = True; break
        if loaded: time.sleep(3)
        # full page height then capture
        layout = send("Page.getLayoutMetrics")
        h = int(layout["result"]["contentSize"]["height"]) if "result" in layout else height
        h = max(h, height)
        r = send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True,
                                            "clip": {"x": 0, "y": 0, "width": width,
                                                     "height": h, "scale": 1}})
        data = base64.b64decode(r["result"]["data"])
        with open(outfile, "wb") as f: f.write(data)
        print(f"saved {outfile} ({len(data)} bytes, full height {h})")
        s.close()
    finally:
        proc.terminate()

if __name__ == "__main__":
    shoot(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
