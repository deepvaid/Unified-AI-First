import type { MpSectionRailGroup } from '@/components/MpSectionRail.vue'
import { TEMPLATE_SPECS } from './templateSpecs'

/**
 * Rail groups for the templates gallery. Derived from TEMPLATE_SPECS so the rail,
 * the index cards and the spec panel can never list different templates.
 */
export function templatesRailGroups(): MpSectionRailGroup[] {
  return [
    {
      items: [
        {
          slug: 'overview',
          label: 'Overview',
          icon: 'layout-dashboard',
          to: { name: 'TemplatesIndex' },
          match: ['TemplatesIndex'],
        },
      ],
    },
    {
      title: 'Page archetypes',
      items: TEMPLATE_SPECS.map((spec) => ({
        slug: spec.slug,
        label: spec.title,
        icon: spec.icon,
        to: { name: spec.routeName },
        match: [spec.routeName],
      })),
    },
  ]
}
