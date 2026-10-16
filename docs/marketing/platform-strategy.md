# Social Card — Platform Content Marketing Strategy

Marketing plan for **Social Card** (https://workboost.qzz.io/social-card) on **X, Threads, TikTok, and Facebook**.
Per-platform language: **X in English** (global build-in-public audience); **Threads, TikTok,
and Facebook in Vietnamese** (founder is in Vietnam — the local indie / vibe-coding community
is the beachhead). Based on 2024–2025 platform data, algorithm documentation, and indie
founder case studies (Tony Dinh/Blackmagic & Xnapper, Jon Yongfook/Bannerbear, Lucia/bolta.ai,
Senja). Sources linked inline.

---

## 0. The one advantage we must exploit: every post IS the demo

Social Card makes social-media post images. So **every marketing post should be a card made
with Social Card**. Each post is simultaneously:

1. Content (value for the reader)
2. A product demo (the image itself)
3. A distribution loop (QR code on the card → back to the app)

```
             ┌─────────────────────────────────────────┐
             │  Post a card made with Social Card      │
             └───────────────────┬─────────────────────┘
                                 │
              people like the ───┼─── people scan the
              card's look        │        QR on the card
                    │            │            │
                    ▼            ▼            ▼
             "what tool      engagement    visit
              made this?"    (algorithm    workboost.qzz.io
                    │         boost)      /social-card
                    ▼                         │
             profile visit ────────► try the app ──┐
                                                  │
                                                  ▼
                                   user posts their own cards
                                   (each carries the loop again)
```

Tony Dinh's Xnapper (clean-screenshot tool, grew to ~$4–6K MRR, sold for $150K) ran exactly
this playbook: every screenshot he posted anywhere was an Xnapper screenshot. Never say
"made with Social Card" in text every time — the aesthetic itself becomes the signature,
and people ask. When they ask, reply with the link.

**Card Type → content mode mapping:**

| Card Type                                     | Marketing use                                                |
| --------------------------------------------- | ------------------------------------------------------------ |
| **Quote Card**                                | Thought-leadership, tips, hot takes, build-in-public metrics |
| **Showcase Card** (screenshots + annotations) | Feature announcements, before/after, mini tutorials          |

---

## 1. Positioning (shared across platforms)

**One-liner:**

> Make your posts look designed — in 30 seconds, no design skills. Free, in-browser, copy-paste to Threads/X/Facebook.

**ICP (in priority order):**

1. Indie hackers / solo founders posting build-in-public updates (X, Threads)
2. Creators & newsletter writers sharing quote cards
3. Marketers making product-announcement posts

**Core pain we solve:** raw screenshots and plain text make products look cheap and
unreadable; Canva/Photoshop is overkill for a quick shareable card.

**Content pillars (3 — enough for a solo founder to sustain):**

| Pillar                    | Share | Examples                                                                 |
| ------------------------- | ----- | ------------------------------------------------------------------------ |
| **P1 — Show, don't tell** | 40%   | Cards, before/after, feature demos via Showcase Card                     |
| **P2 — Build in public**  | 30%   | Metrics, milestones, failures, decisions (metric-specific, not vague)    |
| **P3 — Educate**          | 30%   | Content-design tips: ratios, typography, "why your screenshots look bad" |

---

## 2. X (Twitter) — solution

### Why X matters

The build-in-public community lives here. Hardest cold start of the three platforms
(organic reach favors big verified accounts), but it's where our ICP #1 discovers tools.
X's own data: median engagement rate fell to 1.22% (2025) — image posts convert harder
per view (~0.79% ER) while text posts get ~2× raw impressions ([Ordinal study](https://www.tryordinal.com/blog/twitter-x-engagement-data-study)).

### Algorithm facts that change behavior

From [X's open-source algorithm](https://github.com/twitter/the-algorithm/blob/main/README.md)
and [code analyses](https://partyfly.github.io/x-algorithm-handbook/en/):

- **Replies are the strongest positive signal** (reply ≈ +13.5, reply engaged by author +75,
  vs like +0.5). Replying to people who reply to us is the cheapest reach multiplier we have.
- **Dwell time is paid for** — threads and image-carousels that make people stop and read win.
- A post's candidate pipeline life is **~48 hours**; engagement half-life ~30 min →
  **guard the first hour** (be online to reply when posting).
- Same-author decay: our 2nd post in a viewer's feed scores 62.5%, 3rd 43.75% →
  **1–3 good posts beat 10 filler posts**; never post in rapid bursts.
- Small-account cold-start scorer boosts eligible posts (≤1K followers, <24h old,
  originals not replies) → originals are our route to strangers.
- **Links in the first post reduce reach** → put the URL in the last reply of a thread,
  or in a reply under a single post.
- **Hashtags are dead for reach** (topic retrieval uses neural embeddings, not keyword
  matching). Zero or one, never more.
- Best length: **100–200 characters** for single posts.
- Unverified accounts are trust-capped → don't follow-spam (penalty triggers when
  following >500 AND ratio >0.6). Follow ≤300 relevant accounts, engage instead.

### Cadence & schedule

- **2–3 posts/day** max, weekday **8:00–14:00** audience time (Hootsuite guidance).
- Use the **3-2-1 formula**: 3 quick insights (cards), 2 engagement posts (polls/questions),
  1 deep post (thread or Showcase-Card tutorial) per day — or spread across the week.
- Plus **5–10 thoughtful replies/day** on bigger accounts in the indie-hacker space.
  Replies build relationships; originals build reach. Do both.

### Formats that work for us

1. **Single Quote Card + one-line text** — the daily driver. The card carries the design;
   text carries the hook. Link in first reply.
2. **Showcase Card feature demos** — every feature shipped gets a same-day demo post
   (Tony Dinh's loop: _"Morning: add a feature. Afternoon: release it, tweet it."_).
3. **5–8 post threads** with 2–5 min gaps between the first three replies, link in the
   final reply ([practitioner guide](https://mediagrowth.io/x-twitter/x-threads-vs-standalone-posts-reach-tradeoffs-after-24-hours/)).
   Thread idea: "7 posts that look designed in 30 seconds" — each post a card example.
4. **Quote tweets** of people posting ugly screenshots/cards — gently fix their post as a
   showcase. Quote tweets earn ~2× standard engagement (Hootsuite).

### X — 4-week launch sequence

| Week | Focus                                                                                                                            |
| ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Profile setup (bio = one-liner + link). Follow ~100–200 relevant accounts. Replies only: 5+/day, genuinely useful. No promotion. |
| 2    | First originals: 1/day Quote Cards (P3 tips). Reply to every response within the first hour.                                     |
| 3    | First Showcase Card feature demo + first thread. Start the "made in 30s" series.                                                 |
| 4    | Rhythm: 2–3/day across pillars. Announce free use: "free, no signup" hook post. Engage 30 min after posting.                     |

### Example posts (ready to adapt)

**P3 tip, single card:**

> Your raw screenshot has 9px system fonts and a messy desktop behind it.
> That's why your product looks cheaper than it is.
> [Quote Card: "If the screenshot looks like a debug log, people read it like one."]

**P1 feature demo (Showcase Card):**

> Shipped: handwritten-style annotations on product screenshots.
> Point at exactly what changed — no arrows drawn in Preview.
> [Showcase Card: hero screenshot + 2 annotated details]

**P2 build-in-public (metric-specific):**

> Social Card week 6:
> — 412 cards exported
> — 61% via clipboard paste (the feature I almost cut)
> — 0 signup wall
> Biggest surprise: people mostly make quote cards, not product shots.

**Engagement bait (poll):**

> What do you do with a screenshot before posting it?
> ▢ Nothing, ship it raw
> ▢ Crop it
> ▰ Redraw it in Figma like a maniac

---

## 3. Threads — solution

### Why Threads is our best ROI platform right now

> Language: **Vietnamese**. Target: the Vietnamese indie-hacker / vibe-coding community —
> the audience day-01's Vietnamese poll already reached.

- **Median engagement 6.25% — ~74% higher than X**; 500M MAU and it passed X in mobile
  DAU in Jan 2026 ([statistics roundup](https://www.socialplug.io/blog/threads-statistics)).
- Ads only fully rolled out Jan 2026 → **organic competition still light**. This window closes
  as platforms mature.
- The [Meta ranking doc](https://transparency.meta.com/features/explaining-ranking/ig-threads-feed)
  shows replies (especially **replies-to-replies within 1–6h**) feed at least five ranking
  predictions → conversations compound reach. Small accounts get discovered through
  conversation, not follower count.
- Buffer's 128K-post analysis: **replying to comments boosts engagement 42%**.

### Platform rules

- 500-char limit; **1–2 line posts perform best**, 200–300 chars for developed ideas.
- Up to 10 images/post; text attachments up to 10K chars (use for long-form notes).
- Hashtags: minimal utility ("a few relevant topic tags may help"). Topic Tags exist
  (#DesignThreads, #BuildInPublic style) — use at most one.
- **Instagram activity feeds Threads ranking** (profile views cross-signal) — keep IG
  profile alive with the same cards.

### Strategy: the Educate → Agitate → Architect sequence

This is the proven Threads playbook from
[Lucia's 0→100 paying users case study](https://www.indiehackers.com/post/from-0-to-100-paying-users-the-exact-threads-content-strategy-i-used-to-launch-my-saas-e4c127ff30):

| Phase            | Users | What to post                                                                                                                                                                                                |
| ---------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Educator**  | 0–20  | Pure value for the micro-niche: content-design tips, frameworks, "I analyzed 50 founder accounts and…". Spend MORE time answering questions in others' comments than writing own posts. No product mention. |
| **2. Agitator**  | 20–50 | Relatable pain posts, no solution mention: "Does anyone else have a graveyard of half-designed posts?" "Spent 20 min in Canva for a quote image again."                                                     |
| **3. Architect** | 50+   | Build-in-public reveal: "I got so fed up I built a tool that does this in 30 seconds." Behind-the-scenes, feedback, data posts. CTA = "follow the journey", not "buy".                                      |

Since we're launching fresh on Threads, run all three phases in order, ~2 weeks each.

### Cadence

- **1–2 posts/day** + **15–30 min/day replying** in others' threads and to every comment
  on ours (within hours — the 1–6h reply window is when ranking compounds).
- Formats: short punchy opinions, questions, polls, trending topics (jump early —
  trending spikes get extra reach), cards as images.
- Every post that works on X gets repurposed here in shorter form (see §5).

### Example posts

**Educate:**

> Unpopular opinion: your content isn't underperforming because of the algorithm.
> It's underperforming because it looks like everyone else's post.
> Same words, better typography = 2× the stop-scroll.

> I looked at 30 product launch posts yesterday.
> The ones with clean, minimal images got ~3× more replies than raw screenshots.
> Design isn't decoration. It's the first sentence.

**Agitate:**

> Me, opening Canva for the 4th time today to make one quote image:
>
> - new project
> - find the font
> - resize canvas
> - export
> - wrong ratio
>
> 20 minutes. For ONE image. Does anyone else live like this?

**Architect (reveal):**

> So I got fed up and spent a few weekends building my own tool.
>
> Type the quote → pick a ratio → copy to clipboard → paste into Threads.
> 30 seconds. No signup. Free.
>
> Follow along while I polish it — I'm building the annotation feature next.

**Poll:**

> Be honest: when you post a screenshot of your product, do you clean it up first?

---

## 4. TikTok — solution

### Why TikTok: the interest graph, not the follower graph

TikTok's [official ranking explanation](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you)
states follower count and past viral hits are **not direct ranking factors** — each video
is seeded to ~200–300 test viewers and scaled only on early retention and high-intent
engagement (watch time, completion, rewatches, saves/shares). Best cold start of the four
platforms: a day-one account competes on content quality alone.

Honest caveats:

- Small-account baselines fell hard in 2025 (1–5K-follower accounts average ~350
  views/video, −23% YoY, [Socialinsider](https://www.socialinsider.io/social-media-benchmarks/tiktok)).
  The game is **breakouts, not baselines**: 1 in 6 videos does 3× its creator's median,
  92% of creators get a 3× breakout within 12 months
  ([Viewlify](https://viewlify.app/blog/tiktok-benchmarks-2026)).
- Video is the most expensive format here (~30–45 min/clip). If the week collapses, cut
  TikTok first — never cut Threads replies.

### What this looks like for Social Card

"Type text → instant designed output" is a proven TikTok mega-format (CreatorKit's
version: ~3M views). The closest founder case: **Dumbphone** — simple screen videos of a
minimalist interface → 2.4M views in 45 days → 20K downloads, $9K MRR in 78 days
([case](https://www.shortimize.com/blog/20k-downloads-and-9k-mrr-in-78-days-how-this-indie-app-turned-minimalism-into-millions-of-views)).
Also FlowTrack: 5s hook + 15s demo + 5s QR CTA → one 28-second clip hit 1.6M views →
4,300 site visits, 380 trials in 48h
([case](https://www.tokportal.com/post/case-study-how-a-saas-startup-grew-250-by-posting-tiktoks-in-four-countries)).

### Video formula (every video follows this)

| Time   | Beat                                                                                                                                      |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 0–2s   | Pain-point hook: side-by-side raw post vs designed card + text overlay. No intros ("Hey guys…" costs 30–40% retention).                   |
| 2–20s  | Screen speedrun: type → ratio → theme → QR → Copy → paste into a composer. Pattern interrupt (zoom / new text overlay) every 3–5 seconds. |
| 20–25s | Payoff: finished card, text `Free. No signup. 30 seconds.` Hold the last frame ~2s so the video loops cleanly.                            |

Specs from [retention data](https://www.opus.pro/blog/tiktok-length-format-retention-data):

- Length **21–34 seconds** (62% avg completion vs 48% for 60s+).
- On-screen text/captions always (+12% retention; 60–70% watch sound-off) — also how
  TikTok search finds the video (put keywords on screen AND in the caption).
- Sound: keep original typing/click sounds (satisfying = rewatches), optional subtle
  trending audio at ~10% volume.
- Hashtags: 3 niche tags max (`#designtok #buildinpublic #indiehacker`) — near-zero
  reach effect, pure categorization.
- CTA stays at the END (link in bio + pinned comment). CTA-in-first-3s trades reach for
  signups (−22% views but 2.6× signups/1K views) — an option once a format already retains.

### Cadence

- **3 videos/week** (Tue/Thu/Sat). Never daily — 12–15 high-retention videos/month beat
  30 rushed ones; quality is the only lever that scales.
- Rotate 5 hook archetypes to fight creative fatigue.
- Cross-post winners to Instagram Reels (same file, zero extra work).

## 5. Facebook — solution

### Honest verdict: deprioritize the Page

The [Rival IQ 2024 benchmark](https://get.rivaliq.com/hubfs/eBooks/2024-Rival-IQ-Social-Media-Industry-Benchmark-Report.pdf)
(2,100 companies, 1.9M posts) is blunt:

- Median Page engagement: **0.063% per post** — Tech & Software: **0.032%** (vs 0.437% on Instagram).
- **Links are the worst-performing format on Facebook in all 14 industries** — and a link
  is the natural SaaS post. Photo posts are the only above-average format.

A niche visual tool run by a solo founder should NOT spend meaningful time growing a
Facebook Page organically. The economics are an order of magnitude worse than Threads/X.

### What to do instead (2 hours/week, capped)

1. **Auto cross-post our cards as photo posts** (via Buffer/Meta Business Suite scheduler).
   No bare links ever — if a link is needed, it goes in the first comment, or better,
   it's the **QR printed on the card itself**. Photo post + QR = format that works +
   link that travels with the image.
2. **Groups, not Page (the actual Facebook play):** be a helpful member in groups where
   our ICP hangs out — indie hacker / solopreneur / social-media-marketing / designer
   groups. Share cards as genuine answers ("here's a quick quote image you can make"),
   not link drops. Group rules usually ban promotion; the image is the promotion.
3. **Reels opportunistically**: short screen-recordings of the 30-second card flow
   (type → ratio → copy → paste into the composer). Same recording works on Threads, IG, X.

### KPI reality check

Expect near-zero from the Page itself. Measure Facebook only by referral traffic to the
app (UTM: `?utm_source=facebook`), not followers.

---

## 6. The content engine — one card → four platforms

Solo-founder constraint: produce once, distribute everywhere. Weekly loop (~7 hrs/week):

```
 MON          TUE–THU               FRI
 ────         ────────              ────
 1 deep       repurpose daily:      review analytics,
 piece +      X (full card) →       double down on the
 film TikTok  Threads (shortened    format that won,
 speedrun     text + same card)     plan next week
 (thread /    → FB photo post
 tutorial)    TikTok: Tue/Thu/Sat
```

- **Monday:** one deep piece — a 5–8 post X thread or a Showcase-Card tutorial — and
  film the TikTok speedrun of making its card (~30–45 min).
- **Tue–Thu:** 2–3 repurposed posts/day on X, 1–2 on Threads (rewritten shorter,
  more conversational — never paste identical text), 1 photo post on FB,
  TikTok video Tue/Thu/Sat.
- **Friday:** check what earned replies/impressions; next week's plan keeps winners.
- Every reply gets a reply (within the hour on X, within 6h on Threads).

**Weekly series (named, recurring — series outperform one-offs):**

| Series               | Platform    | Format                                                         |
| -------------------- | ----------- | -------------------------------------------------------------- |
| _Made in 30 seconds_ | X + Threads | One card + the 3-step recipe                                   |
| _30-second speedrun_ | TikTok      | Screen recording: raw post → designed card, typing sounds only |
| _Before / After_     | All 4       | Raw screenshot vs Social Card version                          |
| _Build log_          | X + Threads | Metric-specific weekly update                                  |
| _Fix this post_      | X           | Quote-tweet an ugly (public-figure) post, rebuild it as a card |

---

## 7. 90-day plan & KPIs

### Phase 1 — Month 1: presence (Educator mode)

- Set up profiles (X + Threads bio = one-liner + link; IG mirror).
- Ship the weekly loop. 0 promotion except the link in bio/replies.

### Phase 2 — Month 2: reveal (Agitator → Architect)

- Threads reveal post. First "fix this post" series on X.
- Launch post on Indie Hackers / Product Hunt only after 2–4 weeks of organic traction
  (Tony Dinh sequenced Product Hunt AFTER the beta buzz; PH is a spike, not a strategy).

### Phase 3 — Month 3: compound

- Double down on the top-2 formats by replies. Start the free-template angle:
  "recreate this card in 30s" (template content is screenshot-and-reuse material,
  the highest-intent demo).
- TikTok: double down on the one hook archetype that retained best; kill the rest.

### Realistic KPIs for a solo founder (from [indie SaaS benchmarks](https://boringriches.com/guides/saas-business-revenue-benchmarks/))

| Metric                         | Month 1                     | Month 3               | Month 6       |
| ------------------------------ | --------------------------- | --------------------- | ------------- |
| Threads followers              | 100–300                     | 500–1K                | 2–5K          |
| X followers                    | 50–200                      | 300–800               | 1–2K          |
| TikTok followers               | 100–500                     | 500–1K                | 2–5K          |
| TikTok median views/video      | ~300 (normal)               | 1 breakout ≥3× median | 1 video >100K |
| Threads median ER              | >4% (platform median 6.25%) | ≥5%                   | ≥5%           |
| App visits/week (UTM-tagged)   | 100                         | 500                   | 2K            |
| Cards exported via QR/referral | —                           | 50/wk                 | 200/wk        |

$1K–3K MRR-equivalent traction (visits, users, cards) within 12 months is a solid outcome
for a solo founder; anything faster is top-10% territory. Do not judge weeks — judge
90-day slopes.

### Track weekly (spreadsheet, 5 numbers)

Cards exported, app visits by UTM source, follower counts, replies earned (not likes —
replies are the signal both algorithms pay for), QR scans.

---

## 8. Source register

- X algorithm (official repo + code analyses): [the-algorithm](https://github.com/twitter/the-algorithm/blob/main/README.md),
  [handbook](https://partyfly.github.io/x-algorithm-handbook/en/), [explainer](https://lemelson.github.io/x-algorithm-explained/)
- X engagement data: [Ordinal study](https://www.tryordinal.com/blog/twitter-x-engagement-data-study)
- Threads ranking (official): [Meta transparency doc](https://transparency.meta.com/features/explaining-ranking/ig-threads-feed)
- Threads tactics & stats: [Hootsuite](https://blog.hootsuite.com/threads-algorithm/), [Buffer](https://buffer.com/resources/threads-algorithm/), [Socialplug stats](https://www.socialplug.io/blog/threads-statistics)
- Threads 0→100 users case study: [Lucia on Indie Hackers](https://www.indiehackers.com/post/from-0-to-100-paying-users-the-exact-threads-content-strategy-i-used-to-launch-my-saas-e4c127ff30)
- Facebook benchmarks: [Rival IQ 2024 report](https://get.rivaliq.com/hubfs/eBooks/2024-Rival-IQ-Social-Media-Industry-Benchmark-Report.pdf)
- Founder case studies: [Tony Dinh — Blackmagic](https://news.tonydinh.com/p/322-2k-mrr-in-60-days-by-building-in-public-910564),
  [Yongfook — Bannerbear](https://www.bannerbear.com/blog/one-year-of-marketing-a-saas-from-10k-to-20k-mrr/)
- Post formats library: [68 SaaS post ideas](https://www.socialmon.ai/blog/68-high-performing-post-ideas-for-saas-startups-that-actually-convert)
- TikTok ranking (official): [How TikTok recommends videos](https://newsroom.tiktok.com/how-tiktok-recommends-videos-for-you)
- TikTok benchmarks & retention: [Socialinsider](https://www.socialinsider.io/social-media-benchmarks/tiktok),
  [Viewlify](https://viewlify.app/blog/tiktok-benchmarks-2026),
  [OpusClip retention data](https://www.opus.pro/blog/tiktok-length-format-retention-data)
- TikTok founder cases: [Dumbphone](https://www.shortimize.com/blog/20k-downloads-and-9k-mrr-in-78-days-how-this-indie-app-turned-minimalism-into-millions-of-views),
  [FlowTrack](https://www.tokportal.com/post/case-study-how-a-saas-startup-grew-250-by-posting-tiktoks-in-four-countries)
