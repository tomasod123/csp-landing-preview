# Deploy · clinicsuccesspartners.com

Production: **clinicsuccesspartners.com** (SiteGround shared hosting)
SSH alias: `siteground-csp` (configured in `~/.ssh/config`)
Webroot: `/home/customer/www/clinicsuccesspartners.com/public_html/`

Every future change: paste "deploy it" to Claude. Claude reads this file and executes.

---

## Standard deploy (what Claude should do each time)

```bash
cd ~/csp-landing

# 1. Safety: status must be clean
git status --short
git push origin main   # fans out to preview + private GitHub remotes
git push hetzner main  # offsite mirror

# 2. Dry-run rsync first, review output
rsync -avn --delete \
  --exclude='.git' --exclude='.DS_Store' --exclude='.tmp' \
  --exclude='node_modules' --exclude='README.md' --exclude='*.log' \
  --exclude='.gitignore' --exclude='deploy.md' \
  ~/csp-landing/ \
  siteground-csp:/home/customer/www/clinicsuccesspartners.com/public_html/

# 3. Real run (drop the 'n')
rsync -av --delete \
  --exclude='.git' --exclude='.DS_Store' --exclude='.tmp' \
  --exclude='node_modules' --exclude='README.md' --exclude='*.log' \
  --exclude='.gitignore' --exclude='deploy.md' \
  ~/csp-landing/ \
  siteground-csp:/home/customer/www/clinicsuccesspartners.com/public_html/
```

After rsync: **Tomas flushes cache** at
https://tools.siteground.com → Speed → Caching → Flush Cache
(There is no SSH-level cache flush on SiteGround.)

## Verification (auto-run after every deploy)

```bash
bash -c '
echo "=== Homepage 200 ==="
/usr/bin/curl -sI "https://clinicsuccesspartners.com/" | head -3
echo "=== 301 check ==="
for u in about case-studies services ppc-google-ads seo; do
  code=$(/usr/bin/curl -sI "https://clinicsuccesspartners.com/${u}/" | head -1)
  echo "  /${u}/ -> ${code}"
done
echo "=== Static files 200 ==="
for p in robots.txt sitemap.xml assets/favicon-32.png css/page.css; do
  code=$(/usr/bin/curl -sI "https://clinicsuccesspartners.com/${p}" | head -1)
  echo "  /${p} -> ${code}"
done
echo "=== TTFB ==="
/usr/bin/curl -o /dev/null -s -w "  ttfb=%{time_starttransfer}s total=%{time_total}s\n" "https://clinicsuccesspartners.com/"
'
```

## Rollback (if deploy looks wrong)

The pre-migration WordPress snapshot is preserved at:
`/home/customer/www/clinicsuccesspartners.com/public_html_old/`

```bash
ssh siteground-csp "cd /home/customer/www/clinicsuccesspartners.com && \
  mv public_html public_html_failed_$(date +%Y%m%d%H%M) && \
  mv public_html_old public_html"
```

Site restored to WordPress in ~30 seconds.

**Full backup archives** (WordPress files + DB, SHA256-verified, April 2026):
- SiteGround: `/home/customer/backups/wordpress-{db,files}-20260419-154727UTC.*`
- Mac: `~/csp-landing/.tmp/backups/`
- Hetzner: `root@204.168.203.29:/root/backups/csp-wordpress/`
- SiteGround daily auto-backup: Site Tools → Security → Backups (30-day retention)

## Git remotes (all push on `git push origin main` via multi-push URL)

- `origin`: GitHub preview (https://github.com/tomasod123/csp-landing-preview.git)
- `origin` (2nd push URL): GitHub private (https://github.com/tomasod123/csp-landing.git)
- `private`: GitHub private (explicit name)
- `hetzner`: Hetzner bare repo (root@204.168.203.29:/root/git/csp-landing.git)

## Known SiteGround quirks

1. **PHP handler on HTML**: SiteGround defaults to routing every request through mod_php. We disable this in `.htaccess` block #0 with `<FilesMatch>` + `SetHandler None`. Do NOT remove that block.
2. **No SSH cache flush**: only the web dashboard can flush their Dynamic Cache.
3. **Dynamic Caching** may need enabling at Site Tools → Speed → Caching → Dynamic Caching (ON).
4. **The `ascdevelopment.` and `staging2.` subdomain folders** in `~/www/` are legacy WordPress installs not in DNS. Leave them alone.

## Post-deploy checklist

- [ ] SiteGround cache flushed via dashboard
- [ ] Homepage hard-refreshed in browser (Cmd+Shift+R)
- [ ] Spot-check one old URL (e.g. `/case-studies/`) returns 301 to `/`
- [ ] Search Console: resubmit new `sitemap.xml` at https://clinicsuccesspartners.com/sitemap.xml
- [ ] Post-deploy loose threads: add real `/privacy` and `/terms` pages (current links 301 to `/`)

## Emergency contacts

- SiteGround support: https://tools.siteground.com → Support → Contact
- GoDaddy DNS (for emergencies only): https://dcc.godaddy.com
