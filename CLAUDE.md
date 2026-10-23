# iqbait.com — Al-Bait Al-Iraqi for Customs Clearance

Static site on GitHub Pages (domain in `CNAME`). The HTML pages are **generated** — never edit `index.html` or anything under `en/`, `fa/`, `zh/`, `iran-iraq-customs-clearance/`, `border-crossings/`, `china-to-iraq-via-iran/`, `customs-glossary/` by hand; the next build overwrites them and CI fails. Hand-written: `404.html`, `offline.html`, `robots.txt`, `sw.js`, `manifest.json`.

## Changing the site
1. Text, in all four languages: `_src/i18n/ar.json`, `en.json`, `fa.json`, `zh.json`. Every key must exist in every file and lists must have the same length.
2. Pages are registered in `PAGES` in `_src/build.mjs`. Templates: `_src/templates/base.html` (top bar, header, footer), `home`, `guide`, `hub` (all border crossings), `crossing` (one page per entry of `crossings`, slugs in `CROSSING_SLUGS`), `china`, `glossary`. Styles: `_src/styles.css`. Script: `_src/script.js`.
3. Contact details and SEO constants: `SITE` in `_src/build.mjs` plus the templates.
4. Run `node _src/build.mjs`, then commit the sources together with the generated files, `sitemap.xml`, `llms.txt`, `llms-full.txt` and `_src/lastmod.json`.
5. `node _src/build.mjs --check` must pass (the "Check generated pages" workflow runs it).

Template syntax: `{{key}}` translated text, `{{.field}}` a field of the current page's own data (a crossing), `{{~key}}` text with the phone/email turned into links, `{{@var}}` build variables, `{{#component key}}` lists rendered by `COMPONENTS` in `build.mjs`.

## Business facts (keep identical everywhere)
Phone/WhatsApp +964 775 168 7406 · support@iqbait.com · واسط / بدرة / منفذ زرباطية الحدودي (opposite Mehran, Iran) · since 2015, 11+ years, 3000+ shipments · Sun–Thu 8:00–17:00 · © 2015.

## SEO / AI search
- URLs: `/` (Arabic, default), `/en/`, `/fa/`, `/zh/`; under each: `iran-iraq-customs-clearance/`, `border-crossings/` + 7 crossing pages, `china-to-iraq-via-iran/`, `customs-glossary/`. Canonical, hreflang, Open Graph and JSON-LD are generated per page; every page must keep a unique title and description.
- Crossing facts are deliberately conservative (governorate/province level). Do not add distances, fees or opening hours unless the office confirms them.
- `robots.txt` (hand-written) explicitly allows AI crawlers. `llms.txt` and `llms-full.txt` are generated from the translations.
- IndexNow: key file `bd04e954b6ffc9194b4590f2baf589c9.txt` at the root; `.github/workflows/indexnow.yml` submits the sitemap after each Pages deployment.
- `_src/` is not published: Jekyll skips folders that start with `_`.
- In Arabic/Persian text, keep phone numbers plain (`+964 775 168 7406`); `{{~key}}` and the FAQ component wrap them in `dir="ltr"` links so they render in the right order.
