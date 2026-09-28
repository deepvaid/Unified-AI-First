# Neelam-Store — what the prototype doesn't show yet

The prototype's Neelam-Store is built from what the UAT crawl could see (the admin and the product
search were down from 2026-09-27; see `CRAWL-SUMMARY.md` next to this file, which stays internal).
Nothing below was guessed into the prototype. Each item waits for the crawl that can see it.

## Store admin

| Surface | Prototype today | Waiting on |
|---|---|---|
| General | The shared Overview page; its business information is still the prototype's sample | The General page's fields and values |
| Themes | Current theme card with **Show store**, the installed-themes table, each theme into the builder | **Upload theme** (dialog), the kebab menus (current card and rows), **Themes In Focus**, Lumos's content and styles |
| Pages | FAQs, About Us and abhi1, text as served on the storefront | Their published / updated dates and SEO fields |
| Blogs | None | The blog list (the storefront's `/blogs` failed during the outage) |
| Policies | Privacy and refund policies are stored and served on the storefront | The admin Policies page (list and editor) |
| Navigation | No menus listed | The menus behind the header and footer; the storefront draws its links from `useStorefront` meanwhile |
| Campaigns, Assets | Empty | Their lists |
| Integrations, Store Settings | Not built | Every card, including Payments and Checkout |
| Store switcher | Shows the prototype's web stores | The account's real store list |
| Merchandising | Off for this store | The storefront's search runs on Merch Cloud; its data wasn't readable |

## Storefront

| Surface | Prototype today | Waiting on |
|---|---|---|
| Home | Header, image banner, Featured Collections (looping, one dot per card), footer with newsletter — as crawled | The banner and card photographs (placeholders stand in; nothing is downloaded from the store) and the logo artwork (its wordmark stands in) |
| Pages and policies | Breadcrumb, title and body as served | The title band's styling |
| Newsletter | Validates like the store (email + consent), shows "Subscribing..." | The success message |
| Collections, products, search, login, wishlist | Links land on the storefront's 404 page | Product data (the search service returned errors) |
| Cart | The empty cart | Products to add; then the line items and summary (their wording is in the crawl) |
| Checkout | Not built | A cart, then the checkout up to the payment step — Maropay then takes the payment there instead of the checkout preview |

## Prototype stand-ins

- The account is the prototype's demo account (2000290 stands in for UAT 116000); the storefront
  address follows the real pattern `{account}-{store}.uat.maropost.store`.
- The store sells in AUD on UAT; the prototype's catalogue and Maropay account are USD. Decide when the
  checkout is built.
