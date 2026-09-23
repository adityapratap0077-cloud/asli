import sys, time, subprocess, json, urllib.request, base64, os
sys.path.insert(0, ".qa")
from shoot import ws_connect, ws_send, ws_recv, CHROME
PORT=9275; PROFILE="/tmp/cdp-scroll"
proc = subprocess.Popen([CHROME,"--headless=new","--no-sandbox","--disable-gpu",
  f"--remote-debugging-port={PORT}",f"--user-data-dir={PROFILE}",
  "--window-size=1280,900","--hide-scrollbars","file:///tmp/go-scroll.html"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
open("/tmp/go-scroll.html","w").write('<!doctype html><html><head><meta http-equiv="refresh" content="0;url=http://127.0.0.1:3111/"></head><body></body></html>')
try:
  tgt=None
  for _ in range(40):
    try:
      with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=3) as r:
        for t in json.load(r):
          if t.get("type")=="page" and "127.0.0.1:3111" in t.get("url",""): tgt=t; break
      if tgt: break
    except Exception: pass
    time.sleep(0.5)
  s=ws_connect(tgt["webSocketDebuggerUrl"]); mid=[0]
  def send(m,p=None):
    mid[0]+=1; ws_send(s,{"id":mid[0],"method":m,"params":p or {}})
    while True:
      r=ws_recv(s,timeout=15)
      if r.get("id")==mid[0]: return r
  send("Page.enable")
  send("Emulation.setDeviceMetricsOverride",{"width":390,"height":844,"deviceScaleFactor":1,"mobile":True})
  time.sleep(4)
  # scroll through the page to trigger lazy images
  send("Runtime.evaluate",{"expression":"window.scrollTo(0, document.body.scrollHeight)"})
  time.sleep(3)
  send("Runtime.evaluate",{"expression":"window.scrollTo(0, 0)"})
  time.sleep(2)
  n=send("Runtime.evaluate",{"expression":"Array.from(document.images).filter(i=>i.complete&&i.naturalWidth>0).length+'/'+document.images.length","returnByValue":True})
  print("loaded images:", n["result"]["result"]["value"])
  layout=send("Page.getLayoutMetrics"); h=int(layout["result"]["contentSize"]["height"])
  r=send("Page.captureScreenshot",{"format":"png","captureBeyondViewport":True,
        "clip":{"x":0,"y":0,"width":390,"height":h,"scale":1}})
  open(".qa/landing-mobile3.png","wb").write(base64.b64decode(r["result"]["data"]))
  print("saved")
  s.close()
finally:
  proc.terminate()
