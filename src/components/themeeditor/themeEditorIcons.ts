import type { ThemeEditorLanguage } from '@/stores/themeEditorLumosFiles'

/** The file-type glyph the explorer and the tab strip share (Lucide names). */
export function languageIcon(language: ThemeEditorLanguage): string {
  switch (language) {
    case 'html':
      return 'file-code'
    case 'json':
      return 'braces'
    case 'css':
      return 'palette'
    case 'javascript':
      return 'code'
    case 'image':
      return 'file-image'
    default:
      return 'file-text'
  }
}
