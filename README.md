# g3n7ry.com — personal hub

A single-page personal hub for **Christopher Gentry** (`g3n7ry`), designed to
strengthen the personal brand and act as the parent entity for
[christopher-gentry.com](https://christopher-gentry.com).

Aesthetic: **"The Archivist's Console"** — warm amber phosphor on near-black,
an editorial serif (the writer) paired with an engineering monospace (the
builder). Hand-built, **no framework and no build step**.

## What's here

```
g3n7ry-hub/
  index.html        # the whole page (semantic HTML + JSON-LD Person schema)
  styles.css        # the design system (CSS variables, atmosphere, motion)
  main.js           # boot sequence, scroll reveals, cursor glow, live RSS pull
  favicon.svg       # amber 'g' + blinking cursor mark
  assets/og.svg     # source for the social share image
  assets/og.png     # 1200×630 Open Graph image (regenerate from og.svg)
  CNAME             # g3n7ry.com
  robots.txt
  sitemap.xml
```

## Notable details

- **Entity SEO.** The `Person` JSON-LD mirrors the schema on
  christopher-gentry.com and cross-links both sites plus GitHub/LinkedIn via
  `sameAs`. Two sites corroborating each other is the strongest signal for
  tying the "Christopher Gentry" / "g3n7ry" identity together in search.
- **Always fresh.** `main.js` fetches the newest item from
  `https://christopher-gentry.com/rss.xml` and shows it as the "latest
  dispatch." If the fetch fails (offline, CORS), it degrades silently to a
  static link — no broken state.
- **Accessible & fast.** Honours `prefers-reduced-motion`, has a skip link,
  semantic landmarks, focus-visible styles, and ships ~one small JS file.
- **Boot sequence** is skippable (Enter / Esc / click / scroll) and has a
  6-second failsafe so no one is ever trapped behind it.

## Local preview

No build step. Serve the folder with anything static:

```sh
cd g3n7ry-hub
python3 -m http.server 8099
# → http://localhost:8099
```

## Regenerating the OG image

`assets/og.png` is rasterized from `assets/og.svg` with `sharp`:

```sh
npm install sharp --no-save
node -e "require('sharp')('g3n7ry-hub/assets/og.svg',{density:144}).resize(1200,630).png().toFile('g3n7ry-hub/assets/og.png')"
```

## Deploying to g3n7ry.com

This is a **separate site from the blog** (different custom domain), so it gets
its own repo and GitHub Pages target — a single Pages site can only serve one
custom domain.

**This folder is the repo root.** It already contains everything needed,
including `.github/workflows/deploy.yml` (which rasterizes the OG image and
publishes to Pages on every push to `main`).

### Push to the `portfolio` repo

The repo (`C-G3n7ry/portfolio`) already exists. From a clone of the monorepo
(so you have these files locally), publish this folder as the repo root:

```sh
cd g3n7ry-hub
git init -b main
git add .
git commit -m "Launch g3n7ry.com personal hub"
git remote add origin git@github.com:C-G3n7ry/portfolio.git
git push -u origin main
```

(Or with the GitHub CLI from inside `g3n7ry-hub/`:
`gh repo create C-G3n7ry/portfolio --public --source=. --push` — only if the
repo were empty/uncreated.)

### Turn on Pages + DNS

1. In the new repo: **Settings → Pages → Build and deployment → Source:
   GitHub Actions**. The workflow deploys automatically on push.
2. Point `g3n7ry.com` DNS at GitHub Pages — for an apex domain, four `A`
   records to `185.199.108.153`, `.109.153`, `.110.153`, `.111.153` (plus the
   `AAAA` equivalents `2606:50c0:8000–8003::153`), or an `ALIAS`/`ANAME` to
   `c-g3n7ry.github.io` if your DNS provider supports it.
3. The `CNAME` file (`g3n7ry.com`) is already in place, so Pages will pick up
   the custom domain on first deploy.

### Alternative: any static host

There's no build step, so Netlify / Cloudflare Pages / Vercel work too — point
them at this folder. (You'd lose the CI OG-image generation; commit
`assets/og.png` instead — it's already generated in the monorepo copy.)
