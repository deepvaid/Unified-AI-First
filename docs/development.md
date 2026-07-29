# Development Guide

## Prerequisites
- Node.js 18+
- npm 9+

## Quick Start

```bash
# Install dependencies
npm install

# Generate design tokens
npm run tokens:build

# Start dev server
npm run dev
# → http://localhost:5173

# In a second terminal, start the root Storybook
npm run storybook
# → http://localhost:6006
```

## Development Workflow

### Three terminals

| Terminal | Command | Purpose |
|----------|---------|---------|
| 1 | `npm run dev` | App dev server with HMR |
| 2 | `npm run storybook` | Root Storybook preview |
| 3 | `npm run tokens:watch` | Auto-rebuild tokens on change |

### Creating a New Component

1. Create `src/components/MpComponentName.vue`:
```vue
<script setup lang="ts">
defineProps<{
  title: string
  count?: number
}>()

defineEmits<{
  (e: 'action'): void
}>()
</script>

<template>
  <div>...</div>
</template>

<style scoped>
/* Use design tokens, never hardcode */
</style>
```

2. Write a story `src/components/MpComponentName.stories.ts`:
```ts
import type { Meta, StoryObj } from '@storybook/vue3'
import MpComponentName from './MpComponentName.vue'

const meta = {
  title: 'Category/MpComponentName',
  component: MpComponentName,
  tags: ['autodocs'],
} satisfies Meta<typeof MpComponentName>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { title: 'Example', count: 5 },
}
```

3. Verify in the root Storybook: `http://localhost:6006`

### Modifying a Design Token

1. Edit `src/design-tokens/tokens.json`
2. Run `npm run tokens:build` (or let watch mode handle it)
3. Generated files update automatically:
   - `src/design-tokens/generated/_variables.scss`
   - `src/design-tokens/generated/variables.css`
   - `src/design-tokens/generated/tokens.ts`
4. Components referencing these tokens pick up changes via HMR

### SCSS in components

Vite and Storybook inject `src/design-tokens/generated/_variables.scss` globally (`$mp-spacing-*`, `$mp-borderRadius-*`, etc.). Import generated variables explicitly in a `<style>` block only when needed:

```scss
@use '@/design-tokens/generated/variables' as *;
```

Do not recreate colours in component SCSS — use semantic CSS aliases (`--text-primary`, `--border-subtle`) or Vuetify theme channels.

### Dark mode

See [`docs/dark-mode/06-theme-architecture.md`](dark-mode/06-theme-architecture.md). Use Storybook **Theme** and **Accent** toolbars to verify components; pinned `DarkMode*` stories document critical categories.

### Adding a New View

1. Create `src/views/Section/NewPage.vue`
2. Add route in `src/router/index.ts`
3. Add sidebar nav link in `src/components/layout/AppSidebar.vue`
4. Follow the data table page pattern (see CLAUDE.md)

## Pre-Push Checklist

```bash
# 1. Type check
npm run type-check

# 2. Build app
npm run build

# 3. Build Storybook
npm run build-storybook

# 4. Verify tokens
npm run tokens:build
```

## Commit Message Format

```
[type]: short description

Optional longer explanation.
```

**Types:** `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

**Examples:**
- `[feat]: add MpDateRangePicker component with story`
- `[fix]: correct MpStatusChip color for "Requires Action" status`
- `[docs]: update design-system.md with new tokens`
- `[refactor]: extract useTableFilters composable from SalesOrders`

## Storybook Dependencies

The root workspace already carries the pinned Storybook dependencies.
Use `npm run storybook` directly after installing repo dependencies.

## Useful Links

- [Vuetify 3 Docs](https://vuetifyjs.com/)
- [Vue 3 Composition API](https://vuejs.org/api/composition-api-setup.html)
- [Storybook for Vue](https://storybook.js.org/docs/get-started/frameworks/vue3-vite)
- [MDI Icons](https://pictogrammers.com/library/mdi/)
