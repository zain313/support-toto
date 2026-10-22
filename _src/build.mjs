#!/usr/bin/env node
// Builds the static multilingual site from _src/.
//   node _src/build.mjs          write all generated files
//   node _src/build.mjs --check  exit 1 if any generated file is out of date
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const SRC = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SRC, '..');
const CHECK = process.argv.includes('--check');

const SITE = {
  origin: 'https://iqbait.com',
  phone: '+9647751687406',
  whatsapp: 'https://wa.me/9647751687406',
  email: 'support@iqbait.com',
  founded: '2015',
  // Approximate position of the Zurbatiyah border crossing; replace with the Google Business Profile pin when available.
  geo: { latitude: 33.13, longitude: 46.1 },
  ogImage: { path: '/images/og-cover.jpg', width: 1200, height: 630 },
  fbVerification: 'sutxxrsdtg8j2zsn03ri442dxwtb39',
  guidePublished: '2026-10-22',
};

// Object order = order of the language switcher.
const LANGS = {
  ar: { dir: 'rtl', locale: 'ar_IQ', label: 'العربية', name: 'Arabic', intl: 'ar-IQ', font: 'Cairo:wght@400;600;700;800' },
  en: { dir: 'ltr', locale: 'en_US', label: 'EN', name: 'English', intl: 'en-GB', font: 'Inter:wght@400;600;700;800' },
  zh: { dir: 'ltr', locale: 'zh_CN', label: '中文', name: 'Chinese', intl: 'zh-CN', font: 'Noto+Sans+SC:wght@400;600;700' },
  fa: { dir: 'rtl', locale: 'fa_IR', label: 'فارسی', name: 'Persian', intl: 'fa-IR', font: 'Vazirmatn:wght@400;600;700;800' },
};
const LANG_CODES = Object.keys(LANGS);
const DEFAULT_LANG = 'ar';
const X_DEFAULT_LANG = 'en';

const PAGES = [
  { id: 'home', slug: '', template: 'home.html', changefreq: 'weekly', priority: '1.0', images: ['/images/hero-1.webp', '/images/hero-2.webp', '/images/hero-3.webp'] },
  { id: 'guide', slug: 'iran-iraq-customs-clearance/', template: 'guide.html', changefreq: 'monthly', priority: '0.9', images: [] },
];

const pagePath = (lang, page) => (lang === DEFAULT_LANG ? '/' : `/${lang}/`) + page.slug;
const pageUrl = (lang, page) => SITE.origin + pagePath(lang, page);
const page = id => PAGES.find(p => p.id === id);

const read = rel => fs.readFileSync(path.join(SRC, rel), 'utf8');
const T = Object.fromEntries(LANG_CODES.map(l => [l, JSON.parse(read(`i18n/${l}.json`))]));
const CSS = read('styles.css').trim();
const JS = read('script.js').trim();
const TEMPLATES = { base: read('templates/base.html'), home: read('templates/home.html'), guide: read('templates/guide.html') };

const errors = [];
// Strips invisible direction marks used to keep phone numbers readable in RTL text.
const md = s => String(s).replace(/[\u200e\u2066-\u2069]/g, '');
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function t(lang, key) {
  const v = T[lang][key];
  if (v === undefined) {
    errors.push(`[${lang}] missing translation key "${key}"`);
    return Array.isArray(T[DEFAULT_LANG][key]) ? [] : `{{${key}}}`;
  }
  return v;
}

// Text with the phone number and email turned into links; dir="ltr" keeps the number readable inside Arabic/Persian sentences.
const PHONE_DISPLAY = '+964 775 168 7406';
const rich = s => esc(md(s))
  .split(PHONE_DISPLAY).join(`<a href="tel:${SITE.phone}" dir="ltr">${PHONE_DISPLAY}</a>`)
  .split(SITE.email).join(`<a href="mailto:${SITE.email}" dir="ltr">${SITE.email}</a>`);

const COMPONENTS = {
  crossingCards: lang => '<ul class="crossings">\n' + t(lang, 'crossings').map((c, i) =>
    `<li class="crossing${i === 0 ? ' hq' : ''}">` +
    (i === 0 ? `<span class="hq-badge">${esc(t(lang, 'iran.hq'))}</span>` : '') +
    `<div class="pair"><span class="side"><small>${esc(t(lang, 'iran.iq'))}</small><strong>${esc(c.iq)}</strong></span>` +
    `<span class="swap" aria-hidden="true">⇄</span>` +
    `<span class="side"><small>${esc(t(lang, 'iran.ir'))}</small><strong>${esc(c.ir)}</strong></span></div>` +
    `<p>${esc(c.note)}</p></li>`).join('\n') + '\n</ul>',
  crossingTable: lang => '<div class="table-wrap"><table>\n' +
    `<thead><tr><th>#</th><th>${esc(t(lang, 'iran.iq'))}</th><th>${esc(t(lang, 'iran.ir'))}</th><th>${esc(t(lang, 'guide.colNote'))}</th></tr></thead>\n<tbody>\n` +
    t(lang, 'crossings').map((c, i) => `<tr${i === 0 ? ' class="hq"' : ''}><td>${i + 1}</td><td>${esc(c.iq)}</td><td>${esc(c.ir)}</td><td>${esc(c.note)}</td></tr>`).join('\n') +
    '\n</tbody></table></div>',
  ports: lang => '<ul class="ports">\n' + t(lang, 'ports').map(p => `<li><strong>${esc(p.name)}</strong><span>${esc(p.note)}</span></li>`).join('\n') + '\n</ul>',
  faq: (lang, key) => '<div class="faq">\n' + t(lang, key).map((f, i) =>
    `<details${i === 0 ? ' open' : ''}><summary><h3>${esc(f.q)}</h3></summary><div class="ans"><p>${rich(f.a)}</p></div></details>`).join('\n') + '\n</div>',
  list: (lang, key) => '<ul class="bullets">\n' + t(lang, key).map(s => `<li>${esc(s)}</li>`).join('\n') + '\n</ul>',
  steps: (lang, key) => '<ol class="howto">\n' + t(lang, key).map((s, i) => `<li id="step-${i + 1}"><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></li>`).join('\n') + '\n</ol>',
  docs: (lang, key) => '<dl class="docs">\n' + t(lang, key).map(d => `<div><dt>${esc(d.name)}</dt><dd>${esc(d.text)}</dd></div>`).join('\n') + '\n</dl>',
};

// {{key}} translated text, {{~key}} text with phone/email links, {{@var}} prebuilt HTML, {{#component arg}} rendered block. Single pass, so inserted HTML is never re-scanned.
function render(tpl, lang, vars) {
  return tpl.replace(/\{\{([#@~]?)([\w.-]+)(?:\s+([\w.-]+))?\}\}/g, (m, sigil, name, arg) => {
    if (sigil === '@') {
      if (!(name in vars)) { errors.push(`unknown template variable @${name}`); return m; }
      return vars[name];
    }
    if (sigil === '#') {
      if (!COMPONENTS[name]) { errors.push(`unknown component #${name}`); return m; }
      return COMPONENTS[name](lang, arg);
    }
    const v = t(lang, name);
    if (typeof v !== 'string') { errors.push(`[${lang}] "${name}" is a list, use a component`); return m; }
    return sigil === '~' ? rich(v) : esc(v);
  });
}

function jsonLd(lang, pg, lastmod) {
  const url = pageUrl(lang, pg);
  const orgId = `${SITE.origin}/#organization`;
  const siteId = `${SITE.origin}/#website`;
  const pageId = `${url}#webpage`;
  const ogImage = SITE.origin + SITE.ogImage.path;
  const brand = t(lang, 'brand.name');
  const alternateName = [...new Set([...LANG_CODES.map(l => T[l]['brand.name']), 'Al-Bait Al-Iraqi', 'Al Bait Al Iraqi', 'البيت العراقي', 'iqbait'])].filter(n => n !== brand);
  const areaServed = [
    { '@type': 'Country', name: t(lang, 'org.iraq'), sameAs: 'https://en.wikipedia.org/wiki/Iraq' },
    { '@type': 'Country', name: t(lang, 'org.iran'), sameAs: 'https://en.wikipedia.org/wiki/Iran' },
  ];
  const services = [
    ['import', 'svc.t1', 'svc.d1'], ['export', 'svc.t2', 'svc.d2'], ['transit', 'svc.transit.t', 'svc.transit.d'],
    ['specialised', 'svc.t3', 'svc.d3'], ['consulting', 'svc.t4', 'svc.d4'],
  ].map(([id, name, desc]) => ({
    '@type': 'Service', '@id': `${SITE.origin}/#service-${id}`, name: t(lang, name), serviceType: t(lang, name),
    description: t(lang, desc), provider: { '@id': orgId }, areaServed,
  }));
  const business = {
    '@type': 'ProfessionalService', '@id': orgId, name: brand, alternateName,
    description: t(lang, 'org.desc'), url: `${SITE.origin}/`,
    logo: { '@type': 'ImageObject', url: `${SITE.origin}/images/icon-512.png`, width: 512, height: 512 },
    image: ogImage, telephone: SITE.phone, email: SITE.email, foundingDate: SITE.founded,
    address: { '@type': 'PostalAddress', streetAddress: t(lang, 'org.street'), addressLocality: t(lang, 'org.locality'), addressRegion: t(lang, 'org.region'), addressCountry: 'IQ' },
    geo: { '@type': 'GeoCoordinates', ...SITE.geo },
    hasMap: 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Zurbatiyah Border Crossing, Wasit, Iraq'),
    openingHoursSpecification: [{ '@type': 'OpeningHoursSpecification', dayOfWeek: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'], opens: '08:00', closes: '17:00' }],
    areaServed, knowsAbout: t(lang, 'org.knowsAbout'),
    contactPoint: [{ '@type': 'ContactPoint', contactType: 'customer service', telephone: SITE.phone, email: SITE.email, url: SITE.whatsapp, areaServed: ['IQ', 'IR'], availableLanguage: ['ar', 'fa'] }],
    hasOfferCatalog: { '@type': 'OfferCatalog', name: t(lang, 'services.title'), itemListElement: services.map(s => ({ '@type': 'Offer', itemOffered: { '@id': s['@id'] } })) },
  };
  const website = { '@type': 'WebSite', '@id': siteId, url: `${SITE.origin}/`, name: brand, alternateName, inLanguage: LANG_CODES, publisher: { '@id': orgId } };
  const webpage = {
    '@type': ['WebPage', 'FAQPage'], '@id': pageId, url,
    name: t(lang, `${pg.id}.seo.title`), description: t(lang, `${pg.id}.seo.desc`), inLanguage: lang,
    isPartOf: { '@id': siteId }, about: { '@id': orgId },
    primaryImageOfPage: { '@type': 'ImageObject', url: ogImage }, dateModified: lastmod,
    mainEntity: t(lang, pg.id === 'home' ? 'home.faq' : 'guide.faq').map(f => ({ '@type': 'Question', name: md(f.q), acceptedAnswer: { '@type': 'Answer', text: md(f.a) } })),
  };
  const graph = [business, website, webpage, ...services];
  if (pg.id === 'guide') {
    webpage.breadcrumb = { '@id': `${url}#breadcrumb` };
    graph.push(
      { '@type': 'BreadcrumbList', '@id': `${url}#breadcrumb`, itemListElement: [
        { '@type': 'ListItem', position: 1, name: t(lang, 'nav.home'), item: pageUrl(lang, page('home')) },
        { '@type': 'ListItem', position: 2, name: t(lang, 'guide.crumb'), item: url },
      ] },
      { '@type': 'Article', '@id': `${url}#article`, headline: t(lang, 'guide.h1'), description: t(lang, 'guide.seo.desc'), inLanguage: lang,
        image: ogImage, author: { '@id': orgId }, publisher: { '@id': orgId }, datePublished: SITE.guidePublished, dateModified: lastmod,
        mainEntityOfPage: { '@id': pageId }, about: areaServed },
      { '@type': 'HowTo', '@id': `${url}#howto`, name: t(lang, 'guide.stepsTitle'), inLanguage: lang,
        step: t(lang, 'guide.steps').map((s, i) => ({ '@type': 'HowToStep', position: i + 1, name: s.name, text: s.text, url: `${url}#step-${i + 1}` })) },
    );
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': graph }).replace(/</g, '\\u003c');
}

function head(lang, pg, lastmod) {
  const L = LANGS[lang];
  const url = pageUrl(lang, pg);
  const ogImage = SITE.origin + SITE.ogImage.path;
  const title = esc(t(lang, `${pg.id}.seo.title`));
  const desc = esc(t(lang, `${pg.id}.seo.desc`));
  const font = `https://fonts.googleapis.com/css2?family=${L.font}&display=swap`;
  const out = [
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    `<title>${title}</title>`,
    `<meta name="description" content="${desc}">`,
    '<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">',
    `<link rel="canonical" href="${url}">`,
    ...LANG_CODES.map(l => `<link rel="alternate" hreflang="${l}" href="${pageUrl(l, pg)}">`),
    `<link rel="alternate" hreflang="x-default" href="${pageUrl(X_DEFAULT_LANG, pg)}">`,
    `<meta name="facebook-domain-verification" content="${SITE.fbVerification}">`,
    '<meta name="geo.region" content="IQ-WA">',
    '<meta name="geo.placename" content="Badra, Wasit, Iraq">',
    '<link rel="preconnect" href="https://fonts.googleapis.com">',
    '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
    `<link rel="preload" href="${font}" as="style" onload="this.onload=null;this.rel='stylesheet'">`,
    `<noscript><link href="${font}" rel="stylesheet"></noscript>`,
    ...(pg.id === 'home' ? ['<link rel="preload" href="/images/hero-1.webp" as="image" type="image/webp" fetchpriority="high">'] : []),
    `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='8' fill='%230A2342'/><path d='M4 14L16 4l12 10v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V14z' stroke='%23C9A84C' stroke-width='2' stroke-linejoin='round' fill='none'/><circle cx='16' cy='20' r='4' stroke='%23C9A84C' stroke-width='1.6' fill='none'/></svg>">`,
    '<link rel="apple-touch-icon" href="/images/icon-192.png">',
    '<link rel="manifest" href="/manifest.json">',
    '<meta name="theme-color" content="#0A2342">',
    '<meta name="mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-capable" content="yes">',
    '<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">',
    `<meta name="apple-mobile-web-app-title" content="${esc(t(lang, 'brand.name'))}">`,
    '<meta property="og:type" content="website">',
    `<meta property="og:site_name" content="${esc(t(lang, 'brand.name'))}">`,
    `<meta property="og:title" content="${title}">`,
    `<meta property="og:description" content="${desc}">`,
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${ogImage}">`,
    `<meta property="og:image:width" content="${SITE.ogImage.width}">`,
    `<meta property="og:image:height" content="${SITE.ogImage.height}">`,
    `<meta property="og:image:alt" content="${esc(t(lang, 'og.alt'))}">`,
    `<meta property="og:locale" content="${L.locale}">`,
    ...LANG_CODES.filter(l => l !== lang).map(l => `<meta property="og:locale:alternate" content="${LANGS[l].locale}">`),
    '<meta name="twitter:card" content="summary_large_image">',
    `<meta name="twitter:title" content="${title}">`,
    `<meta name="twitter:description" content="${desc}">`,
    `<meta name="twitter:image" content="${ogImage}">`,
    `<meta name="twitter:image:alt" content="${esc(t(lang, 'og.alt'))}">`,
    `<script type="application/ld+json">${jsonLd(lang, pg, lastmod)}</script>`,
  ];
  if (lang === DEFAULT_LANG && pg.id === 'home') {
    // Old links used ?lang=xx on the home page; send them to the real language URL.
    out.push(`<script>(function(){var l=new URLSearchParams(location.search).get('lang');if(['en','fa','zh'].indexOf(l)>-1)location.replace('/'+l+'/'+location.hash);})();</script>`);
  }
  return out.join('\n');
}

const langSwitch = (lang, pg) => LANG_CODES.map(l =>
  `<a href="${pagePath(l, pg)}" hreflang="${l}" lang="${l}"${l === lang ? ' class="active" aria-current="page"' : ''}>${LANGS[l].label}</a>`).join('\n');

const formatDate = (lang, iso) => new Intl.DateTimeFormat(LANGS[lang].intl, { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));

// lastmod only moves when a page's content changes, so sitemap dates stay trustworthy for crawlers.
const STATE_FILE = path.join(SRC, 'lastmod.json');
const prevState = fs.existsSync(STATE_FILE) ? JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')) : {};
const nextState = {};
const today = new Date().toISOString().slice(0, 10);
const files = new Map();

for (const pg of PAGES) {
  for (const lang of LANG_CODES) {
    const LM = '__LASTMOD__', LML = '__LASTMOD_LABEL__';
    const vars = {
      lang, dir: LANGS[lang].dir, home: pagePath(lang, page('home')), guide: pagePath(lang, page('guide')),
      lastmod: LM, lastmodLabel: LML, langSwitch: langSwitch(lang, pg), css: CSS, js: JS,
    };
    vars.content = render(TEMPLATES[pg.id], lang, vars);
    vars.head = head(lang, pg, LM);
    const draft = render(TEMPLATES.base, lang, vars);
    const key = pagePath(lang, pg);
    const hash = crypto.createHash('sha256').update(draft).digest('hex').slice(0, 16);
    const date = prevState[key]?.hash === hash ? prevState[key].date : today;
    nextState[key] = { hash, date };
    files.set(path.join(pagePath(lang, pg).slice(1), 'index.html'), draft.split(LM).join(date).split(LML).join(formatDate(lang, date)));
  }
}

function sitemap() {
  const urls = PAGES.flatMap(pg => LANG_CODES.map(lang => {
    const alts = LANG_CODES.map(l => `<xhtml:link rel="alternate" hreflang="${l}" href="${pageUrl(l, pg)}"/>`)
      .concat(`<xhtml:link rel="alternate" hreflang="x-default" href="${pageUrl(X_DEFAULT_LANG, pg)}"/>`);
    const imgs = pg.images.map(src => `<image:image><image:loc>${SITE.origin}${src}</image:loc></image:image>`);
    return ['<url>', `<loc>${pageUrl(lang, pg)}</loc>`, `<lastmod>${nextState[pagePath(lang, pg)].date}</lastmod>`,
      `<changefreq>${pg.changefreq}</changefreq>`, `<priority>${pg.priority}</priority>`, ...alts, ...imgs, '</url>'].join('\n');
  }));
  return '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n' +
    urls.join('\n') + '\n</urlset>\n';
}


function llmsTxt() {
  const en = T.en;
  const crossings = en.crossings.map(c => `${c.iq} ↔ ${c.ir}`).join('; ');
  const lines = [
    `# ${en['brand.name']} (${T.ar['brand.name']})`,
    '',
    `> ${en['org.desc']}`,
    '',
    md(T.ar['org.desc']),
    '',
    md(T.fa['org.desc']),
    '',
    md(T.zh['org.desc']),
    '',
    '## Key facts',
    '',
    '- Office: Zurbatiyah Border Crossing (منفذ زرباطية الحدودي), Badra, Wasit Governorate, Iraq — opposite the Mehran border crossing, Ilam Province, Iran.',
    '- In business since 2015 (11+ years); 3,000+ shipments cleared between Iraq and Iran; average clearance time 3 working days.',
    `- Services: ${[en['svc.t1'], en['svc.t2'], en['svc.transit.t'], en['svc.t3'], en['svc.t4']].join('; ')}.`,
    `- Iraq–Iran land border crossings covered (Iraqi side ↔ Iranian side): ${crossings}.`,
    `- Iranian ports and routes followed: ${en.ports.map(p => p.name).join('; ')}.`,
    '- Phone / WhatsApp: +964 775 168 7406 — https://wa.me/9647751687406',
    `- Email: ${SITE.email}`,
    '- Working hours: Sunday–Thursday, 08:00–17:00 (Iraq time). Quotes within 24 hours.',
    '- Website languages: Arabic, English, Persian (Farsi), Chinese.',
    '',
    '## Pages',
    '',
    ...PAGES.flatMap(pg => LANG_CODES.map(l => `- [${md(T[l][`${pg.id}.seo.title`])}](${pageUrl(l, pg)}): ${md(T[l][`${pg.id}.seo.desc`])}`)),
    '',
    '## FAQ',
    '',
    ...en['home.faq'].flatMap(f => [`### ${f.q}`, '', f.a, '']),
    '## Optional',
    '',
    `- [Full site content in Arabic, English, Persian and Chinese](${SITE.origin}/llms-full.txt)`,
    '',
  ];
  return lines.join('\n');
}

function llmsFullTxt() {
  const sections = LANG_CODES.map(l => {
    const d = T[l];
    return [
      `# ${d['brand.name']} — ${LANGS[l].name} (${pageUrl(l, page('home'))})`,
      '',
      md(d['org.desc']),
      '',
      `## ${d['hero.title1']} ${d['hero.title2']} ${d['hero.title3']}`,
      '',
      md(d['hero.lead']),
      '',
      `## ${d['services.title']}`,
      '',
      ...[['svc.t1', 'svc.d1'], ['svc.t2', 'svc.d2'], ['svc.transit.t', 'svc.transit.d'], ['svc.t3', 'svc.d3'], ['svc.t4', 'svc.d4']].map(([a, b]) => `- **${d[a]}:** ${d[b]}`),
      '',
      `## ${d['iran.title']}`,
      '',
      md(d['iran.sub']),
      '',
      `### ${d['iran.landTitle']}`,
      '',
      ...d.crossings.map(c => `- ${c.iq} ⇄ ${c.ir} — ${c.note}`),
      '',
      `### ${d['iran.portsTitle']}`,
      '',
      ...d.ports.map(p => `- **${p.name}:** ${p.note}`),
      '',
      `## ${d['faq.title']}`,
      '',
      ...d['home.faq'].flatMap(f => [`### ${f.q}`, '', md(f.a), '']),
      `## ${d['guide.h1']} (${pageUrl(l, page('guide'))})`,
      '',
      md(d['guide.summary']),
      '',
      `### ${d['guide.howTitle']}`,
      '',
      md(d['guide.howText']),
      '',
      `### ${d['guide.routesTitle']}`,
      '',
      ...d['guide.routes'].map(r => `- ${r}`),
      '',
      `### ${d['guide.stepsTitle']}`,
      '',
      ...d['guide.steps'].map((s, i) => `${i + 1}. **${s.name}:** ${s.text}`),
      '',
      `### ${d['guide.docsTitle']}`,
      '',
      ...d['guide.docs'].map(x => `- **${x.name}:** ${x.text}`),
      '',
      md(d['guide.docsNote']),
      '',
      `### ${d['guide.timeTitle']}`,
      '',
      md(d['guide.timeText']),
      '',
      `### ${d['guide.tipsTitle']}`,
      '',
      ...d['guide.tips'].map(x => `- ${x}`),
      '',
      ...d['guide.faq'].flatMap(f => [`### ${f.q}`, '', md(f.a), '']),
      `${d['contact.phone.k']}: +964 775 168 7406 · WhatsApp: https://wa.me/9647751687406 · ${SITE.email} · ${md(d['contact.addr.v'])}`,
      '',
    ].join('\n');
  });
  return sections.join('\n---\n\n');
}

files.set('sitemap.xml', sitemap());
files.set('llms.txt', llmsTxt());
files.set('llms-full.txt', llmsFullTxt());

if (errors.length) {
  console.error([...new Set(errors)].join('\n'));
  process.exit(1);
}

let stale = 0;
for (const [rel, content] of files) {
  const abs = path.join(ROOT, rel);
  const current = fs.existsSync(abs) ? fs.readFileSync(abs, 'utf8') : null;
  if (current === content) continue;
  stale++;
  if (CHECK) { console.error(`out of date: ${rel}`); continue; }
  fs.mkdirSync(path.dirname(abs), { recursive: true });
  fs.writeFileSync(abs, content);
  console.log(`wrote ${rel}`);
}
if (CHECK) {
  if (stale) { console.error('Run: node _src/build.mjs'); process.exit(1); }
  console.log('All generated files are up to date.');
} else {
  fs.writeFileSync(STATE_FILE, JSON.stringify(nextState, null, 2) + '\n');
  console.log(stale ? `${stale} file(s) updated.` : 'Nothing changed.');
}
