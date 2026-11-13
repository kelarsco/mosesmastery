#!/usr/bin/env python3
"""Builds the blog (blog/index.html + blog/<slug>/index.html), refreshes the shared header/menu/footer on every page,
and rewrites sitemap.xml.   Run from the project root:   python3 tools/build_blog.py [--covers]
--covers also renders asset/blog/<slug>.jpg (needs: pip install playwright && playwright install chromium)."""
import os, re, sys, json, html
sys.path.insert(0, os.path.dirname(__file__))
from chrome import header, footer, header_de, footer_de, SOCIALS
from de import DE_PAGES
from articles import ARTICLES
from services import SERVICES
from niches import NICHES

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
SITE = "https://www.mosesmastery.com"
OG = SITE + "/asset/og-image.jpg"
esc = html.escape
def W(path, text):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    open(path, "w", encoding="utf8", newline="\n").write(text)

def hreflang(en_url, de_url):
    return (f'  <link rel="alternate" hreflang="en" href="{en_url}">\n  <link rel="alternate" hreflang="de" href="{de_url}">\n'
            f'  <link rel="alternate" hreflang="x-default" href="{en_url}">\n')

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
    if fn == "index.html" and 'rel="alternate" hreflang="de"' not in t:
        t = t.replace('<link rel="canonical" href="https://www.mosesmastery.com/">', '<link rel="canonical" href="https://www.mosesmastery.com/">\n' + hreflang(SITE + "/", SITE + "/de/").rstrip("\n"), 1)
    if fn != "account.html" and "js/track.js" not in t:
        t = t.replace('<script src="js/index.js"></script>', '<script src="js/config.js"></script>\n<script src="js/track.js"></script>\n<script src="js/index.js"></script>')
    open(p, "w", encoding="utf8", newline="").write(t)

# ---------- 2. blog pages ----------
def long_date(iso):
    y, m, d = iso.split("-"); mon = ["January","February","March","April","May","June","July","August","September","October","November","December"][int(m) - 1]
    return f"{mon} {int(d)}, {y}"

def head(title, desc, canon, p, og_img, og_type="website", extra="", lang="en", locale="en_US"):
    return f'''<!DOCTYPE html>
<html lang="{lang}">
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
  <meta property="og:locale" content="{locale}">
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
ORG = {"@type": ["Organization", "ProfessionalService"], "@id": SITE + "/#org", "name": "Moses Mastery", "url": SITE + "/", "logo": SITE + "/asset/icon-512.png", "areaServed": "Worldwide", "email": "info@mosesecom.com", "telephone": "+15818095630", "founder": {"@id": SITE + "/#person"}, "sameAs": ["https://www.linkedin.com/in/moses-daniel-89029b41b/"] + [u for _l, _s, _i, u in SOCIALS if "linkedin" not in u and "wa.me" not in u], "knowsAbout": ["Shopify store design", "Shopify conversion rate optimization", "Shopify SEO", "Meta ads for Shopify", "Google ads for Shopify", "AI automation for eCommerce"]}
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
for sv in SERVICES + NICHES:
    p = "../../"; url = f'{SITE}/services/{sv["slug"]}/'
    graph = [ORG, PERSON,
        {"@type": "Service", "@id": url + "#service", "name": sv["title"], "description": sv["desc"], "url": url, "provider": {"@id": SITE + "/#org"}, "areaServed": "Worldwide", "serviceType": sv["title"]},
        {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Services", "item": SITE + "/services/"}, {"@type": "ListItem", "position": 3, "name": sv["title"], "item": url}]},
        {"@type": "FAQPage", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a_}} for q, a_ in sv["faqs"]]}]
    _tw = {d["en_twin"].strip("/").split("/")[-1]: d for d in DE_PAGES if d["en_twin"]}
    _hl = hreflang(url, SITE + "/de/" + _tw[sv["slug"]]["slug"] + "/") if sv["slug"] in _tw else ""
    page = head(sv["stitle"], sv["desc"], url, p, OG, "website", _hl + ld({"@context": "https://schema.org", "@graph": graph}))
    secs = "".join(f'<h2 id="s{i}">{h}</h2>{b}' for i, (h, b) in enumerate(sv["sections"]))
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a_)}</p></details>' for q, a_ in sv["faqs"])
    rel = [a for a in ARTICLES if a["slug"] in sv["related"]]
    relh = "".join(f'<article class="bl-card"><a href="{p}blog/{r["slug"]}/" class="bl-card-img" tabindex="-1" aria-hidden="true">{cover_img(r, p)}</a><div class="bl-card-body"><p class="bl-meta"><span class="bl-tag">{r["tag"]}</span><span>{r["mins"]} min read</span></p><h3><a href="{p}blog/{r["slug"]}/">{esc(r["title"])}</a></h3></div></article>' for r in rel).replace('src="{}asset'.format(p), 'src="{}asset'.format(p))
    others = "".join(f'<li><a href="../{o["slug"]}/">{o["nav"]}</a></li>' for o in SERVICES if o["slug"] != sv["slug"])
    if sv in SERVICES or True: others += "".join(f'<li><a href="../{o["slug"]}/">Shopify for {o["nav"]}</a></li>' for o in NICHES if o["slug"] != sv["slug"])
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

# ---------- 2c. German section (/de/) ----------
def de_url(d): return SITE + "/de/" + (d["slug"] + "/" if d["slug"] else "")
for d in DE_PAGES:
    p = "../" if not d["slug"] else "../../"
    p = "../" if not d["slug"] else "../../"
    url = de_url(d); en_url = SITE + "/" + d["en_twin"]
    en_rel = d["en_twin"] if d["en_twin"] else "index.html"
    active = {"": "home", "shopify-agentur": "agentur", "shopify-seo-agentur": "seo"}[d["slug"]]
    crumbs = [{"@type": "ListItem", "position": 1, "name": "Start", "item": SITE + "/de/"}] + ([{"@type": "ListItem", "position": 2, "name": d["nav"], "item": url}] if d["slug"] else [])
    graph = [ORG, PERSON,
        {"@type": "Service", "@id": url + "#service", "name": d["title"], "description": d["desc"], "url": url, "inLanguage": "de", "provider": {"@id": SITE + "/#org"}, "areaServed": [{"@type": "Country", "name": "Deutschland"}, {"@type": "Country", "name": "Österreich"}, {"@type": "Country", "name": "Schweiz"}], "serviceType": d["title"]},
        {"@type": "BreadcrumbList", "itemListElement": crumbs},
        {"@type": "FAQPage", "inLanguage": "de", "mainEntity": [{"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a_}} for q, a_ in d["faqs"]]}]
    page = head(d["stitle"], d["desc"], url, p, OG, "website", hreflang(en_url, url).replace(f'hreflang="en" href="{en_url}"', f'hreflang="en" href="{en_url}"') + ld({"@context": "https://schema.org", "@graph": graph}), lang="de", locale="de_DE")
    page = page.replace('<link rel="alternate" hreflang="de" href="%s">' % url, '<link rel="alternate" hreflang="de" href="%s">' % url)
    secs = "".join(f'<h2 id="s{i}">{h}</h2>{b_.replace("{p}", p)}' for i, (h, b_) in enumerate(d["sections"]))
    faq = "".join(f'<details><summary>{esc(q)}</summary><p>{esc(a_)}</p></details>' for q, a_ in d["faqs"])
    crumb = f'<nav class="ar-crumbs" aria-label="Brotkrumen"><a href="{p}de/">Start</a>' + (f'<span>/</span><span aria-current="page">{esc(d["nav"])}</span>' if d["slug"] else "") + '</nav>'
    page += f'''<body class="bl-page">
  {header_de(p, active, en_rel)}
  <main id="main">
    <article class="ar">
      <header class="ar-head">
        {crumb}
        <h1>{esc(d["h1"])}</h1>
        <p class="ar-by">Von <strong>Moses Daniel</strong>, Gründer von Moses Mastery &middot; <a href="{p}{en_rel}" hreflang="en" lang="en">Read in English</a></p>
        <p class="bl-lead">{esc(d["lead"])}</p>
      </header>
      <div class="ar-wrap sv-wrap"><div class="ar-body prose">{secs}
        <h2 id="faq">Häufige Fragen</h2><div class="sv-faq">{faq}</div>
      </div></div>
      <section class="ar-cta"><h2>Bereit für den <em>nächsten Schritt</em>?</h2><p>Senden Sie den Link zu Ihrem Shop und Ihre Ziele. Sie erhalten eine klare Antwort, wo ich anfangen würde, und ein Festpreis-Angebot.</p>
        <div><a class="bl-btn" href="{p}contact.html">Angebot anfragen <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a> <a class="bl-btn bl-btn-ghost" href="{p}audit.html">Kostenloser Store-Scan</a></div></section>
    </article>
  </main>
  {footer_de(p)}
''' + TAIL % (p, p, p, p)
    W(os.path.join(ROOT, "de", d["slug"], "index.html") if d["slug"] else os.path.join(ROOT, "de", "index.html"), page)

# hub page
p = "../"; url = SITE + "/services/"
hub_ld = {"@context": "https://schema.org", "@graph": [ORG, PERSON,
    {"@type": "CollectionPage", "@id": url + "#page", "name": "Shopify services", "url": url, "isPartOf": {"@id": SITE + "/#org"}},
    {"@type": "ItemList", "itemListElement": [{"@type": "ListItem", "position": i + 1, "url": f'{SITE}/services/{sv["slug"]}/', "name": sv["title"]} for i, sv in enumerate(SERVICES)]},
    {"@type": "BreadcrumbList", "itemListElement": [{"@type": "ListItem", "position": 1, "name": "Home", "item": SITE + "/"}, {"@type": "ListItem", "position": 2, "name": "Services", "item": url}]}]}
ncards = "".join(f'''<article class="bl-card"><div class="bl-card-body"><h2><a href="{n["slug"]}/">{esc(n["title"])}</a></h2><p>{esc(n["desc"])}</p><a class="bl-more" href="{n["slug"]}/">Learn more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></article>''' for n in NICHES)
page = head("Shopify Services: Design, CRO, SEO, Ads & AI | Moses Mastery", "Shopify store design, conversion optimization, SEO, Meta and Google ads, and AI automation for eCommerce brands, from Moses Mastery.", url, p, OG, "website", ld(hub_ld))
cards = "".join(f'''<article class="bl-card"><div class="bl-card-body"><h2><a href="{sv["slug"]}/">{esc(sv["title"])}</a></h2><p>{esc(sv["desc"])}</p><a class="bl-more" href="{sv["slug"]}/">Learn more <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div></article>''' for sv in SERVICES)
page += f'''<body class="bl-page">
  {header(p, "services")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>Services</p><h1>Shopify <em>services.</em></h1>
      <p class="bl-lead">Design, conversion, search, ads and AI automation for Shopify stores, from one specialist. Choose what you need, or send your store link and I will tell you where I would start.</p></section>
    <section class="bl-list" aria-label="Services"><div class="bl-grid">{cards}</div></section>
    <section class="bl-list" aria-label="By industry"><h2 style="max-width:1100px;margin:0 auto 1rem;padding:0 1.4rem">By industry</h2><div class="bl-grid">{ncards}</div></section>
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
<li>Your approximate location (country, region and city). To work this out, your browser asks a geolocation service (ipwho.is, or geojs.io or ipapi.co if the first is unavailable), which sees your IP address as any website you visit would. I never receive or store your IP address.</li>
<li>Technical signals that help me fix the site: page speed, and errors your browser hits.</li>
</ul>
<p>This data is stored in a database I control (Supabase). It carries a random identifier kept in your browser storage, not your name or email. The identifier is not a cookie and is not shared with advertisers.</p>
<h2>Session recordings and heatmaps</h2>
<p>If switched on, this site uses Microsoft Clarity to show me anonymised recordings and heatmaps of how pages are used. Everything typed into form fields is masked. Clarity is not started for visitors in European time zones. Microsoft\u2019s privacy statement is at <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">privacy.microsoft.com</a>.</p>
<h2>When you contact me</h2>
<p>The free store scan needs only a public store link, which is checked through Google PageSpeed Insights and my scanning function and is not tied to your name or email. If you send the contact form or the calculator review form, your answers, name and email are delivered to me by Web3Forms and are also saved in my database (Supabase) so a request is never lost. They are used only to reply to you. Please do not share passwords or card details in the forms. If you book a call, Calendly handles that booking under its own privacy policy.</p>
<h2>Your choices</h2>
<ul>
<li>If your browser sends <strong>Do Not Track</strong>, no analytics are recorded. Automated visitors such as search crawlers and speed-test tools are not counted.</li>
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
    <section class="ar-wrap sv-wrap legal-wrap" style="padding-bottom:4rem"><div class="prose">{PRIV}</div></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
W(os.path.join(ROOT, "privacy.html"), page)

# legal pages (terms, refund, cookies) -- plain-language, kept consistent with privacy.html
LEGAL_UPDATED = "8 November 2026"
def legal_page(fname, title, kicker, h1, desc, body):
    p = ""; url = SITE + "/" + fname
    pg = head(title + " | Moses Mastery", desc, url, p, OG, "website")
    pg += f'''<body class="bl-page">
  {header(p, "")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>{kicker}</p><h1>{h1}</h1></section>
    <section class="ar-wrap sv-wrap legal-wrap" style="padding-bottom:4rem"><div class="prose">{body}<p><em>Last updated {LEGAL_UPDATED}.</em></p></div></section>
  </main>
  {footer(p)}
''' + TAIL % (p, p, p, p)
    W(os.path.join(ROOT, fname), pg)

TERMS = """<h2>1. Who we are</h2>
<p>These terms apply to this website and to services provided by Moses Mastery, run by Moses Daniel (\u201cI\u201d, \u201cme\u201d, \u201cMoses Mastery\u201d). Contact: <a href="mailto:info@mosesecom.com">info@mosesecom.com</a>. By using the site or hiring me you agree to these terms.</p>
<h2>2. What I do</h2>
<p>I provide Shopify store design and development, conversion-rate optimization and audits, Shopify SEO, Meta and Google advertising management, and AI automation, content and chat set-up. The exact scope, deliverables, timeline and price of any project are agreed in writing (a proposal, quote or message thread) before work starts.</p>
<h2>3. Quotes, payment and timelines</h2>
<ul>
<li>A quote stays valid for the period stated on it. Work begins when you accept it and any agreed deposit or first payment is received.</li>
<li>Invoices are due by the date shown on them. Work may be paused while an invoice is overdue.</li>
<li>Timelines depend on you providing content, access and feedback promptly. Delays on your side move the dates.</li>
<li>Ad spend is paid by you directly to the ad platform and is never part of my fee unless the quote says so.</li>
</ul>
<h2>4. Your responsibilities</h2>
<p>You confirm that you own or have the right to use the content, products, images, trademarks and accounts you give me. You are responsible for your store\u2019s products, prices, shipping, taxes, refunds to your own customers and compliance with the laws and platform rules (Shopify, Meta, Google) that apply to your business.</p>
<h2>5. Results</h2>
<p>I work to improve your store\u2019s design, speed, conversion and traffic, but I cannot promise a specific increase in sales, rankings or return on ad spend. Results depend on your product, market, budget, competition and platform changes outside my control. Past work shown on this site is not a guarantee of future results.</p>
<h2>6. Ownership</h2>
<p>Once a project is paid in full, you own the final deliverables made specifically for you (such as your store design, copy and custom assets). I keep ownership of my own tools, templates, code snippets and know-how, and of third-party items such as themes, apps and fonts, which stay under their own licences. Unless you ask otherwise, I may mention the project and show non-confidential screenshots in my portfolio.</p>
<h2>7. Confidentiality and access</h2>
<p>I treat your business information and any store or account access you give me as confidential and use it only to do the agreed work. Please give access through each platform\u2019s proper collaborator or staff invitation rather than sharing passwords, and remove my access when the work ends.</p>
<h2>8. Third-party services</h2>
<p>Your store runs on third-party platforms and apps (for example Shopify, Meta, Google, Klaviyo or app developers). Their availability, pricing, policies and outages are outside my control and their own terms apply.</p>
<h2>9. Liability</h2>
<p>To the fullest extent the law allows, I am not liable for indirect or consequential loss, such as lost profit, lost sales or lost data. My total liability for any claim relating to a project is limited to the fees you paid me for that project. Nothing in these terms limits liability that cannot be limited by law.</p>
<h2>10. Ending a project</h2>
<p>Either of us may end a project by written notice. You pay for work completed up to that point. Refunds are covered in the <a href="refund-policy.html">Refund Policy</a>.</p>
<h2>11. This website</h2>
<p>The content, design and code of this site belong to Moses Mastery and may not be copied or resold without permission. The information on the site is general and may change. Please do not misuse the site or try to disrupt it. How your data is handled is explained in the <a href="privacy.html">Privacy Policy</a> and <a href="cookie-policy.html">Cookie Policy</a>.</p>
<h2>12. Changes and contact</h2>
<p>I may update these terms; the date at the bottom shows the latest version, and the version you accepted for a project continues to apply to that project. Questions: <a href="mailto:info@mosesecom.com">info@mosesecom.com</a>.</p>"""

REFUND = """<h2>In short</h2>
<p>I want you to be happy with the work. If something is not right, tell me first and I will fix it. This policy explains what happens if we cannot resolve it, and what is and is not refundable.</p>
<h2>Free items</h2>
<p>The strategy call, the store review and the revenue calculator are free, so there is nothing to refund.</p>
<h2>Fixed-price projects</h2>
<ul>
<li><strong>Before work starts:</strong> if you cancel after paying a deposit but before I begin, the deposit is refunded in full, less any payment-processor fees.</li>
<li><strong>During the project:</strong> if you cancel part-way, you pay for the work completed up to that point and the remainder of any prepayment is refunded.</li>
<li><strong>After delivery:</strong> I will correct anything that does not match the agreed scope, free of charge, for 14 days after delivery. Once the project is approved and delivered, fees are non-refundable.</li>
</ul>
<h2>Monthly and retainer services</h2>
<p>Monthly services (such as ad management or ongoing optimization) can be cancelled with 14 days\u2019 written notice before the next billing date. The current month is not refunded once the work for it has started, and there are no refunds for past months.</p>
<h2>What is not refundable</h2>
<ul>
<li>Ad spend paid to Meta, Google or any other platform, which is charged by them and not by me.</li>
<li>Third-party costs such as themes, apps, domains, licences and stock assets.</li>
<li>Work you asked me to stop using, or changes outside the agreed scope.</li>
<li>Results that differ from your expectations when the agreed work was delivered as described (see section 5 of the <a href="terms.html">Terms &amp; Conditions</a>).</li>
</ul>
<h2>How to ask for a refund</h2>
<p>Email <a href="mailto:info@mosesecom.com">info@mosesecom.com</a> with your name, the project and what went wrong. I reply within 3 business days. Approved refunds go back to the original payment method and usually arrive within 5 to 10 business days, depending on your bank or payment provider.</p>"""

COOKIES = """<h2>The short version</h2>
<p>This site does not use advertising or tracking cookies, and it does not sell data. It stores a small random identifier in your browser (not a cookie) for its own visit counting, and a few optional services may set cookies of their own, listed below.</p>
<h2>What a cookie is</h2>
<p>A cookie is a small file a website saves on your device. Browser storage (localStorage and sessionStorage) works in a similar way. Both let a site remember something between pages or visits.</p>
<h2>What this site stores</h2>
<ul>
<li><strong>Visit counting (browser storage, not a cookie).</strong> A random identifier and a session marker, so I can count visitors and pages without knowing who you are. It holds no name or email. Details are in the <a href="privacy.html">Privacy Policy</a>.</li>
<li><strong>Preferences (browser storage).</strong> Small conveniences such as a remembered choice. Nothing here identifies you.</li>
<li><strong>Sign-in (browser storage).</strong> Only if you or an admin sign in to an account area, to keep you signed in.</li>
</ul>
<h2>Third-party services that may set cookies</h2>
<ul>
<li><strong>Microsoft Clarity</strong> (session recordings and heatmaps, when switched on): may set its own cookies. It is not started for visitors in European time zones, and form fields are masked. See <a href="https://privacy.microsoft.com/privacystatement" rel="noopener noreferrer">Microsoft\u2019s privacy statement</a>.</li>
<li><strong>Calendly</strong> (booking a call): loads only when you open the booking widget and may set cookies under its own policy.</li>
<li><strong>Font and icon providers</strong> and embedded media (for example video) may set cookies when they load.</li>
<li><strong>WhatsApp</strong> links open WhatsApp, which then follows its own policy.</li>
</ul>
<h2>Your choices</h2>
<ul>
<li>If your browser sends <strong>Do Not Track</strong>, this site records no analytics.</li>
<li>You can block or delete cookies and site data in your browser settings, or use a content blocker. The site keeps working.</li>
<li>To ask what is held about you or to have it removed, email <a href="mailto:info@mosesecom.com">info@mosesecom.com</a>.</li>
</ul>"""

legal_page("terms.html", "Terms & Conditions", "Legal", "Terms &amp; <em>Conditions.</em>", "Terms and conditions for using the Moses Mastery website and hiring Moses Mastery for Shopify services.", TERMS)
legal_page("refund-policy.html", "Refund Policy", "Legal", "Refund <em>Policy.</em>", "How refunds and cancellations work for Moses Mastery projects and monthly services.", REFUND)
legal_page("cookie-policy.html", "Cookie Policy", "Legal", "Cookie <em>Policy.</em>", "What cookies and browser storage the Moses Mastery website uses, and how to control them.", COOKIES)

# free store audit page
p = ""; url = SITE + "/audit.html"
AUDIT = """
<section class="calc-lead aud" id="audit">
  <h2>Paste your store link. <em>See your results in seconds.</em></h2>
  <p>No signup, no email, no waiting. The scan runs right here and shows your score, what is hurting sales and what to fix first. Free.</p>
  <form id="auditForm" class="aud-form" aria-label="Free store scan">
    <input name="store" type="text" inputmode="url" required placeholder="yourstore.com" autocomplete="url" autocapitalize="off" spellcheck="false" pattern="[^ ]+\\.[^ ]+" title="Enter your store address, for example yourstore.com" aria-label="Your store link">
    <button type="submit" class="mm-cta"><span class="mm-cta-tx">Scan my store</span><span class="mm-cta-ar" aria-hidden="true"><svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></button>
    <p class="calc-status" id="auditStatus" role="status"></p>
  </form>
</section>
<section class="aud-what"><h2>What the scan checks</h2><div class="aud-wg">
  <div><b>Page Speed</b><span>How fast your store loads on a phone, and what slows it down.</span></div>
  <div><b>Mobile Experience</b><span>Viewport, tap targets and readable text on small screens.</span></div>
  <div><b>SEO Basics</b><span>Titles, descriptions and the signals Google needs to find you.</span></div>
  <div><b>Technical Health</b><span>HTTPS, script errors and outdated code.</span></div>
  <div><b>UX &amp; Accessibility</b><span>Contrast, labels and structure that keep visitors moving.</span></div>
  <div><b>Marketing Tools</b><span>Analytics, ad pixels, email capture and reviews detected on load.</span></div>
  <div><b>Trust &amp; Credibility</b><span>Policies, contact details, reviews and payment badges.</span></div>
  <div><b>Conversion Signals</b><span>Buttons, search, offers, shipping messages and email signup.</span></div>
  <div><b>Product Page SEO</b><span>Product schema, price data, images and headings.</span></div>
</div></section>
<section class="aud-how">
  <h2>How it works</h2>
  <ol>
    <li><strong>You paste the link.</strong> Only the public store address. No name, no email.</li>
    <li><strong>The scan runs on this page.</strong> Within seconds you get an overall score, a score for each area and a ranked list of fixes, powered by Google PageSpeed Insights and my own store checks.</li>
    <li><strong>Want help with the fixes?</strong> Book a free call or message me on WhatsApp. The scan measures what can be checked from outside; a personal review adds design, offer and checkout.</li>
  </ol>
  <p class="aud-talk">Prefer to talk it through? <a href="https://calendly.com/onwenmoses/30min" rel="noopener" onclick="Calendly.initPopupWidget({url: 'https://calendly.com/onwenmoses/30min?hide_gdpr_banner=1&primary_color=f7cb1a'});return false;">Book a free strategy call</a> instead.</p>
  <details><summary>Is it really free?</summary><p>Yes. The scan is free and there is no obligation. If you want help with the fixes, I will send a fixed quote, and you can say no.</p></details>
  <details><summary>Will you need access to my store?</summary><p>No. The scan only reads your public store. Never share passwords with anyone.</p></details>
  <details><summary>Do you guarantee results?</summary><p>No one can honestly promise a sales increase. The scan and review point out real problems and what to fix first; results depend on your product, traffic and market.</p></details>
</section>
"""
page = head("Free Shopify Store Audit | Moses Mastery", "Free Shopify store scanner: paste your store link and see your score plus speed, mobile, SEO, trust and conversion checks on the page in seconds. No signup, no email.", url, p, OG, "website")
page += f'''<body class="bl-page">
  {header(p, "")}
  <main id="main">
    <section class="bl-hero"><p class="bl-kicker"><span></span>Free offer</p><h1>Scan your store and see what is <em>costing you sales.</em></h1></section>
    <section class="ar-wrap sv-wrap legal-wrap" style="padding-bottom:4rem">{AUDIT}</section>
  </main>
  {footer(p)}
''' + (TAIL % (p, p, p, p)).replace("</body>", '<script src="js/audit.js"></script>\n</body>')
W(os.path.join(ROOT, "audit.html"), page)

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
    <section class="ar-wrap sv-wrap legal-wrap" style="padding-bottom:4rem">{CALC}</section>
  </main>
  {footer(p)}
''' + (TAIL % (p, p, p, p)).replace("</body>", '<script src="js/calculator.js"></script>\n</body>')
W(os.path.join(ROOT, "calculator.html"), page)

# ---------- 3. sitemap ----------
urls = [("/", "1.0", "2026-10-28"), ("/services/", "0.9", "2026-10-28"), ("/projects.html", "0.8", "2026-10-27"), ("/contact.html", "0.7", "2026-10-27"), ("/privacy.html", "0.2", "2026-10-28"), ("/terms.html", "0.2", "2026-11-08"), ("/refund-policy.html", "0.2", "2026-11-08"), ("/cookie-policy.html", "0.2", "2026-11-08"), ("/calculator.html", "0.7", "2026-10-29"), ("/audit.html", "0.8", "2026-11-10"), ("/blog/", "0.9", "2026-10-28")] + [(f'/services/{sv["slug"]}/', "0.9", "2026-10-28") for sv in SERVICES] + [(f'/services/{sv["slug"]}/', "0.8", "2026-11-08") for sv in NICHES] + [(f'/blog/{a["slug"]}/', "0.8", a["date"]) for a in ARTICLES] + [("/de/" + (d["slug"] + "/" if d["slug"] else ""), "0.8", "2026-11-13") for d in DE_PAGES]
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
