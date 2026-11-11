# Store scanner: one-time setup (about 3 minutes)

The page `audit.html` works without this step: it shows Page Speed, Mobile, SEO, Technical Health, UX and Accessibility, and Marketing Tools using Google PageSpeed Insights.
To also score **Trust & Credibility**, **Conversion** and **Product SEO**, deploy the small server function in `supabase/functions/scan/index.ts` (browsers are not allowed to read another store's page, so a server has to).

## Dashboard method (no tools to install)
1. Open your Supabase project, then **Edge Functions**, then **Deploy a new function**, then **Via Editor**.
2. Name it exactly `scan`.
3. Paste the full contents of `supabase/functions/scan/index.ts` and click **Deploy**.
4. Open the function's **Settings** tab and turn **Verify JWT with legacy secret** OFF, then **Save changes**. The site uses a new-style publishable key, which the legacy JWT check rejects (401). The function protects itself with a CORS allow-list and a private-address block.
5. Reload `audit.html` and scan a store. The three extra categories now show scores.

It only reads public pages, refuses private and internal addresses, stores nothing, and only answers requests that come from mosesmastery.com.

## Optional: PageSpeed API key
Without a key Google limits requests. Create a free "PageSpeed Insights API" key in Google Cloud, restrict it to `https://www.mosesmastery.com/*`, and paste it into `psiKey` in `js/config.js`.
