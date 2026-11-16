"""Confluence page body (HTML format for the Atlassian MCP) for the BKM report: native tiles/cards + the five uploaded infographics.

Usage: python3 scripts/bkm-report/confluence-body.py [source.html] [out-file]   (defaults: the public report, output/bkm-figs/confluence-body.html)
"""
import json, re, sys, html, collections
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SRC = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "public/bkm-health-requirements.html"
src = SRC.read_text(encoding="utf-8")
ROWS = json.loads(re.search(r"const ROWS = (\[.*?\]);\n", src, re.S).group(1))
ST = ["Have", "Partial", "WIP", "Missing", "Unverified"]
COLOR = {"Have": "green", "Partial": "yellow", "WIP": "purple", "Missing": "red", "Unverified": "neutral"}
PH = {0: "Launch", 1: "Parity", 2: "Beyond"}
VERCEL = "https://ai-first-maropost.vercel.app/bkm-health-requirements.html"
REPO_DOC = "https://github.com/deepvaid/Unified-AI-First/blob/master/docs/store-builder/bkm-health-requirements.md"
COLL = "contentId-6973554714"
MEDIA = {  # attachment media ids on DES 6973554714, uploaded through the editor on 2026-11-16; re-uploads get new ids
    "overview": ("b7193528-d7c1-4723-8084-afb52c50221f", 1920, 390),
    "area": ("51106f49-6b4f-4415-8b78-92eded505649", 1920, 1122),
    "effort": ("2c4d8ec5-32ac-4d32-8571-7383246c00c2", 1920, 682),
    "apps": ("1289d5fd-36a2-411e-a6d1-bdb326f2acf4", 1920, 1458),
    "theme": ("fb52e9b3-b9c4-4272-a5bb-78455f46a774", 1920, 932),
}

esc = lambda s: html.escape(str(s), quote=False)
attr = lambda s: html.escape(str(s), quote=True)
rich = lambda s: re.sub(r"`([^`]+)`", r"<code>\1</code>", esc(s))
loz = lambda s: f'<span data-type="status" data-color="{COLOR[s]}">{s}</span>'
cnt = lambda rows, s: sum(1 for r in rows if r["status"] == s)
todo = [r for r in ROWS if r["route"] != "Configure"]
verify = [r for r in ROWS if r["status"] == "Unverified" or re.search(r"not captured|unknown whether", r["mcc"])]
xl = [r for r in ROWS if r["size"] == "XL"]

out = []
w = out.append


def fig(key, alt, caption):
    mid, iw, ih = MEDIA[key]
    w(f'<figure data-type="media-single" data-layout="wide" data-width="960" data-width-type="pixel"><div data-type="media" data-media-type="file" data-id="{mid}" '
      f'data-collection="{COLL}" data-alt="{attr(alt)}" data-width="{iw}" data-height="{ih}"></div>'
      f'<figcaption>{esc(caption)}</figcaption></figure>')


def panel(icon, color, inner):
    return f'<div data-type="panel-custom" data-icon="{icon}" data-color="{color}">{inner}</div>'


def cols(kind, cells, widths=None):
    ws = widths or [None] * len(cells)
    body = "".join(f'<div data-type="column"{f" data-width=\"{x}\"" if x else ""}>{c}</div>' for c, x in zip(cells, ws))
    return f'<section data-type="{kind}">{body}</section>'


# Header ----------------------------------------------------------------------
w('<p><strong>Owner:</strong> Deepak V. (UX) · <strong>Status:</strong> '
  '<span data-type="status" data-color="blue">In review</span> · <strong>Crawled:</strong> '
  '<time datetime="2026-11-13">13 Nov 2026</time> · <strong>Updated:</strong> <time datetime="2026-11-16">16 Nov 2026</time></p>')
w(f'<p><strong>Reference store 01:</strong> <a href="https://bkm.health/">bkm.health</a> · '
  f'<strong>Filterable version:</strong> <a href="{VERCEL}">BKM on Commerce Cloud</a> · '
  f'<strong>Full write-up:</strong> <a href="{REPO_DOC}">bkm-health-requirements.md</a></p>')
w('<p>BKM sells 8 supplements, mostly on subscription, to 33 countries from a Shopify store at bkm.health. '
  'This page lists what that store needs from a theme and from the platform, and how much of it Commerce Cloud has today.</p>')
w('<div data-type="panel-info"><p>Commerce Cloud statuses come from the UAT capture in the design-system repo (Sept to Oct 2026), '
  'not the live product. The capture holds real section and file names but stand-in contents, so <strong>Missing</strong> means '
  '"not found in the capture". The last section lists what engineering should confirm.</p></div>')
w('<div data-type="extension" data-extension-key="toc" data-extension-type="com.atlassian.confluence.macro.core" '
  'data-parameters=\'{"macroParams":{"maxLevel":{"value":"2"},"exclude":{"value":"^[0-9£].*"}},"macroMetadata":{"schemaVersion":{"value":"1"},"title":"Table of Contents"}}\'></div>')

# At a glance -----------------------------------------------------------------
w("<h2>At a glance</h2>")
p0 = sum(1 for r in todo if r["phase"] == 0)
tiles = [(":no_entry:", "#FFEBE6", "8", "launch blockers"),
         (":construction:", "#FFFAE6", str(p0), "to build before launch"),
         (":hourglass:", "#EAE6FF", str(len(xl)), "multi-quarter builds"),
         (":question:", "#F4F5F7", str(len(verify)), "questions for engineering")]
w(cols("layout-section", [panel(i, c, f"<h2>{n}</h2><p>{esc(t)}</p>") for i, c, n, t in tiles], [25, 25, 25, 25]))
fig("overview", f"Status of all {len(ROWS)} requirements: Theme 54 (11 have, 22 partial, 1 WIP, 17 missing, 3 unverified), "
    "Platform 28 (3 have, 12 partial, 12 missing, 1 unverified).",
    f"{len(ROWS)} requirements by status. Only {cnt(ROWS, 'Have')} ({round(100 * cnt(ROWS, 'Have') / len(ROWS))}%) are covered today.")
tbl = ("<table><thead><tr><th>Track</th>" + "".join(f"<th>{loz(s)}</th>" for s in ST) + "<th>Total</th></tr></thead><tbody>")
for t in ["Theme", "Platform"]:
    rs = [r for r in ROWS if r["track"] == t]
    tbl += f"<tr><td><strong>{t}</strong></td>" + "".join(f"<td>{cnt(rs, s)}</td>" for s in ST) + f"<td>{len(rs)}</td></tr>"
tbl += ("<tr><td><strong>All</strong></td>" + "".join(f"<td><strong>{cnt(ROWS, s)}</strong></td>" for s in ST)
        + f"<td><strong>{len(ROWS)}</strong></td></tr></tbody></table>")
w(f"<details><summary>Status counts as a table</summary>{tbl}</details>")

# Launch blockers -------------------------------------------------------------
w("<h2>Launch blockers: eight things stand between BKM and a launch</h2>")
blockers = [
    ("Subscriptions", "Plans, prepaid supplies, recurring billing and a self-service portal. Nothing exists, and it is BKM's core revenue model.", "P01 to P05, T38"),
    ("Selling across markets", "Per-market currency and prices, market URLs, shipping zones and rates, VAT, and European payment methods.", "P06, P07, P09 to P11, T06"),
    ("Structured product content", "Subtitle, chips, ingredients, supplement facts and FAQs have nowhere to live on a product. Several product-page sections read from it.", "P13"),
    ("A template per product, and sections in code", "Every BKM product page is its own composition; Commerce Cloud has one template per type. Whether a developer can add a coded section to the builder is unconfirmed.", "T11, T12"),
    ("A handful of universal sections", "Video hero, tabbed collections, accordion, comparison table, announcement bar.", "T01, T22, T24, T30, T43, T48"),
    ("Reviews", "Only a rating snippet exists. BKM shows stars on every card and a review list on each product.", "P17, T35"),
    ("Consent, pixels and a place for scripts", "Needed to trade in the EU and to keep BKM's ad attribution working.", "T07, T13, P21, P22"),
    ("Migration", "Live subscriptions and their stored payment methods are the risky part.", "P27"),
]
cards = [panel(":no_entry:", "#FFEBE6", f"<h3>{i}. {esc(h)}</h3><p>{esc(p)}</p><p><em>Rows: {ids}</em></p>")
         for i, (h, p, ids) in enumerate(blockers, 1)]
for k in range(0, len(cards), 2):
    w(cols("layout-two-equal", cards[k:k + 2]))
w('<div data-type="panel-success"><p><strong>Already covered:</strong> catalog basics, collections, promotions, customer accounts, blog, search, '
  'policy pages and most plain content sections. Email, SMS, popups, chat and helpdesk can come from Marketing Cloud and Service Cloud.</p></div>')

# Store profile ---------------------------------------------------------------
w("<h2>Store profile: what BKM is running</h2>")
facts = [(":shopping_cart:", "Platform", "Shopify, Palo Alto 5.6 theme plus about 20 custom-coded sections"),
         (":package:", "Catalog", "8 products, 14 variants, 12 collections"),
         (":page_facing_up:", "Content", "10 pages, 5 blogs, 6 articles"),
         (":globe_with_meridians:", "Markets", "Sweden (SEK), UK (GBP), Poland; English only"),
         (":truck:", "Ships to", "33 countries: EU, UK, NO, CH, IS, US, UAE"),
         (":gift:", "Offers", "Free shipping over 549 kr, 30-day money-back guarantee")]
fc = [panel(i, "#F4F5F7", f"<p><strong>{k}</strong></p><p>{esc(v)}</p>") for i, k, v in facts]
w(cols("layout-three-equal", fc[:3]))
w(cols("layout-three-equal", fc[3:]))
w("<h3>Purchase options on one product page</h3>")
plans = [(":star:", "#E3FCEF", "3-month supply", "586 kr", "30% off · 3 units · ships every 3 months"),
         (":repeat:", "#DEEBFF", "Monthly", "223 kr", "20% off · 1 unit · ships every month"),
         (":shopping_bags:", "#F4F5F7", "One-time", "279 kr", "Full price · 1 unit · ships once")]
w(cols("layout-three-equal", [panel(i, c, f"<p><strong>{n}</strong></p><h2>{p}</h2><p>{d}</p>") for i, c, n, p, d in plans]))
w("<p>Prices shown for Electrolytes. Run by Recharge. The account icon leads to Recharge's portal, which signs customers in with a code "
  "sent by SMS and email. Tranquil also carries a pre-order plan.</p>")
w("<h3>Prices are set per market, not converted</h3>")
mk = [(":flag_se:", "Sweden", "/", "SEK", "399 to 419"), (":flag_gb:", "United Kingdom", "/en-gb", "GBP", "£33.99"),
      (":flag_pl:", "Poland", "/en-pl", "PLN (inferred)", "159.00")]
w(cols("layout-three-equal", [panel(i, "#DEEBFF", f"<p><strong>{n}</strong> · <code>{u}</code></p><h2>{p}</h2><p>{c}</p>")
                               for i, n, u, c, p in mk]))
w("<p>Prices shown for Tranquil. Payment methods shown: cards, Apple Pay, Google Pay, Klarna, iDEAL, Bancontact, BLIK, MobilePay, MB WAY, Bizum, Satispay.</p>")

# App stack -------------------------------------------------------------------
w("<h2>App stack: eleven apps, and where each job would go</h2>")
fig("apps", "Diagram mapping BKM's apps to where each job would go in Maropost. Build in Commerce Cloud: Recharge subscriptions, Klaviyo reviews, "
    "Restock Rocket pre-orders. Marketing Cloud and Service Cloud: Klaviyo email and SMS, Restock Rocket back-in-stock, Gorgias. "
    "Store Builder and theme: Instant, Transcy. Third party through a script or pixel surface: Cookiebot, Triple Whale, Meta and TikTok pixels, Microsoft Clarity.",
    "Each app's job, mapped to where it would go. The script and pixel surface the last group needs does not exist yet.")
apps = [("Recharge", "Subscription plans, recurring billing, customer portal and login", "Build in platform"),
        ("Klaviyo", "Email and SMS, onsite signup forms; also review requests, star ratings and the review list", "Marketing Cloud for messaging; reviews are a build, or a third party at launch"),
        ("Gorgias", "Live chat, help centre, proactive chat campaigns, tickets", "Service Cloud and Chatbot"),
        ("Instant", "Visual page builder, used for two landing pages", "Store Builder"),
        ("Restock Rocket", "Back-in-stock alerts, and probably the pre-order plan on Tranquil (inferred)", "Marketing Cloud journey on stock change; pre-orders in platform"),
        ("Transcy", "Currency and language switcher", "Build in theme, on top of markets"),
        ("Cookiebot", "Cookie consent", "Third party, through a script surface"),
        ("Triple Whale", "Ad attribution pixel", "Third party, through a pixel surface"),
        ("Meta and TikTok pixels", "Ad tracking (TikTok inferred from pixel config)", "Pixel surface"),
        ("Microsoft Clarity", "Session recording and heatmaps", "Pixel surface")]
t = '<table><thead><tr><th data-colwidth="170">App</th><th data-colwidth="330">What it does for BKM</th><th data-colwidth="300">Commerce Cloud route</th></tr></thead><tbody>'
t += "".join(f"<tr><td><strong>{esc(a)}</strong></td><td>{esc(d)}</td><td>{esc(r)}</td></tr>" for a, d, r in apps) + "</tbody></table>"
w(f"<details><summary>App details as a table</summary>{t}</details>")

# Theme -------------------------------------------------------------------------
w("<h2>Theme: about half of the storefront was written by an agency</h2>")
w("<p>If Commerce Cloud lets a developer add a coded section with settings (T12), most of the custom-coded sections can be built per brand the same way. "
  "If it cannot, each one becomes a native section to build.</p>")
fig("theme", "Where BKM's storefront sections come from: about 20 custom-coded for BKM, 23 stock Palo Alto theme sections, and 7 injected by apps.",
    "Where each storefront section comes from. The custom-coded group is the one that depends on T12.")
sources = [("Stock theme sections (23)", "Announcement bar, Header, Footer, Video hero, Image with text, Tabbed collections, Overlapping images, Divider, Text, Icons row, Collection grid, Product buy box, Accordions, Related products, Page hero, Blog posts, Article, Recommended posts, Contact form, Mosaic, Cart, Search, Page"),
           ("Custom-coded for BKM (about 20)", "Logo slider, Benefit pillars, Dosing steps, Comparison table, Ingredient science, Ingredient cards, How to use, Athlete grid, Sticky add-to-cart bar, USP marquee, Persona stats, Curated reviews grid, Quote grid, Instagram feed, Landing promo, Landing buy box, Embedded tool, Button variant picker, Delivery estimator, Add-on offer"),
           ("Injected by apps (7)", "Purchase options (Recharge), Rating stars (Klaviyo), Review list (Klaviyo), Chat bubble (Gorgias), Cookie banner (Cookiebot), Landing page body (Instant), Currency switcher (Transcy)")]
t = '<table><thead><tr><th data-colwidth="220">Source</th><th data-colwidth="580">Sections</th></tr></thead><tbody>'
t += "".join(f"<tr><td><strong>{esc(h)}</strong></td><td>{esc(s)}</td></tr>" for h, s in sources) + "</tbody></table>"
w(f"<details><summary>Section list as text</summary>{t}</details>")

# Gap matrix ------------------------------------------------------------------
w("<h2>Gap matrix: every requirement against the capture</h2>")
fig("area", "Status by area. Theme: Global chrome 10, Builder 4, Page templates 7, Content sections 12, Product page 21. "
    "Platform: Subscriptions 5 (4 missing, none covered), Markets 7, Catalog and content 8, Growth and operations 8.",
    "Where the gaps are. Subscriptions is the emptiest area; Product page has the most rows but most are partly there.")
w("<p><strong>Size:</strong> S days, M weeks, L a quarter-scale project, XL a multi-quarter programme. Rough, from the outside. "
  "<strong>Phase:</strong> 0 Launch, 1 Parity, 2 Beyond. Click a column header to sort. "
  f'To filter by track, status or phase, use the <a href="{VERCEL}">filterable version</a>.</p>')
CW = [("ID", 60), ("Requirement", 180), ("BKM today", 260), ("Status", 110), ("Commerce Cloud capture", 280), ("Route", 120), ("Size", 60), ("Phase", 90)]
for tr in ["Theme", "Platform"]:
    rs = [r for r in ROWS if r["track"] == tr]
    w(f"<h3>{tr} ({len(rs)})</h3>")
    w('<table data-layout="full-width"><thead><tr>' + "".join(f'<th data-colwidth="{c}">{h}</th>' for h, c in CW) + "</tr></thead><tbody>")
    for r in rs:
        cells = [r["id"], f'<p><strong>{esc(r["req"])}</strong></p><p style="font-size: 14px">{esc(r["area"])}</p>',
                 rich(r["bkm"]), loz(r["status"]), rich(r["mcc"]), esc(r["route"]), r["size"], f'{r["phase"]} {PH[r["phase"]]}']
        w("<tr>" + "".join(f"<td>{v}</td>" for v in cells) + "</tr>")
    w("</tbody></table>")

# Build list --------------------------------------------------------------------
w("<h2>Build list: what to build, in three phases</h2>")
fig("effort", "Items to build by phase and size. Phase 0 Launch: 42 items (12 S, 17 M, 10 L, 3 XL). Phase 1 Parity: 24 (13 S, 10 M, 1 L). Phase 2 Beyond: 2 (1 S, 1 L).",
    "How much there is to build in each phase. All three XL builds (" + ", ".join(r["id"] for r in xl) + ") sit in Phase 0.")
w("<p>Only rows that need work are listed. Rows already covered are left out. Size in brackets.</p>")
colhtml = []
for p in PH:
    rs = [r for r in todo if r["phase"] == p]
    h = f"<h3>Phase {p}: {PH[p]} ({len(rs)} items)</h3>"
    for a in dict.fromkeys(r["area"] for r in rs):
        h += f"<p><strong>{esc(a)}</strong></p><ul>" + "".join(f'<li>{r["id"]} {esc(r["req"])} ({r["size"]})</li>' for r in rs if r["area"] == a) + "</ul>"
    colhtml.append(h)
w(cols("layout-three-equal", colhtml))

# Verify ------------------------------------------------------------------------
w("<h2>Open questions: verify with engineering</h2>")
w("<p>The capture cannot answer these. Each one changes a status above. Every Missing row is also worth a quick confirmation, Phase 0 first. "
  "Tick an item once it is confirmed and update its status in the gap matrix.</p>")
w('<ul data-type="task-list">' + "".join(f'<li data-type="task-item"><input type="checkbox"> {r["id"]} <strong>{esc(r["req"])}.</strong> {rich(r["mcc"])}</li>'
                                         for r in verify) + "</ul>")

# Method ------------------------------------------------------------------------
w("<h2>Method: how this was gathered, and what was not seen</h2><ul>"
  "<li>Public pages only, read-only requests. No login, nothing added to the cart, no checkout started.</li>"
  "<li>Read: home, two collections, the Electrolytes and Tranquil product pages (Swedish and UK), cart, search, blog and two articles, all 10 content pages, policies, account login.</li>"
  "<li>Not seen: checkout, the logged-in account and subscription portal, transactional emails, the other six product pages, mobile layouts beyond the navigation drawer.</li>"
  f'<li>The full written version, with the catalog table, design tokens, section order per template and migration notes, is in the repo at <a href="{REPO_DOC}">docs/store-builder/bkm-health-requirements.md</a>.</li></ul>')

body = "\n".join(out)
assert "—" not in body, "em dash found"
OUT = Path(sys.argv[2]) if len(sys.argv) > 2 else ROOT / "output/bkm-figs/confluence-body.html"
OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(body, encoding="utf-8")
print(len(body), "chars;", len(todo), "to build;", len(verify), "to verify")
