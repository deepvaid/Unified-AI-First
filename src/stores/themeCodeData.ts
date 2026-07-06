// Mock theme code files — the seed data behind the "Edit Code" IDE surface.
// Mirrors a real Maropost storefront theme: layouts/ (Go-template shells) and
// templates/ (per-page HTML + JSON section config). Prototype only — this is
// static seed content, not a real theme repo.

export interface ThemeCodeFile {
  /** Repo-relative path, e.g. "templates/404/default.html". */
  path: string
  language: 'html' | 'json'
  content: string
}

// ── Seed files ────────────────────────────────────────────────────────────────
// Content is realistic-looking template markup / JSON, not functional. Keep it
// plausible: HTML files use Go-template `{{ }}` syntax; JSON files are small
// section configs.

export const themeCodeFiles: ThemeCodeFile[] = [
  // ── layouts/ ──────────────────────────────────────────────────────────────
  {
    path: 'layouts/theme.html',
    language: 'html',
    content: `{{ define "layout" }}
<!doctype html>
<html lang="{{ .Store.Locale }}">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>{{ .Page.Title }} · {{ .Store.Name }}</title>
    <link rel="stylesheet" href="{{ asset "theme.css" }}" />
    {{ block "head" . }}{{ end }}
  </head>
  <body class="template-{{ .Template.Type }}">
    {{ section "header" . }}
    <main id="main-content" role="main">
      {{ block "content" . }}{{ end }}
    </main>
    {{ section "footer" . }}
    <script src="{{ asset "theme.js" }}" defer></script>
  </body>
</html>
{{ end }}`,
  },
  {
    path: 'layouts/checkout.html',
    language: 'html',
    content: `{{ define "layout" }}
<!doctype html>
<html lang="{{ .Store.Locale }}">
  <head>
    <meta charset="utf-8" />
    <title>Checkout · {{ .Store.Name }}</title>
    <link rel="stylesheet" href="{{ asset "checkout.css" }}" />
  </head>
  <body class="template-checkout">
    <header class="checkout__header">
      <a href="/" class="checkout__logo">{{ .Store.Name }}</a>
    </header>
    {{ block "content" . }}{{ end }}
  </body>
</html>
{{ end }}`,
  },

  // ── templates/home ──────────────────────────────────────────────────────────
  {
    path: 'templates/home/default.html',
    language: 'html',
    content: `{{ define "content" }}
<div class="page-home">
  {{ range .Sections }}
    <section class="section section--{{ .Type }}" data-section-id="{{ .Id }}">
      {{ if eq .Type "hero" }}
        <div class="hero" style="background-image:url('{{ .Settings.image }}')">
          <h1 class="hero__title">{{ .Settings.heading }}</h1>
          <p class="hero__subtitle">{{ .Settings.subheading }}</p>
          <a href="{{ .Settings.ctaLink }}" class="btn btn--primary">
            {{ .Settings.ctaLabel }}
          </a>
        </div>
      {{ else if eq .Type "featured-products" }}
        <div class="featured">
          <h2>{{ .Settings.title }}</h2>
          <ul class="product-grid">
            {{ range .Products }}
              {{ include "snippets/product-card" . }}
            {{ end }}
          </ul>
        </div>
      {{ else }}
        {{ include (printf "sections/%s" .Type) . }}
      {{ end }}
    </section>
  {{ end }}
</div>
{{ end }}`,
  },
  {
    path: 'templates/home/default.json',
    language: 'json',
    content: `{
  "sections": {
    "hero": {
      "type": "hero",
      "settings": {
        "heading": "New season, new gear",
        "subheading": "Shop the Fall 26 collection",
        "ctaLabel": "Shop now",
        "ctaLink": "/collections/all",
        "image": "assets/hero-fall26.jpg"
      }
    },
    "featured": {
      "type": "featured-products",
      "settings": {
        "title": "Trending now",
        "collection": "featured",
        "limit": 8
      }
    }
  },
  "order": ["hero", "featured"]
}`,
  },

  // ── templates/header ──────────────────────────────────────────────────────
  {
    path: 'templates/header/default.html',
    language: 'html',
    content: `{{ define "content" }}
<header class="site-header">
  <div class="site-header__inner">
    <a href="/" class="site-header__logo">
      {{ if .Settings.logo }}
        <img src="{{ .Settings.logo }}" alt="{{ .Store.Name }}" />
      {{ else }}
        <span>{{ .Store.Name }}</span>
      {{ end }}
    </a>
    <nav class="site-nav" aria-label="Primary">
      {{ range .Menu.Items }}
        <a href="{{ .Url }}" class="site-nav__link">{{ .Title }}</a>
      {{ end }}
    </nav>
    <div class="site-header__actions">
      <a href="/search" aria-label="Search">{{ icon "search" }}</a>
      <a href="/cart" aria-label="Cart">{{ icon "cart" }} <span>{{ .Cart.Count }}</span></a>
    </div>
  </div>
</header>
{{ end }}`,
  },
  {
    path: 'templates/header/default.json',
    language: 'json',
    content: `{
  "settings": {
    "logo": "assets/logo.svg",
    "sticky": true,
    "menu": "main-menu",
    "showSearch": true,
    "showCart": true
  }
}`,
  },

  // ── templates/footer ──────────────────────────────────────────────────────
  {
    path: 'templates/footer/default.json',
    language: 'json',
    content: `{
  "settings": {
    "menu": "footer-menu",
    "showNewsletter": true,
    "newsletterHeading": "Join our list",
    "copyright": "© {{ year }} Atlas Outfitters",
    "socialLinks": [
      { "platform": "instagram", "url": "https://instagram.com/atlas" },
      { "platform": "tiktok", "url": "https://tiktok.com/@atlas" }
    ]
  }
}`,
  },

  // ── templates/cart ─────────────────────────────────────────────────────────
  {
    path: 'templates/cart/default.json',
    language: 'json',
    content: `{
  "settings": {
    "showTaxNote": true,
    "enableNotes": true,
    "checkoutLabel": "Proceed to checkout",
    "emptyMessage": "Your cart is empty.",
    "recommendations": {
      "enabled": true,
      "engine": "frequently-bought-together"
    }
  }
}`,
  },

  // ── templates/collection ────────────────────────────────────────────────────
  {
    path: 'templates/collection/default.json',
    language: 'json',
    content: `{
  "settings": {
    "productsPerPage": 24,
    "showFilters": true,
    "defaultSort": "best-selling",
    "sortOptions": ["best-selling", "price-asc", "price-desc", "newest"],
    "showBreadcrumbs": true
  }
}`,
  },

  // ── templates/account ───────────────────────────────────────────────────────
  {
    path: 'templates/account/default.json',
    language: 'json',
    content: `{
  "settings": {
    "showOrderHistory": true,
    "showAddresses": true,
    "showWishlist": false,
    "ordersPerPage": 10
  }
}`,
  },

  // ── templates/login ─────────────────────────────────────────────────────────
  {
    path: 'templates/login/default.json',
    language: 'json',
    content: `{
  "settings": {
    "heading": "Log in",
    "showGuestCheckout": true,
    "enableSocialLogin": false,
    "registerPrompt": "New here? Create an account"
  }
}`,
  },
  {
    path: 'templates/login/schema.json',
    language: 'json',
    content: `{
  "name": "Login",
  "settings": [
    { "id": "heading", "type": "text", "label": "Heading", "default": "Log in" },
    { "id": "showGuestCheckout", "type": "checkbox", "label": "Allow guest checkout", "default": true },
    { "id": "enableSocialLogin", "type": "checkbox", "label": "Social login", "default": false },
    { "id": "registerPrompt", "type": "text", "label": "Register prompt" }
  ]
}`,
  },

  // ── templates/404 ─────────────────────────────────────────────────────────
  {
    path: 'templates/404/default.html',
    language: 'html',
    content: `{{ define "content" }}
{{ end }}`,
  },
  {
    path: 'templates/404/default.json',
    language: 'json',
    content: `{
  "settings": {
    "heading": "Page not found",
    "message": "The page you're looking for doesn't exist.",
    "ctaLabel": "Back to home",
    "ctaLink": "/"
  }
}`,
  },

  // ── templates/500 ─────────────────────────────────────────────────────────
  {
    path: 'templates/500/default.html',
    language: 'html',
    content: `{{ define "content" }}
<div class="page-error">
  <h1>{{ .Settings.heading }}</h1>
  <p>{{ .Settings.message }}</p>
  <a href="{{ .Settings.ctaLink }}" class="btn">{{ .Settings.ctaLabel }}</a>
</div>
{{ end }}`,
  },
  {
    path: 'templates/500/default.json',
    language: 'json',
    content: `{
  "settings": {
    "heading": "Something went wrong",
    "message": "We hit an unexpected error. Please try again.",
    "ctaLabel": "Reload",
    "ctaLink": "/"
  }
}`,
  },

  // ── templates/blogs + blogpost ──────────────────────────────────────────────
  {
    path: 'templates/blogs/default.json',
    language: 'json',
    content: `{
  "settings": {
    "postsPerPage": 12,
    "showExcerpt": true,
    "showAuthor": true,
    "showDate": true,
    "layout": "grid"
  }
}`,
  },
  {
    path: 'templates/blogpost/default.json',
    language: 'json',
    content: `{
  "settings": {
    "showAuthor": true,
    "showDate": true,
    "showShareButtons": true,
    "showRelated": true,
    "relatedLimit": 3
  }
}`,
  },
]

// ── Tree helper ──────────────────────────────────────────────────────────────
// Group files by their top-level folder (the segment before the first slash),
// preserving seed order within each group. Used by the Explorer panel.

export interface ThemeCodeFolder {
  name: string
  files: ThemeCodeFile[]
}

export function groupFilesByFolder(files: ThemeCodeFile[]): ThemeCodeFolder[] {
  const order: string[] = []
  const map = new Map<string, ThemeCodeFile[]>()
  for (const file of files) {
    const folder = file.path.split('/')[0] ?? ''
    if (!map.has(folder)) {
      map.set(folder, [])
      order.push(folder)
    }
    map.get(folder)!.push(file)
  }
  return order.map((name) => ({ name, files: map.get(name)! }))
}

/** Leaf label for a file row: the path minus its top-level folder. */
export function fileLeafLabel(path: string): string {
  const idx = path.indexOf('/')
  return idx === -1 ? path : path.slice(idx + 1)
}
