"""Builds /de/index.html from the English index.html: same design and sections, German text.
TXT maps English text (prefix match, whitespace-normalised) to German. ATTR does the same for attribute values.
Anything left in English is listed by the build so it can be translated. Names, domains and numbers stay as they are."""
import re, html

TXT = {
"©19–26": "©19–26",
"We transform brands": "Wir machen aus Marken Umsatzquellen.",
"Now building": "Aktuell im Bau",
"Shopify stores": "Shopify-Shops",
"We build high-converting eCommerce": "Wir bauen E-Commerce-Erlebnisse, die gut konvertieren und Ihren Umsatz steigern. Ihr Shop ist nicht nur eine Website, sondern Ihr Vertriebskanal rund um die Uhr: Er soll Kunden anziehen, überzeugen und mit Ihnen wachsen.",
"Ecommerce website": "E-Commerce-Website",
"conversion rate (CRO)": "Conversion-Optimierung (CRO)",
"Brand Identity Design": "Markenidentität",
"Social media ads": "Social-Media-Werbung",
"AI automation": "KI-Automatisierung",
"Get Your Free Audit": "Kostenlosen Audit anfordern",
"Our results speak for themselves.": "Die Ergebnisse sprechen für sich.",
"Trusted by industry leaders:": "Marken, mit denen ich gearbeitet habe:",
"Our Services": "Unsere Leistungen",
"Everything your store needs to": "Alles, was Ihr Shop braucht, um",
"sell more": "mehr zu verkaufen",
"Store Design": "Store-Design",
"We craft conversion-optimized store designs": "Wir gestalten conversion-optimierte Shops, die Ihre Produkte ins beste Licht rücken, den Kaufprozess vereinfachen und den durchschnittlichen Bestellwert steigern.",
"High-Converting Stores": "Shops, die verkaufen",
"Conversion Optimization": "Conversion-Optimierung",
"Performance Advertising": "Performance-Werbung",
"Brand Strategy & Design": "Markenstrategie & Design",
"AI Automation & Workflows": "KI-Automatisierung & Workflows",
"AI Content & Creative": "KI-Inhalte & Kreation",
"AI Chatbots & Assistants": "KI-Chatbots & Assistenten",
"We turn your existing traffic": "Wir machen aus Ihrem bestehenden Traffic zahlende Kunden: mit bewährten CRO-Methoden, die Conversion-Rate und Umsatz steigern, ohne dass Ihr Werbebudget wächst.",
"We create high-performance ad campaigns": "Wir erstellen leistungsstarke Werbekampagnen, die Aufmerksamkeit gewinnen, qualifizierten Traffic bringen und auf allen Social-Plattformen messbare Ergebnisse liefern.",
"We build powerful brand identities": "Wir entwickeln starke Markenauftritte, die auffallen, sofort Vertrauen schaffen und Sie in Ihrem Markt als erste Adresse positionieren.",
"We automate the repetitive work": "Wir automatisieren die wiederkehrende Arbeit hinter Ihrem Shop – Bestell- und Support-Abläufe, Nachfassaktionen, Reporting und Produktpflege –, damit Sie weniger Zeit mit Verwaltung und mehr mit Wachstum verbringen.",
"AI-assisted product copy": "KI-gestützte Produkttexte, SEO-Inhalte und Werbemittel – schnell erstellt, von Menschen geprüft und auf Ihren Markenton abgestimmt.",
"Custom chat assistants": "Individuelle Chat-Assistenten, die Kundenfragen beantworten, Produkte empfehlen und im richtigen Moment an Sie übergeben – abgestimmt auf Ihr Sortiment und Ihre Richtlinien.",
"Start Your Project": "Projekt starten",
"Conversion Optimization": "Conversion-Optimierung",
"Meta & Google Ads": "Meta- & Google-Werbung",
"Etsy Growth": "Etsy-Wachstum",
"Store Redesign": "Shop-Relaunch",
"AI Automation": "KI-Automatisierung",
"Shopify Stores": "Shopify-Shops",
"Grow": "Wachstum",
"Selected Work": "Ausgewählte Projekte",
"proven results,": "echte Projekte,",
"stunning designs": "starkes Design",
"Store Design & Conversion Optimization for a Premium Fragrance Brand": "Store-Design und Conversion-Optimierung für eine Premium-Duftmarke",
"Store Design & Development for a Home Brewing Kit Brand": "Store-Design und Entwicklung für eine Marke für Heimbrau-Sets",
"Store Design & Growth Optimization for a Natural Skincare Brand": "Store-Design und Wachstumsoptimierung für eine Naturkosmetik-Marke",
"Store Design & Development for a Gut-Friendly Specialty Food Brand": "Store-Design und Entwicklung für eine Spezialitätenmarke für darmfreundliche Lebensmittel",
"Optimization": "Optimierung",
"Development": "Entwicklung",
"shopify": "Shopify",
"design": "Design",
"ecommerce": "E-Commerce",
"all projects": "alle Projekte",
"Brands I've worked with": "Marken, mit denen ich gearbeitet habe",
"Shopify stores across 6 niches": "Shopify-Shops aus 6 Branchen",
"From streetwear and jewelry": "Von Streetwear und Schmuck bis zu Nahrungsergänzung, Haustierbedarf und Food – echte Shopify-Shops, an denen ich gearbeitet habe. Öffnen Sie einen Shop oder filtern Sie nach Branche.",
"Shopify brands": "Shopify-Marken",
"Niches": "Branchen",
"Services": "Leistungen",
"All": "Alle",
"Apparel & Streetwear": "Mode & Streetwear",
"Jewelry": "Schmuck",
"Supplements & Wellness": "Nahrungsergänzung & Wellness",
"Skincare": "Hautpflege",
"Food & Drink": "Food & Getränke",
"Pet": "Haustiere",
"Apparel": "Mode",
"Wellness": "Wellness",
"Store analytics": "Store-Analysen",
"Inside the dashboards": "Ein Blick in die Dashboards",
"Screen recordings and snapshots": "Bildschirmaufnahmen und Ausschnitte aus Shopify- und Triple-Whale-Dashboards von Shops, an denen ich gearbeitet habe.",
"About me": "Über mich",
"Who’s Behind Moses Mastery": "Wer hinter Moses Mastery steht",
"I founded Moses Mastery": "Ich habe Moses Mastery gegründet, um E-Commerce-Marken mit strategischem Branding, conversion-orientiertem Design und leistungsstarker Entwicklung weiterzubringen.",
"I started solo": "Ich habe allein angefangen, aber schnell gemerkt, dass sich Ergebnisse nur mit einem Team skalieren lassen. Im E-Commerce müssen Strategie, CRO, UX und Marke wie ein System zusammenarbeiten. Deshalb arbeite ich mit Spezialisten zusammen, um Umsetzung und Ergebnisse zu verbessern.",
"I remain hands-on": "Ich bleibe in jedem Projekt selbst beteiligt, leite die Strategie und arbeite an Design und Marketing mit – denn dort entsteht der Umsatzeffekt.",
"Founder | Marketing lead": "Gründer | Marketing-Leitung",
"General Quotes": "Allgemeine Angebote",
"Scale Your Business,": "Skalieren Sie Ihr Geschäft,",
"Maximize Your ROI": "steigern Sie Ihren ROI",
"Store Launch Packages": "Store-Launch-Pakete",
"Prices are starting points. Your fixed quote": "Die Preise sind Ausgangspunkte (in US-Dollar). Ihr Festpreis-Angebot hängt von der Anzahl der Produkte, Seiten und Funktionen ab.",
"Starter": "Starter",
"from $500": "ab 500 $",
"from $950": "ab 950 $",
"from $1,500": "ab 1.500 $",
"from $2,000": "ab 2.000 $",
"from $6,000": "ab 6.000 $",
"from $10,500": "ab 10.500 $",
"one-time project": "einmaliges Projekt",
"per month": "pro Monat",
"Conversion-Focused Store Design": "Conversion-orientiertes Store-Design",
"Product & niche research": "Produkt- & Nischenrecherche",
"Payment gateway setup": "Einrichtung des Zahlungsanbieters",
"SSL certificate setup": "Einrichtung des SSL-Zertifikats",
"Growth": "Growth",
"Everything in Starter, plus:": "Alles aus Starter, zusätzlich:",
"Premium store design & UX": "Premium-Store-Design & UX",
"Multi-language & multi-currency setup": "Mehrsprachig & mehrwährig einrichten",
"Premium": "Premium",
"Everything in Growth, plus:": "Alles aus Growth, zusätzlich:",
"Advanced Custom Features": "Individuelle Zusatzfunktionen",
"Privacy, terms & policy pages setup": "Seiten für Datenschutz, Bedingungen und Richtlinien einrichten",
"Get Started": "Jetzt starten",
"Choose a suitable plan to get started.": "Wählen Sie ein passendes Paket, um zu starten.",
"Growth Marketing Packages": "Growth-Marketing-Pakete",
"Monthly plans, quoted": "Monatliche Pläne, passend zu Ihrem Shop und Ihren Zielen angeboten. Das Werbebudget zahlen Sie direkt an die Werbeplattformen; es ist nicht enthalten.",
"Launch": "Launch",
"Conversion Rate Optimization": "Conversion-Optimierung (CRO)",
"Content strategy": "Content-Strategie",
"Search engine optimization (SEO)": "Suchmaschinenoptimierung (SEO)",
"Automated email flows": "Automatisierte E-Mail-Flows",
"Meta & Google ad campaigns": "Meta- & Google-Werbekampagnen",
"Accelerate": "Accelerate",
"Everything in Launch, plus:": "Alles aus Launch, zusätzlich:",
"Advanced Email Marketing": "Erweitertes E-Mail-Marketing",
"Social Proof & Review Strategy": "Social Proof & Bewertungsstrategie",
"Elite": "Elite",
"Everything in Accelerate, plus:": "Alles aus Accelerate, zusätzlich:",
"Continuous Performance Optimization": "Laufende Performance-Optimierung",
"Multi-Platform Ad Management": "Werbung auf mehreren Plattformen",
"Advanced retargeting funnels": "Erweiterte Retargeting-Funnels",
"FAQ": "FAQ",
"Questions, answered": "Fragen und Antworten",
"What does Moses Mastery do?": "Was macht Moses Mastery?",
"Moses Mastery designs, builds": "Moses Mastery gestaltet, baut und optimiert Shopify-Shops. Zu den Leistungen gehören Store-Design und Entwicklung, Theme-Anpassung und Relaunches, Conversion-Optimierung, Meta- und Google-Werbung, E-Commerce-SEO und Google Merchant Center, Markendesign und KI-Automatisierung.",
"Do you only work with Shopify?": "Arbeiten Sie nur mit Shopify?",
"Shopify is the focus.": "Der Schwerpunkt liegt auf Shopify. Design, Entwicklung und Optimierung sind auf Shopify-Shops ausgerichtet, und die Werbe-, SEO- und KI-Leistungen unterstützen diese.",
"What AI services do you offer?": "Welche KI-Leistungen bieten Sie an?",
"Three: AI automation": "Drei: KI-Automatisierung und Workflows für wiederkehrende Abläufe im Shop, KI-Inhalte und Kreation für Produkttexte, SEO-Inhalte und Werbemittel sowie KI-Chatbots und Assistenten für Kundenfragen und Produktempfehlungen.",
"Which niches have you worked in?": "In welchen Branchen haben Sie gearbeitet?",
"Apparel and streetwear, jewelry": "Mode und Streetwear, Schmuck, Nahrungsergänzung und Wellness, Hautpflege, Food und Getränke sowie Haustierbedarf. Die Markengalerie auf dieser Seite zeigt Beispiele.",
"Can you audit my existing store?": "Können Sie meinen bestehenden Shop prüfen?",
"Yes. Store audits": "Ja. Shop-Audits und Performance-Optimierung gehören zum Angebot. Senden Sie Ihren Shop-Link über die Kontaktseite und beschreiben Sie, was verbessert werden soll.",
"How does pricing work?": "Wie funktionieren die Preise?",
"Store Launch packages are one-time": "Store-Launch-Pakete sind Einmalprojekte, Growth-Marketing-Pakete laufen monatlich. Alle Preise sind Ausgangspunkte: Senden Sie Shop-Link und Ziele über die Kontaktseite, dann erhalten Sie ein Festpreis-Angebot für den Umfang. Das Werbebudget zahlen Sie direkt an die Werbeplattformen; es ist nicht enthalten.",
"How do I get started?": "Wie fange ich an?",
"Book a strategy call": "Buchen Sie ein Strategiegespräch oder fragen Sie über die Kontaktseite ein Angebot an. Nennen Sie Shop-Link, Ziele und Fristen, damit die erste Antwort konkret ausfallen kann.",
"Client feedback": "Kundenfeedback",
"What clients say": "Das sagen Kunden",
"Messages and store reports shared": "Nachrichten und Shop-Berichte, die Kunden geteilt haben, mit verborgenen Namen. (Die Nachrichten sind im Original auf Englisch.)",
"Swipe to see more": "Wischen für mehr",
"Results shown are from individual clients.": "Die gezeigten Ergebnisse stammen von einzelnen Kunden. Sie hängen von Produkt, Angebot, Werbebudget, Markt und Zeitpunkt ab und sind kein Versprechen für künftige Ergebnisse.",
"How we work": "So arbeiten wir",
"From first look to": "Vom ersten Blick bis zu",
"steady growth": "stetigem Wachstum",
"Audit": "Audit",
"We review your store, traffic": "Wir prüfen Ihren Shop, Ihren Traffic und Ihre Zahlen, um genau zu finden, wo Besucher abspringen.",
"Build": "Umsetzung",
"We design and build the fixes": "Wir gestalten und bauen die Verbesserungen: Produktseiten, Checkout und Ladezeit.",
"We ship the changes": "Wir setzen die Änderungen live und richten das Tracking ein, damit jedes Ergebnis messbar ist.",
"We run ads and keep testing": "Wir schalten Werbung und testen weiter, damit mehr Besucher zu Käufern werden.",
"Free tool": "Kostenloses Tool",
"How much revenue is your store": "Wie viel Umsatz lässt Ihr Shop",
"leaving on the table?": "liegen?",
"Enter your traffic, conversion rate": "Geben Sie Traffic, Conversion-Rate und Bestellwert ein. In 30 Sekunden sehen Sie, was eine bessere Conversion-Rate wert ist. (Der Rechner ist auf Englisch.)",
"Try the free calculator": "Kostenlosen Rechner testen",
"contact": "Kontakt",
"Ready to Scale?": "Bereit zu wachsen?",
"Let's Discuss Your Project": "Sprechen wir über Ihr Projekt",
"Founder & Marketing Lead": "Gründer & Marketing-Leitung",
"Please make sure to add some project details": "Bitte nennen Sie einige Projektdetails, damit wir Ihre Anfrage prüfen und Ihnen ein Angebot machen können. Melden Sie sich jederzeit – wir erstellen ein Angebot nach Ihren Angaben, und wenn alles passt, legen wir los.",
"Get My Free Store Audit": "Meinen kostenlosen Store-Audit anfordern",
"Get Free Quote": "Kostenloses Angebot anfordern",
}
ATTR = {
"Now building: Shopify stores": "Aktuell im Bau: Shopify-Shops, Conversion-Systeme, Werbekampagnen und KI-Workflows",
"Shopify stores|conversion systems": "Shopify-Shops|Conversion-Systeme|Werbekampagnen|KI-Workflows",
"store design": "Store-Design", "Conversion Rate": "Conversion-Rate", "Social Media Ads": "Social-Media-Werbung",
"Brand Identity Design": "Markenidentität", "AI Automation": "KI-Automatisierung", "AI Content & Creative": "KI-Inhalte & Kreation",
"AI Chatbots & Assistants": "KI-Chatbots & Assistenten",
"Previous brands": "Vorherige Marken", "Next brands": "Nächste Marken", "Moses Mastery at a glance": "Moses Mastery im Überblick",
"Filter brands by niche": "Marken nach Branche filtern", "Brands gallery": "Markengalerie, mit den Pfeiltasten navigieren",
"Store analytics screen recordings": "Bildschirmaufnahmen der Store-Analysen", "Previous recordings": "Vorherige Aufnahmen", "Next recordings": "Nächste Aufnahmen",
"Enlarged dashboard": "Vergrößerter Dashboard-Screenshot", "Client messages": "Kundennachrichten",
"Moses Daniel, founder of Moses Mastery, in a floral": "Moses Daniel, Gründer von Moses Mastery, im weißen Blumenhemd mit schwarzer Kappe",
"Moses Daniel, founder of Moses Mastery": "Moses Daniel, Gründer von Moses Mastery",
"Client WhatsApp message thanking": "WhatsApp-Nachricht eines Kunden mit Dank und wöchentlichem Shopify-Umsatzbericht",
"Client WhatsApp message describing": "WhatsApp-Nachricht eines Kunden zu Umsätzen nach dem Start der Werbung, mit Shopify-Umsatzbericht",
"Client Instagram message": "Instagram-Nachricht eines Kunden mit Dank und Shopify-Umsatzbericht",
"Client WhatsApp message reporting": "WhatsApp-Nachricht eines Kunden zu den Umsätzen am ersten Tag der Werbung, mit Shopify-Bericht",
}
CAT = {"Apparel":"Mode","Jewelry":"Schmuck","Wellness":"Wellness","Skincare":"Hautpflege","Food &amp; Drink":"Food &amp; Getränke","Pet":"Haustiere"}

def _norm(s): return " ".join(html.unescape(s).split())
def _look(m, s):
    n = _norm(s)
    if n in m: return m[n]
    for k, v in m.items():
        if n.startswith(k): return v
    return None

def translate(t):
    """t = HTML of the English page body. Returns (html, untranslated list)."""
    miss = []
    parts = re.split(r"(<script.*?</script>|<style.*?</style>|<[^>]+>)", t, flags=re.S)
    for i, s in enumerate(parts):
        if s.startswith("<script") or s.startswith("<style"): continue
        if s.startswith("<"):
            def ra(m):
                v = _look(ATTR, m.group(2))
                if v is None:
                    mm = re.match(r"(.+?), (Apparel|Jewelry|Wellness|Skincare|Food &amp; Drink|Food & Drink|Pet) store \(opens in a new tab\)$", m.group(2))
                    if mm: return f'{m.group(1)}"{mm.group(1)}, {CAT.get(mm.group(2).replace("& Drink","&amp; Drink").replace("&amp;amp;","&amp;"), mm.group(2))}-Shop (öffnet in neuem Tab)"'
                    mm = re.match(r"(.+) Shopify store homepage$", m.group(2))
                    if mm: return f'{m.group(1)}"{mm.group(1)} Shopify-Shop, Startseite"'
                    mm = re.match(r"Shopify analytics screen recording (\d+) of (\d+)$", m.group(2))
                    if mm: return f'{m.group(1)}"Shopify-Analysen, Bildschirmaufnahme {mm.group(1)} von {mm.group(2)}"'
                    mm = re.match(r"(.+) Shopify store shown on a phone$", m.group(2))
                    if mm: return f'{m.group(1)}"{mm.group(1)} Shopify-Shop auf einem Smartphone"'
                    return m.group(0)
                return f'{m.group(1)}"{html.escape(v, True)}"'
            parts[i] = re.sub(r'((?:aria-label|alt|data-title|data-words)=)"([^"]*)"', ra, s)
            parts[i] = re.sub(r'(data-desc=)"([^"]*)"', lambda m: f'{m.group(1)}"{html.escape(_look(TXT, m.group(2)) or html.unescape(m.group(2)), True)}"', parts[i])
        else:
            if not s.strip(): continue
            v = _look(TXT, s)
            if v is None:
                if re.search(r"[A-Za-z]{3,}", s) and not re.fullmatch(r"[\W\d]*", s): miss.append(_norm(s)[:80])
                continue
            lead = s[:len(s) - len(s.lstrip())]; trail = s[len(s.rstrip()):]
            parts[i] = lead + html.escape(v, False).replace("&#x27;", "'") + trail
    return "".join(parts), miss
