import sys, time, subprocess, json, urllib.request
sys.path.insert(0, ".qa")
from shoot import ws_connect, ws_send, ws_recv, CHROME
PORT=9273; PROFILE="/tmp/cdp-vpw"
proc = subprocess.Popen([CHROME,"--headless=new","--no-sandbox","--disable-gpu",
  f"--remote-debugging-port={PORT}",f"--user-data-dir={PROFILE}",
  "--window-size=390,844","--hide-scrollbars","file:///tmp/go-vpw.html"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
open("/tmp/go-vpw.html","w").write('<!doctype html><html><head><meta http-equiv="refresh" content="0;url=http://127.0.0.1:3111/checkout"></head><body></body></html>')
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
  time.sleep(5)
  r=send("Runtime.evaluate",{"expression":"window.innerWidth+'x'+window.innerHeight+' docW='+document.documentElement.scrollWidth","returnByValue":True})
  print(r["result"]["result"]["value"])
  # now try device emulation override via Emulation (it timed out before on setDeviceMetricsOverride... try again carefully)
  s.close()
finally:
  proc.terminate()
