import { ref } from 'vue'
import { defineStore } from 'pinia'
import {
  block,
  getSectionDef,
  sectionFromDef,
  seedSettings,
  seedTemplates,
  type ThemeEditorBlock,
  type ThemeEditorSection,
  type ThemeEditorSectionDef,
  type ThemeEditorSettings,
  type ThemeEditorTemplate,
  type ThemeEditorValue,
} from './themeEditorData'

export interface ThemeEditorState {
  templates: ThemeEditorTemplate[]
  settings: ThemeEditorSettings
}

// Builder state for the theme editor re-skin (docs/rebuild/theme-editor-reskin), keyed by theme
// id. Every theme lazily seeds the crawled Lumos content; `saved` holds the last committed
// snapshot so `isDirty` is a plain comparison. Save = commit the snapshot; Publish = save and
// let the caller flip the theme's status in useStoreThemes.
export const useThemeEditorStore = defineStore('themeEditor', () => {
  const themes = ref<Record<string, ThemeEditorState>>({})
  const saved = ref<Record<string, string>>({})

  function stateFor(themeId: string): ThemeEditorState {
    if (!themes.value[themeId]) {
      themes.value[themeId] = { templates: seedTemplates(), settings: seedSettings() }
      saved.value[themeId] = JSON.stringify(themes.value[themeId])
    }
    return themes.value[themeId]
  }

  function isDirty(themeId: string): boolean {
    const state = themes.value[themeId]
    return !!state && JSON.stringify(state) !== saved.value[themeId]
  }

  function save(themeId: string) {
    saved.value[themeId] = JSON.stringify(stateFor(themeId))
  }

  /** Restores the last saved snapshot (Discard). */
  function revert(themeId: string) {
    const snapshot = saved.value[themeId]
    if (snapshot) themes.value[themeId] = JSON.parse(snapshot) as ThemeEditorState
  }

  function template(themeId: string, type: string): ThemeEditorTemplate | undefined {
    return stateFor(themeId).templates.find((entry) => entry.type === type)
  }

  function findSection(themeId: string, type: string, sectionId: string): ThemeEditorSection | undefined {
    return template(themeId, type)?.sections.find((entry) => entry.id === sectionId)
  }

  /** Depth-first block lookup inside a section (blocks nest one level: Trust Stats Bar → Stat). */
  function findBlock(section: ThemeEditorSection, blockId: string): { block: ThemeEditorBlock; parent?: ThemeEditorBlock } | undefined {
    for (const entry of section.blocks) {
      if (entry.id === blockId) return { block: entry }
      const child = entry.blocks?.find((nested) => nested.id === blockId)
      if (child) return { block: child, parent: entry }
    }
    return undefined
  }

  // ── Sections ────────────────────────────────────────────────────────────────

  function addSection(themeId: string, type: string, def: ThemeEditorSectionDef, variantId?: string): ThemeEditorSection | undefined {
    const target = template(themeId, type)
    if (!target) return undefined
    const created = sectionFromDef(def, variantId)
    target.sections.push(created)
    return created
  }

  function removeSection(themeId: string, type: string, sectionId: string) {
    const target = template(themeId, type)
    if (!target) return
    target.sections = target.sections.filter((entry) => entry.id !== sectionId)
  }

  function moveSection(themeId: string, type: string, from: number, to: number) {
    const target = template(themeId, type)
    if (!target || from === to || from < 0 || to < 0 || from >= target.sections.length || to >= target.sections.length) return
    const [moved] = target.sections.splice(from, 1)
    if (moved) target.sections.splice(to, 0, moved)
  }

  function updateSection(themeId: string, type: string, sectionId: string, patch: { label?: string; settings?: Record<string, ThemeEditorValue> }) {
    const target = findSection(themeId, type, sectionId)
    if (!target) return
    if (patch.label !== undefined) target.label = patch.label
    if (patch.settings) Object.assign(target.settings, patch.settings)
  }

  // ── Blocks ──────────────────────────────────────────────────────────────────

  function addBlock(themeId: string, type: string, sectionId: string, kind: string, parentBlockId?: string): ThemeEditorBlock | undefined {
    const target = findSection(themeId, type, sectionId)
    if (!target) return undefined
    const created = block(kind)
    if (parentBlockId) {
      const parent = findBlock(target, parentBlockId)?.block
      if (!parent) return undefined
      parent.blocks = [...(parent.blocks ?? []), created]
    } else {
      target.blocks.push(created)
    }
    return created
  }

  function removeBlock(themeId: string, type: string, sectionId: string, blockId: string) {
    const target = findSection(themeId, type, sectionId)
    if (!target) return
    const found = findBlock(target, blockId)
    if (!found) return
    if (found.parent) found.parent.blocks = (found.parent.blocks ?? []).filter((entry) => entry.id !== blockId)
    else target.blocks = target.blocks.filter((entry) => entry.id !== blockId)
  }

  function moveBlock(themeId: string, type: string, sectionId: string, from: number, to: number, parentBlockId?: string) {
    const target = findSection(themeId, type, sectionId)
    if (!target) return
    const list = parentBlockId ? findBlock(target, parentBlockId)?.block.blocks : target.blocks
    if (!list || from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return
    const [moved] = list.splice(from, 1)
    if (moved) list.splice(to, 0, moved)
  }

  function updateBlock(themeId: string, type: string, sectionId: string, blockId: string, patch: { label?: string; settings?: Record<string, ThemeEditorValue> }) {
    const target = findSection(themeId, type, sectionId)
    const found = target && findBlock(target, blockId)
    if (!found) return
    if (patch.label !== undefined) found.block.label = patch.label
    if (patch.settings) Object.assign(found.block.settings, patch.settings)
  }

  // ── Theme settings ──────────────────────────────────────────────────────────

  function settings(themeId: string): ThemeEditorSettings {
    return stateFor(themeId).settings
  }

  function patchSettings(themeId: string, patch: (settings: ThemeEditorSettings) => void) {
    patch(stateFor(themeId).settings)
  }

  return {
    themes,
    stateFor,
    isDirty,
    save,
    revert,
    template,
    findSection,
    findBlock,
    getSectionDef,
    addSection,
    removeSection,
    moveSection,
    updateSection,
    addBlock,
    removeBlock,
    moveBlock,
    updateBlock,
    settings,
    patchSettings,
  }
})
