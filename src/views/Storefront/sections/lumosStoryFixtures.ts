/*
 * P5.5 exemption — the values here are a MERCHANT's theme (Lumos, from its Figma style
 * guide), the content the storefront draws, not Marobase chrome (DESIGN_AUDIT.md P4-8).
 */
import { createBlock, createSection } from '@/storefront/themeSections'
import type { ThemeSection, ThemeStyles } from '@/storefront/themeSections'

// Story-only: the Lumos theme's styles and home sections, for the storefront's section
// stories and the builder canvas's, so both can show the part 5 settings before (and
// without) the Lumos demo store. The app never imports it.

/** Lumos's styles: Inter at 500, uppercase titles and buttons, indigo, 8px cards, a pale tint, a 1328px measure. */
export const LUMOS_STYLES: ThemeStyles = {
  drawing: 'sections', brandColor: '#495DA7', accentColor: '#495DA7', background: '#FFFFFF', textColor: '#272727',
  headingFont: 'Inter', bodyFont: 'Inter', cornerRadius: 4, buttonStyle: 'solid',
  saleBadgeColor: '#D4183D', customBadgeColor: '#495DA7', soldOutBadgeColor: '#272727',
  buttonColor: '#495DA7', surfaceColor: '#F9FAFB', mutedColor: '#6D6D6D', dividerColor: '#E8E8E8', headingCase: 'Uppercase',
  headingWeight: 500, cardColor: '#FFFFFF', cardRadius: 8, cardShadow: 'Soft', buttonBorderColor: '#495DA7', buttonHoverColor: '#394A8A',
  buttonCase: 'Uppercase', tintColor: '#F4F7FF', measure: 1328, gutter: 56, heroTitleSize: 64, sectionTitleSize: 32,
}

const PHOTOS = '/storefront/lumos'
const BRANDS = ['Oakmere', 'Linden Row', 'Morrow & Pine', 'Halden Works', 'Cove & Co', 'Brightwell Studio']
const ROOMS: [label: string, accent: string, handle: string, photo: string][] = [
  ['Living room', 'room', 'living-room', 'room-living'],
  ['Bedroom', '', 'bedroom', 'room-bedroom'],
  ['Dining room', 'Dining', 'dining', 'room-dining'],
  ['Home office', 'office', 'office', 'room-office'],
  ['Outdoor living', 'Outdoor', 'outdoor', 'room-outdoor'],
]

/** Lumos's home sections between its header and footer: hero, rooms, brands, featured products and "Why choose us". */
export function lumosHomeSections(prefix: string): ThemeSection[] {
  const id = (name: string) => `${prefix}-lumos-${name}`
  return [
    {
      ...createSection('image-banner', {
        badge: 'New arrivals',
        headline: 'Discover your perfect place',
        accentWords: 'perfect place',
        subheadline: 'Sofas, tables and lighting made to live with, delivered free to your door.',
        height: 'Large',
        contentPosition: 'Center left',
        image: `${PHOTOS}/hero-living.jpg`,
      }, id('hero')),
      blocks: [
        createBlock('button', { label: 'Shop new arrivals', link: '/collections/new-arrivals' }, id('hero-new')),
        createBlock('button', { label: 'Browse rooms', link: '/collections/all' }, id('hero-rooms')),
        createBlock('stat', { value: '12K+', label: 'Homes furnished' }, id('stat-homes')),
        createBlock('stat', { value: '480+', label: 'Pieces' }, id('stat-pieces')),
        createBlock('stat', { value: '4.8', label: 'Average rating' }, id('stat-rating')),
      ],
    },
    {
      ...createSection('collection-grid', { title: 'Shop by room', accentWords: 'room', columns: 3, layout: 'Carousel', tileStyle: 'Label over photo', background: 'Tint' }, id('rooms')),
      blocks: ROOMS.map(([label, accent, handle, photo]) => createBlock('collection', { label, accent, link: `/collections/${handle}`, image: `${PHOTOS}/${photo}.jpg` }, id(`room-${handle}`))),
    },
    {
      ...createSection('logo-strip', { title: 'Brands we carry', background: 'Tint' }, id('brands')),
      blocks: BRANDS.map((name) => createBlock('logo', { name, link: `/collections/all?brand=${encodeURIComponent(name)}` }, id(`logo-${name.toLowerCase().replace(/\W+/g, '-')}`))),
    },
    createSection('featured-products', { eyebrow: 'Recommendations', title: 'Featured products', collection: 'all', productCount: 8, layout: 'Carousel' }, id('featured')),
    {
      ...createSection('icon-row', {
        eyebrow: 'Why choose us',
        title: 'The Lumos difference',
        subtitle: 'Furniture built to last, delivered free, with design help when you want it.',
        alignment: 'Center',
        tileStyle: 'Card',
      }, id('why')),
      blocks: [
        createBlock('feature', { icon: 'award', title: 'Built to last', text: 'Solid wood frames and fabrics made for daily life.' }, id('why-built')),
        createBlock('feature', { icon: 'truck', title: 'Free delivery', text: 'On every order, in 3 to 5 business days.' }, id('why-delivery')),
        createBlock('feature', { icon: 'headphones', title: 'Design help', text: 'Ask us about sizes, fabrics and finishes.' }, id('why-help')),
        createBlock('feature', { icon: 'shield-check', title: '30-day returns', text: 'Changed your mind? Send it back within 30 days.' }, id('why-returns')),
      ],
    },
  ]
}
