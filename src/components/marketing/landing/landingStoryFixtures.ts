// Shared fixtures for the landing-editor stories. Mirrors the PALETTE constant in
// views/Marketing/LandingPageEditor.vue — the five landing components all take the
// same palette, so the stories share one copy rather than repeating it each time.
import type { PaletteItem } from './LandingBlockPalette.vue'
import { defaultLandingBlock, type LandingPageBlock, type LandingPageStyle } from '@/stores/useLandingPages'

export const PALETTE: PaletteItem[] = [
  { type: 'title', label: 'Title', icon: 'heading' },
  { type: 'paragraph', label: 'Paragraph', icon: 'text' },
  { type: 'list', label: 'List', icon: 'list' },
  { type: 'image', label: 'Image', icon: 'image' },
  { type: 'button', label: 'Button', icon: 'square-mouse-pointer' },
  { type: 'divider', label: 'Divider', icon: 'minus' },
  { type: 'spacer', label: 'Spacer', icon: 'move-vertical' },
  { type: 'social', label: 'Social', icon: 'share-2' },
  { type: 'html', label: 'HTML', icon: 'code' },
  { type: 'video', label: 'Video', icon: 'video' },
  { type: 'form', label: 'Form', icon: 'clipboard-list' },
  { type: 'icons', label: 'Icons', icon: 'shapes' },
  { type: 'menu', label: 'Menu', icon: 'menu' },
  { type: 'text', label: 'Text', icon: 'type' },
]

/** A block of the given type with a stable id and readable content. */
export function block(
  type: LandingPageBlock['type'],
  overrides: Partial<LandingPageBlock> = {},
  id = `lpb-story-${type}`,
): LandingPageBlock {
  return { ...defaultLandingBlock(type), id, ...overrides } as LandingPageBlock
}

/** A small realistic page: hero title, supporting copy, CTA, and an image. */
export const PAGE_BLOCKS: LandingPageBlock[] = [
  block('title', { text: 'Spring into savings', titleSize: 'XL', align: 'center' }),
  block('paragraph', { text: 'Up to 40% off the new season. Free shipping on orders over $50.', align: 'center' }),
  block('button', { label: 'Shop the sale', align: 'center' }),
  block('image', { alt: 'Spring collection hero' }),
  block('divider'),
  block('list', { items: ['Free returns', '30-day guarantee', 'Carbon-neutral delivery'] }),
]

export const PAGE_STYLE: LandingPageStyle = {
  backgroundColor: '#FFFFFF',
  contentWidth: 720,
  baseFont: 'Inter',
  accentColor: '#1A56DB',
  buttonRadius: 8,
}
