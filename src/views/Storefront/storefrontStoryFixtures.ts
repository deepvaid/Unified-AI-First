/*
 * P5.5 exemption — the hex values here are a MERCHANT's theme (Northfold's), the
 * content the storefront draws, not Marobase chrome. Same line Phase 4 drew for
 * the storefront (DESIGN_AUDIT.md P4-8).
 */
import type { Decorator } from '@storybook/vue3'
import { demoStoreFor } from '@/storefront/demoStores'
import { snapshotFor } from '@/storefront/demoStores/install'
import { storefrontThemeVars } from '@/storefront/themeSections'

// The storefront stories draw Northfold (demo) as its shoppers see it: its own
// products, size charts and theme, from the store's seed (src/storefront/northfoldDemo.ts).

const NORTHFOLD = demoStoreFor('northfold')

/** Northfold as its home channel is seeded, on a fixed day. */
export const northfold = snapshotFor(NORTHFOLD.homeChannel, 'northfold', '2026-11-20')

export function northfoldProduct(name: string) {
  const product = northfold.products.find((p) => p.name === name)
  if (!product) throw new Error(`No Northfold product "${name}"`)
  return product
}

export function northfoldChart(name: string) {
  const chart = northfold.sizeCharts.find((c) => c.name === name)
  if (!chart) throw new Error(`No Northfold size chart "${name}"`)
  return chart
}

/** The theme's variables, with the quieter surfaces the richer drawing reads (when the theme does not set them itself). */
const themeVars = {
  '--sf-surface': '#f1eee9',
  '--sf-muted': '#66625c',
  '--sf-divider': '#e4dfd8',
  ...storefrontThemeVars(northfold.theme.styles),
}

/**
 * The store's page around a story: its background, text, fonts and variables,
 * as StorefrontLayout gives them to every storefront page. Never the app's dark mode.
 */
export function storefrontFrame(width = '480px', padding = '24px'): Decorator {
  const style = {
    ...themeVars,
    boxSizing: 'border-box',
    maxWidth: width,
    padding,
    background: 'var(--sf-bg)',
    color: 'var(--sf-text)',
    fontFamily: 'var(--sf-body-font), system-ui, sans-serif',
    fontSize: '16px',
    lineHeight: '24px',
  }
  return () => ({
    setup: () => ({ style }),
    template: '<div :style="style"><story /></div>',
  })
}
