"""Service landing pages (one per search intent). Edit here, then run: python3 tools/build_blog.py
Rules: no invented results, clients or guarantees. Prices must match the home page."""

SERVICES = [
{
"slug": "shopify-store-design",
"nav": "Shopify design &amp; development",
"title": "Shopify Store Design & Development",
"stitle": "Shopify Store Design & Development | Moses Mastery",
"h1": "Shopify store design & development",
"desc": "Custom Shopify store design, theme customization and redesigns built around conversion. Starter, Growth and Premium packages from $500. Moses Mastery.",
"lead": "A Shopify store that looks good but does not guide shoppers to the buy button is an expensive brochure. I design and build Shopify stores around one question: what makes this visitor confident enough to buy?",
"sections": [
("What I design and build", """<ul><li><strong>New Shopify stores</strong>: structure, theme setup, collections, product pages, payments, shipping and policy pages.</li>
<li><strong>Theme customization</strong>: changing an existing theme so it fits your brand and sells better, without a rebuild.</li>
<li><strong>Redesigns</strong>: a new look and a better shopping flow for a store that already trades.</li>
<li><strong>Product page and cart design</strong>: the pages where most buying decisions happen.</li>
<li><strong>Store setup basics</strong>: payment gateway setup, SSL certificate setup, multi-language and multi-currency setup, and privacy, terms and policy pages.</li></ul>"""),
("How a project runs", """<ol><li><strong>Discovery.</strong> I review your products, audience, competitors and any current store data.</li>
<li><strong>Plan.</strong> We agree the page structure, features and what is in scope before design starts.</li>
<li><strong>Design and build.</strong> I build in Shopify, with mobile first, because most store traffic is on phones.</li>
<li><strong>Test and launch.</strong> Checkout, payments, speed and tracking are checked before going live.</li>
<li><strong>Handover.</strong> You get a walkthrough so you can manage products and content yourself.</li></ol>"""),
("Who this is for", "<p>Founders launching a first Shopify store, brands moving to Shopify from another platform, and store owners whose design no longer matches the quality of their products. If your store gets visitors but few orders, start with a <a href=\"../shopify-conversion-rate-optimization/\">conversion audit</a> instead, since a full redesign is not always the answer. My guide <a href=\"../../blog/shopify-redesign-or-optimize/\">Shopify redesign or optimization?</a> helps you decide.</p>"),
("Packages and pricing", "<p>Store Launch packages are one-time projects: Starter from $500, Growth from $950 and Premium from $1,500. These are starting points. After you send your store link and goals, you receive a fixed quote based on the number of products, pages and features. See the <a href=\"../../index.html#price\">package details</a>.</p>"),
],
"faqs": [
("How much does a Shopify store design cost?", "Moses Mastery Store Launch packages start from $500 for Starter, $950 for Growth and $1,500 for Premium. The final price depends on the number of products, pages and custom features, and you receive a fixed quote before work starts."),
("Do you build on a custom theme or customize an existing one?", "Both. Many stores do well with a customized premium theme, which is faster and cheaper. Custom features are added where the store really needs them."),
("Will my store work well on mobile?", "Yes. Stores are designed mobile first and checked on real phone sizes, because most Shopify traffic arrives on mobile devices."),
("Can you redesign my existing Shopify store?", "Yes. Redesigns keep your products, apps and data, and improve the layout, product pages and shopping flow."),
],
"related": ["shopify-redesign-or-optimize", "shopify-store-audit-checklist"],
},
{
"slug": "shopify-conversion-rate-optimization",
"nav": "Conversion optimization",
"title": "Shopify Conversion Rate Optimization (CRO)",
"stitle": "Shopify Conversion Rate Optimization (CRO) | Moses Mastery",
"h1": "Shopify conversion rate optimization (CRO) & store audits",
"desc": "Shopify CRO and store audits: find where visitors drop off and fix product pages, cart, checkout, speed and trust. Growth plans from $2,000 per month.",
"lead": "If your store already gets traffic but few orders, the fastest win is usually not more ads. It is fixing the steps where shoppers leave. I audit your funnel, find the biggest leaks and fix them in order of impact.",
"sections": [
("What a CRO engagement covers", """<ul><li><strong>Funnel analysis</strong>: sessions, product views, add to cart, checkout and purchase, to see where people drop off.</li>
<li><strong>Store audit</strong>: homepage, navigation, collection and product pages, cart, checkout, speed and trust signals.</li>
<li><strong>Prioritized fixes</strong>: a ranked list, so the highest-impact changes come first.</li>
<li><strong>Implementation</strong>: I make the changes, not just a report.</li>
<li><strong>Measurement</strong>: each change is checked against your numbers, so you know what worked.</li></ul>"""),
("Typical problems I find", """<p>Slow mobile pages, product pages that bury the add-to-cart button, unclear shipping and returns, weak product photography, reviews placed far from the price, and checkouts with unnecessary friction. The <a href="../../blog/shopify-conversion-rate-optimization-checklist/">12-fix Shopify CRO checklist</a> and the <a href="../../blog/shopify-store-audit-checklist/">store audit checklist</a> show the approach in detail.</p>"""),
("What I need from you", "<p>Your store link and, ideally, read-only access to Shopify analytics. If you have no tracking set up yet, setting it up is the first step, because it is impossible to improve what is not measured.</p>"),
("Pricing", "<p>Audits and one-off optimization fixes are quoted to your store. Ongoing Growth Marketing plans, which include conversion optimization, start from $2,000 per month (ad spend is paid directly to the ad platforms and is not included). <a href=\"../../contact.html\">Send your store link</a> for a quote.</p>"),
],
"faqs": [
("What is conversion rate optimization for Shopify?", "Conversion rate optimization (CRO) is improving your store so a bigger share of visitors become customers, by fixing product pages, navigation, cart, checkout, speed and trust, using your own store data."),
("How long does CRO take to show results?", "Some fixes, like speed and clearer product pages, can be measured within weeks. Reliable conclusions need enough traffic, so smaller stores need longer test periods. No honest agency can promise a specific lift."),
("Do I need a lot of traffic for CRO to work?", "More traffic makes testing faster, but many fixes are obvious usability problems that help at any size. Low-traffic stores focus on clear fixes rather than A/B tests."),
("Can you audit my Shopify store first?", "Yes. Send your store link through the contact page and describe what you want improved. The audit shows where I would start."),
],
"related": ["shopify-conversion-rate-optimization-checklist", "shopify-store-audit-checklist"],
},
{
"slug": "shopify-seo",
"nav": "Shopify SEO",
"title": "Shopify SEO & Google Merchant Center",
"stitle": "Shopify SEO & Google Merchant Center | Moses Mastery",
"h1": "Shopify SEO & Google Merchant Center",
"desc": "Shopify SEO that fixes technical issues, structures collections and product pages, and sets up Google Merchant Center so your products can be found.",
"lead": "Search traffic is the cheapest customer source once it works, but it takes time and a clean foundation. I set up your Shopify store so Google can crawl it, understand it and show your products.",
"sections": [
("What Shopify SEO includes", """<ul><li><strong>Technical SEO</strong>: indexing, canonical URLs, sitemap, duplicate collection and product URLs, redirects and page speed.</li>
<li><strong>Keyword research</strong>: the phrases real shoppers use for your products and categories.</li>
<li><strong>Collection and product page optimization</strong>: titles, descriptions, headings, internal links and image alt text.</li>
<li><strong>Structured data</strong>: product, review and breadcrumb markup, so search engines understand your pages.</li>
<li><strong>Google Merchant Center</strong>: feed setup and fixes, so products can appear in Google Shopping results.</li>
<li><strong>Content</strong>: guides and buying advice that answer questions shoppers search for.</li></ul>"""),
("Honest expectations", "<p>SEO is slow. New or changed pages usually take months to settle, and results depend on competition and links. Anyone who promises a number-one ranking is guessing. What I can do is remove technical barriers, match your pages to real search demand and track progress with Search Console data. My <a href=\"../../blog/shopify-seo-guide/\">Shopify SEO guide</a> explains the full process.</p>"),
("How it works", """<ol><li>Technical and content audit of your store.</li><li>A prioritized plan: fixes first, content second.</li><li>Implementation of on-page and technical changes.</li><li>Merchant Center setup or repair.</li><li>Monthly review of Search Console data.</li></ol>"""),
("Pricing", "<p>SEO is quoted to the size of your store and competition. It is also part of the Growth Marketing plans, which start from $2,000 per month. <a href=\"../../contact.html\">Request a quote</a>.</p>"),
],
"faqs": [
("Is Shopify good for SEO?", "Yes, with some setup. Shopify handles basics like SSL and sitemaps, but duplicate URLs, thin collection pages, slow apps and poor titles still need attention."),
("How long does Shopify SEO take?", "Expect several months before meaningful organic growth. Technical fixes can help sooner, but rankings depend on competition and content quality."),
("What is Google Merchant Center and do I need it?", "Google Merchant Center is where you upload your product feed so products can appear in Google Shopping and free listings. Most product-based stores benefit from setting it up."),
("Do you guarantee first-page rankings?", "No. Nobody can guarantee rankings. I focus on the work that improves your chances and report progress with real data."),
],
"related": ["shopify-seo-guide", "shopify-store-audit-checklist"],
},
{
"slug": "meta-ads-for-shopify",
"nav": "Meta &amp; Google ads",
"title": "Meta & Google Ads for Shopify Stores",
"stitle": "Meta & Google Ads for Shopify Stores | Moses Mastery",
"h1": "Meta & Google ads for Shopify stores",
"desc": "Meta (Facebook and Instagram) and Google ad campaigns for Shopify stores: tracking, creative, retargeting and reporting. Plans from $2,000 per month.",
"lead": "Ads work when the store, the tracking and the creative are ready for them. I set up and manage Meta and Google campaigns for Shopify stores so your budget goes to the audiences and products that actually sell.",
"sections": [
("What is included", """<ul><li><strong>Tracking first</strong>: Meta pixel and conversions API, Google tags and purchase tracking, checked before spending.</li>
<li><strong>Campaign structure</strong>: prospecting, retargeting and product catalog campaigns.</li>
<li><strong>Creative direction</strong>: briefs and testing plans for images and video, since creative is the biggest lever on Meta.</li>
<li><strong>Retargeting funnels</strong>: reaching visitors who viewed products or added to cart.</li>
<li><strong>Reporting</strong>: clear monthly numbers: spend, revenue, cost per purchase and what to do next.</li></ul>"""),
("Before you spend on ads", "<p>Ads send traffic to your store, so a weak product page or slow site wastes money. I usually check conversion basics first. Read the <a href=\"../../blog/meta-ads-for-shopify-stores/\">Meta ads setup, creative and scaling guide</a> for how I approach it.</p>"),
("Pricing and ad spend", "<p>Growth Marketing plans start from $2,000 per month: Launch from $2,000, Accelerate from $6,000 and Elite from $10,500. Ad spend is paid directly to Meta and Google and is not included in these prices. Plans are quoted to your store and goals through the <a href=\"../../contact.html\">contact page</a>.</p>"),
],
"faqs": [
("How much should I spend on Meta ads for a Shopify store?", "It depends on your margins and goals. Many stores start with a modest test budget, learn what creative and audiences work, then scale. A quote after reviewing your store gives a realistic range."),
("Is ad spend included in your price?", "No. Ad spend is paid directly to Meta and Google. Management fees are separate."),
("Do you manage both Meta and Google ads?", "Yes. Meta covers Facebook and Instagram, and Google covers Search and Shopping, including Merchant Center setup."),
("Can you promise a return on ad spend?", "No. Results depend on the product, the offer, the store and competition. I set clear tracking and report real numbers so decisions are based on data."),
],
"related": ["meta-ads-for-shopify-stores", "shopify-conversion-rate-optimization-checklist"],
},
{
"slug": "ai-automation-for-shopify",
"nav": "AI automation",
"title": "AI Automation for Shopify Stores",
"stitle": "AI Automation for Shopify Stores | Moses Mastery",
"h1": "AI automation, content & chatbots for Shopify stores",
"desc": "AI automation for Shopify: workflows for orders and support, AI-assisted product copy and ad creative, and chatbots that answer customer questions.",
"lead": "Most store owners spend hours each week on repetitive work: answering the same questions, writing product copy, chasing follow-ups. I set up AI workflows that take on this work, with a human reviewing anything customer-facing.",
"sections": [
("Three ways I use AI in stores", """<ul><li><strong>AI automation and workflows</strong>: automating repetitive operations such as order and support flows, follow-ups and reporting.</li>
<li><strong>AI content and creative</strong>: product descriptions, SEO content and ad creative drafted with AI and edited by a person, so it stays accurate and on-brand.</li>
<li><strong>AI chatbots and assistants</strong>: a store assistant that answers common customer questions and recommends products, with a clear path to a human.</li></ul>"""),
("Where it helps most", "<p>Stores with many products to describe, a steady stream of repeat support questions, or a small team doing manual follow-ups. My guide to <a href=\"../../blog/ai-automation-for-shopify-stores/\">AI automation workflows for Shopify</a> lists seven that are worth setting up first.</p>"),
("What to know before starting", "<p>AI is a tool, not a replacement for judgment. Customer-facing text needs review, product facts must come from your data, and customers should be able to reach a person. I design workflows with those guardrails. Projects are quoted to the scope: <a href=\"../../contact.html\">describe what you want automated</a>.</p>"),
],
"faqs": [
("What can AI automate in a Shopify store?", "Common examples are answering repeat support questions, drafting product descriptions and SEO content, preparing ad creative variations, and routing orders and follow-ups. The best candidates are repetitive, rule-based tasks."),
("Will AI-written product descriptions hurt my SEO?", "Not when they are accurate, useful and edited by a person. Unreviewed, generic text is the risk, so I use AI for drafts and keep a human in the loop."),
("Can a chatbot replace my customer support?", "It can handle common questions, but it should not replace people. A good setup answers simple questions and hands complex ones to a human."),
("How much does AI automation cost?", "It depends on what is automated and which tools are involved. Send a short description of the task through the contact page for a quote."),
],
"related": ["ai-automation-for-shopify-stores", "shopify-seo-guide"],
},
]
