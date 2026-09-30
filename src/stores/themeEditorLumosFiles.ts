// Lumos theme file tree — the seed behind the theme code editor (store builder re-skin,
// docs/rebuild/theme-editor-reskin/README.md). Folder and file names are as crawled from UAT
// (store #9 neelam-store, theme Lumos, 2026-09-30). Contents are plausible stand-ins generated
// per file kind — Go-template HTML, section/block schemas, theme settings — not the real
// theme source, which the admin never exposes as a bundle.

export type ThemeEditorLanguage = 'html' | 'json' | 'css' | 'javascript' | 'text' | 'image'

export interface ThemeEditorFile {
  /** Theme-relative path, e.g. "templates/home/default.json" or "assets/css/theme.css". */
  path: string
  language: ThemeEditorLanguage
  content: string
}

/** Top-level folders in the order the UAT explorer lists them. */
export const LUMOS_FOLDERS = [
  'layouts',
  'templates',
  'sections',
  'sections_wip',
  'blocks',
  'snippets',
  'config',
  'assets',
  'locales',
] as const
export type LumosFolder = (typeof LUMOS_FOLDERS)[number]

/** The 25 page templates of the theme, in explorer order. */
export const TEMPLATE_NAMES = [
  '404', '500', 'addresses', 'blogpost', 'cart', 'collection', 'edit_profile', 'footer',
  'forgot_password', 'header', 'home', 'login', 'order', 'order_confirmation', 'order_summary',
  'orders', 'page', 'policy', 'product', 'profile', 'reset_password', 'search', 'sign_out',
  'signup', 'wishlist',
]

const SECTION_NAMES = [
  'addresses', 'benefits', 'blog', 'blogpost', 'brands', 'cart', 'category-grid', 'collection',
  'default', 'edit_profile', 'error-404', 'error-500', 'featured-collections-grid',
  'featured-collections-slider', 'featured-products', 'footer', 'forgot_password', 'header',
  'hero', 'image-banner-with-cta', 'image-banner', 'login', 'multi-column-horizontal-items',
  'multi-column', 'newsletter', 'order-confirmation', 'order-details', 'orders', 'page',
  'policy', 'product', 'profile', 'reset_password', 'search', 'sign_out', 'signup', 'wishlist',
]

const SECTION_WIP_NAMES = ['hero-video', 'lookbook', 'product-bundle']

const BLOCK_NAMES = [
  'address-card', 'brand-logo', 'category-card', 'collection-card', 'cta-buttons', 'heading-tag',
  'heading', 'hero-stat', 'hero-trust-bar', 'image-multi-column', 'image', 'info-banner-block',
  'info-card-horizontal', 'info-card', 'info-list', 'login', 'newsletter', 'order-address-block',
  'order-payment-summary-block', 'order-products-block', 'order-summary-block', 'product-card',
  'recommendation', 'return-refund-block', 'rich-content', 'search-input', 'testimonial-card',
  'text-heading',
]

const SNIPPET_FILES = [
  'CartItem.html', 'account-breadcrumbs.html', 'account-sidebar.html', 'breadcrumbs.html',
  'pagination.html', 'price.html', 'product-badge.html', 'rating.html', 'social-icons.html',
  'toast.html',
]

const CONFIG_FILES = ['settings_data.json', 'settings_schema.json']

const CSS_FILES = [
  'account', 'base', 'blog', 'cart', 'checkout', 'collection', 'footer', 'header', 'hero',
  'layout', 'modal', 'multicolumn', 'order-confirmation', 'order-summary', 'orders',
  'product-details', 'recommendation', 'search', 'styles-to-remove', 'swiper.min', 'tailwind',
  'theme', 'typography',
].map((name) => `css/${name}.css`)

const IMAGE_FILES = [
  'Frame_6318_1.webp', 'afterpay.svg', 'arrow-back.svg', 'arrow-icon-expand.svg', 'arrow.svg',
  'auth-side.png', 'banner-1.webp', 'banner1.webp', 'banner2.webp', 'basket.svg',
  'brand-appel-shop.png', 'brand-artifox.png', 'brand-benchmade-modern.png', 'brand-castlery.png',
  'brand-floyd.png', 'brand-frontgate.png', 'brand-novogratz-alt.png', 'brand-novogratz.png',
  'brand-serena-lily.png', 'brand-stickley.png', 'brand-vermont-woods.png', 'camera.png',
  'car-image-1.webp', 'car-image-2.webp', 'car-image-3.webp', 'car1.webp', 'car2.webp',
  'facebook-icon.svg', 'instagram-icon.svg', 'logo.svg', 'mastercard.svg', 'paypal.svg',
  'search-icon.svg', 'tesla.svg', 'twitter-header-icon.svg', 'visa.svg', 'warning.svg',
  'wishlist-close-selected.svg', 'wishlist-header-icon.svg', 'wishlist-mobile-back-arrow.svg',
  'wishlist-mobile-close.svg', 'zip.svg',
].map((name) => `images/${name}`)

const JS_FILES = [
  'account', 'addresses', 'autocomplete', 'blog-list', 'carousel', 'cart', 'filters',
  'font-loader', 'forgot-password', 'htmx.min', 'lazy-loading', 'lazy-pagination', 'magnify',
  'menu', 'nav-drawer', 'newsletter', 'orders', 'product', 'recommendation', 'reset-password',
  'search', 'signin', 'signup', 'sorting', 'store', 'swiper.min', 'toast', 'wishlist',
].map((name) => `js/${name}.js`)

const LOCALE_FILES = [
  'en-GB.json', 'en-US.json', 'en.json', 'ru-RU.json', 'ru.json', 'schema.en.json',
  'schema.ru.json', 'schema.uk.json', 'system.en.json', 'system.ru.json', 'system.uk.json',
  'ua-UA.json', 'ua.json', 'uk.json',
]

const pairs = (names: string[]) => names.flatMap((name) => [`${name}.html`, `${name}.json`])

/** Files per top-level folder, as the explorer shows them (label = path minus the folder). */
export const LUMOS_TREE: Record<LumosFolder, string[]> = {
  layouts: ['auth.html', 'default.html', 'search.html'],
  // The two error templates also carry an HTML override; the rest are JSON section configs only.
  templates: TEMPLATE_NAMES.flatMap((name) =>
    name === '404' || name === '500' ? [`${name}/default.html`, `${name}/default.json`] : [`${name}/default.json`],
  ),
  sections: pairs(SECTION_NAMES),
  sections_wip: pairs(SECTION_WIP_NAMES),
  blocks: pairs(BLOCK_NAMES),
  snippets: SNIPPET_FILES,
  config: CONFIG_FILES,
  assets: [...CSS_FILES, ...IMAGE_FILES, ...JS_FILES],
  locales: LOCALE_FILES,
}

// ── Labels ────────────────────────────────────────────────────────────────────

const TEMPLATE_LABEL_OVERRIDES: Record<string, string> = {
  '404': '404 Not Found',
  '500': '500 Server Error',
  blogpost: 'Blog Post',
  sign_out: 'Sign Out',
}

/** "order_confirmation" → "Order Confirmation", "featured-collections-grid" → "Featured Collections Grid". */
export function humanize(name: string): string {
  return name
    .replace(/\.[a-z0-9]+$/i, '')
    .split(/[-_/]/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function templateLabel(name: string): string {
  return TEMPLATE_LABEL_OVERRIDES[name] ?? humanize(name)
}

/** Top-level folder of a path, or undefined for a root file. */
export function folderOf(path: string): string | undefined {
  const index = path.indexOf('/')
  return index === -1 ? undefined : path.slice(0, index)
}

/** The explorer label: the path minus its top-level folder ("templates/home/default.json" → "home/default.json"). */
export function fileLabel(path: string): string {
  const index = path.indexOf('/')
  return index === -1 ? path : path.slice(index + 1)
}

export function languageFor(path: string): ThemeEditorLanguage {
  const ext = path.slice(path.lastIndexOf('.') + 1).toLowerCase()
  if (ext === 'html') return 'html'
  if (ext === 'json') return 'json'
  if (ext === 'css') return 'css'
  if (ext === 'js') return 'javascript'
  if (['svg', 'png', 'webp', 'jpg', 'jpeg', 'gif'].includes(ext)) return 'image'
  return 'text'
}

// ── Content generators ────────────────────────────────────────────────────────

const HOME_SECTION_ORDER = ['hero', 'category-grid', 'brands', 'featured-products', 'multi-column']

function layoutContent(name: string): string {
  if (name === 'default.html') {
    return `<!DOCTYPE html>
{{ $settings := theme_settings }}
<html lang="{{ if $settings.locale }}{{ $settings.locale }}{{ else }}en{{ end }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ block "title" . }}{{ $settings.store_name }}{{ end }}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="stylesheet" href="{{ asset "css/tailwind.css" }}">
  <link rel="stylesheet" href="{{ asset "css/theme.css" }}">
  <link rel="stylesheet" href="{{ asset "css/typography.css" }}">
  <script src="{{ asset "js/htmx.min.js" }}" defer></script>
  <script src="{{ asset "js/font-loader.js" }}" defer></script>
  {{ block "head" . }}{{ end }}
</head>
<body class="template-{{ .Template.Type }}" data-store="{{ $settings.store_name }}">
  {{ section "header" . }}
  <main id="main" class="site-main">
    {{ block "content" . }}{{ end }}
  </main>
  {{ section "footer" . }}
  {{ snippet "toast" . }}
  <script src="{{ asset "js/store.js" }}" defer></script>
</body>
</html>
`
  }
  if (name === 'auth.html') {
    return `<!DOCTYPE html>
{{ $settings := theme_settings }}
<html lang="{{ $settings.locale | default "en" }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ block "title" . }}{{ $settings.store_name }}{{ end }}</title>
  <link rel="stylesheet" href="{{ asset "css/tailwind.css" }}">
  <link rel="stylesheet" href="{{ asset "css/theme.css" }}">
  <link rel="stylesheet" href="{{ asset "css/account.css" }}">
</head>
<body class="template-auth">
  <div class="auth-layout">
    <aside class="auth-layout__side">
      <img src="{{ asset "images/auth-side.png" }}" alt="">
    </aside>
    <main id="main" class="auth-layout__main">
      <a class="auth-layout__logo" href="/">
        <img src="{{ asset "images/logo.svg" }}" alt="{{ $settings.store_name }}">
      </a>
      {{ block "content" . }}{{ end }}
    </main>
  </div>
  {{ snippet "toast" . }}
</body>
</html>
`
  }
  return `<!DOCTYPE html>
{{ $settings := theme_settings }}
<html lang="{{ $settings.locale | default "en" }}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{{ block "title" . }}Search · {{ $settings.store_name }}{{ end }}</title>
  <link rel="stylesheet" href="{{ asset "css/tailwind.css" }}">
  <link rel="stylesheet" href="{{ asset "css/theme.css" }}">
  <link rel="stylesheet" href="{{ asset "css/search.css" }}">
  <script src="{{ asset "js/htmx.min.js" }}" defer></script>
</head>
<body class="template-search">
  {{ section "header" . }}
  <main id="main" class="site-main site-main--search"
        hx-get="{{ .Request.Path }}" hx-trigger="filters-changed from:body" hx-target="#results">
    {{ block "content" . }}{{ end }}
  </main>
  {{ section "footer" . }}
  <script src="{{ asset "js/search.js" }}" defer></script>
</body>
</html>
`
}

function templateJson(name: string): string {
  const label = templateLabel(name)
  const sectionNames = name === 'home' ? HOME_SECTION_ORDER : [name.replace(/_/g, '-')]
  const sections = Object.fromEntries(
    sectionNames.map((section, index) => [
      `${section}-${index + 1}`,
      { type: section, settings: index === 0 ? { color_scheme: 'default' } : {} },
    ]),
  )
  return `${JSON.stringify(
    {
      id: 'default',
      label,
      layout: name === 'search' ? 'search' : ['login', 'signup', 'forgot_password', 'reset_password'].includes(name) ? 'auth' : 'default',
      sections,
      order: Object.keys(sections),
    },
    null,
    2,
  )}\n`
}

function templateHtml(name: string): string {
  if (name === '404') return '{{ define "content" }}\n{{ end }}\n'
  return `{{ define "content" }}
<section class="error-page error-page--500">
  <h1>{{ t "system.errors.server_error_title" }}</h1>
  <p>{{ t "system.errors.server_error_body" }}</p>
  <a class="btn btn--primary" href="/">{{ t "general.back_home" }}</a>
</section>
{{ end }}
`
}

function sectionHtml(name: string): string {
  const label = humanize(name)
  return `{{ define "section:${name}" }}
{{ $s := .Settings }}
<section class="section section--${name} color-scheme-{{ $s.color_scheme | default "default" }}"
         data-section-id="{{ .Id }}" data-section-type="${name}">
  <div class="container section__inner text-{{ $s.alignment | default "left" }}">
    {{ if $s.heading }}
      <h2 class="section__heading">{{ $s.heading }}</h2>
    {{ else }}
      <h2 class="section__heading">${label}</h2>
    {{ end }}
    <div class="section__blocks">
      {{ range .Blocks }}
        {{ block .Type . }}
      {{ end }}
    </div>
  </div>
</section>
{{ end }}
`
}

function sectionJson(name: string): string {
  const label = humanize(name)
  return `${JSON.stringify(
    {
      name: label,
      tag: 'section',
      class: `section-${name}`,
      settings: [
        { type: 'text', id: 'heading', label: 'Heading', default: label },
        { type: 'select', id: 'alignment', label: 'Content alignment', options: ['left', 'center', 'right'], default: 'left' },
        { type: 'color_scheme', id: 'color_scheme', label: 'Color scheme', default: 'default' },
        { type: 'range', id: 'padding_top', label: 'Top padding', min: 0, max: 96, step: 8, unit: 'px', default: 48 },
        { type: 'range', id: 'padding_bottom', label: 'Bottom padding', min: 0, max: 96, step: 8, unit: 'px', default: 48 },
      ],
      blocks: [
        { type: 'heading', name: 'Heading' },
        { type: 'rich-content', name: 'Rich content' },
        { type: 'cta-buttons', name: 'CTA buttons' },
      ],
      max_blocks: 12,
      presets: [{ name: label, blocks: [{ type: 'heading' }] }],
    },
    null,
    2,
  )}\n`
}

function blockHtml(name: string): string {
  return `{{ define "block:${name}" }}
{{ $b := .Settings }}
<div class="block block--${name}" data-block-id="{{ .Id }}">
  {{ if $b.title }}<h3 class="block__title">{{ $b.title }}</h3>{{ end }}
  {{ if $b.text }}<div class="block__text rte">{{ $b.text | safe }}</div>{{ end }}
  {{ if $b.link }}<a class="block__link" href="{{ $b.link }}">{{ $b.link_label | default "Learn more" }}</a>{{ end }}
</div>
{{ end }}
`
}

function blockJson(name: string): string {
  const label = humanize(name)
  return `${JSON.stringify(
    {
      name: label,
      settings: [
        { type: 'text', id: 'title', label: 'Title', default: label },
        { type: 'richtext', id: 'text', label: 'Text' },
        { type: 'url', id: 'link', label: 'Link' },
        { type: 'text', id: 'link_label', label: 'Link label', default: 'Learn more' },
      ],
    },
    null,
    2,
  )}\n`
}

function snippetHtml(name: string): string {
  const id = name.replace(/\.html$/, '')
  return `{{ define "snippet:${id}" }}
<div class="${id.toLowerCase()}">
  {{/* ${humanize(id)} partial — rendered with {{ snippet "${id}" . }} */}}
  {{ range $k, $v := .Props }}<span data-{{ $k }}="{{ $v }}"></span>{{ end }}
</div>
{{ end }}
`
}

function configJson(name: string): string {
  if (name === 'settings_schema.json') {
    return `${JSON.stringify(
      [
        { name: 'theme_info', theme_name: 'Lumos', theme_version: '1.4.0', theme_author: 'Maropost' },
        {
          name: 'Logo',
          settings: [
            { type: 'image_picker', id: 'logo', label: 'Image' },
            { type: 'url', id: 'logo_link', label: 'Logo link', default: '/' },
            { type: 'text', id: 'store_name', label: 'Store name' },
            { type: 'textarea', id: 'store_description', label: 'Store description' },
            { type: 'text', id: 'locale', label: 'Language code', default: 'en' },
          ],
        },
        {
          name: 'Theme Colors',
          settings: [{ type: 'color_scheme_group', id: 'color_schemes', label: 'Color schemes' }],
        },
        {
          name: 'Typography',
          settings: [{ type: 'font_scheme_group', id: 'font_schemes', label: 'Font schemes' }],
        },
        {
          name: 'Buttons',
          settings: [
            { type: 'range', id: 'button_radius', label: 'Corner radius', min: 0, max: 24, step: 2, unit: 'px', default: 8 },
            { type: 'select', id: 'button_style', label: 'Style', options: ['solid', 'outline'], default: 'solid' },
          ],
        },
      ],
      null,
      2,
    )}\n`
  }
  return `${JSON.stringify(
    {
      current: {
        logo: 'images/logo.svg',
        logo_link: '/',
        store_name: 'Furniture & Home',
        store_description:
          "Quality furniture and home furnishings. Shop living room, bedroom, dining, office and outdoor — design the space you'll love.",
        locale: 'en',
        color_schemes: {
          default: { background: '#FFFFFF', text: '#1F2937', primary: '#5B5FC7', secondary: '#EEF0FB' },
          dark: { background: '#0B0B0B', text: '#FFFFFF', primary: '#FFFFFF', secondary: '#9CA3AF' },
          modern: { background: '#FFF5F2', text: '#1F2937', primary: '#F4A582', secondary: '#111111' },
        },
        font_schemes: {
          default: { heading: 'Inter', body: 'Inter', base_size: 16 },
        },
        button_radius: 8,
        button_style: 'solid',
      },
    },
    null,
    2,
  )}\n`
}

function cssContent(name: string): string {
  const base = name.replace(/^css\//, '').replace(/\.css$/, '')
  if (base === 'tailwind') {
    return `/*! tailwindcss v3.4.13 | MIT License | https://tailwindcss.com — generated bundle, edit theme.css instead */
*,::before,::after{box-sizing:border-box;border-width:0;border-style:solid;border-color:#e5e7eb}
html{line-height:1.5;-webkit-text-size-adjust:100%;tab-size:4;font-family:var(--font-body),ui-sans-serif,system-ui,sans-serif}
body{margin:0;line-height:inherit}
.container{width:100%;margin-left:auto;margin-right:auto;padding-left:1rem;padding-right:1rem}
@media (min-width:1100px){.container{max-width:1100px}}
.flex{display:flex}.grid{display:grid}.hidden{display:none}.items-center{align-items:center}.justify-between{justify-content:space-between}
.gap-4{gap:1rem}.gap-8{gap:2rem}.text-center{text-align:center}.font-semibold{font-weight:600}.uppercase{text-transform:uppercase}
`
  }
  if (base === 'swiper.min') {
    return `/** Swiper 11.1.14 — MIT License — https://swiperjs.com (minified vendor bundle) */
.swiper{margin-left:auto;margin-right:auto;position:relative;overflow:hidden;list-style:none;padding:0;z-index:1;display:block}.swiper-wrapper{position:relative;width:100%;height:100%;z-index:1;display:flex;transition-property:transform;box-sizing:content-box}.swiper-slide{flex-shrink:0;width:100%;height:100%;position:relative;transition-property:transform;display:block}.swiper-button-next,.swiper-button-prev{position:absolute;top:50%;width:44px;height:44px;margin-top:-22px;z-index:10;cursor:pointer;display:flex;align-items:center;justify-content:center}
`
  }
  if (base === 'theme') {
    return `/* Lumos — theme-level custom properties. Section styles live beside their section (css/hero.css …). */
:root {
  --color-background: #ffffff;
  --color-text: #1f2937;
  --color-primary: #5b5fc7;
  --color-secondary: #eef0fb;
  --color-announcement: #5b5fc7;
  --font-heading: 'Inter', system-ui, sans-serif;
  --font-body: 'Inter', system-ui, sans-serif;
  --base-font-size: 16px;
  --button-radius: 8px;
  --card-radius: 12px;
  --container-max: 1100px;
}

body {
  background: var(--color-background);
  color: var(--color-text);
  font-family: var(--font-body);
  font-size: var(--base-font-size);
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: var(--button-radius);
  font-weight: 600;
  transition: background 150ms ease, color 150ms ease;
}

.btn--primary { background: var(--color-primary); color: #fff; }
.btn--primary:hover { background: color-mix(in srgb, var(--color-primary) 88%, #000); }
.btn--secondary { background: transparent; color: var(--color-text); border: 1px solid currentColor; }

.section { padding-block: var(--section-padding-top, 48px) var(--section-padding-bottom, 48px); }
.section__heading { font-family: var(--font-heading); font-size: 2rem; letter-spacing: -0.01em; }
`
  }
  return `/* ${humanize(base)} */
.${base} {
  position: relative;
  padding-block: var(--section-padding, 48px);
}

.${base}__inner {
  display: grid;
  gap: 1.5rem;
}

.${base}__heading {
  font-family: var(--font-heading);
  font-size: clamp(1.5rem, 2.5vw, 2.25rem);
  line-height: 1.15;
}

@media (min-width: 768px) {
  .${base}__inner {
    grid-template-columns: repeat(var(--${base}-columns, 3), minmax(0, 1fr));
  }
}
`
}

function jsContent(name: string): string {
  const base = name.replace(/^js\//, '').replace(/\.js$/, '')
  if (base === 'htmx.min') {
    return `/*! htmx 2.0.4 — BSD-2-Clause — https://htmx.org (minified vendor bundle; edit the source, not this file) */
(function(e,t){if(typeof define==="function"&&define.amd){define([],t)}else if(typeof module==="object"&&module.exports){module.exports=t()}else{e.htmx=e.htmx||t()}})(typeof self!=="undefined"?self:this,function(){return{version:"2.0.4",config:{historyEnabled:true,defaultSwapStyle:"innerHTML",timeout:0,scrollBehavior:"instant"},process:function(e){}}});
`
  }
  if (base === 'swiper.min') {
    return `/** Swiper 11.1.14 — MIT License — https://swiperjs.com (minified vendor bundle) */
!function(e,t){"object"==typeof exports&&"undefined"!=typeof module?module.exports=t():"function"==typeof define&&define.amd?define(t):(e="undefined"!=typeof globalThis?globalThis:e||self).Swiper=t()}(this,function(){"use strict";class Swiper{constructor(e,t){this.el=e;this.params=t||{};this.init()}init(){}slideNext(){}slidePrev(){}}return Swiper});
`
  }
  const camel = base.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())
  return `// ${humanize(base)} — progressive enhancement over the server-rendered markup.
(function () {
  const root = document.querySelector('[data-${base}]');
  if (!root) return;

  const state = { busy: false };

  function ${camel}Init() {
    root.addEventListener('click', (event) => {
      const trigger = event.target.closest('[data-${base}-action]');
      if (!trigger || state.busy) return;
      state.busy = true;
      root.dispatchEvent(new CustomEvent('${base}:action', { bubbles: true, detail: trigger.dataset }));
      window.setTimeout(() => { state.busy = false; }, 150);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', ${camel}Init);
  } else {
    ${camel}Init();
  }
})();
`
}

function localeJson(name: string): string {
  const lang = name.startsWith('ru') || name.includes('.ru.') ? 'ru' : name.startsWith('ua') || name.startsWith('uk') || name.includes('.uk.') ? 'uk' : 'en'
  const isSchema = name.startsWith('schema.')
  const isSystem = name.startsWith('system.')
  const strings = {
    en: { search: 'Search', cart: 'Cart', add_to_cart: 'Add to cart', back_home: 'Back to home', server_error_title: 'Something went wrong', server_error_body: 'Please try again in a moment.', newsletter: 'Subscribe to our newsletter' },
    ru: { search: 'Поиск', cart: 'Корзина', add_to_cart: 'В корзину', back_home: 'На главную', server_error_title: 'Что-то пошло не так', server_error_body: 'Попробуйте ещё раз через минуту.', newsletter: 'Подпишитесь на рассылку' },
    uk: { search: 'Пошук', cart: 'Кошик', add_to_cart: 'Додати в кошик', back_home: 'На головну', server_error_title: 'Щось пішло не так', server_error_body: 'Спробуйте ще раз за хвилину.', newsletter: 'Підпишіться на розсилку' },
  }[lang]
  if (isSchema) {
    return `${JSON.stringify(
      { sections: { hero: { name: 'Hero Banner', settings: { alignment: { label: 'Content alignment' } } }, 'category-grid': { name: 'Categories' } }, blocks: { heading: { name: 'Heading' }, 'cta-buttons': { name: 'CTA Buttons' } } },
      null,
      2,
    )}\n`
  }
  if (isSystem) {
    return `${JSON.stringify({ errors: { server_error_title: strings.server_error_title, server_error_body: strings.server_error_body, not_found: '404' }, general: { back_home: strings.back_home } }, null, 2)}\n`
  }
  return `${JSON.stringify(
    { general: { search: strings.search, cart: strings.cart, back_home: strings.back_home }, products: { add_to_cart: strings.add_to_cart }, newsletter: { title: strings.newsletter } },
    null,
    2,
  )}\n`
}

function contentFor(folder: LumosFolder, name: string): string {
  switch (folder) {
    case 'layouts':
      return layoutContent(name)
    case 'templates': {
      const [template, file] = name.split('/')
      return file === 'default.html' ? templateHtml(template ?? '') : templateJson(template ?? '')
    }
    case 'sections':
    case 'sections_wip':
      return name.endsWith('.json') ? sectionJson(name.replace(/\.json$/, '')) : sectionHtml(name.replace(/\.html$/, ''))
    case 'blocks':
      return name.endsWith('.json') ? blockJson(name.replace(/\.json$/, '')) : blockHtml(name.replace(/\.html$/, ''))
    case 'snippets':
      return snippetHtml(name)
    case 'config':
      return configJson(name)
    case 'assets':
      if (name.startsWith('css/')) return cssContent(name)
      if (name.startsWith('js/')) return jsContent(name)
      return ''
    case 'locales':
      return localeJson(name)
  }
}

/** The full Lumos working set — one entry per file in {@link LUMOS_TREE}. */
export function buildLumosFiles(): ThemeEditorFile[] {
  return LUMOS_FOLDERS.flatMap((folder) =>
    LUMOS_TREE[folder].map((name) => ({
      path: `${folder}/${name}`,
      language: languageFor(name),
      content: contentFor(folder, name),
    })),
  )
}
