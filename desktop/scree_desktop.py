"""Scree desktop pet: a frameless, transparent, always-on-top window.

Reads <home>/Scree/live.json (or $SCREE_DIR/live.json), written every second by the Scree mod
in any running Claude Code session: Scree's animated form, a ring that fills
with the 5-hour usage window, and session updates in a speech bubble.
Pet actions (right-click menu, double-click) go to inbox.txt for the mod.
Run with pyw so no console window opens.
"""
import ctypes
import json
import os
import sys
import time
from pathlib import Path

from PySide6.QtCore import QPoint, Qt, QTimer, QUrl
from PySide6.QtGui import QAction, QGuiApplication
from PySide6.QtWebEngineCore import QWebEnginePage
from PySide6.QtWebEngineWidgets import QWebEngineView
from PySide6.QtWidgets import QApplication, QMenu

DIR = Path(os.environ.get("SCREE_DIR") or (Path.home() / "Scree"))
LIVE = DIR / "live.json"
INBOX = DIR / "inbox.txt"
POS = DIR / "desktop_pos.json"
W, H = 240, 310

PAGE = """<!doctype html><html><head><meta charset="utf-8"><style>
html,body{margin:0;background:transparent;overflow:hidden;font-family:'Segoe UI',sans-serif;user-select:none}
#wrap{display:flex;flex-direction:column;align-items:center}
#bubble{max-width:216px;min-height:16px;margin:4px 0 2px;background:rgba(28,28,28,.9);color:#f3efe6;font-size:12px;
  padding:6px 11px;border-radius:12px;text-align:center;opacity:0;transform:translateY(4px);
  transition:opacity .3s,transform .3s;cursor:default;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#bubble.show{opacity:1;transform:none}
#bubble .dot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px}
#stage{position:relative;width:196px;height:196px;cursor:grab}
#ring{position:absolute;inset:0}
#pet{position:absolute;left:18px;top:22px;width:160px;height:152px}
#bar{display:flex;align-items:center;gap:2px;margin-top:2px;background:rgba(22,22,22,.94);border-radius:22px;
  padding:4px 6px;box-shadow:0 3px 12px rgba(0,0,0,.35)}
#bar button{background:none;border:0;width:34px;height:30px;border-radius:15px;cursor:pointer;display:flex;
  align-items:center;justify-content:center}
#bar button:hover{background:#353535}
#bar svg{width:17px;height:17px;stroke:#eee;fill:none;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.sep{width:1px;height:16px;background:#4a4a4a;margin:0 2px}
</style></head><body><div id="wrap">
<div id="bubble"></div>
<div id="stage" title="">
 <svg id="ring" viewBox="0 0 196 196">
  <circle cx="98" cy="98" r="91" stroke="rgba(160,150,135,.18)" stroke-width="4" fill="none"/>
  <circle id="arc" cx="98" cy="98" r="91" stroke="#e9c78f" stroke-width="4" fill="none" stroke-linecap="round"
   stroke-dasharray="0 572" transform="rotate(-90 98 98)" style="transition:stroke-dasharray .8s,stroke .8s"/>
 </svg>
 <div id="pet"></div>
</div>
<div id="bar">
 <button title="Chat with Claude" onclick="go('chat')"><svg viewBox="0 0 24 24"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg></button>
 <span class="sep"></span>
 <button title="Talk (voice typing)" onclick="go('voice')"><svg viewBox="0 0 24 24"><path d="M4 10v4M8 7v10M12 4v16M16 7v10M20 10v4"/></svg></button>
</div></div>
<script>
function go(a){location.href='scree://'+a}
const stage=document.getElementById('stage'),pet=document.getElementById('pet'),bub=document.getElementById('bubble');
stage.addEventListener('mousedown',e=>{if(e.button===0&&e.detail===1)go('drag')});
stage.addEventListener('dblclick',()=>go('pet'));
let lastForm='',lastNews=0,hideT=0,sticky=false,state={};
const C=2*Math.PI*91, COL={work:'#8fb3ff',ask:'#ffb347',done:'#7bd88f',warn:'#ff6b6b'};
function show(html,ms,stick){bub.innerHTML=html;bub.classList.add('show');clearTimeout(hideT);sticky=!!stick;
  if(!stick)hideT=setTimeout(()=>bub.classList.remove('show'),ms)}
bub.addEventListener('click',()=>{sticky=false;bub.classList.remove('show')});
stage.addEventListener('mouseenter',()=>{ if(sticky)return;
  const f=(state.limits||[]).find(l=>l.kind==='five_hour');
  let t=state.caption||'Scree';
  if(f){t+=' \\u00b7 5h '+Math.round(f.percentUsed)+'%';
    if(f.resetsAt)t+=', resets '+new Date(f.resetsAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'})}
  show(t,99999)});
stage.addEventListener('mouseleave',()=>{if(!sticky)bub.classList.remove('show')});
window.scree=(d)=>{
  state=d;
  if(d.svg&&d.form!==lastForm){pet.innerHTML=d.svg.replace('<svg ','<svg width="160" height="152" ');lastForm=d.form}
  const f=(d.limits||[]).find(l=>l.kind==='five_hour');
  const pct=f?Math.min(100,f.percentUsed):0, arc=document.getElementById('arc');
  arc.setAttribute('stroke-dasharray',(C*pct/100).toFixed(1)+' '+C.toFixed(1));
  arc.setAttribute('stroke',pct>=90?'#ff6b6b':pct>=70?'#ffb347':'#e9c78f');
  const n=d.news;
  if(n&&n.t&&n.t!==lastNews){lastNews=n.t;
    const ms={work:2500,done:9000,warn:9000}[n.kind]||4000;
    show('<span class="dot" style="background:'+(COL[n.kind]||'#aaa')+'"></span>'+n.text.replace(/</g,'&lt;'),ms,n.kind==='ask')}
};
</script></body></html>"""


def press_win_h():
    """Windows voice typing (Win+H) into whatever has focus."""
    k = ctypes.windll.user32.keybd_event
    k(0x5B, 0, 0, 0)
    k(0x48, 0, 0, 0)
    k(0x48, 0, 2, 0)
    k(0x5B, 0, 2, 0)


class Page(QWebEnginePage):
    def __init__(self, owner):
        super().__init__(owner)
        self.owner = owner

    def acceptNavigationRequest(self, url, nav_type, is_main):
        if url.scheme() == "scree":
            self.owner.command(url.host())
            return False
        return super().acceptNavigationRequest(url, nav_type, is_main)


class Pet(QWebEngineView):
    def __init__(self):
        super().__init__()
        self.setWindowFlags(Qt.FramelessWindowHint | Qt.WindowStaysOnTopHint | Qt.Tool)
        self.setAttribute(Qt.WA_TranslucentBackground)
        self.setStyleSheet("background:transparent")
        self.setPage(Page(self))
        self.page().setBackgroundColor(Qt.transparent)
        self.setHtml(PAGE, QUrl("about:blank"))
        self.resize(W, H)
        self.move(self.start_pos())
        self.last = ""
        self.asleep = False
        self.loadFinished.connect(lambda _: self.poll(force=True))
        t = QTimer(self)
        t.timeout.connect(self.poll)
        t.start(500)
        self.setContextMenuPolicy(Qt.CustomContextMenu)
        self.customContextMenuRequested.connect(self.menu)

    def start_pos(self):
        try:
            x, y = json.loads(POS.read_text())
            return QPoint(x, y)
        except Exception:
            g = QGuiApplication.primaryScreen().availableGeometry()
            return QPoint(g.right() - W - 24, g.bottom() - H - 24)

    def moveEvent(self, e):
        super().moveEvent(e)
        try:
            POS.write_text(json.dumps([self.x(), self.y()]))
        except Exception:
            pass

    def command(self, a):
        if a == "drag":
            self.windowHandle().startSystemMove()
        elif a == "chat":
            self.open_claude()
        elif a == "voice":
            self.open_claude()
            QTimer.singleShot(1300, press_win_h)
        elif a in ("pet", "feed", "play", "sleep", "wake"):
            DIR.mkdir(parents=True, exist_ok=True)
            with INBOX.open("a", encoding="utf-8") as f:
                f.write(a + "\n")

    def open_claude(self):
        try:
            os.startfile("claude://")
        except Exception:
            pass

    def poll(self, force=False):
        try:
            d = json.loads(LIVE.read_text(encoding="utf-8"))
        except Exception:
            return
        if time.time() * 1000 - d.get("t", 0) > 15000:
            d["caption"] = "Claude is closed"
            d["pet"] = {**d.get("pet", {}), "asleep": True}
        self.asleep = bool(d.get("pet", {}).get("asleep"))
        key = json.dumps([d.get("form"), d.get("caption"), d.get("limits"), d.get("news")])
        if key == self.last and not force:
            return
        self.last = key
        self.page().runJavaScript(f"window.scree && window.scree({json.dumps(d)})")

    def menu(self, pos):
        m = QMenu(self)
        for label, act in (("Pet", "pet"), ("Feed a crystal", "feed"), ("Play", "play"),
                           ("Wake up" if self.asleep else "Tuck in", "wake" if self.asleep else "sleep")):
            a = QAction(label, m)
            a.triggered.connect(lambda _=False, x=act: self.command(x))
            m.addAction(a)
        m.addSeparator()
        hide = QAction("Hide for an hour", m)
        hide.triggered.connect(lambda: (self.hide(), QTimer.singleShot(3600000, self.show)))
        quit_ = QAction("Quit Scree", m)
        quit_.triggered.connect(QApplication.quit)
        m.addAction(hide)
        m.addAction(quit_)
        m.exec(self.mapToGlobal(pos))


if __name__ == "__main__":
    app = QApplication(sys.argv)
    app.setQuitOnLastWindowClosed(False)
    pet = Pet()
    pet.show()
    sys.exit(app.exec())
