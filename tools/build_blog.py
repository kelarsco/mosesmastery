#!/usr/bin/env python3
"""Builds the blog (blog/index.html + blog/<slug>/index.html), refreshes the shared header/menu/footer on every page,
and rewrites sitemap.xml.   Run from the project root:   python3 tools/build_blog.py [--covers]
--covers also renders asset/blog/<slug>.jpg (needs: pip install playwright && playwright install chromium)."""
import os, re, sys, json, html
sys.path.insert(0, os.path.dirname(__file__))
from chrome import header, footer
from articles import ARTICLES
from services import SERVICES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://www.mosesmastery.com"
OG = SITE + "/asset/og-image.jpg"
esc = html.escape
def W(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf8", newline="\n").write(text)

# ---------- 1. shared header / footer on the root pages ----------
PAGES = {"index.html": "home", "projects.html": "projects", "contact.html": "contact", "thankyou.html": "", "account.html": ""}
for fn, active in PAGES.items():
    p = os.path.join(ROOT, fn); t = open(p, encoding="utf8").read()
    h = header("", active)
    if "<!-- mm-header -->" in t:
        t = re.sub(r"<!-- mm-header -->.*?<!-- /mm-header -->", lambda m: h, t, flags=re.S)
    else:
        t, n = re.subn(r'(<!-- header start -->\s*)?<header class="header">.*?</header>', lambda m: h, t, count=1, flags=re.S); assert n, fn
    f = footer("")
    if "<!-- mm-footer -->" in t:
        t = re.sub(r"<!-- mm-footer -->.*?<!-- /mm-footer -->", lambda m: f, t, flags=re.S)
    else:
        t, n = re.subn(r'<!-- footer -->.*?<div class="all-right">.*?</div>', lambda m: f, t, count=1, flags=re.S); assert n, fn
    if fn != "account.html" and "js/track.js" not in t:
        t = t.replace('<script src="js/index.js"></script>', '<script src="js/config.js"></script>\n<script src="js/track.js"></script>\n<script src="js/index.js"></script>')
    open(p, "w", encoding="utf8", newline="").write(t)

# ---------- 2. blog pages ----------
def long_date(iso):
    y, m, d = iso.split("-"); mon = ["January","February","March","April","May","June","July","August","September","October","November","December"][int(m) - 1]
    return f"{mon} {int(d)}, {y}"

def head(title, desc, canon, p, og_img, og_type="website", extra=""):
    return f'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc, True)}">
  <meta name="robots" content="index, follow, max-image-preview:large">
  <meta name="author" content="Moses Daniel">
  <meta name="theme-color" content="#0d0d0d">
  <link rel="canonical" href="{canon}">
  <meta property="og:type" content="{og_type}">
  <meta property="og:site_name" content="Moses Mastery">
  <meta property="og:locale" content="en_US">
  <meta property="og:title" content="{esc(title, True)}">
  <meta property="og:description" content="{esc(desc, True)}">
  <meta property="og:url" content="{canon}">
  <meta property="og:image" content="{og_img}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc(title, True)}">
  <meta name="twitter:description" content="{esc(desc, True)}">
  <meta name="twitter:image" content="{og_img}">
  <link rel="icon" href="/favicon.ico" sizes="48x48">
  <link rel="icon" type="image/png" sizes="32x32" href="{p}asset/favicon-32.png">
  <link rel="icon" type="image/png" sizes="16x16" href="{p}asset/favicon-16.png">
  <link rel="apple-touch-icon" sizes="180x180" href="{p}asset/apple-touch-icon.png">
  <link rel="manifest" href="{p}site.webmanifest">
  <link rel="preconnect" href="https://cdnjs.cloudflare.com" crossorigin>
  <link rel="preload" href="/asset/fonts/inter-latin-opsz-normal.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{p}css/style.css">
  <link rel="stylesheet" href="{p}css/blog.css">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css" media="print" onload="this.media='all'"><noscript><link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/7.0.1/css/all.min.css"></noscript>
  <link rel="stylesheet" href="https://assets.calendly.com/assets/external/widget.css" media="print" onload="this.media='all'">
{extra}</head>
'''

def ld(obj): return '  <script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>\n"
ORG = {"@type": "Organization", "@id": SITE + "/#org", "name": "Moses Mastery", "url": SITE + "/", "logo": SITE + "/asset/icon-512.png"}
PERSON = {"@type": "Person", "@id": SITE + "/#person", "name": "Moses Daniel", "url": SITE + "/", "worksFor": {"@id": SITE + "/#org"}}
TAIL = '''<script src="%sjs/config.js"></script>
<script src="%sjs/track.js"></script>
<script src="%sjs/index.js"></script>
<script src="%sjs/sections.js"></script>
<script src="https://assets.calendly.com/assets/external/widget.js" async></script>
</body>
</html>
'''
def cover_img(a, p, cls="", eager=False):
    return (f'<img class="{cls}" src="{p}asset/blog/{a["slug"]}.jpg" alt="{esc(a["title"], True)}" width="1200" height="630" '
            + ('fetchpriority="high"' if eager else 'loading="lazy" decoding="async"') + '>')
def excerpt(a): return a["desc"]

# --- listing
p = "../"
cards = ""
for i, a in enumerate(ARTICLES):
    cards += f'''
      <article class="bl-card">
        <a href="{a["slug"]}/" class="bl-card-img" tabindex="-1" aria-hidden="true">{cover_img(a, p)}</a>
        <div class="bl-card-body">
          <p class="bl-meta"><span class="bl-tag">{a["tag"]}</span><time datetime="{a["date"]}">{long_date(a["date"])}</time><span>{a["mins"]} min read</span></p>
          <h2><a href="{a["slug"]}/">{esc(a["title"])}</a></h2>
          <p>{esc(excerpt(a))}</p>
          <a class="bl-more" href="{a["slug"]}/">Read article <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
        </div>
      </article>'''
lst_ld = {"@context": "https://schema.org", "@graph": [ORG, PERSON,
    {"@type": "Blog", "@id": SITE + "/blog/#blog", "name": "Moses Mastery Blog", "url": SITE + "/blog/", "publisher": {"@id": SITE + "/#org"},
     "blogPost": [{"@type": "BlogPosting", "headline": a["title"], "url": f'{SITE}/blog/{a["slug"]}/', "datePublished": a["date"], "image": f'{SITE}/asset/blog/{a["slug"]}.jpg'} for a in ARTICLES]},
    {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"}]}]}
first = ARTICLES[0]
page = head("Shopify, eCommerce & AI Blog | Moses Mastery", "Practical guides on Shopify conversion rate optimization, SEO, Meta ads, AI automation and store audits, written by Shopify growth specialist Moses Daniel of Moses Mastery.", SITE + "/blog/", p, f'{SITE}/asset/blog/{first["slug"]}.jpg', extra=ld(lst_ld))
page += f'''<body class="bl-page">
  {header(p, "blog")}
  <main id="main">
    <section class="bl-hero">
      <p class="bl-kicker"><span></span>Our blog</p>
      <h1>Insights &amp; <em>Articles.</em></h1>
      <p class="bl-lead">Practical guides on Shopify, conversion, SEO, ads and AI for eCommerce brands. No fluff, just what to do next.</p>
    </section>
    <section class="bl-list" aria-label="Articles">
      <div class="bl-grid">{cards}
      </div>
    </section>
    <section class="bl-cta">
      <h2>Want these ideas applied to <em>your store</em>?</h2>
      <p>Send me your store link and I&rsquo;ll tell you where I&rsquo;d start.</p>
      <a class="bl-btn" href="../contact.html">Request a store review <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
    </section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
W(os.path.join(ROOT, "blog", "index.html"), page)

# --- articles
STITLES = {
    "shopify-conversion-rate-optimization-checklist": "Shopify CRO Checklist: 12 Fixes to Lift Conversions",
    "shopify-seo-guide": "Shopify SEO Guide: Rank Your Store on Google",
    "ai-automation-for-shopify-stores": "AI Automation for Shopify: 7 Workflows to Set Up",
    "meta-ads-for-shopify-stores": "Meta Ads for Shopify: Setup, Creative & Scaling",
    "shopify-store-audit-checklist": "Shopify Store Audit Checklist (Before You Run Ads)",
    "shopify-redesign-or-optimize": "Shopify Redesign vs Optimization: Which to Choose",
}
for idx, a in enumerate(ARTICLES):
    p = "../../"; url = f'{SITE}/blog/{a["slug"]}/'; img = f'{SITE}/asset/blog/{a["slug"]}.jpg'
    toc = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', a["body"])
    toc_html = "".join(f'<li><a href="#{i}">{re.sub(r"^\d+\.\s*", "", t)}</a></li>' for i, t in toc)
    faq_q = re.findall(r"<h3>(.*?)</h3>\s*<p>(.*?)</p>", a["body"].split('id="faq"')[-1], re.S) if 'id="faq"' in a["body"] else []
    graph = [ORG, PERSON,
        {"@type": "BlogPosting", "@id": url + "#post", "mainEntityOfPage": {"@type": "WebPage", "@id": url}, "headline": a["title"], "description": a["desc"],
         "image": [img], "datePublished": a["date"], "dateModified": a["date"], "author": {"@id": SITE + "/#person"}, "publisher": {"@id": SITE + "/#org"},
         "articleSection": a["tag"], "inLanguage": "en", "wordCount": len(re.sub(r"<[^>]+>", " ", a["body"]).split())},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Blog", "item": SITE + "/blog/"}, {"@type": "ListItem", "position": 3, "name": a["title"], "item": url}]}]
    if faq_q:
        strip = lambda s: re.sub(r"<[^>]+>", "", html.unescape(s)).strip()
        graph.append({"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": strip(q), "acceptedAnswer": {"@type": "Answer", "text": strip(ans)}} for q, ans in faq_q]})
    related = [r for r in ARTICLES if r["slug"] != a["slug"]]
    related = (related[idx:] + related[:idx])[:3] if related else []
    rel = "".join(f'''<article class="bl-card"><a href="../{r["slug"]}/" class="bl-card-img" tabindex="-1" aria-hidden="true">{cover_img(r, p)}</a><div class="bl-card-body"><p class="bl-meta"><span class="bl-tag">{r["tag"]}</span><span>{r["mins"]} min read</span></p><h3><a href="../{r["slug"]}/">{esc(r["title"])}</a></h3></div></article>''' for r in related)
    page = head(STITLES.get(a["slug"], a["title"] + " | Moses Mastery"), a["desc"], url, p, img, "article", ld({"@context": "https://schema.org", "@graph": graph}))
    page += f'''<body class="bl-page">
  {header(p, "blog")}
  <main id="main">
    <article class="ar" itemscope itemtype="https://schema.org/BlogPosting">
      <header class="ar-head">
        <nav class="ar-crumbs" aria-label="Breadcrumb"><a href="{p}index.html">Home</a><span>/</span><a href="../">Blog</a><span>/</span><span aria-current="page">{esc(a["tag"])}</span></nav>
        <p class="bl-meta"><span class="bl-tag">{a["tag"]}</span><time datetime="{a["date"]}" itemprop="datePublished">{long_date(a["date"])}</time><span>{a["mins"]} min read</span></p>
        <h1 itemprop="headline">{esc(a["title"])}</h1>
        <p class="ar-by">By <strong>Moses Daniel</strong>, founder of Moses Mastery</p>
      </header>
      <figure class="ar-cover">{cover_img(a, p, eager=True)}</figure>
      <div class="ar-wrap">
        <aside class="ar-toc" aria-label="On this page"><p>On this page</p><ol>{toc_html}</ol></aside>
        <div class="ar-body prose" itemprop="articleBody">{a["body"]}</div>
      </div>
      <section class="ar-cta"><h2>Need help with your <em>Shopify store</em>?</h2><p>I design, optimize and grow Shopify stores and set up AI automation for them. Book a free strategy call or send your store link.</p>
        <div><a class="bl-btn" href="https://calendly.com/onwenmoses/30min" onclick="Calendly.initPopupWidget({{url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a'}});return false;">Book a call <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a> <a class="bl-btn bl-btn-ghost" href="{p}contact.html">Contact me</a></div></section>
      <section class="ar-author"><img src="{p}asset/logo.webp" alt="" width="72" height="72" loading="lazy"><div><p class="ar-author-n">Moses Daniel</p><p>Founder of Moses Mastery. I help eCommerce brands with Shopify design, conversion optimization, SEO, ads and AI automation.</p></div></section>
    </article>
    <section class="bl-related" aria-label="More articles"><h2>Keep reading</h2><div class="bl-grid bl-grid-3">{rel}</div></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
    W(os.path.join(ROOT, "blog", a["slug"], "index.html"), page)

# ---------- 2b. service landing pages ----------
def strip_tags(t): return re.sub(r"<[^>]+>", "", html.unescape(t)).strip()
TODAY = "2026-10-28"
for sv in SERVICES:
    p = "../../"; url = f'{SITE}/services/{sv["slug"]}/'
    graph = [ORG, PERSON,
        {"@type": "Service", "@id": url + "#service", "name": sv["title"], "description": sv["desc"], "url": url, "provider": {"@id": SITE + "/#org"}, "areaServed": "Worldwide", "serviceType": sv["title"]},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Services", "item": SITE + "/services/"}, {"@type": "ListItem", "position": 3, "name": sv["title"], "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a_}} for q, a_ in sv["faqs"]]}]
    page = head(sv["stitle"], sv["desc"], url, p, OG, "website", ld({"@context": "https://schema.org", "@graph": graph}))
    secs = "".join(f'<h2 id="s{i}">{h}</h2>{b}' for i, (h, b) in enumerate(sv["sections"]))
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a_)}</p></details>' for q, a_ in sv["faqs"])
    rel = [a for a in ARTICLES if a["slug"] in sv["related"]]
    relh = "".join(f'<article class="bl-card"><a href="{p}blog/{r["slug"]}/" class="bl-card-img" tabindex="-1" aria-hidden="true">{cover_img(r, p)}</a><div class="bl-card-body"><p class="bl-meta"><span class="bl-tag">{r["tag"]}</span><span>{r["mins"]} min read</span></p><h3><a href="{p}blog/{r["slug"]}/">{esc(r["title"])}</a></h3></div></article>' for r in rel).replace('src="{}asset'.format(p), 'src="{}asset'.format(p))
    others = "".join(f'<li><a href="../{o["slug"]}/">{o["nav"]}</a></li>' for o in SERVICES if o["slug"] != sv["slug"])
    page += f'''<body class="bl-page">
  {header(p, "services")}
  <main id="main">
    <article class="ar">
      <header class="ar-head">
        <nav class="ar-crumbs" aria-label="Breadcrumb"><a href="{p}index.html">Home</a><span>/</span><a href="../">Services</a><span>/</span><span aria-current="page">{esc(sv["title"])}</span></nav>
        <h1>{esc(sv["h1"])}</h1>
        <p class="ar-by">By <strong>Moses Daniel</strong>, founder of Moses Mastery</p>
        <p class="bl-lead">{esc(sv["lead"])}</p>
      </header>
      <div class="ar-wrap sv-wrap"><div class="ar-body prose">{secs}
        <h2 id="faq">Frequently asked questions</h2><div class="sv-faq">{faq}</div>
        <h2 id="more">Other services</h2><ul>{others}</ul>
      </div></div>
      <section class="ar-cta"><h2>Ready to <em>get started</em>?</h2><p>Send your store link and goals. You will get a clear reply with where I would start and a fixed quote.</p>
        <div><a class="bl-btn" href="{p}contact.html">Request a quote <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a> <a class="bl-btn bl-btn-ghost" href="https://calendly.com/onwenmoses/30min" onclick="Calendly.initPopupWidget({{url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a'}});return false;">Book a call</a></div></section>
    </article>
    <section class="bl-related" aria-label="Related guides"><h2>Related guides</h2><div class="bl-grid bl-grid-3">{relh}</div></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
    W(os.path.join(ROOT, "services", sv["slug"], "index.html"), page)

# hub page
p = "../"; url = SITE + "/services/"
hub_ld = {"@context": "https://schema.org", "@graph": [ORG, PERSON,
    {"@type": "CollectionPage", "@id": url + "#page", "name": "Shopify services", "url": url, "isPartOf": {"@id": SITE + "/#org"}},
    {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f'{SITE}/services/{sv["slug"]}/', "name": sv["title"]} for i, sv in enumerate(SERVICES)]},
    {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Services", "item": url}]}]}
page = head("Shopify Services: Design, CRO, SEO, Ads & AI | Moses Mastery", "Shopify store design, conversion optimization, SEO, Meta and Google ads, and AI automation for eCommerce brands, from Moses Mastery.", url, p, OG, "website", ld(hub_ld))
cards = "".join(f'''<article class="bl-card"><div class="bl-card-body"><h2><a href="{sv["slug"]}/">{esc(sv["title"])}</a></h2><p>{esc(sv["desc"])}</p><a class="bl-more" href="{sv["slug"]}/">Learn more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></article>''' for sv in SERVICES)
page += f'''<body class="bl-page">
  {header(p, "services")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>Services</p><h1>Shopify <em>services.</em></h1>
      <p class="bl-lead">Design, conversion, search, ads and AI automation for Shopify stores, from one specialist. Choose what you need, or send your store link and I will tell you where I would start.</p></section>
    <section class="bl-list" aria-label="Services"><div class="bl-grid">{cards}</div></section>
    <section class="bl-cta"><h2>Not sure where to <em>start</em>?</h2><p>Send me your store link and I will tell you what I would fix first.</p><a class="bl-btn" href="{p}contact.html">Request a store review <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
W(os.path.join(ROOT, "services", "index.html"), page)

# privacy page (plain-language; keep in step with js/track.js)
p = ""; url = SITE + "/privacy.html"
PRIV = """<h2>The short version</h2>
<p>This site counts visits so I can see what works. It does not use advertising cookies, it does not sell data, and it never records what you type into a form.</p>
<h2>What is recorded when you visit</h2>
<ul>
<li>The pages you open, how long you stay, and how far you scroll.</li>
<li>Which buttons and links you click (for example Book a call, WhatsApp or email), and whether you start or send the contact form. The text you type is never recorded.</li>
<li>Your device type, browser, operating system, screen width, time zone, and the site you came from.</li>
<li>Your approximate location (country, region and city). To work this out, your browser asks a geolocation service (ipwho.is), which sees your IP address as any website you visit would. I never receive or store your IP address.</li>
<li>Technical signals that help me fix the site: page speed, and errors your browser hits.</li>
</ul>
<p>This data is stored in a database I control (Supabase). It carries a random identifier kept in your browser storage, not your name or email. The identifier is not a cookie and is not shared with advertisers.</p>
<h2>Session recordings and heatmaps</h2>
<p>If switched on, this site uses Microsoft Clarity to show me anonymised recordings and heatmaps of how pages are used. Everything typed into form fields is masked. Clarity is not started for visitors in European time zones. Microsoft\u2019s privacy statement is at <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">privacy.microsoft.com</a>.</p>
<h2>When you contact me</h2>
<p>If you send the contact form or the calculator review form, your answers, name and email are delivered to me by Web3Forms and are also saved in my database (Supabase) so a request is never lost. They are used only to reply to you. If you book a call, Calendly handles that booking under its own privacy policy.</p>
<h2>Your choices</h2>
<ul>
<li>If your browser sends <strong>Do Not Track</strong>, no analytics are recorded.</li>
<li>You can also block the tracker with any content blocker, and the site still works.</li>
<li>To ask what is held about you, or to have it deleted, email <a href="mailto:info@mosesecom.com">info@mosesecom.com</a> and include the approximate date and device of your visit.</li>
</ul>
<h2>Who is responsible</h2>
<p>Moses Mastery, run by Moses Daniel. Questions: <a href="mailto:info@mosesecom.com">info@mosesecom.com</a>. Last updated 28 October 2026.</p>"""
page = head("Privacy | Moses Mastery", "What Moses Mastery records when you visit this website, why, and how to opt out.", url, p, OG, "website")
page += f'''<body class="bl-page">
  {header(p, "")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>Privacy</p><h1>How this site <em>handles data.</em></h1></section>
    <section class="ar-wrap sv-wrap" style="padding-bottom:4rem"><div class="prose">{PRIV}</div></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
W(os.path.join(ROOT, "privacy.html"), page)

# revenue-leak calculator page
p = ""; url = SITE + "/calculator.html"
CALC = """
<div class="calc" id="calc">
  <form class="calc-in" id="calcForm" onsubmit="return false" aria-label="Store numbers">
    <h2>Your store today</h2>
    <label class="calc-f"><span>Monthly visitors</span><input id="cVis" type="number" inputmode="numeric" min="0" step="100" value="10000"></label>
    <label class="calc-f"><span>Conversion rate (%)</span><input id="cCr" type="number" inputmode="decimal" min="0" max="100" step="0.1" value="1.2"></label>
    <label class="calc-f"><span>Average order value ($)</span><input id="cAov" type="number" inputmode="decimal" min="0" step="1" value="60"></label>
    <p class="calc-note">Find these in Shopify under Analytics. Use last month's numbers. Nothing here is sent anywhere until you choose to request a review.</p>
  </form>
  <div class="calc-out" aria-live="polite">
    <h2>What a better conversion rate is worth</h2>
    <p class="calc-now">Right now your store makes about <strong id="oNow">$0</strong> a month from this traffic.</p>
    <div class="calc-rows">
      <div class="calc-row"><span class="calc-l">Small lift <em>+15% conversion</em></span><span class="calc-v" id="o1">$0</span><i class="calc-bar"><b id="b1"></b></i></div>
      <div class="calc-row"><span class="calc-l">Realistic <em>+30% conversion</em></span><span class="calc-v" id="o2">$0</span><i class="calc-bar"><b id="b2"></b></i></div>
      <div class="calc-row"><span class="calc-l" id="l3">Healthy benchmark</span><span class="calc-v" id="o3">$0</span><i class="calc-bar"><b id="b3"></b></i></div>
    </div>
    <p class="calc-big">Extra revenue per year at the realistic level: <strong id="oYear">$0</strong></p>
    <p class="calc-note">These are estimates from simple math (visitors &times; conversion rate &times; order value), not a promise. Real results depend on your traffic quality, product and offer. Many Shopify stores sit between 1% and 3% conversion.</p>
  </div>
</div>
<section class="calc-lead" id="calcLead">
  <h2>Want me to find where <em>your</em> store leaks?</h2>
  <p>Send your store link. I will review it and email you the three biggest fixes I would make first. Free, no obligation.</p>
  <form id="calcLeadForm" class="calc-lf">
    <input type="hidden" name="access_key" value="fd19a73d-7fdc-4f4a-89e9-0a4c99f1ff1e">
    <input type="hidden" name="subject" value="Calculator lead: store review request">
    <input type="hidden" name="from_name" value="Moses Mastery calculator">
    <input type="hidden" name="numbers" id="lNum" value="">
    <input type="checkbox" name="botcheck" class="mm-hp" tabindex="-1" autocomplete="off" aria-hidden="true">
    <label><span>Your name</span><input name="name" required autocomplete="name"></label>
    <label><span>Email</span><input name="email" type="email" required autocomplete="email"></label>
    <label class="calc-wide"><span>Store link</span><input name="store" type="url" required placeholder="https://yourstore.com" autocomplete="url"></label>
    <button type="submit" class="mm-cta"><span class="mm-cta-tx">Send my free review</span><span class="mm-cta-ar" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></button>
    <p class="calc-status" id="calcStatus" role="status"></p>
  </form>
</section>
"""
page = head("Free Shopify Revenue Calculator | Moses Mastery", "See how much more revenue your Shopify store could make from a better conversion rate. Free calculator, plus a free store review.", url, p, OG, "website")
page += f'''<body class="bl-page">
  {header(p, "")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>Free tool</p><h1>How much is your store <em>leaving on the table?</em></h1></section>
    <section class="ar-wrap sv-wrap" style="padding-bottom:4rem">{CALC}</section>
  </main>
  {footer(p)}
''' + (TAIL % (p, p, p, p)).replace("</body>", '<script src="js/calculator.js"></script>\n</body>')
W(os.path.join(ROOT, "calculator.html"), page)

# ---------- 3. sitemap ----------
urls = [("/", "1.0", "2026-10-28"), ("/services/", "0.9", "2026-10-28"), ("/projects.html", "0.8", "2026-10-27"), ("/contact.html", "0.7", "2026-10-27"), ("/privacy.html", "0.2", "2026-10-28"), ("/calculator.html", "0.7", "2026-10-29"), ("/blog/", "0.9", "2026-10-28")] + [(f'/services/{sv["slug"]}/', "0.9", "2026-10-28") for sv in SERVICES] + [(f'/blog/{a["slug"]}/', "0.8", a["date"]) for a in ARTICLES]
W(os.path.join(ROOT, "sitemap.xml"), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + "".join(f"  <url><loc>{SITE}{u}</loc><lastmod>{d}</lastmod><priority>{pr}</priority></url>\n" for u, pr, d in urls) + "</urlset>\n")
print("built:", len(ARTICLES), "articles; header/footer refreshed on", ", ".join(PAGES))

# ---------- 4. optional: cover images ----------
if "--covers" in sys.argv:
    from playwright.sync_api import sync_playwright
    font = os.environ.get("COVER_FONT", "")
    face = f"@font-face{{font-family:'CoverInter';src:url('file://{font}');font-weight:100 900}}" if font else ""
    logo = "file://" + os.path.join(ROOT, "asset", "logo.png")
    def title_html(a):
        t = esc(a["ctitle"])
        for w in a["chi"]: t = t.replace(esc(w), f'<b>{esc(w)}</b>', 1)
        return t
    tpl = """<html><style>{face}*{{margin:0;box-sizing:border-box}}body{{width:1200px;height:630px;background:#0c0806;font-family:'CoverInter','Inter',Arial,sans-serif;position:relative;overflow:hidden;color:#fff}}
.glow{{position:absolute;inset:0;background:radial-gradient(900px 520px at 85% 0%,rgba(255,91,0,.85),transparent 60%),radial-gradient(700px 420px at 0% 100%,rgba(255,91,0,.35),transparent 65%)}}
.big{{position:absolute;right:-10px;top:-90px;font-size:{gsize}px;font-weight:900;letter-spacing:-.06em;color:#ff6a00;opacity:.95;line-height:1;text-shadow:0 0 80px rgba(255,91,0,.35)}}
.logo{{position:absolute;left:56px;top:48px;display:flex;align-items:center;gap:16px;font-weight:700;font-size:30px}}.logo img{{width:56px;height:56px;border-radius:50%}}
.panel{{position:absolute;left:0;right:0;bottom:0;height:300px;background:linear-gradient(to top,rgba(8,5,4,.96),rgba(8,5,4,.78));backdrop-filter:blur(2px);padding:44px 56px}}
.tag{{display:inline-block;background:#ffd000;color:#111;font-weight:800;font-size:20px;letter-spacing:.12em;padding:8px 16px;border-radius:999px;margin-bottom:20px}}
h1{{font-size:62px;line-height:1.06;font-weight:800;letter-spacing:-.035em;max-width:1000px}}h1 b{{color:#ff6a00}}
.edge{{position:absolute;left:0;bottom:0;width:100%;height:8px;background:linear-gradient(90deg,#ff5b00,#ffd000)}}</style>
<body><div class="glow"></div><div class="big">{glyph}</div><div class="logo"><img src="{logo}"><span>Moses Mastery</span></div>
<div class="panel"><span class="tag">{tag}</span><h1>{title}</h1></div><div class="edge"></div></body></html>"""
    os.makedirs(os.path.join(ROOT, "asset", "blog"), exist_ok=True)
    with sync_playwright() as pw:
        b = pw.chromium.launch(); pg = b.new_page(viewport={"width": 1200, "height": 630}, device_scale_factor=1)
        for a in ARTICLES:
            open("/tmp/_cover.html", "w", encoding="utf8").write(tpl.format(face=face, glyph=esc(a["cover"]), gsize={1: 600, 2: 600}.get(len(a["cover"]), 430), logo=logo, tag=a["tag"], title=title_html(a)))
            pg.goto("file:///tmp/_cover.html"); pg.wait_for_timeout(400)
            pg.screenshot(path=os.path.join(ROOT, "asset", "blog", a["slug"] + ".jpg"), type="jpeg", quality=88)
        b.close()
    print("covers rendered")
