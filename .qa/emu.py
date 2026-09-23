import sys, time, subprocess, json, urllib.request
sys.path.insert(0, ".qa")
from shoot import ws_connect, ws_send, ws_recv, CHROME
PORT=9274; PROFILE="/tmp/cdp-emu"
proc = subprocess.Popen([CHROME,"--headless=new","--no-sandbox","--disable-gpu",
  f"--remote-debugging-port={PORT}",f"--user-data-dir={PROFILE}",
  "--window-size=1280,900","--hide-scrollbars","file:///tmp/go-emu.html"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
open("/tmp/go-emu.html","w").write('<!doctype html><html><head><meta http-equiv="refresh" content="0;url=http://127.0.0.1:3111/checkout"></head><body></body></html>')
try:
  tgt=None
  for _ in range(60):
    try:
      with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=3) as r:
        for t in json.load(r):
          if t.get("type")=="page" and "127.0.0.1:3111" in t.get("url",""): tgt=t; break
      if tgt: break
    except Exception: pass
    time.sleep(0.5)
  print("landed", flush=True)
  s=ws_connect(tgt["webSocketDebuggerUrl"]); mid=[0]
  import socket as sk
  def raw_send(m,p=None):
    mid[0]+=1; ws_send(s,{"id":mid[0],"method":m,"params":p or {}}); return mid[0]
  def recv_until(i, timeout=10):
    s.settimeout(timeout)
    while True:
      m=ws_recv(s,timeout=timeout)
      print("got:", str(m)[:120], flush=True)
      if m.get("id")==i: return m
  i=raw_send("Page.enable"); recv_until(i)
  i=raw_send("Emulation.setDeviceMetricsOverride",{"width":390,"height":844,"deviceScaleFactor":2,"mobile":True}); recv_until(i)
  time.sleep(6)
  i=raw_send("Runtime.evaluate",{"expression":"window.innerWidth+'x'+window.innerHeight+' docW='+document.documentElement.scrollWidth","returnByValue":True})
  m=recv_until(i); print("RESULT:", m["result"]["result"]["value"], flush=True)
  s.close()
finally:
  proc.terminate()
