"""Write one self-contained HTML page per infographic (BKM report palette), for headless-Chrome PNG capture.

Usage: python3 scripts/bkm-report/figures.py [source.html] [out-dir]   (defaults: the public report, output/bkm-figs)
"""
import json, re, sys, html, os, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/bkm-health-requirements.html"
src = SRC.read_text(encoding="utf-8")
OUT = sys.argv[2] if len(sys.argv) > 2 else str(ROOT / "output/bkm-figs")
os.makedirs(OUT, exist_ok=True)
ROWS = json.loads(re.search(r"const ROWS = (\[.*?\]);\n", src, re.S).group(1))
ST = ["Have", "Partial", "WIP", "Missing", "Unverified"]
esc = lambda s: html.escape(str(s), quote=True)
cnt = lambda rows, s: sum(1 for r in rows if r["status"] == s)

CSS = """
:root{--bg:#f5f7fb;--surface:#fff;--ink:#0a2240;--text:#1d2c42;--muted:#5a6a81;--line:#d9e0ea;--accent-soft:#e7edf6;
--Have:#2e9a63;--Partial:#d99a1c;--WIP:#6d52ff;--Missing:#d2463c;--Unverified:#98a5b7;
--S:#cfdbee;--M:#8ea6cf;--L:#4a6aa0;--XL:#0a2240;
--font:"Figtree","Helvetica Neue",Arial,sans-serif;--mono:"Inconsolata",ui-monospace,Menlo,monospace}
*{box-sizing:border-box}html,body{margin:0;background:var(--bg)}
body{font-family:var(--font);color:var(--text);font-size:16px;line-height:1.45;width:960px}
.fig{width:960px;padding:32px 36px;background:var(--bg)}
.label{font-family:var(--mono);font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.legend{display:flex;flex-wrap:wrap;gap:8px 24px;margin:0;padding:0;list-style:none;font-size:15px;color:var(--text)}
.legend li{display:flex;align-items:center;gap:8px}.legend b{color:var(--ink);font-weight:600}
.legend .pct{color:var(--muted)}
.dot{width:12px;height:12px;border-radius:3px;flex:none}
.bar{display:flex;gap:2px;height:30px}
.bar span{display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;min-width:0;overflow:hidden}
.bar span:first-child{border-radius:6px 0 0 6px}.bar span:last-child{border-radius:0 6px 6px 0}.bar span:only-child{border-radius:6px}
.on-dark{color:#fff}.on-light{color:var(--ink)}
.note{font-size:15px;color:var(--text);border-left:3px solid var(--ink);background:var(--accent-soft);padding:10px 14px;border-radius:0 6px 6px 0}
"""
ON = {"Have": "on-dark", "Partial": "on-light", "WIP": "on-dark", "Missing": "on-dark", "Unverified": "on-light",
      "S": "on-light", "M": "on-light", "L": "on-dark", "XL": "on-dark"}


def page(name, body, extra_css="", script=""):
    doc = (f'<!doctype html><html><head><meta charset="utf-8">'
           f'<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Figtree:wght@400;500;600;700&family=Inconsolata:wght@500&display=swap">'
           f'<style>{CSS}{extra_css}</style></head><body><div class="fig" id="fig">{body}</div>'
           f'<script>{script}document.fonts.ready.then(()=>{{document.title="H="+Math.ceil(document.getElementById("fig").getBoundingClientRect().height)}});</script></body></html>')
    open(os.path.join(OUT, name + ".html"), "w", encoding="utf-8").write(doc)


def stack(rows_counts, unit, keys):
    """rows_counts: list of (key, n). unit: px per item. Labels hidden when a segment is too narrow."""
    segs = []
    for k, n in rows_counts:
        if not n:
            continue
        w = n * unit
        lab = str(n) if w >= 22 else ""
        segs.append(f'<span class="{ON[k]}" style="width:{w:.1f}px;background:var(--{k})" title="{k}: {n}">{lab}</span>')
    return f'<div class="bar">{"".join(segs)}</div>'


# 1. Status overview -------------------------------------------------------------
tot = len(ROWS)
track_area = 560
unit = track_area / max(sum(1 for r in ROWS if r["track"] == t) for t in ("Theme", "Platform"))
rows = ""
for t in ("Theme", "Platform"):
    rs = [r for r in ROWS if r["track"] == t]
    rows += (f'<div class="row"><span class="name">{t}</span>{stack([(s, cnt(rs, s)) for s in ST], unit, ST)}'
             f'<span class="tot">{len(rs)}</span></div>')
legend = "".join(f'<li><span class="dot" style="background:var(--{s})"></span>{s} <b>{cnt(ROWS, s)}</b>'
                 f'<span class="pct">{round(100 * cnt(ROWS, s) / tot)}%</span></li>' for s in ST)
page("01-status-overview", f"""
<div class="wrap">
  <div class="hero"><div class="big">{tot}</div><div class="cap">requirements checked<br><span>54 theme · 28 platform</span></div></div>
  <div class="right"><div class="rows">{rows}</div><ul class="legend">{legend}</ul></div>
</div>""", """
.wrap{display:grid;grid-template-columns:170px 1fr;gap:32px;align-items:center}
.big{font-size:76px;line-height:1;font-weight:700;color:var(--ink);letter-spacing:-.02em}
.cap{font-size:16px;color:var(--text);margin-top:8px}.cap span{color:var(--muted);font-size:14px}
.rows{display:grid;gap:14px;margin-bottom:22px}
.row{display:grid;grid-template-columns:88px auto 1fr;gap:14px;align-items:center}
.row .name{font-weight:600;color:var(--ink)}.row .tot{font-family:var(--mono);color:var(--muted);font-size:15px}
.legend .pct{font-size:14px}
""")

# 2. Status by area ----------------------------------------------------------------
areas = collections.OrderedDict()
for r in ROWS:
    areas.setdefault((r["track"], r["area"]), []).append(r)
maxn = max(len(v) for v in areas.values())
unit = 600 / maxn
body = '<ul class="legend top">' + "".join(f'<li><span class="dot" style="background:var(--{s})"></span>{s}</li>' for s in ST) + "</ul>"
for t in ("Theme", "Platform"):
    body += f'<div class="grp label">{t}</div>'
    for (tt, a), rs in areas.items():
        if tt != t:
            continue
        miss = cnt(rs, "Missing")
        body += (f'<div class="row"><span class="name">{esc(a)}</span>{stack([(s, cnt(rs, s)) for s in ST], unit, ST)}'
                 f'<span class="tot">{len(rs)}</span></div>')
body += ('<p class="note"><b>Subscriptions is the emptiest area:</b> 4 of its 5 requirements are missing and none are covered. '
         'Product page has the most rows to work through (21), but most are partly there already.</p>')
page("02-status-by-area", body, """
.top{margin-bottom:18px}.grp{margin:16px 0 8px}.grp:first-of-type{margin-top:0}
.row{display:grid;grid-template-columns:190px auto 1fr;gap:14px;align-items:center;margin-bottom:10px}
.row .name{font-weight:500;color:var(--ink);font-size:15px}.row .tot{font-family:var(--mono);color:var(--muted);font-size:15px}
.bar{height:26px}.note{margin:20px 0 0}
""")

# 3. Build effort by phase -------------------------------------------------------
PH = {0: "Launch", 1: "Parity", 2: "Beyond"}
SZ = ["S", "M", "L", "XL"]
todo = [r for r in ROWS if r["route"] != "Configure"]
maxn = max(sum(1 for r in todo if r["phase"] == p) for p in PH)
unit = 600 / maxn
body = ""
for p in PH:
    rs = [r for r in todo if r["phase"] == p]
    c = collections.Counter(r["size"] for r in rs)
    segs = []
    for k in SZ:
        n = c.get(k, 0)
        if n:
            w = n * unit
            lab = f"{k} {n}" if w >= 46 else (str(n) if w >= 18 else "")
            segs.append(f'<span class="{ON[k]}" style="width:{w:.1f}px;background:var(--{k})" title="{k}: {n}">{lab}</span>')
    body += (f'<div class="row"><span class="name"><span class="label">Phase {p}</span><br><b>{PH[p]}</b></span>'
             f'<div class="bar">{"".join(segs)}</div><span class="tot">{len(rs)} items</span></div>')
body += ('<ul class="legend">' + "".join(f'<li><span class="dot" style="background:var(--{k})"></span><b>{k}</b> {d}</li>' for k, d in
                                        [("S", "days"), ("M", "weeks"), ("L", "a quarter"), ("XL", "several quarters")]) + "</ul>")
xl = [r for r in ROWS if r["size"] == "XL"]
body += ('<p class="note"><b>All three XL builds are needed for launch:</b> '
         + ", ".join(f'{esc(r["req"].lower())} ({r["id"]})' for r in xl[:-1]) + f' and {esc(xl[-1]["req"].lower())} ({xl[-1]["id"]}).</p>')
page("03-build-effort", body, """
.row{display:grid;grid-template-columns:110px auto 1fr;gap:16px;align-items:center;margin-bottom:16px}
.row .name{line-height:1.25}.row .name b{color:var(--ink);font-size:17px;font-weight:600}
.row .tot{font-family:var(--mono);color:var(--muted);font-size:15px}
.bar{height:38px}.legend{margin-top:6px}.note{margin:20px 0 0}
""")

# 4. Where each app's job goes --------------------------------------------------
apps = [("recharge", "Recharge", "Subscriptions, billing, portal"), ("klaviyo", "Klaviyo", "Email, SMS, forms, reviews"),
        ("restock", "Restock Rocket", "Back-in-stock, pre-orders"), ("gorgias", "Gorgias", "Chat, help centre, tickets"),
        ("instant", "Instant", "Two landing pages"), ("transcy", "Transcy", "Currency switcher"),
        ("cookiebot", "Cookiebot", "Cookie consent"), ("triple", "Triple Whale", "Ad attribution"),
        ("meta", "Meta and TikTok pixels", "Ad tracking"), ("clarity", "Microsoft Clarity", "Session recording")]
dests = [("platform", "Build in Commerce Cloud", "Subscriptions, billing and the subscriber portal · reviews · pre-orders", "Nothing exists yet for subscriptions or reviews."),
         ("cloud", "Marketing Cloud and Service Cloud", "Email, SMS and signup forms · back-in-stock journey · chat, help centre and tickets", "Available today; needs storefront and subscription events."),
         ("theme", "Store Builder and theme", "Landing pages · currency and country switcher", "The switcher needs markets in the platform first."),
         ("third", "Third party, through a script or pixel surface", "Consent banner · attribution, ad and session pixels", "The surface itself is missing (T13, P21).")]
links = [("recharge", "platform"), ("klaviyo", "platform"), ("klaviyo", "cloud"), ("restock", "platform"), ("restock", "cloud"),
         ("gorgias", "cloud"), ("instant", "theme"), ("transcy", "theme"), ("cookiebot", "third"), ("triple", "third"),
         ("meta", "third"), ("clarity", "third")]
body = ('<div class="heads"><span class="label">BKM app today</span><span class="label">Where the job goes in Maropost</span></div>'
        '<div class="map"><svg id="wires"></svg><div class="apps">'
        + "".join(f'<div class="app" id="a-{k}"><b>{esc(n)}</b><span>{esc(d)}</span></div>' for k, n, d in apps)
        + '</div><div class="dests">'
        + "".join(f'<div class="dest" id="d-{k}"><b>{esc(t)}</b><span>{esc(j)}</span><em>{esc(n)}</em></div>' for k, t, j, n in dests)
        + "</div></div>")
script = ("const L=" + json.dumps(links) + ";function wire(){const m=document.querySelector('.map').getBoundingClientRect();const s=document.getElementById('wires');"
          "s.setAttribute('width',m.width);s.setAttribute('height',m.height);let p='';for(const[a,d]of L){const A=document.getElementById('a-'+a).getBoundingClientRect();"
          "const D=document.getElementById('d-'+d).getBoundingClientRect();const x1=A.right-m.left,y1=A.top+A.height/2-m.top,x2=D.left-m.left,y2=D.top+D.height/2-m.top,cx=(x1+x2)/2;"
          "p+=`<path d=\"M${x1} ${y1} C${cx} ${y1} ${cx} ${y2} ${x2} ${y2}\"/><circle cx=\"${x2}\" cy=\"${y2}\" r=\"4\"/>`}s.innerHTML=p}"
          "document.fonts.ready.then(wire);")
page("04-app-routing", body, """
.heads{display:grid;grid-template-columns:270px 1fr 420px;margin-bottom:12px}.heads span:last-child{grid-column:3}
.map{position:relative;display:grid;grid-template-columns:270px 1fr 420px;align-items:center}
#wires{position:absolute;inset:0;pointer-events:none;overflow:visible}
#wires path{fill:none;stroke:#98a5b7;stroke-width:2}#wires circle{fill:#5a6a81}
.apps{display:grid;gap:10px;grid-column:1}.dests{display:grid;gap:22px;grid-column:3}
.app{background:var(--surface);border:1px solid var(--line);border-radius:10px;padding:8px 14px;display:grid;line-height:1.3;position:relative}
.app b{color:var(--ink);font-weight:600;font-size:15px}.app span{color:var(--muted);font-size:13px}
.dest{background:var(--surface);border:1px solid var(--line);border-left:4px solid var(--ink);border-radius:10px;padding:14px 16px;display:grid;gap:4px;line-height:1.35;position:relative}
.dest b{color:var(--ink);font-weight:600;font-size:16px}.dest span{font-size:14px;color:var(--text)}.dest em{font-style:normal;font-size:13px;color:var(--muted)}
""", script)

# 5. Theme sources -----------------------------------------------------------------
groups = [("Custom-coded for BKM", "about 20", "custom", ["Logo slider", "Benefit pillars", "Dosing steps", "Comparison table", "Ingredient science", "Ingredient cards", "How to use", "Athlete grid", "Sticky add-to-cart bar", "USP marquee", "Persona stats", "Curated reviews grid", "Quote grid", "Instagram feed", "Landing promo", "Landing buy box", "Embedded tool", "Button variant picker", "Delivery estimator", "Add-on offer"]),
          ("Stock theme sections", "23", "stock", ["Announcement bar", "Header", "Footer", "Video hero", "Image with text", "Tabbed collections", "Overlapping images", "Divider", "Text", "Icons row", "Collection grid", "Product buy box", "Accordions", "Related products", "Page hero", "Blog posts", "Article", "Recommended posts", "Contact form", "Mosaic", "Cart", "Search", "Page"]),
          ("Injected by apps", "7", "apps", ["Purchase options (Recharge)", "Rating stars (Klaviyo)", "Review list (Klaviyo)", "Chat bubble (Gorgias)", "Cookie banner (Cookiebot)", "Landing page body (Instant)", "Currency switcher (Transcy)"])]
n = {g[2]: len(g[3]) for g in groups}
bar = ("".join(f'<span class="seg-{k}" style="flex:{n[k]}">{lab} · {n[k]}</span>' for k, lab in
               [("custom", "Custom-coded"), ("stock", "Stock theme"), ("apps", "Apps")]))
cols = "".join(f'<div class="col col-{k}"><div class="ch"><b>{esc(t)}</b><span>{c}</span></div><ul class="chips">'
               + "".join(f"<li>{esc(i)}</li>" for i in items) + "</ul></div>" for t, c, k, items in groups)
page("05-theme-sources", f'<div class="mix">{bar}</div><div class="cols">{cols}</div>', """
.mix{display:flex;gap:2px;height:34px;margin-bottom:24px}
.mix span{display:flex;align-items:center;padding:0 12px;font-size:14px;font-weight:600;white-space:nowrap;overflow:hidden}
.mix span:first-child{border-radius:6px 0 0 6px}.mix span:last-child{border-radius:0 6px 6px 0}
.seg-custom{background:var(--ink);color:#fff}.seg-stock{background:#cfdbee;color:var(--ink)}.seg-apps{background:#e3e8ef;color:var(--ink)}
.cols{display:grid;grid-template-columns:1.15fr 1.15fr .8fr;gap:24px;align-items:start}
.ch{display:flex;align-items:baseline;justify-content:space-between;border-top:2px solid var(--line);padding-top:10px;margin-bottom:12px}
.col-custom .ch{border-top-color:var(--ink)}
.ch b{color:var(--ink);font-weight:600}.ch span{font-family:var(--mono);color:var(--muted);font-size:14px}
.chips{display:flex;flex-wrap:wrap;gap:6px;margin:0;padding:0;list-style:none}
.chips li{font-size:13.5px;padding:3px 9px;border:1px solid var(--line);border-radius:6px;background:var(--surface);color:var(--text)}
.col-custom .chips li{border-color:#9fb1cf;background:#eef2f9;color:var(--ink)}
""")
print("written", sorted(os.listdir(OUT)))
