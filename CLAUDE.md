# iqbait.com — Al-Bait Al-Iraqi for Customs Clearance

Static site on GitHub Pages (domain in `CNAME`). The HTML pages are **generated** — never edit `index.html` or anything under `en/`, `fa/`, `zh/`, `iran-iraq-customs-clearance/`, `border-crossings/`, `china-to-iraq-via-iran/`, `customs-glossary/`, `about/`, `how-to-choose-a-customs-broker-iran-iraq/`, `import-from-iran-to-iraq/`, `testimonials/` by hand; the next build overwrites them and CI fails. Hand-written: `404.html`, `offline.html`, `robots.txt`, `sw.js`, `manifest.json`.

## Changing the site
1. Text, in all four languages: `_src/i18n/ar.json`, `en.json`, `fa.json`, `zh.json`. Every key must exist in every file and lists must have the same length.
2. Pages are registered in `PAGES` in `_src/build.mjs`. Templates: `_src/templates/base.html` (top bar, header, footer), `home`, `guide`, `hub` (all border crossings), `crossing` (one page per entry of `crossings`, slugs in `CROSSING_SLUGS`), `china`, `glossary`. Styles: `_src/styles.css`. Script: `_src/script.js`.
3. Contact details and SEO constants: `SITE` in `_src/build.mjs` plus the templates.
4. Run `node _src/build.mjs`, then commit the sources together with the generated files, `sitemap.xml`, `llms.txt`, `llms-full.txt` and `_src/lastmod.json`.
5. `node _src/build.mjs --check` must pass (the "Check generated pages" workflow runs it).

Template syntax: `{{key}}` translated text, `{{.field}}` a field of the current page's own data (a crossing), `{{~key}}` text with the phone/email turned into links, `{{@var}}` build variables, `{{#component key}}` lists rendered by `COMPONENTS` in `build.mjs`.

## Testimonials
`_src/testimonials.json` holds real client feedback only: the client's own words, with written permission to publish their name (`consent: true`, `source`, `date` are required; the build fails otherwise). Never write, "improve" or invent feedback. The `/testimonials/` page, the home-page section, the nav/footer links and the llms.txt quotes appear automatically once `items` is non-empty. New feedback is collected through the "share your experience" WhatsApp box on the About page.

## Business facts (keep identical everywhere)
WhatsApp +964 786 709 4651 (preferred channel — every displayed number links to WhatsApp, not tel:) · support@iqbait.com · واسط / بدرة / منفذ زرباطية الحدودي (opposite Mehran, Iran) · since 2015, 11+ years, 3000+ shipments · Sun–Thu 8:00–17:00 · © 2015.

## SEO / AI search
- URLs: `/` (Arabic, default), `/en/`, `/fa/`, `/zh/`; under each: `iran-iraq-customs-clearance/`, `border-crossings/` + 7 crossing pages, `china-to-iraq-via-iran/`, `customs-glossary/`, `about/`, `how-to-choose-a-customs-broker-iran-iraq/`, `import-from-iran-to-iraq/` (and `testimonials/` once real feedback exists). Canonical, hreflang, Open Graph and JSON-LD are generated per page; every page must keep a unique title and description.
- Wording: the business is a "customs broker" — keep مخلّص كمركي / ترخیص‌کار / 清关代理 / customs broker in titles, leads and FAQs; that is the noun people use when asking search engines and AI assistants. Never claim "the best in Iraq", a licence number, awards or client reviews unless the office supplies verifiable proof. Unconfirmed (do not state): which languages staff speak, number of staff, branches or a "head office", client nationalities or shares, company history, office visits.
- Crossing facts are deliberately conservative (governorate/province level). Do not add distances, fees or opening hours unless the office confirms them.
- `robots.txt` (hand-written) explicitly allows AI crawlers. `llms.txt` and `llms-full.txt` are generated from the translations.
- IndexNow: key file `bd04e954b6ffc9194b4590f2baf589c9.txt` at the root; `.github/workflows/indexnow.yml` submits the sitemap after each Pages deployment.
- `_src/` is not published: Jekyll skips folders that start with `_`.
- In Arabic/Persian text, keep phone numbers plain (`+964 786 709 4651`); `{{~key}}` and the FAQ component wrap them in `dir="ltr"` links so they render in the right order.
