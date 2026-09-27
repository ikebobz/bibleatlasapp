# Make the site readable by ChatGPT, Gemini and other AI browsers

## What I checked first

- Live requests to `https://mybibleatlas.com/` using the GPTBot, ChatGPT-User and Google-Extended user agents all return **HTTP 200** with full server-rendered HTML. The app itself is not blocking them.
- `robots.txt` has a wildcard `Allow: /`, but **no explicit rules for AI crawlers**. Several AI fetchers treat "no named rule" conservatively, and their own tooling reports it as "server settings block me".
- Cloudflare sits in front of the site (`server: cloudflare`, `__cf_bm` cookie). Cloudflare's bot-management / "Block AI bots" feature can challenge those fetchers even though ordinary requests succeed — that layer is outside the app code.
- Google Search Console: the homepage is **"Submitted and indexed"**, crawled 2026-08-18, robots state ALLOWED, Google's canonical is `https://mybibleatlas.com`. So Google does have an indexed version; there is simply no reported impression data yet for the last 28 days (new domain, not proof of zero traffic).

## Changes to make

### 1. Explicit AI-crawler permissions in `public/robots.txt`

Add named allow blocks above the wildcard block, keeping every existing rule intact:

- `GPTBot`, `OAI-SearchBot`, `ChatGPT-User` (OpenAI crawling, search index, and user-triggered browsing)
- `Google-Extended` (Gemini / AI Overviews)
- `ClaudeBot`, `Claude-User`, `anthropic-ai`
- `PerplexityBot`, `Applebot-Extended`, `CCBot`, `Bytespider`, `Amazonbot`, `meta-externalagent`

Each gets `Allow: /` plus the same `Disallow: /admin/`, `/api/`, `/highlights` lines so private routes stay private. The `Sitemap:` line stays.

### 2. Make `/api/public/og/*` reachable

`Disallow: /api/` currently also blocks the share-preview image endpoints. Add `Allow: /api/public/og/` in the wildcard and social-bot blocks so link previews keep rendering for crawlers that respect robots.

### 3. An `llms.txt` at the site root

A plain-text map of the site (`/`, `/about`, `/maps`, `/timeline`, `/concordance`, `/connections`, book and chapter URL patterns) served at `https://mybibleatlas.com/llms.txt`. This is the emerging convention AI assistants look for and gives them a clean summary of what Bible Atlas is.

### 4. Verify after publishing

Re-request the homepage and a verse page with each AI user agent, confirm 200 + readable HTML, and confirm `/robots.txt` and `/llms.txt` serve the new content on production.

## What I cannot fix from the code

If ChatGPT/Gemini still report a block after publishing, the cause is the Cloudflare layer in front of the site, not the app. In that case the fix is in Cloudflare (Security → Bots): turn off "Block AI Scrapers and Crawlers", or add a WAF skip rule for the AI bot user agents. I will tell you exactly what to toggle if the post-publish check still fails.

## Search indexing answer

Google already has an indexed copy of the homepage. The rest of the site (66 books, ~1,189 chapters, maps, concordance) is listed in `/sitemap.xml` and gets picked up over time; no code change is needed for that.
