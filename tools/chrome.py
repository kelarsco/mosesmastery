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
        ("Free Calculator", p + "calculator.html", "calc"),
        ("Contact", p + "contact.html", "contact"),
    ]

def header(p, active=""):
    des = "".join(f'<a href="{h}"{" aria-current=\"page\"" if k == active else ""}>{t}</a>' for t, h, k in [(("Calculator" if k == "calc" else t), h, k) for t, h, k in links(p)[1:]])
    return f'''<!-- mm-header -->
  <header class="header">
    <div class="hd-cont">
      <div class="logo">
        <a href="{p}index.html" aria-label="Moses Mastery home"><img src="{p}asset/logo.webp" class="des_loo" alt="Moses Mastery logo"><img src="{p}asset/logo.webp" class="mob_loo" alt=""></a>
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
      <a href="{p}index.html" class="mm-menu-logo" aria-label="Moses Mastery home"><img src="{p}asset/logo.webp" alt="" width="256" height="256"><span>Moses Mastery</span></a>
      <button type="button" class="mm-menu-close" aria-label="Close menu" onclick="toggleMenu(event)"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>
    </div>
    <nav class="mm-menu-links" aria-label="Menu">
      {"".join(f'<a href="{h}"{" class=\"is-active\" aria-current=\"page\"" if k == active else ""} style="--i:{i}">{t}</a>' for i, (t, h, k) in enumerate(links(p)))}
      <a href="{CAL}" class="mm-menu-cta" style="--i:7" onclick="{CAL_ONCLICK}">Book a call <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>
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
        <a href="{p}index.html" class="mm-foot-logo" aria-label="Moses Mastery home"><img src="{p}asset/logo.webp" alt="" width="256" height="256" loading="lazy"><span>Moses<br>Mastery</span></a>
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
    <div class="mm-foot-bar"><p>&copy; 2026 Moses Mastery. All rights reserved. <a href="{p}account.html" class="mm-foot-sign">Sign in</a><a href="{p}privacy.html" class="mm-foot-sign">Privacy</a></p><button type="button" class="mm-totop" aria-label="Back to top" onclick="window.scrollTo({{top:0,behavior:'smooth'}})">Back to top <i class="fa-solid fa-arrow-up" aria-hidden="true"></i></button></div>
  </footer>
  <a class="mm-wa" href="https://wa.me/15818095630?text=Hi%20Moses%2C%20I%27d%20like%20to%20talk%20about%20my%20Shopify%20store." target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp"><svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true" fill="currentColor"><path d="M16.04 3C9.4 3 4 8.4 4 15.03c0 2.12.55 4.19 1.6 6.01L4 29l8.14-1.56a12 12 0 0 0 3.9.65C22.68 28.09 28 22.7 28 16.06 28 9.4 22.68 3 16.04 3zm0 22.1c-1.2 0-2.38-.3-3.42-.9l-.25-.14-4.83.93.96-4.71-.16-.26a9.1 9.1 0 0 1-1.4-4.9c0-5.04 4.1-9.14 9.14-9.14 5.02 0 9.1 4.1 9.1 9.15 0 5.02-4.08 9.13-9.14 9.13zm5.03-6.84c-.28-.14-1.63-.8-1.88-.9-.25-.09-.43-.14-.62.14-.18.27-.7.89-.86 1.07-.16.18-.32.2-.6.07-.27-.14-1.15-.42-2.2-1.35-.8-.72-1.35-1.6-1.5-1.88-.16-.27-.02-.42.12-.55.12-.12.27-.32.4-.48.14-.16.18-.27.27-.46.09-.18.05-.34-.02-.48-.07-.14-.62-1.5-.85-2.05-.22-.54-.45-.46-.62-.47h-.53c-.18 0-.48.07-.73.34-.25.27-.96.94-.96 2.3 0 1.37.99 2.69 1.13 2.87.14.18 1.95 2.98 4.73 4.18.66.28 1.18.45 1.58.58.66.21 1.27.18 1.75.11.53-.08 1.63-.67 1.86-1.31.23-.64.23-1.19.16-1.31-.07-.11-.25-.18-.53-.32z"/></svg></a>
  <!-- /mm-footer -->'''
