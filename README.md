# CSP Landing · Homepage + VSL Squeeze Page

Premium one-page site for **Clinic Success Partners**. Doubles as:
1. The public CSP homepage
2. A VSL landing page for cold-email traffic

## Structure

```
csp-landing/
├── index.html          # single-page site, CSS inlined
├── brand/              # CSP brand system (tokens · motion · js)
├── css/page.css        # overrides + reduced-motion safeguards
├── js/scorecard.js     # interactive 7-slider diagnostic
├── assets/
│   ├── favicon.svg
│   └── og-image.jpg    # (add before deploy — 1200x630)
└── README.md
```

## Local preview

```bash
cd ~/csp-landing
python3 -m http.server 8787
# open http://localhost:8787
```

## Deploy to SiteGround (main domain, SSH)

SiteGround hosting accepts plain static uploads over SSH. Target the web-root directory of `clinicsuccesspartners.com` (usually `~/www/clinicsuccesspartners.com/public_html/`).

### Option A — scp the whole tree

```bash
# From the project root, after adding og-image.jpg
rsync -avz --delete \
  --exclude '.git' \
  --exclude '.DS_Store' \
  --exclude 'README.md' \
  ~/csp-landing/ \
  USER@HOSTNAME:~/www/clinicsuccesspartners.com/public_html/
```

Swap `USER`, `HOSTNAME`, and the SiteGround path to match your SSH credentials. SiteGround provides both from Site Tools → Devs → SSH Keys Manager.

### Option B — Git deploy

Push the repo to GitHub, then on the SiteGround server:

```bash
# First time
cd ~/www/clinicsuccesspartners.com/public_html
git init
git remote add origin git@github.com:tomasod123/csp-landing.git
git fetch
git checkout -f main

# Subsequent deploys
git pull
```

### Option C — Upload a zip via Site Tools

```bash
cd ~
zip -r csp-landing.zip csp-landing/ -x '*.git*' '*.DS_Store'
# then upload through Site Tools file manager
```

## Post-deploy checks

- `https://clinicsuccesspartners.com/` loads without console errors
- Vidalytics video plays (loader + player)
- All CTAs click through to `book.clinicsuccesspartners.com/schedule-call` with UTMs intact
- Interactive scorecard updates score + dollar estimate + CTA URL live
- Mobile: sticky bottom CTA bar appears after hero
- Lighthouse: LCP under 2s, CLS under 0.05

## Edit workflow

- **Copy changes** → `index.html` directly
- **New section** → compose from `brand/components.html` patterns, keep class names consistent
- **Scorecard tweaks** → `js/scorecard.js` (dollar factor is `* 2000`, tier thresholds at 14/24)
- **CTA URL** → search-replace `book.clinicsuccesspartners.com/schedule-call` across repo

## Brand system rules

Everything pulls from `/brand/tokens.css` — do not introduce new colors, fonts, or radii inline. Primary CTA is always `.btn.btn-primary.magnetic` (blue-800 + tinted shadow). Voice is operator-grade editorial (no emdashes, no "genuinely", no hype phrases, EBITDA not revenue for clinic valuations).
