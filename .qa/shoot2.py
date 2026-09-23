#!/usr/bin/env python3
"""Full-page screenshots via CDP. Works around Chrome 152 Local Network Access
checks by launching at a file:// redirector (file: URLs are trustworthy
initiators, so the hop to 127.0.0.1 is allowed)."""
import base64, json, os, subprocess, sys, time, urllib.request, uuid
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from shoot import ws_connect, ws_send, ws_recv, CHROME

BASE_PORT = 9250
RUN = uuid.uuid4().hex[:8]

def shoot(path, outfile, width, height):
    port = BASE_PORT + (abs(hash(outfile)) % 400)
    profile = f"/tmp/cdp-{RUN}-{os.path.basename(outfile)}"
    go = f"/tmp/go-{RUN}-{os.path.basename(outfile)}.html"
    url = f"http://127.0.0.1:3111{path}"
    with open(go, "w") as f:
        f.write(f'<!doctype html><html><head><meta http-equiv="refresh" content="0;url={url}"></head><body></body></html>')
    proc = subprocess.Popen([CHROME, "--headless=new", "--no-sandbox", "--disable-gpu",
                             f"--remote-debugging-port={port}", f"--user-data-dir={profile}",
                             f"--window-size={width},{height}", "--hide-scrollbars",
                             f"file://{go}"],
                            stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        tgt = None
        for _ in range(40):
            try:
                with urllib.request.urlopen(f"http://127.0.0.1:{port}/json/list", timeout=3) as r:
                    for t in json.load(r):
                        if t.get("type") == "page" and "127.0.0.1:3111" in t.get("url", ""):
                            tgt = t; break
                if tgt: break
            except Exception:
                pass
            time.sleep(0.5)
        if not tgt:
            raise RuntimeError("never landed on " + url)
        if path not in tgt["url"]:
            raise RuntimeError(f"landed on wrong page: {tgt['url']}")
        s = ws_connect(tgt["webSocketDebuggerUrl"])
        mid = [0]
        def send(method, params=None):
            mid[0] += 1
            ws_send(s, {"id": mid[0], "method": method, "params": params or {}})
            while True:
                m = ws_recv(s, timeout=15)
                if m.get("id") == mid[0]: return m
        send("Page.enable")
        if width < 500:
            # Chrome enforces a ~500px minimum window; emulate narrow viewports
            send("Emulation.setDeviceMetricsOverride",
                 {"width": width, "height": height, "deviceScaleFactor": 2, "mobile": True})
        # fixed settle wait (loadEventFired may already have fired)
        time.sleep(7)
        layout = send("Page.getLayoutMetrics")
        h = int(layout["result"]["contentSize"]["height"]) if "result" in layout else height
        h = max(h, height)
        r = send("Page.captureScreenshot", {"format": "png", "captureBeyondViewport": True,
                                            "clip": {"x": 0, "y": 0, "width": width,
                                                     "height": h, "scale": 1}})
        data = base64.b64decode(r["result"]["data"])
        with open(outfile, "wb") as f:
            f.write(data)
        print(f"saved {outfile} ({len(data)} bytes, height {h})")
        s.close()
    finally:
        proc.terminate()

if __name__ == "__main__":
    shoot(sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4]))
