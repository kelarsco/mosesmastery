"""Industry landing pages (one per niche). Rules: no invented results, clients or guarantees.
Store examples are portfolio stores already shown on the home page."""

def _stores(items):
    li = "".join(f'<li><a href="{u}" target="_blank" rel="noopener noreferrer"><strong>{n}</strong></a> ({d})</li>' for n, u, d in items)
    return f'<p>Stores from my portfolio in this space (open any to see the live site):</p><ul>{li}</ul><p>See more on the <a href="../../projects.html">projects page</a>.</p>'

PRICE = "<p>Store Launch packages are one-time projects: Starter from $500, Growth from $950 and Premium from $1,500. Growth Marketing plans (ads, CRO and ongoing optimization) start from $2,000 per month, and ad spend is paid directly to Meta and Google. After you send your store link and goals, you receive a fixed quote. See the <a href=\"../../index.html#price\">package details</a>.</p>"

NICHES = [
{
"slug": "shopify-designer-for-apparel-brands",
"nav": "Apparel &amp; streetwear",
"title": "Shopify Designer for Apparel & Streetwear Brands",
"stitle": "Shopify Designer for Apparel & Streetwear Brands | Moses Mastery",
"h1": "Shopify designer for apparel & streetwear brands",
"desc": "Shopify store design, conversion optimization and Meta ads for clothing, streetwear and fashion brands. See real apparel stores and get a fixed quote.",
"lead": "Fashion shoppers buy with their eyes and leave over doubts about fit, shipping and returns. I design and optimize Shopify apparel stores to answer those doubts before the shopper has to ask.",
"sections": [
("What apparel stores need", """<ul><li><strong>Fast, visual collection pages</strong> with filters for size, colour and price that work well on a phone.</li>
<li><strong>Product pages that answer fit questions</strong>: size guides, model measurements, fabric details and clear photos of every colour.</li>
<li><strong>Variant and stock handling</strong> that does not frustrate shoppers: sold-out sizes, back-in-stock alerts and drops or pre-orders.</li>
<li><strong>Clear shipping and returns</strong> shown on the product page and in the cart, since returns are the top worry in online fashion.</li>
<li><strong>Merchandising and bundles</strong> such as outfits, collections and sets that lift average order value.</li></ul>"""),
("How I help", """<p>For new stores I handle design and build. For stores already trading, I audit the product page, cart and checkout, fix what loses sales, then support growth with <a href="../meta-ads-for-shopify/">Meta and Google ads</a> and <a href="../shopify-seo/">Shopify SEO</a>. If you are choosing between a rebuild and fixes, read <a href="../../blog/shopify-redesign-or-optimize/">redesign or optimize</a>.</p>"""),
("Apparel stores in my portfolio", _stores([("D42 Multiverse","https://d42multiverse-shop.com/","streetwear"),("WEARELUXE","https://weareluxe.shop/","unisex apparel"),("Aerosoul","https://aerosoul.co.uk/","apparel"),("Incarnie","https://incarnie.com/","apparel")])),
("Pricing", PRICE),
],
"faqs": [
("Can you design a Shopify store for a clothing brand?", "Yes. I design and build Shopify stores for apparel and streetwear brands, including collection pages, size guides, variants and returns information."),
("How do you reduce returns and size questions?", "By putting fit information where shoppers need it: size guides, model measurements, fabric details and clear photos on every product page."),
("Do you run ads for fashion brands too?", "Yes. I set up Meta and Google campaigns with tracking, creative direction and retargeting. Ad spend is paid directly to the platforms."),
("How much does it cost?", "Store Launch packages start from $500. Ongoing growth plans start from $2,000 per month. You receive a fixed quote after sharing your store link and goals."),
],
"related": ["shopify-redesign-or-optimize", "shopify-conversion-rate-optimization-checklist"],
},
{
"slug": "shopify-designer-for-jewelry-stores",
"nav": "Jewelry stores",
"title": "Shopify Designer for Jewelry Stores",
"stitle": "Shopify Designer for Jewelry Stores | Moses Mastery",
"h1": "Shopify designer for jewelry stores",
"desc": "Shopify store design, conversion optimization and ads for jewelry brands. Build trust, show every detail and lift order value. See real jewelry stores.",
"lead": "Jewelry is a trust purchase. Shoppers need to see the detail, believe the quality and feel safe paying. I design Shopify jewelry stores that do exactly that.",
"sections": [
("What jewelry stores need", """<ul><li><strong>Detail-first product pages</strong>: close-up photos, on-model shots, scale and material information.</li>
<li><strong>Trust signals</strong>: reviews, certifications, warranty, secure checkout and clear return terms near the buy button.</li>
<li><strong>Higher order value</strong>: sets, pairs, gift options, engraving or sizing add-ons and "complete the look" suggestions.</li>
<li><strong>Gifting flow</strong>: gift wrap, messages and delivery dates, since many purchases are gifts.</li>
<li><strong>Speed with heavy images</strong>: sharp photos that still load fast on mobile.</li></ul>"""),
("How I help", """<p>I build or rebuild the store, then improve conversion with a page-by-page <a href="../shopify-conversion-rate-optimization/">CRO audit</a> and bring in buyers through <a href="../meta-ads-for-shopify/">Meta and Google ads</a> and <a href="../shopify-seo/">Shopify SEO</a>, including Google Merchant Center so your products can appear in Shopping results.</p>"""),
("Jewelry stores in my portfolio", _stores([("Rosie Ray","https://rosieray.com/","jewelry"),("Si'bella Atelier","https://sibellaatelier.com/","jewelry"),("Diamond Land","https://diamond-land.be/","diamonds and jewelry"),("LushStonez","https://www.lushstonez.com/","gemstone jewelry")])),
("Pricing", PRICE),
],
"faqs": [
("Do you design Shopify stores for jewelry brands?", "Yes. I design and build Shopify jewelry stores with detail-rich product pages, trust signals and gifting options."),
("How do you build trust for a new jewelry brand?", "With reviews, clear materials and certification information, visible return and warranty terms, secure checkout and consistent, high-quality photography."),
("Can you help jewelry stores appear on Google Shopping?", "Yes. Google Merchant Center setup is part of my Shopify SEO and Google ads work."),
("What does it cost?", "Store Launch packages start from $500 and growth plans from $2,000 per month. You receive a fixed quote after reviewing your store."),
],
"related": ["shopify-conversion-rate-optimization-checklist", "shopify-seo-guide"],
},
{
"slug": "shopify-expert-for-wellness-and-skincare-brands",
"nav": "Wellness &amp; skincare",
"title": "Shopify Expert for Wellness & Skincare Brands",
"stitle": "Shopify Expert for Wellness & Skincare Brands | Moses Mastery",
"h1": "Shopify expert for wellness, supplement & skincare brands",
"desc": "Shopify store design, subscriptions, conversion optimization and ads for wellness, supplement and skincare brands. See real stores and get a fixed quote.",
"lead": "Wellness and skincare shoppers want proof, clear ingredients and a reason to come back. I build Shopify stores that explain the product simply and turn first orders into repeat customers.",
"sections": [
("What wellness and skincare stores need", """<ul><li><strong>Clear product education</strong>: ingredients, how to use, who it is for and what to expect, in plain language.</li>
<li><strong>Social proof</strong>: reviews, before and after photos where you are allowed to use them, and expert or lab information.</li>
<li><strong>Subscriptions and refills</strong>: subscribe-and-save so repeat orders happen without extra ads.</li>
<li><strong>Bundles and routines</strong> that raise average order value, such as starter kits and full regimens.</li>
<li><strong>Compliant claims</strong>: ad platforms and regulators are strict on health claims, so copy and creative need care. Check your own local rules.</li></ul>"""),
("How I help", """<p>I design the store, set up retention basics and run <a href="../meta-ads-for-shopify/">Meta and Google ads</a> with tracking in place first. A <a href="../shopify-conversion-rate-optimization/">CRO audit</a> finds where shoppers drop off between the product page and checkout.</p>"""),
("Stores in my portfolio", _stores([("Ritual","https://ritual.com/","wellness and supplements"),("Levels","https://www.levels.com/","health and wellness"),("NOTOX Skin Lab","https://notoxskinlab.com/","skincare")])),
("Pricing", PRICE),
],
"faqs": [
("Do you work with supplement and skincare brands?", "Yes. I design, optimize and market Shopify stores for wellness, supplement and skincare brands."),
("Can you set up subscriptions on Shopify?", "Yes. Subscribe-and-save and refill flows can be set up with Shopify subscription apps, and I design the product page around them."),
("Can you promise sales results?", "No. Results depend on product, offer, budget and competition. I set up clear tracking and report real numbers."),
("What does it cost?", "Store Launch packages start from $500 and growth plans from $2,000 per month, quoted to your store and goals."),
],
"related": ["meta-ads-for-shopify-stores", "shopify-conversion-rate-optimization-checklist"],
},
{
"slug": "shopify-expert-for-food-and-pet-brands",
"nav": "Food, drink &amp; pet brands",
"title": "Shopify Expert for Food, Drink & Pet Brands",
"stitle": "Shopify Expert for Food, Drink & Pet Brands | Moses Mastery",
"h1": "Shopify expert for food, drink & pet brands",
"desc": "Shopify store design, subscriptions, conversion optimization and ads for food, drink and pet brands. See real stores and get a fixed quote.",
"lead": "Food, drink and pet products live on repeat orders, careful shipping and trust. I build Shopify stores that make reordering easy and the first purchase feel safe.",
"sections": [
("What food, drink and pet stores need", """<ul><li><strong>Repeat-order flow</strong>: subscriptions, reorder buttons and bundles for products people run out of.</li>
<li><strong>Clear shipping rules</strong>: delivery areas, dates, packaging and cut-off times, especially for fresh or perishable items.</li>
<li><strong>Appetising, honest product pages</strong>: ingredients, allergens, sizes and serving or feeding guidance.</li>
<li><strong>Gift and bundle options</strong> that lift order value around holidays and seasons.</li>
<li><strong>Local and regional intent</strong>: collection pages and SEO for the places you deliver to.</li></ul>"""),
("How I help", """<p>I design and build the store, fix the product page and checkout, and bring in customers with <a href="../meta-ads-for-shopify/">Meta and Google ads</a> and <a href="../shopify-seo/">Shopify SEO</a>.</p>"""),
("Stores in my portfolio", _stores([("Farmyard Fine Dining","https://farmyardfinedining.com/","food and drink"),("Mewyoo","https://mewyoo.com/","pet products")])),
("Pricing", PRICE),
],
"faqs": [
("Do you work with food and pet brands?", "Yes. I design, optimize and market Shopify stores for food, drink and pet brands."),
("Can you set up subscriptions for repeat orders?", "Yes. Subscription and reorder flows can be added with Shopify apps, and the product pages are designed around them."),
("Can you help with shipping information for perishable products?", "Yes. I make delivery areas, dates and rules clear on product pages, the cart and checkout. Your carrier and regulations decide what is possible."),
("What does it cost?", "Store Launch packages start from $500 and growth plans from $2,000 per month, quoted after reviewing your store."),
],
"related": ["shopify-seo-guide", "shopify-store-audit-checklist"],
},
]
