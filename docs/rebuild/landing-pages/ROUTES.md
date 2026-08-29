# Landing Pages — routes to wire

The three rebuilt surfaces, using UAT's own paths. Routes are **not** registered by this slice —
`src/router/index.ts` is wired centrally. The views call `router.push({ name })` assuming the names
below.

## Records to add

```ts
{
  path: '/accounts/:accountId/landing_pages',
  name: 'LandingPages',
  component: () => import('@/views/Marketing/LandingPages.vue'),
  meta: {},
},
{
  path: '/accounts/:accountId/landing_pages/template',
  name: 'LandingPageTemplates',
  component: () => import('@/views/Marketing/LandingPageTemplates.vue'),
  meta: {},
},
{
  path: '/accounts/:accountId/landing_pages/create',
  name: 'LandingPageBuilderChooser',
  component: () => import('@/views/Marketing/LandingPageBuilderChooser.vue'),
  meta: {},
},
```

## Notes for the wiring pass

| # | Note |
|---|---|
| 1 | **`LandingPages` already exists** at this exact path — no change needed beyond keeping the name. |
| 2 | **`LandingPageTemplates` must move** from `/landing_pages/templates` (plural, today) to `/landing_pages/template` (singular, UAT). The name stays `LandingPageTemplates`. Add a redirect from the plural path if any bookmark matters. |
| 3 | **`LandingPageBuilderChooser` is new.** It must be registered **before** any `/landing_pages/:id`-shaped route, or `create` is swallowed as an id. Today's editor route is `/landing_pages/editor/:id/edit`, so there is no conflict as things stand. |
| 4 | No `meta` is required on any of the three — none is a builder shell or a rail shell. The editor (`LandingPageEditor`) keeps its existing `meta: { builderShell: true }`. |
| 5 | The flow is `LandingPages → LandingPageTemplates → LandingPageBuilderChooser → LandingPageEditor`. The chooser creates the record and pushes `{ name: 'LandingPageEditor', params: { accountId, id } }`, so that route name must keep working. |

## Query parameters each surface owns

| Route | Params | Meaning |
|---|---|---|
| `LandingPages` | `q`, `type` (csv of `wysiwyg` / `dnd_legacy` / `dnd`), `folder` (a `useFolders` id in the `landing_pages` scope) | search, editor-type filter, folder filter — all restored on load |
| `LandingPageTemplates` | `tab` (`mine`; absent = library), `q`, `facets` (csv of facet slugs), `folder` | tab, library search, category facets, saved-template folder |
| `LandingPageBuilderChooser` | `template` (a library template id, or `saved-<n>` for a merchant-saved one; absent = blank page) | what the new page is seeded from |

All are written with `router.replace`, so filtering never floods the back stack.
