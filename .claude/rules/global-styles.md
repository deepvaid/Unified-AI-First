# Global stylesheet rule — keep Storybook identical to the app

`src/styles/app-styles.ts` is the **single ordered manifest** of every app-wide stylesheet. It is imported by both `src/main.ts` (the app / design sandbox) and `.storybook/preview.ts` (Storybook), which is what guarantees components render identically in both.

## The rule

- **Never** add a global CSS/SCSS import directly to `src/main.ts` or `.storybook/preview.ts`.
- **Always** add new app-wide stylesheets to `src/styles/app-styles.ts` instead — they reach the app and Storybook automatically.
- **Do not reorder** the imports in `app-styles.ts` — the cascade order is significant (tokens → theme aliases → global.scss → feature skins).
- Component-scoped styles stay in `<style scoped>` inside the component, as usual. This rule is only about global stylesheets.

## Why this exists

Before 2026-07-18, Storybook loaded only 6 of the app's 15 stylesheets. Form fields rendered as raw Vuetify (missing `settings-form.scss`), the AppSidebar/AppBar stories were missing their shell skins (`sidebar-*.css`, `shell-variants.css`), and MpSourceCloudChip lost its per-cloud colors — while story docs described the app styling as if it were active. The shared manifest fixed all of it at once; bypassing it reintroduces the drift.

See `docs/design-system/handover-2026-07.md` ("Render parity with the design sandbox") for the full history.
