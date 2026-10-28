"""Shared header, mobile menu and footer markup for every page (used by build_blog.py)."""
CAL = "https://calendly.com/onwenmoses/30min"
CAL_ONCLICK = ("Calendly.initPopupWidget({url: '%s?hide_gdpr_banner=1&primary_color=f7cb1a'});return false;" % CAL)

SOCIALS = [  # (label, short, icon class, url)
    ("Instagram", "IG", "fa-brands fa-instagram", "https://www.instagram.com/moses__mastery"),
    ("X (Twitter)", "X", "fa-brands fa-x-twitter", "https://x.com/moses_mastery"),
    ("Pinterest", "PIN", "fa-brands fa-pinterest-p", "https://pin.it/7k7AHvYYQ"),
    ("Telegram", "TG", "fa-brands fa-telegram", "https://t.me/moses_mastery"),
    ("WhatsApp", "WA", "fa-brands fa-whatsapp", "https://wa.me/15818095630"),
]

def links(p):
    return [
        ("Home", p + "index.html", "home"),
        ("Services", p + "services/", "services"),
        ("Projects", p + "projects.html", "projects"),
        ("Pricing", p + "index.html#price", "price"),
        ("Blog", p + "blog/", "blog"),
        ("Contact", p + "contact.html", "contact"),
    ]

def header(p, active=""):
    des = "".join(f'<a href="{h}"{" aria-current=\"page\"" if k == active else ""}>{t}</a>' for t, h, k in links(p)[1:])
    return f'''<!-- mm-header -->
  <header class="header">
    <div class="hd-cont">
      <div class="logo">
        <a href="{p}index.html" aria-label="Moses Mastery home"><img src="{p}asset/logo.png" class="des_loo" alt="Moses Mastery logo"><img src="{p}asset/logo.png" class="mob_loo" alt=""></a>
      </div>
      <nav class="nav-menu_des" aria-label="Main">{des}</nav>
      <div class="rgt-hd">
        <a class="hd-sign" href="{p}account.html"><i class="fa-regular fa-user" aria-hidden="true"></i> Sign in</a>
        <div class="hd-cll">
          <a href="{CAL}" rel="noopener" onclick="{CAL_ONCLICK}"><i class="fa-solid fa-circle"><span></span></i> Strategy Call</a>
        </div>
        <div class="nav-togg">
          <button type="button" class="menu-icon" aria-label="Open menu" aria-expanded="false" aria-controls="mmMenu" onclick="toggleMenu(event)">
            <span class="line line1"></span><span class="line line2"></span>
          </button>
        </div>
      </div>
    </div>
  </header>
  <div class="mm-menu" id="mmMenu" aria-hidden="true" role="dialog" aria-label="Site menu">
    <div class="mm-menu-top">
      <a href="{p}index.html" class="mm-menu-logo" aria-label="Moses Mastery home"><img src="{p}asset/logo.png" alt="" width="256" height="256"><span>Moses Mastery</span></a>
      <button type="button" class="mm-menu-close" aria-label="Close menu" onclick="toggleMenu(event)"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </div>
    <nav class="mm-menu-links" aria-label="Menu">
      {"".join(f'<a href="{h}"{" class=\"is-active\" aria-current=\"page\"" if k == active else ""} style="--i:{i}">{t}</a>' for i, (t, h, k) in enumerate(links(p)))}
      <a href="{CAL}" class="mm-menu-cta" style="--i:6" onclick="{CAL_ONCLICK}">Book a call <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
      <div class="mm-menu-auth" style="--i:7"><a href="{p}account.html">Sign in</a><span>/</span><a href="{p}account.html?mode=signup">Sign up</a></div>
    </nav>
    <div class="mm-menu-foot">
      <div class="mm-menu-soc">{"".join(f'<a href="{u}" target="_blank" rel="noopener noreferrer" aria-label="{l}">{s}</a>' for l, s, i, u in SOCIALS)}</div>
      <p>&copy; Moses Mastery 2026</p>
    </div>
  </div>
  <!-- /mm-header -->'''

def footer(p):
    soc = "".join(f'<a href="{u}" target="_blank" rel="noopener noreferrer" aria-label="{l}"><i class="{i}" aria-hidden="true"></i></a>' for l, s, i, u in SOCIALS)
    co = "".join(f'<li><a href="{h}">{t}</a></li>' for t, h, k in links(p))
    sv = "".join(f'<li><a href="{p}services/{sl}/">{t}</a></li>' for sl, t in (
        ("shopify-store-design", "Shopify design &amp; development"), ("shopify-conversion-rate-optimization", "Conversion optimization &amp; audits"), ("shopify-seo", "Shopify SEO"),
        ("meta-ads-for-shopify", "Meta &amp; Google ads"), ("ai-automation-for-shopify", "AI automation, content &amp; chat")))
    return f'''<!-- mm-footer -->
  <footer class="mm-foot">
    <div class="mm-foot-in">
      <div class="mm-foot-brand">
        <a href="{p}index.html" class="mm-foot-logo" aria-label="Moses Mastery home"><img src="{p}asset/logo.png" alt="" width="256" height="256" loading="lazy"><span>Moses<br>Mastery</span></a>
        <p class="mm-foot-tag">Shopify design, growth and AI for eCommerce brands.</p>
        <address class="mm-foot-contact">
          <span>Contact</span>
          <a href="mailto:info@mosesecom.com">info@mosesecom.com</a>
          <a href="tel:+15818095630">+1 (581) 809-5630</a>
        </address>
        <div class="mm-foot-soc">{soc}</div>
      </div>
      <nav class="mm-foot-col" aria-label="Company"><h3>Company</h3><ul>{co}</ul></nav>
      <nav class="mm-foot-col" aria-label="Services"><h3>Services</h3><ul>{sv}</ul></nav>
      <div class="mm-foot-col mm-foot-book"><h3>Let&rsquo;s talk</h3><p>Have a store to grow? Book a free strategy call.</p><a class="mm-foot-btn" href="{CAL}" onclick="{CAL_ONCLICK}">Book a call <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a></div>
    </div>
    <div class="mm-foot-bar"><p>&copy; 2026 Moses Mastery. All rights reserved. <a href="{p}account.html" class="mm-foot-sign">Sign in</a></p><button type="button" class="mm-totop" aria-label="Back to top" onclick="window.scrollTo({{top:0,behavior:'smooth'}})">Back to top <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button></div>
  </footer>
  <!-- /mm-footer -->'''
