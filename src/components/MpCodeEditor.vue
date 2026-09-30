<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { Compartment, EditorState } from '@codemirror/state'
import {
  EditorView,
  drawSelection,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
} from '@codemirror/view'
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands'
import {
  HighlightStyle,
  bracketMatching,
  foldGutter,
  foldKeymap,
  indentOnInput,
  syntaxHighlighting,
} from '@codemirror/language'
import { tags as t } from '@lezer/highlight'
import { html } from '@codemirror/lang-html'
import { json } from '@codemirror/lang-json'
import { css } from '@codemirror/lang-css'
import { javascript } from '@codemirror/lang-javascript'
import { liquid } from '@codemirror/lang-liquid'

export type MpCodeLanguage = 'html' | 'json' | 'css' | 'javascript' | 'text'

// The one code-editing surface (docs/rebuild/GAPS.md "No SQL / code editor"): CodeMirror 6 behind a
// v-model, with the editor chrome on design tokens. Geometry comes from `component.editor.*`, the
// gutter/selection/active-line surfaces from the surface ladder, and every syntax colour from the
// seven `--code-*` aliases (color.light.code / color.dark.code, each a declared contrast pair). HTML
// files parse as Liquid-over-HTML so Go-template `{{ }}` tags read as template tags, not text.
//
// Mount one instance per document (key the component by file path): the undo history belongs to
// the document, so swapping `modelValue` for a different file would carry the previous file's
// undo stack along.

const props = withDefaults(defineProps<{
  modelValue: string
  language?: MpCodeLanguage
  readonly?: boolean
  lineNumbers?: boolean
  /** Accessible name for the editing region ("Editor content: layouts/default.html"). */
  ariaLabel: string
}>(), {
  language: 'text',
  readonly: false,
  lineNumbers: true,
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  /** Cmd/Ctrl+S inside the editor. The host decides what "save" means. */
  save: []
}>()

const host = ref<HTMLDivElement | null>(null)
let view: EditorView | null = null

const languageConf = new Compartment()
const readonlyConf = new Compartment()
const gutterConf = new Compartment()

function languageExtension(language: MpCodeLanguage) {
  switch (language) {
    case 'html':
      return liquid({ base: html() })
    case 'json':
      return json()
    case 'css':
      return css()
    case 'javascript':
      return javascript()
    default:
      return []
  }
}

function gutterExtension(enabled: boolean) {
  return enabled ? [lineNumbers(), highlightActiveLineGutter(), foldGutter()] : []
}

function readonlyExtension(readonly: boolean) {
  return [EditorState.readOnly.of(readonly), EditorView.editable.of(!readonly)]
}

const theme = EditorView.theme({
  '&': {
    height: '100%',
    fontSize: 'var(--mp-component-editor-codeFontSize)',
    backgroundColor: 'var(--surface-primary)',
    color: 'var(--text-primary)',
  },
  '.cm-scroller': {
    fontFamily: 'var(--mp-fontFamily-mono)',
    lineHeight: 'var(--mp-component-editor-codeLineHeight)',
    overflow: 'auto',
  },
  '.cm-content': {
    caretColor: 'var(--text-primary)',
    paddingBlock: 'var(--mp-space-8)',
  },
  '.cm-line': { paddingInline: 'var(--mp-space-12)' },
  '&.cm-focused': { outline: 'none' },
  '.cm-gutters': {
    backgroundColor: 'var(--surface-primary)',
    color: 'var(--text-muted)',
    border: 'none',
    paddingInlineStart: 'var(--mp-space-8)',
  },
  '.cm-activeLineGutter': {
    backgroundColor: 'var(--surface-secondary)',
    color: 'var(--text-secondary)',
  },
  '.cm-activeLine': { backgroundColor: 'var(--surface-secondary)' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground, ::selection': {
    backgroundColor: 'var(--accent-selected-bg)',
  },
  '.cm-cursor, .cm-dropCursor': { borderLeftColor: 'var(--text-primary)' },
  '.cm-matchingBracket, &.cm-focused .cm-matchingBracket': {
    backgroundColor: 'var(--accent-subtle-bg)',
    outline: '1px solid var(--border-strong)',
  },
  '.cm-foldGutter .cm-gutterElement': { color: 'var(--text-muted)' },
  '.cm-foldPlaceholder': {
    backgroundColor: 'var(--surface-secondary)',
    border: '1px solid var(--border-subtle)',
    color: 'var(--text-secondary)',
  },
})

const highlight = HighlightStyle.define([
  { tag: [t.keyword, t.controlKeyword, t.definitionKeyword, t.moduleKeyword, t.operatorKeyword, t.processingInstruction], color: 'var(--code-keyword)' },
  { tag: [t.string, t.special(t.string), t.attributeValue], color: 'var(--code-string)' },
  { tag: [t.tagName, t.angleBracket], color: 'var(--code-tag)' },
  { tag: [t.attributeName, t.propertyName, t.definition(t.propertyName), t.className], color: 'var(--code-attribute)' },
  { tag: [t.number, t.bool, t.null, t.atom, t.unit], color: 'var(--code-number)' },
  { tag: [t.comment, t.lineComment, t.blockComment, t.meta, t.documentMeta], color: 'var(--code-comment)', fontStyle: 'italic' },
  { tag: [t.punctuation, t.bracket, t.brace, t.paren, t.squareBracket, t.operator, t.separator, t.derefOperator], color: 'var(--code-punctuation)' },
  { tag: [t.variableName, t.name, t.function(t.variableName)], color: 'var(--text-primary)' },
  { tag: t.invalid, color: 'var(--neg)' },
])

onMounted(() => {
  if (!host.value) return
  view = new EditorView({
    parent: host.value,
    state: EditorState.create({
      doc: props.modelValue,
      extensions: [
        gutterConf.of(gutterExtension(props.lineNumbers)),
        highlightSpecialChars(),
        history(),
        drawSelection(),
        indentOnInput(),
        bracketMatching(),
        highlightActiveLine(),
        syntaxHighlighting(highlight),
        theme,
        keymap.of([
          {
            key: 'Mod-s',
            run: () => {
              emit('save')
              return true
            },
          },
          ...defaultKeymap,
          ...historyKeymap,
          ...foldKeymap,
          indentWithTab,
        ]),
        languageConf.of(languageExtension(props.language)),
        readonlyConf.of(readonlyExtension(props.readonly)),
        EditorView.contentAttributes.of({ 'aria-label': props.ariaLabel }),
        EditorView.updateListener.of((update) => {
          if (update.docChanged) emit('update:modelValue', update.state.doc.toString())
        }),
      ],
    }),
  })
})

watch(
  () => props.modelValue,
  (value) => {
    if (!view) return
    const current = view.state.doc.toString()
    if (value !== current) view.dispatch({ changes: { from: 0, to: current.length, insert: value } })
  },
)

watch(
  () => props.language,
  (language) => view?.dispatch({ effects: languageConf.reconfigure(languageExtension(language)) }),
)

watch(
  () => props.readonly,
  (readonly) => view?.dispatch({ effects: readonlyConf.reconfigure(readonlyExtension(readonly)) }),
)

watch(
  () => props.lineNumbers,
  (enabled) => view?.dispatch({ effects: gutterConf.reconfigure(gutterExtension(enabled)) }),
)

onBeforeUnmount(() => {
  view?.destroy()
  view = null
})

defineExpose({
  /** Moves keyboard focus into the document. */
  focus: () => view?.focus(),
})
</script>

<template>
  <div ref="host" class="mp-code-editor" />
</template>

<style scoped>
/* The host fills whatever pane it is given; CodeMirror's own root takes 100% of it (theme above). */
.mp-code-editor {
  height: 100%;
  min-height: 0;
  overflow: hidden;
}
</style>
