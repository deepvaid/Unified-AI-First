import type { IconProps, IconSet } from 'vuetify'
import { h, type Component } from 'vue'
import * as LucideIcons from 'lucide-vue-next'

/**
 * Convert kebab-case or camelCase icon name to PascalCase.
 * 'chevron-down' → 'ChevronDown', 'settings' → 'Settings'
 */
function toPascalCase(name: string): string {
  return name.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('')
}

/**
 * Resolve a Lucide icon component by kebab-case name string.
 * Returns null if no matching export is found.
 */
function resolveLucideIcon(name: string): Component | null {
  const pascal = toPascalCase(name)
  const icon = (LucideIcons as unknown as Record<string, Component>)[pascal]
  return icon ?? null
}

/**
 * Maps Vuetify's built-in mdi-* alias strings to Lucide kebab-case names.
 * Vuetify uses these strings for internal UI icons (expand chevrons, checkboxes, etc.)
 * Routing them through Lucide SVGs avoids the class-doubling bug from the MDI CSS fallback.
 */
export const MDI_TO_LUCIDE: Record<string, string> = {
  'mdi-chevron-down': 'chevron-down',
  'mdi-chevron-up': 'chevron-up',
  'mdi-chevron-left': 'chevron-left',
  'mdi-chevron-right': 'chevron-right',
  'mdi-menu-down': 'chevron-down',
  'mdi-menu-right': 'chevron-right',
  'mdi-menu-up': 'chevron-up',
  'mdi-unfold-more-horizontal': 'chevrons-up-down',
  'mdi-page-first': 'chevrons-left',
  'mdi-page-last': 'chevrons-right',
  'mdi-check': 'check',
  'mdi-check-circle': 'check-circle',
  'mdi-close': 'x',
  'mdi-close-circle': 'x-circle',
  'mdi-arrow-up': 'arrow-up',
  'mdi-arrow-down': 'arrow-down',
  'mdi-checkbox-marked': 'square-check',
  'mdi-checkbox-blank-outline': 'square',
  'mdi-minus-box': 'minus-square',
  'mdi-radiobox-marked': 'circle-dot',
  'mdi-radiobox-blank': 'circle',
  'mdi-information': 'info',
  'mdi-alert-circle-outline': 'alert-triangle',
  'mdi-menu': 'menu',
  'mdi-plus': 'plus',
  'mdi-minus': 'minus',
  'mdi-calendar': 'calendar',
  'mdi-paperclip': 'paperclip',
  'mdi-eyedropper': 'pipette',
  'mdi-star': 'star',
  'mdi-star-outline': 'star',
  'mdi-star-half-full': 'star-half',
  'mdi-cached': 'loader',
}

/**
 * Vuetify 3 icon set that renders Lucide SVG icons as the primary source.
 *
 * Resolution order:
 * 1. Vue component passed directly via aliases
 * 2. Known mdi-* strings → mapped to Lucide SVG (avoids class-doubling bug)
 * 3. Kebab-case string → Lucide lookup
 * 4. Unknown mdi-* strings → MDI CSS font fallback (requires @mdi/font)
 *
 * Usage in templates (after registration as defaultSet):
 *   icon="settings"         → Lucide Settings
 *   icon="chevron-down"     → Lucide ChevronDown
 *   prepend-icon="plus"     → Lucide Plus
 *   <v-icon>trash-2</v-icon> → Lucide Trash2
 */
export const lucideIconSet: IconSet = {
  component: (props: IconProps) => {
    const { tag, icon } = props
    const p = props as IconProps & { class?: unknown; style?: unknown }
    const cls = p.class
    const style = p.style

    // Vue component passed directly (e.g. via $aliases)
    if (icon && typeof icon === 'object' && !Array.isArray(icon)) {
      return h(tag as string, { class: cls, style }, [
        h(icon as Component, { size: '0.875em', strokeWidth: 1.75 }),
      ])
    }

    if (typeof icon === 'string') {
      if (icon.startsWith('mdi-')) {
        // Route known mdi-* strings to Lucide SVGs (no class doubling)
        const lucideName = MDI_TO_LUCIDE[icon]
        if (lucideName) {
          const lucideIcon = resolveLucideIcon(lucideName)
          if (lucideIcon) {
            return h(tag as string, { class: cls, style }, [
              h(lucideIcon, { size: '0.875em', strokeWidth: 1.75 }),
            ])
          }
        }
        // True MDI CSS fallback for unmapped icons
        return h(tag as string, { class: ['mdi', icon], style })
      }

      // Lucide lookup by kebab-case name
      const lucideIcon = resolveLucideIcon(icon)
      if (lucideIcon) {
        return h(tag as string, { class: cls, style }, [
          h(lucideIcon, { size: '0.875em', strokeWidth: 1.75 }),
        ])
      }
    }

    return h(tag as string, { class: cls, style })
  },
}
