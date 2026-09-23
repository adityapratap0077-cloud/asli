import sys, time, subprocess, json, urllib.request
sys.path.insert(0, ".qa")
from shoot import ws_connect, ws_send, ws_recv, CHROME
PORT=9225; PROFILE="/tmp/cdp-dbg2"
proc = subprocess.Popen([CHROME,"--headless=new","--no-sandbox","--disable-gpu",
  f"--remote-debugging-port={PORT}",f"--user-data-dir={PROFILE}","--allow-file-access-from-files",
  "file:///tmp/go.html"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
  tgt=None
  for _ in range(40):
    try:
      with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=3) as r:
        for t in json.load(r):
          if t.get("type")=="page" and "file://" in t.get("url",""): tgt=t; break
      if tgt: break
    except Exception: pass
    time.sleep(0.5)
  print("target:", tgt["url"] if tgt else None)
  s=ws_connect(tgt["webSocketDebuggerUrl"]); mid=[0]
  def send(m,p=None):
    mid[0]+=1; ws_send(s,{"id":mid[0],"method":m,"params":p or {}})
    while True:
      r=ws_recv(s, timeout=10)
      if r.get("id")==mid[0]: return r
  send("Page.enable")
  # wait for the redirect to land
  deadline=time.time()+15; landed=False
  while time.time()<deadline:
    r=send("Target.getTargets") if False else None
    info=json.loads(urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=3).read().decode())
    for t in info:
      if t.get("type")=="page" and "127.0.0.1:3111" in t.get("url",""):
        landed=True; tgt=t; break
    if landed: break
    time.sleep(0.5)
  print("landed:", landed)
  s.close()
finally:
  proc.terminate()
