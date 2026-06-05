# QK Content Generator

AI-powered social content generator for **Queenless Kings**.
Lightweight Next.js 15 app that round-robins across **16 LLM providers** (most free) with automatic failover. Deploys to **Vercel** and lives at `social.queenlesskingsband.com` via Cloudflare DNS.

> Live: **https://social.queenlesskingsband.com**

## What it does

Same content generator that runs on the home server (`qk_dashboard.py`), reborn as an independent web app:

- **Presets tab** — Post type (gig / release / behind-the-scenes / merch / band update / fan engagement), Platform, Tone, Hashtag style, Details + CTA → post-ready content.
- **Freeform tab** — describe what you want, get back exactly that.
- **Edit toolbar** — regenerate, shorten, lengthen, change tone, copy.
- **16-provider round-robin** with automatic failover on rate limits.
- **Optional shared-password gate** for public access.
- **Independent of the home server** — runs entirely on Vercel's edge network.

## Architecture

```
Browser ──→ Next.js page (Vercel)
                │
                └─→ /api/generate (edge runtime)
                          │
                          └─→ LLM router (round-robin, failover)
                                   │
                                   └─→ 16 providers: Groq, Gemini, Cerebras…
```

API keys live as **encrypted environment variables on Vercel** — never sent to the browser.

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in at least one provider's keys (Pollinations works with no signup at all)
npm run dev
# → http://localhost:3000
```

## Deploy to Vercel

### 1) Push to GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/V-MINUS/qk-content-generator.git
git push -u origin main
```

### 2) Import to Vercel

1. https://vercel.com/new → **Import Git Repository**
2. Pick `V-MINUS/qk-content-generator`
3. Framework: **Next.js** (auto-detected)
4. Build / Output: **leave defaults**
5. **Environment Variables** → add the keys from `.env.example` you have (don't add empty ones).
   - At minimum set `APP_PASSWORD` to a shared secret for the social manager.
   - Recommended free combo to start: `POLLINATIONS_API_KEYS=free` + `GROQ_API_KEYS` + `GEMINI_API_KEYS` + `CEREBRAS_API_KEYS`.
6. **Deploy** — first deploy takes ~1 minute.

You'll get a URL like `qk-content-generator.vercel.app` immediately.

### 3) Bind `social.queenlesskingsband.com` via Cloudflare

#### On Vercel
1. Project → **Settings** → **Domains**
2. Enter `social.queenlesskingsband.com` → **Add**
3. Vercel will say "Add a CNAME record pointing to `cname.vercel-dns.com`"

#### On Cloudflare DNS
1. https://dash.cloudflare.com → `queenlesskingsband.com` → **DNS**
2. **Add record**:
   - **Type**: CNAME
   - **Name**: `social`
   - **Target**: `cname.vercel-dns.com`
   - **Proxy status**: **DNS only** (grey cloud — Vercel handles the SSL cert; orange-cloud proxy can break custom domains until configured carefully)
   - **TTL**: Auto
3. Save. Within ~30s Vercel will issue the SSL cert and the domain goes live.

> **Tip**: If you'd rather use Cloudflare's orange-cloud proxy (for analytics / DDoS), set SSL/TLS encryption mode to **Full (strict)** in the Cloudflare SSL/TLS tab first.

### 4) Add to band site as a link

Edit your band site to add a link:
```html
<a href="https://social.queenlesskingsband.com" target="_blank" rel="noopener">
  Content tools
</a>
```

### 5) Updating later

- **Code change**: `git push` → Vercel auto-deploys in ~30s.
- **Add/rotate a key**: Vercel → Project → Settings → Environment Variables → edit → click **Redeploy**.

## Provider keys (where to get them)

### No signup
| Provider | Free tier |
|---|---|
| **Pollinations** | Anonymous, completely free. Set `POLLINATIONS_API_KEYS=free`. |

### Generous free tiers
| Provider | Free tier | Get key |
|---|---|---|
| Groq | 30 req/min, llama-3.3-70b | https://console.groq.com/keys |
| Cerebras | 1M tokens/day, fastest | https://cloud.cerebras.ai/ |
| Gemini | 1500 req/day flash | https://aistudio.google.com/apikey |
| OpenRouter | free models, 20 req/min | https://openrouter.ai/keys |
| SambaNova | free tier, very fast | https://cloud.sambanova.ai/ |
| GitHub Models | 50 req/day per model | https://github.com/settings/tokens |
| NVIDIA NIM | 1000 free credits | https://build.nvidia.com/ |
| HuggingFace | free w/ token | https://huggingface.co/settings/tokens |
| Mistral | experimental tier | https://console.mistral.ai/api-keys/ |
| Cohere | 1000 req/month trial | https://dashboard.cohere.com/api-keys |

### Free signup credit
| Provider | Credit | Get key |
|---|---|---|
| Hyperbolic | $10 | https://app.hyperbolic.xyz/ |
| Together | $1 + free models | https://api.together.ai/ |
| DeepSeek | small | https://platform.deepseek.com/api_keys |
| xAI Grok | $25/mo (data-share opt-in) | https://console.x.ai/ |

### Paid
- OpenAI: https://platform.openai.com/api-keys

**Multiplying free tiers**: sign up for Groq/Gemini/Cerebras/etc. with multiple email addresses and add all keys comma-separated — `GROQ_API_KEYS=key1,key2,key3` — the router cycles through them.

## API endpoints

- `GET /api/status` → list of configured providers + key counts (no auth)
- `POST /api/generate` → generate or edit (sends `x-app-password` header if APP_PASSWORD set)

```jsonc
// POST /api/generate
{
  "mode": "preset",
  "preset": {
    "postType": "music-release",
    "platform": "instagram",
    "tone": "excited",
    "hashtagStyle": "heavy",
    "details": "New single 'Reckless' drops Friday on all platforms",
    "cta": "Save to your library"
  },
  "maxTokens": 800,
  "temperature": 0.8
}
```

## System prompt

`src/lib/prompts.ts` → `QK_SYSTEM_PROMPT` is the source of truth for band facts and writing rules.
Change it, push, redeploy.

## Why Vercel?

- Zero-config Next.js deploys
- Free tier covers this app comfortably
- Edge runtime = low latency for the social manager
- Encrypted env vars
- 1-click custom domain

## License

MIT.
