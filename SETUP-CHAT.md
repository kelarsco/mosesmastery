# AI chat assistant setup (about 10 minutes)

The chat is already in the site code but switched OFF (`chat: false` in `js/config.js`). Nothing shows to visitors until you finish these steps and I flip it on.

## 1. Get an Anthropic API key and cap the spending
1. Go to console.anthropic.com, sign in, add a small credit (for example $10).
2. Settings -> Limits: set a **monthly spend limit** (for example $10). This is your hard stop.
3. API Keys -> Create key. Copy it (starts with `sk-ant-`). Do not paste it in chat or in the website code.

## 2. Run the rate-limit SQL
Supabase -> SQL Editor -> New query -> paste everything from `supabase/chat.sql` (GitHub -> mosesmastery -> supabase -> chat.sql -> Copy raw file) -> Run. It should say "Success".

## 3. Deploy the function
1. Supabase -> Edge Functions -> Deploy a new function -> Via Editor. Name it exactly `chat`.
2. Replace the code with `supabase/functions/chat/index.ts` from GitHub. Deploy.
3. Open the function's Settings tab, turn **Verify JWT with legacy secret** OFF, Save changes (same as the scan function).

## 4. Add the key as a secret
Supabase -> Edge Functions -> Secrets (or Project Settings -> Edge Functions -> Secrets) -> Add new secret: name `ANTHROPIC_API_KEY`, value = your key. Save.

## 5. Turn it on
Tell Claude "chat is deployed". `chat: true` goes into `js/config.js` and the "Ask AI" button appears on the site.

## Cost and abuse controls (built in)
- Each visitor: 30 messages per day. Whole site: 500 messages per day (change with secrets `CHAT_IP_LIMIT` and `CHAT_DAY_LIMIT`).
- Messages are capped at 500 characters, short replies, last 10 messages of context. Typical conversations cost a fraction of a cent.
- Only your own website can call it, and it only talks about Moses Mastery services.
- The conversation is saved only if the visitor chooses to leave their name and email (it appears in your Leads tab with stage "AI chat").
