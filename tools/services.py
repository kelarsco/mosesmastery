"""Service landing pages (one per search intent). Edit here, then run: python3 tools/build_blog.py
Rules: no invented results, clients or guarantees. Prices must match the home page."""

SERVICES = [
{
"slug": "shopify-store-design",
"nav": "Shopify design &amp; development",
"title": "Shopify Store Design & Development",
"stitle": "Shopify Store Design Agency & Website Designer | Moses Mastery",
"h1": "Shopify store design agency & website designer",
"desc": "Shopify store design agency and website designer: custom Shopify stores, theme customization and redesigns built to convert. Packages from $500. Moses Mastery.",
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
"stitle": "Shopify Marketing Agency: Meta & Google Ads | Moses Mastery",
"h1": "Shopify marketing agency: Meta & Google ads for your store",
"desc": "Shopify marketing agency and expert: Meta (Facebook, Instagram) and Google ad campaigns with tracking, creative, retargeting and reporting. From $2,000 per month.",
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
{
"slug": "google-merchant-center-optimization",
"nav": "Google Merchant Center",
"title": "Google Merchant Center Setup, Optimization & Suspension Help",
"stitle": "Google Merchant Center Setup & Suspension Help | Moses Mastery",
"h1": "Google Merchant Center setup, optimization & suspension help for Shopify stores",
"desc": "Google Merchant Center setup, product feed optimization and help with disapproved products or a suspended account for Shopify stores. Quoted to your store.",
"lead": "Google Merchant Center decides whether your products can appear in free listings and Shopping ads. When it is set up badly, products are disapproved, ads stop or the whole account is suspended. I set it up properly, clean up the feed and fix the store issues behind policy problems.",
"sections": [
("What I set up and fix", """<ul><li><strong>Account setup and verification</strong>: business information, website claim and the connection to your Shopify store.</li>
<li><strong>Product feed quality</strong>: product titles, descriptions, images, product identifiers (such as GTIN or brand where they apply), price and availability that match your product pages.</li>
<li><strong>Shipping, tax and return settings</strong>: configured in Merchant Center to match what your store really offers.</li>
<li><strong>Disapproved products</strong>: reading the issue Google reports and fixing it at the source, in the feed or on the page.</li>
<li><strong>Shopping readiness</strong>: checking the store and feed before you start Google Shopping or Performance Max campaigns.</li></ul>"""),
("Account suspensions and policy problems", """<p>Merchant Center issues usually come from information that is missing, unclear or does not match: contact details, return and shipping policies, a price in the feed that differs from the page, or a checkout that does not look trustworthy. I review the reason Google shows in your account, fix the store and feed problems behind it, and help you prepare a clear request for review. Google makes the final decision, so I cannot promise reinstatement or how long a review takes.</p>"""),
("How it works", """<ol><li><strong>Review.</strong> I check your Merchant Center account, feed status and the store pages Google reads.</li>
<li><strong>Fix list.</strong> You get a plain list of what is wrong and what will change.</li>
<li><strong>Implement.</strong> I make the fixes in Shopify and in Merchant Center.</li>
<li><strong>Monitor.</strong> I watch the account for new warnings after the changes.</li></ol>"""),
("Pricing", "<p>Merchant Center work is quoted to your store, because an account with a few products is very different from a large catalog. Ongoing Google Shopping and ad management is part of the <a href=\"../meta-ads-for-shopify/\">Growth Marketing plans</a>, which start from $2,000 per month (ad spend is paid directly to Google and is not included).</p>"),
],
"faqs": [
("What is Google Merchant Center?", "Google Merchant Center is where you upload your product data so your products can appear in Google free listings and Shopping ads. For Shopify stores it is usually connected through the Google and YouTube channel."),
("Why was my Merchant Center account suspended?", "Common causes include missing or unclear business and contact information, return or shipping policy gaps, product data that does not match the landing page, and checkout or trust problems. The exact reason is shown in your account, and fixing it correctly is what I help with."),
("Can you guarantee my account will be reinstated?", "No. Google decides every review. I fix the problems Google reports and help you prepare the request, but I cannot promise an outcome or a timeline."),
("Do I need Merchant Center to run Google Shopping ads?", "Yes. Shopping and many Performance Max campaigns use the product data in Merchant Center, so a clean feed comes before any ad spend."),
],
"related": ["meta-ads-for-shopify-stores", "shopify-seo-guide"],
},
{
"slug": "etsy-seo-and-store-optimization",
"nav": "Etsy SEO",
"title": "Etsy SEO Services & Shop Optimization",
"stitle": "Etsy SEO Services & Shop Optimization | Moses Mastery",
"h1": "Etsy SEO services & shop optimization",
"desc": "Etsy SEO and shop optimization: listing titles, tags, attributes, photos and descriptions written around what buyers search. Quoted to your shop.",
"lead": "Most Etsy buyers find products through search. If your listing titles, tags and photos do not match what they type, good products stay hidden. I optimize Etsy shops so each listing is easier to find and easier to choose.",
"sections": [
("What I optimize", """<ul><li><strong>Listing titles</strong>: the phrases a buyer would really search, placed so the title still reads naturally.</li>
<li><strong>Tags and attributes</strong>: using the tag slots (up to 13 per listing) and the category, attribute and occasion fields Etsy offers.</li>
<li><strong>Descriptions</strong>: clear details about size, material, personalization and shipping that answer buyer questions before they ask.</li>
<li><strong>Photos and thumbnails</strong>: guidance on the first image and the order of the others, because the thumbnail decides most clicks.</li>
<li><strong>Shop pages</strong>: shop title, announcement, about section, sections and policies, so the shop looks trustworthy.</li></ul>"""),
("How it works", """<ol><li><strong>Shop review.</strong> I look at your listings, categories, current titles and tags, and the competitors buyers see next to you.</li>
<li><strong>Keyword research.</strong> I use Etsy's own search suggestions and the research tools available at the time, and I only report numbers that a tool actually gave.</li>
<li><strong>Rewrite.</strong> I update the highest-value listings first, then the rest of the shop.</li>
<li><strong>Review results.</strong> We check views, clicks, favorites and orders in Etsy Stats and adjust.</li></ol>"""),
("Etsy and your own store", "<p>Etsy is rented traffic, so many sellers also build their own <a href=\"../shopify-store-design/\">Shopify store</a> and use <a href=\"../shopify-seo/\">Shopify SEO</a> to bring in customers they own. I can help with both, and I will tell you honestly when one makes more sense than the other for your products.</p>"),
("Pricing", "<p>Etsy SEO is quoted to your shop, based on the number of listings and the work needed. Send your shop link through the contact page and I will reply with a fixed quote.</p>"),
],
"faqs": [
("What is Etsy SEO?", "Etsy SEO is improving your listing titles, tags, attributes, descriptions and photos so Etsy search shows your products to more of the right buyers."),
("Can you guarantee more sales on Etsy?", "No. Sales depend on your products, prices, reviews, competition and season. Good optimization makes your listings easier to find and more likely to be clicked, but nobody can promise a result."),
("How long does Etsy SEO take to work?", "Some changes can show in views within days or weeks, but Etsy search also depends on sales history and shop activity, so steady improvement takes longer."),
("Do you rewrite every listing?", "I start with the listings that matter most, such as your best sellers and the products with the most potential, and then work through the rest."),
],
"related": ["shopify-seo-guide", "shopify-store-audit-checklist"],
},
]
