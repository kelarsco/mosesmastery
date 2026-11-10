// Moses Mastery store scanner: fetches a public store page on the server (browsers cannot, because of CORS)
// and checks trust, conversion and product-page SEO. Deploy: see SETUP-SCANNER.md. Never stores anything.
const UA = 'Mozilla/5.0 (compatible; MosesMasteryScanner/1.0; +https://www.mosesmastery.com)';
const ALLOW = ['https://www.mosesmastery.com', 'https://mosesmastery.com', 'https://kelarsco.github.io', 'http://localhost', 'http://127.0.0.1'];

export function badHost(h: string): boolean {
  h = (h || '').toLowerCase();
  if (!h || !h.includes('.') || /^(localhost|.*\.local|.*\.internal|.*\.localhost)$/.test(h)) return true;
  if (/^\[/.test(h) || h.includes(':')) return true;
  const m = h.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
  if (m) {
    const a = +m[1], b = +m[2];
    if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254) || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a >= 224) return true;
  }
  return false;
}

async function get(url: string, max = 1500000, ms = 8000): Promise<{ html: string; url: string } | null> {
  const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
  try {
    const r = await fetch(url, { signal: ctl.signal, redirect: 'follow', headers: { 'User-Agent': UA, Accept: 'text/html,application/xhtml+xml' } });
    const fin = new URL(r.url);
    if (badHost(fin.hostname) || !/^https?:$/.test(fin.protocol)) return null;
    const ct = r.headers.get('content-type') || '';
    if (!/html|xml/i.test(ct) || !r.body) return null;
    const rd = r.body.getReader(); const dec = new TextDecoder(); let out = '', n = 0;
    while (true) { const { done, value } = await rd.read(); if (done) break; n += value.length; out += dec.decode(value, { stream: true }); if (n > max) { ctl.abort(); break; } }
    return { html: out, url: r.url };
  } catch (_) { return null; } finally { clearTimeout(t); }
}

type Item = { label: string; ok: boolean };
const pct = (items: Item[]) => Math.round(items.filter(i => i.ok).length / items.length * 100);

export function analyzeHome(html: string) {
  const h = html.toLowerCase();
  const has = (re: RegExp) => re.test(h);
  const trust: Item[] = [
    { label: 'Contact page or contact details', ok: has(/href=["'][^"']*contact/) || has(/mailto:|tel:/) },
    { label: 'About page', ok: has(/href=["'][^"']*(about|our-story|story)/) },
    { label: 'Refund / returns policy linked', ok: has(/(refund|return)[-_ ]?(policy|polic)|policies\/refund|returns?[-_ ]?(and|&)?[-_ ]?exchange/) },
    { label: 'Shipping policy linked', ok: has(/shipping[-_ ]?(policy|info|and)|policies\/shipping|delivery[-_ ]?(info|policy)/) },
    { label: 'Privacy policy and terms linked', ok: has(/privacy/) && has(/terms/) },
    { label: 'Payment methods shown (Visa, PayPal, Shop Pay...)', ok: has(/visa|mastercard|paypal|amex|shop[ _-]?pay|apple[ _-]?pay|klarna|afterpay|google[ _-]?pay/) },
    { label: 'Reviews or ratings app detected', ok: has(/judge\.me|loox|yotpo|stamped|okendo|trustpilot|reviews\.io|junip|rivyo|ali-?reviews|shopper-approved/) },
    { label: 'Social profiles linked', ok: has(/instagram\.com|facebook\.com|tiktok\.com|twitter\.com|x\.com|pinterest\./) },
  ];
  const conv: Item[] = [
    { label: 'Clear shop / buy button', ok: has(/add to (cart|bag|basket)|buy now|shop now|shop all|shop the/) },
    { label: 'Product search available', ok: has(/type=["']search|name=["']q["']|predictive-search|search-form|search-modal/) },
    { label: 'Email signup / newsletter capture', ok: has(/newsletter|klaviyo|mailchimp|omnisend|privy|subscribe|type=["']email/) },
    { label: 'Shipping, returns or guarantee message', ok: has(/free shipping|free delivery|free returns|money[- ]back|guarantee|easy returns|days? (return|refund)/) },
    { label: 'Offer or urgency message', ok: has(/\d+% off|sale|limited|ends (soon|today|in)|save \d|bundle|discount|code/) },
    { label: 'Cart link present', ok: has(/href=["'][^"']*\/cart/) },
    { label: 'Prominent buttons / calls to action', ok: (h.match(/class=["'][^"']*(button|btn)/g) || []).length >= 2 },
  ];
  const ld = /"@type"\s*:\s*"(organization|store|website)"/.test(h);
  const shopify = /cdn\.shopify\.com|shopify\.theme|myshopify\.com|shopify-section/.test(h);
  const m = html.match(/href=["']([^"'#?]*\/products\/[^"'#?]+)["']/i);
  return { trust: { score: pct(trust), items: trust }, conversion: { score: pct(conv), items: conv }, shopify, hasOrgSchema: ld, productPath: m ? m[1] : null };
}

export function analyzeProduct(html: string) {
  const h = html.toLowerCase();
  const blocks = [...html.matchAll(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi)].map(x => x[1]);
  let prod: any = null;
  const walk = (o: any) => { if (!o || prod) return; if (Array.isArray(o)) return o.forEach(walk); if (typeof o === 'object') { const t = o['@type']; if (t === 'Product' || (Array.isArray(t) && t.includes('Product'))) { prod = o; return; } if (o['@graph']) walk(o['@graph']); } };
  for (const b of blocks) { try { walk(JSON.parse(b)); } catch (_) { /* ignore */ } }
  const imgs = [...html.matchAll(/<img\b[^>]*>/gi)].map(x => x[0]);
  const withAlt = imgs.filter(i => /\balt=["'][^"']{3,}/i.test(i)).length;
  const desc = (html.match(/<meta[^>]+name=["']description["'][^>]*content=["']([^"']*)["']/i) || [])[1] || '';
  const items: Item[] = [
    { label: 'Product structured data (schema.org Product)', ok: !!prod },
    { label: 'Price and availability in structured data', ok: !!(prod && prod.offers) },
    { label: 'Star rating in structured data', ok: !!(prod && prod.aggregateRating) },
    { label: 'One clear H1 heading', ok: (h.match(/<h1[\s>]/g) || []).length === 1 },
    { label: 'Meta description of a good length', ok: desc.length >= 50 && desc.length <= 170 },
    { label: 'Share image (og:image) set', ok: /property=["']og:image/.test(h) },
    { label: 'Most product images have alt text', ok: imgs.length > 0 && withAlt / imgs.length >= 0.7 },
    { label: 'Canonical URL set', ok: /rel=["']canonical/.test(h) },
  ];
  return { score: pct(items), items };
}

export async function scan(raw: string) {
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw) ? raw : 'https://' + raw); } catch (_) { return { ok: false, error: 'bad_url' }; }
  if (!/^https?:$/.test(u.protocol) || badHost(u.hostname)) return { ok: false, error: 'bad_url' };
  const home = await get(u.origin + '/');
  if (!home) return { ok: false, error: 'unreachable' };
  const a = analyzeHome(home.html);
  let product = null; let productUrl = null;
  if (a.productPath) {
    try { productUrl = new URL(a.productPath, home.url).toString(); const p = await get(productUrl); if (p) product = analyzeProduct(p.html); } catch (_) { /* ignore */ }
  }
  return { ok: true, shopify: a.shopify, trust: a.trust, conversion: a.conversion, product, productUrl };
}

if (typeof Deno !== 'undefined') {
  // deno-lint-ignore no-explicit-any
  (Deno as any).serve(async (req: Request) => {
    const origin = req.headers.get('origin') || '';
    const okOrigin = ALLOW.some(o => origin === o || origin.startsWith(o + ':'));
    const hdr: Record<string, string> = { 'Access-Control-Allow-Origin': okOrigin ? origin : ALLOW[0], 'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info', 'Access-Control-Allow-Methods': 'POST, OPTIONS', Vary: 'Origin', 'Content-Type': 'application/json' };
    if (req.method === 'OPTIONS') return new Response('ok', { headers: hdr });
    if (!okOrigin) return new Response(JSON.stringify({ ok: false, error: 'forbidden' }), { status: 403, headers: hdr });
    try { const b = await req.json(); const r = await scan(String(b.url || '').slice(0, 300)); return new Response(JSON.stringify(r), { headers: hdr }); }
    catch (_) { return new Response(JSON.stringify({ ok: false, error: 'bad_request' }), { status: 400, headers: hdr }); }
  });
}
