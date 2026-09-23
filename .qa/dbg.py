import sys, time
sys.path.insert(0, ".qa")
from shoot import ws_connect, ws_send, ws_recv
import subprocess, json, urllib.request, os
CHROME="/opt/meta-chromium/chrome"; PORT=9224; PROFILE="/tmp/cdp-dbg"
proc = subprocess.Popen([CHROME,"--headless=new","--no-sandbox","--disable-gpu",
  f"--remote-debugging-port={PORT}",f"--user-data-dir={PROFILE}","about:blank"],
  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
try:
  tgt=None
  for _ in range(40):
    try:
      with urllib.request.urlopen(f"http://127.0.0.1:{PORT}/json/list",timeout=3) as r:
        for t in json.load(r):
          if t.get("type")=="page": tgt=t; break
      if tgt: break
    except Exception: pass
    time.sleep(0.5)
  s=ws_connect(tgt["webSocketDebuggerUrl"]); mid=[0]
  def send(m,p=None):
    mid[0]+=1; ws_send(s,{"id":mid[0],"method":m,"params":p or {}})
    while True:
      r=ws_recv(s)
      if r.get("id")==mid[0]: return r
  print("enable:", send("Page.enable")["result"])
  print("nav:", json.dumps(send("Page.navigate",{"url":"http://127.0.0.1:3111/"})["result"]))
  s.close()
finally:
  proc.terminate()
