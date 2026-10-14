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
| Collections and products | **Stand-ins (5 Oct 2026):** `/collections/:handle` (`all` = everything) and `/products/:handle` sell the account's published Commerce products; product photos are placeholders. The product page shows the store's payment setup — instalment lines, express buy-now buttons, accepted marks | The real catalogue, photos and product-page layout (the search service returned errors) |
| Search, login, wishlist | Links land on the storefront's 404 page | Product search and the account area |
| Cart | **Stand-in:** line items with quantity and remove, totals, Checkout and express buttons; the crawled empty state kept word for word | The real line-item and summary layout (their wording is in the crawl) |
| Checkout | **Stand-in:** `/checkout`, one page in the hosted checkout's order (express, contact, delivery, payment) beside the summary; Maropay takes the payment, other stores show their current provider's card option | The real checkout's steps, fields and payment step |

## Prototype stand-ins

- The account is the prototype's demo account (2000290 stands in for UAT 116000); the storefront
  address follows the real pattern `{account}-{store}.uat.maropost.store`.
- The store sells in AUD on UAT; the prototype's catalogue and Maropay account are USD. The storefront
  shows prices in the Maropay account's currency (decided when the checkout was built, 5 Oct 2026).
- Neelam-Store has no Maropay record in any scenario, so its checkout shows the long-standing Stripe card
  option until the store is linked and activated in Store › Payments.
