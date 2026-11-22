<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, useId, watch } from 'vue'
import { Editor, EditorContent } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import { Placeholder } from '@tiptap/extensions'
import MpMenuItem from './MpMenuItem.vue'

// A rich-text field (Tiptap 3): one formatting toolbar row over an editable area
// drawn in the outlined-field look — static top label, 1px boundary, 2px on focus
// and on error, hint/error underneath. The model is HTML. An empty editor emits
// '' (not '<p></p>') so a required check can test the string.
//
// Insert tag (when `tagGroups` is set) types the literal `{{KEY}}` at the cursor.

const props = withDefaults(defineProps<{
  /** HTML. */
  modelValue: string
  /** Static top label, the same look as a Vuetify field's label. */
  label?: string
  /** Accessible name when there is no visible label (composer chrome). */
  ariaLabel?: string
  /** Trailing ` *` on the label and `aria-required` on the textbox. */
  required?: boolean
  /** Supporting text under the field. */
  hint?: string
  /** Error message — replaces the hint, and error styling wins over focus. */
  error?: string
  /** Shown while the editor is empty. An example, never a restated label. */
  placeholder?: string
  /** Minimum visible lines: 3 short · 5 (default) · 8 long-form. Scrolls past twice this. */
  rows?: number
  /** Not editable; the toolbar is disabled. */
  disabled?: boolean
  /** Enables the Insert tag menu, grouped under subheaders. */
  tagGroups?: { title: string; tags: { key: string; label: string }[] }[]
}>(), {
  required: false,
  rows: 5,
  disabled: false,
})

const emit = defineEmits<{ 'update:modelValue': [html: string] }>()

const uid = useId()
const labelId = `${uid}-label`
const descriptionId = `${uid}-description`
const message = computed(() => props.error || props.hint || '')

// ── Editor ───────────────────────────────────────────────────────────────────

/** Attributes on the contenteditable itself — ProseMirror owns that element. */
const editorAttributes = computed(() => {
  const attrs: Record<string, string> = { role: 'textbox', 'aria-multiline': 'true' }
  if (props.label) attrs['aria-labelledby'] = labelId
  else if (props.ariaLabel) attrs['aria-label'] = props.ariaLabel
  if (message.value) attrs['aria-describedby'] = descriptionId
  if (props.required) attrs['aria-required'] = 'true'
  if (props.error) attrs['aria-invalid'] = 'true'
  if (props.disabled) attrs['aria-disabled'] = 'true'
  if (props.placeholder) attrs['aria-placeholder'] = props.placeholder
  return attrs
})

const editor = shallowRef<Editor>()

function htmlOf(ed: { isEmpty: boolean; getHTML(): string }): string {
  return ed.isEmpty ? '' : ed.getHTML()
}

onMounted(() => {
  editor.value = new Editor({
    content: props.modelValue,
    editable: !props.disabled,
    extensions: [
      // The toolbar's vocabulary only: no headings, code or rules it could not undo.
      StarterKit.configure({
        heading: false,
        code: false,
        codeBlock: false,
        horizontalRule: false,
        link: { openOnClick: false, autolink: true, defaultProtocol: 'https' },
      }),
      Placeholder.configure({ placeholder: () => props.placeholder ?? '' }),
    ],
    editorProps: { attributes: editorAttributes.value },
    onUpdate: ({ editor: ed }) => emit('update:modelValue', htmlOf(ed)),
  })
})

onBeforeUnmount(() => editor.value?.destroy())

// Only replace the document when the incoming HTML differs from what the editor
// already holds — the echo of our own update must never reset the cursor.
watch(() => props.modelValue, (html) => {
  const ed = editor.value
  if (!ed || html === htmlOf(ed)) return
  ed.commands.setContent(html, { emitUpdate: false })
})

watch(() => props.disabled, (disabled) => editor.value?.setEditable(!disabled, false))

watch(editorAttributes, (attributes) => editor.value?.setOptions({ editorProps: { attributes } }))

function isActive(name: string): boolean {
  return editor.value?.isActive(name) ?? false
}

function focusEditor() {
  editor.value?.commands.focus()
}

type ToggleId = 'bold' | 'italic' | 'underline' | 'bulletList' | 'orderedList' | 'blockquote'

interface Toggle {
  id: ToggleId
  label: string
  icon: string
}

const TOGGLES: Record<ToggleId, Toggle> = {
  bold: { id: 'bold', label: 'Bold', icon: 'bold' },
  italic: { id: 'italic', label: 'Italic', icon: 'italic' },
  underline: { id: 'underline', label: 'Underline', icon: 'underline' },
  bulletList: { id: 'bulletList', label: 'Bulleted list', icon: 'list' },
  orderedList: { id: 'orderedList', label: 'Numbered list', icon: 'list-ordered' },
  blockquote: { id: 'blockquote', label: 'Quote', icon: 'quote' },
}

const markGroup = [TOGGLES.bold, TOGGLES.italic, TOGGLES.underline]
const listGroup = [TOGGLES.bulletList, TOGGLES.orderedList]

function toggle(id: ToggleId) {
  const chain = editor.value?.chain().focus()
  if (!chain) return
  if (id === 'bold') chain.toggleBold().run()
  else if (id === 'italic') chain.toggleItalic().run()
  else if (id === 'underline') chain.toggleUnderline().run()
  else if (id === 'bulletList') chain.toggleBulletList().run()
  else if (id === 'orderedList') chain.toggleOrderedList().run()
  else chain.toggleBlockquote().run()
}

// ── Toolbar: one tab stop, arrows move between tools (WAI-ARIA toolbar) ────

const toolbarEl = ref<HTMLElement>()
const tagGroupsShown = computed(() => (props.tagGroups ?? []).filter((g) => g.tags.length))
const hasTags = computed(() => tagGroupsShown.value.length > 0)
const toolIds = computed(() => [
  'bold', 'italic', 'underline', 'bulletList', 'orderedList', 'link', 'blockquote',
  ...(hasTags.value ? ['tag'] : []),
])
const focusIndex = ref(0)

function tabindexFor(id: string): number {
  const ids = toolIds.value
  return ids[Math.min(focusIndex.value, ids.length - 1)] === id ? 0 : -1
}

function tools(): HTMLElement[] {
  return Array.from(toolbarEl.value?.querySelectorAll<HTMLElement>('[data-mp-tool]') ?? [])
}

function onToolbarFocusin(event: FocusEvent) {
  const tool = (event.target as HTMLElement | null)?.closest<HTMLElement>('[data-mp-tool]')
  const index = tool ? tools().indexOf(tool) : -1
  if (index >= 0) focusIndex.value = index
}

function onToolbarKeydown(event: KeyboardEvent) {
  const list = tools()
  const current = list.indexOf(document.activeElement as HTMLElement)
  if (current < 0) return
  let next: number
  if (event.key === 'ArrowRight') next = (current + 1) % list.length
  else if (event.key === 'ArrowLeft') next = (current - 1 + list.length) % list.length
  else if (event.key === 'Home') next = 0
  else if (event.key === 'End') next = list.length - 1
  else return
  event.preventDefault()
  focusIndex.value = next
  list[next]?.focus()
}

// ── Link ─────────────────────────────────────────────────────────────────────

const linkMenu = ref(false)
const linkUrl = ref('')
const linkField = ref<{ focus: () => void }>()

watch(linkMenu, (open) => {
  if (!open) return
  const href = editor.value?.getAttributes('link').href
  linkUrl.value = typeof href === 'string' ? href : ''
})

function focusLinkField() {
  nextTick(() => linkField.value?.focus())
}

/** `example.com` → `https://example.com`; anything with a scheme (mailto:, tel:) is kept. */
function normalizeUrl(raw: string): string {
  const url = raw.trim()
  if (!url) return ''
  return /^[a-z][a-z\d+.-]*:/i.test(url) ? url : `https://${url}`
}

function applyLink() {
  const ed = editor.value
  const href = normalizeUrl(linkUrl.value)
  if (!ed || !href) return
  if (ed.state.selection.empty && !ed.isActive('link')) {
    // Nothing selected: insert the URL itself as the link text, then stop the
    // mark so the next character typed is not part of the link.
    ed.chain().focus()
      .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
      .unsetMark('link')
      .run()
  } else {
    ed.chain().focus().extendMarkRange('link').setLink({ href }).run()
  }
  linkMenu.value = false
}

function removeLink() {
  editor.value?.chain().focus().extendMarkRange('link').unsetLink().run()
  linkMenu.value = false
}

// ── Insert tag ───────────────────────────────────────────────────────────────

function insertTag(key: string) {
  editor.value?.chain().focus().insertContent(`{{${key}}}`).run()
}
</script>

<template>
  <div
    class="mp-rich-text"
    :class="{ 'mp-rich-text--error': !!error, 'mp-rich-text--disabled': disabled }"
    :style="{ '--mp-rich-text-rows': rows }"
  >
    <span v-if="label" :id="labelId" class="mp-rich-text__label" @click="focusEditor">
      {{ label }}<span v-if="required" aria-hidden="true"> *</span>
    </span>

    <div class="mp-rich-text__box">
      <div
        ref="toolbarEl"
        class="mp-rich-text__toolbar"
        role="toolbar"
        aria-label="Formatting"
        :aria-disabled="disabled || undefined"
        @keydown="onToolbarKeydown"
        @focusin="onToolbarFocusin"
        @mousedown.self.prevent
      >
        <v-btn
          v-for="tool in markGroup"
          :key="tool.id"
          icon
          variant="text"
          class="mp-rich-text__tool"
          :class="{ 'is-active': isActive(tool.id) }"
          :disabled="disabled"
          :aria-label="tool.label"
          :aria-pressed="isActive(tool.id) ? 'true' : 'false'"
          :tabindex="tabindexFor(tool.id)"
          data-mp-tool
          @mousedown.prevent
          @click="toggle(tool.id)"
        >
          <v-icon :icon="tool.icon" />
          <v-tooltip activator="parent" :text="tool.label" />
        </v-btn>

        <v-divider vertical class="mp-rich-text__divider" />

        <v-btn
          v-for="tool in listGroup"
          :key="tool.id"
          icon
          variant="text"
          class="mp-rich-text__tool"
          :class="{ 'is-active': isActive(tool.id) }"
          :disabled="disabled"
          :aria-label="tool.label"
          :aria-pressed="isActive(tool.id) ? 'true' : 'false'"
          :tabindex="tabindexFor(tool.id)"
          data-mp-tool
          @mousedown.prevent
          @click="toggle(tool.id)"
        >
          <v-icon :icon="tool.icon" />
          <v-tooltip activator="parent" :text="tool.label" />
        </v-btn>

        <v-divider vertical class="mp-rich-text__divider" />

        <v-menu
          v-model="linkMenu"
          location="bottom start"
          :close-on-content-click="false"
          :disabled="disabled"
          @after-enter="focusLinkField"
        >
          <template #activator="{ props: menu }">
            <v-btn
              v-bind="menu"
              icon
              variant="text"
              class="mp-rich-text__tool"
              :class="{ 'is-active': isActive('link') }"
              :disabled="disabled"
              aria-label="Link"
              aria-haspopup="dialog"
              :tabindex="tabindexFor('link')"
              data-mp-tool
              @mousedown.prevent
            >
              <v-icon icon="link" />
              <v-tooltip activator="parent" text="Link" />
            </v-btn>
          </template>

          <v-card flat border role="dialog" aria-label="Link" class="mp-rich-text__link-panel mp-card-inset--compact">
            <!-- novalidate: `example.com` is a fine answer here (normalizeUrl adds the
                 scheme), but type="url" constraint validation would block the submit. -->
            <form class="mp-rich-text__link-form" novalidate @submit.prevent="applyLink">
              <v-text-field
                ref="linkField"
                v-model="linkUrl"
                label="URL"
                placeholder="https://example.com"
                type="url"
                inputmode="url"
                autocomplete="off"
              />
              <div class="mp-rich-text__link-actions">
                <v-btn v-if="isActive('link')" variant="text" @click="removeLink">Remove link</v-btn>
                <v-btn type="submit" color="primary" :disabled="!linkUrl.trim()">Apply</v-btn>
              </div>
            </form>
          </v-card>
        </v-menu>

        <v-divider vertical class="mp-rich-text__divider" />

        <v-btn
          icon
          variant="text"
          class="mp-rich-text__tool"
          :class="{ 'is-active': isActive(TOGGLES.blockquote.id) }"
          :disabled="disabled"
          :aria-label="TOGGLES.blockquote.label"
          :aria-pressed="isActive(TOGGLES.blockquote.id) ? 'true' : 'false'"
          :tabindex="tabindexFor(TOGGLES.blockquote.id)"
          data-mp-tool
          @mousedown.prevent
          @click="toggle(TOGGLES.blockquote.id)"
        >
          <v-icon :icon="TOGGLES.blockquote.icon" />
          <v-tooltip activator="parent" :text="TOGGLES.blockquote.label" />
        </v-btn>

        <template v-if="hasTags">
          <v-divider vertical class="mp-rich-text__divider" />

          <v-menu location="bottom end" :disabled="disabled">
            <template #activator="{ props: menu }">
              <v-btn
                v-bind="menu"
                icon
                variant="text"
                class="mp-rich-text__tool"
                :disabled="disabled"
                aria-label="Insert tag"
                aria-haspopup="menu"
                :tabindex="tabindexFor('tag')"
                data-mp-tool
                @mousedown.prevent
              >
                <v-icon icon="braces" />
                <v-tooltip activator="parent" text="Insert tag" />
              </v-btn>
            </template>

            <v-list density="compact" role="menu" aria-label="Insert tag" class="mp-rich-text__tag-menu">
              <div
                v-for="(group, gi) in tagGroupsShown"
                :key="group.title"
                role="group"
                :aria-labelledby="`${uid}-tags-${gi}`"
              >
                <v-list-subheader :id="`${uid}-tags-${gi}`">{{ group.title }}</v-list-subheader>
                <MpMenuItem
                  v-for="tag in group.tags"
                  :key="tag.key"
                  :title="tag.label"
                  @click="insertTag(tag.key)"
                />
              </div>
            </v-list>
          </v-menu>
        </template>
      </div>

      <EditorContent :editor="editor" class="mp-rich-text__content" />
    </div>

    <div :id="descriptionId" class="mp-rich-text__details" aria-live="polite">
      <p v-if="message" class="mp-rich-text__message">{{ message }}</p>
    </div>
  </div>
</template>

<style scoped>
/* Zero external margin: the form container owns the space between fields. */
.mp-rich-text {
  --mp-rich-text-line: calc(var(--mp-fontSize-14) * var(--mp-lineHeight-normal));
  --mp-rich-text-pad-block: var(--mp-space-12);
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-labelGap);
  min-width: 0;
}

/* The one label spec — the values settings-form.scss gives a Vuetify field's
   static top label (text.label + field.labelHeight). Calm on focus and error. */
.mp-rich-text__label {
  font-size: var(--mp-text-label-fontSize);
  font-weight: var(--mp-text-label-fontWeight);
  line-height: var(--mp-component-field-labelHeight);
  color: var(--text-secondary);
}

/* ── Field box — the outlined-field look (settings-form.scss) ──────────────
   The boundary stays 1px; the focus/error width is an inset ring on top of it,
   so the 2px state never shifts the content by a pixel. */
.mp-rich-text__box {
  display: flex;
  flex-direction: column;
  min-width: 0;
  border: var(--mp-component-field-borderWidth) solid var(--border-strong);
  border-radius: var(--mp-component-input-radius);
  background: transparent;
  color: var(--text-primary);
  transition: border-color var(--mp-motion-duration-fast) ease, box-shadow var(--mp-motion-duration-fast) ease;
}

.mp-rich-text__box:hover {
  border-color: color-mix(in srgb, var(--border-strong) 60%, var(--text-secondary));
}

.mp-rich-text__box:focus-within {
  border-color: rgb(var(--v-theme-primary));
  box-shadow: inset 0 0 0 calc(var(--mp-component-field-borderWidthActive) - var(--mp-component-field-borderWidth)) rgb(var(--v-theme-primary));
}

/* After focus: equal specificity, so error wins when the field is both. */
.mp-rich-text--error .mp-rich-text__box,
.mp-rich-text--error .mp-rich-text__box:hover {
  border-color: rgb(var(--v-theme-error));
  box-shadow: inset 0 0 0 calc(var(--mp-component-field-borderWidthActive) - var(--mp-component-field-borderWidth)) rgb(var(--v-theme-error));
}

.mp-rich-text--disabled .mp-rich-text__label {
  color: var(--text-disabled);
}

.mp-rich-text--disabled .mp-rich-text__box,
.mp-rich-text--disabled .mp-rich-text__box:hover {
  border-color: var(--border-subtle);
  box-shadow: none;
  color: var(--text-disabled);
}

/* ── Toolbar — 32px tools in a 40px (control.height) row ──────────────────── */
.mp-rich-text__toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mp-space-2);
  padding: var(--mp-space-4) var(--mp-space-8);
  border-bottom: var(--mp-component-field-borderWidth) solid var(--border-subtle);
}

/* !important: maropostDefaults.VBtn writes radius / min-height / padding as
   inline styles, which only !important outranks (same as MpSegmentedControl). */
.mp-rich-text__tool {
  width: var(--mp-space-32) !important;
  height: var(--mp-space-32) !important;
  min-height: 0 !important;
  padding: 0 !important;
  border-radius: var(--mp-radius-8) !important;
  color: var(--text-secondary);
}

/* On the icon, not the button: the button's font-size is one of those inline styles. */
.mp-rich-text__tool :deep(.v-icon) {
  font-size: var(--mp-fontSize-18);
}

.mp-rich-text__tool.is-active {
  background: var(--accent-container);
  color: var(--accent-on-container);
}

.mp-rich-text__tool.v-btn--disabled {
  color: var(--text-disabled);
}

.mp-rich-text__divider {
  align-self: center;
  height: var(--mp-space-20);
  margin-inline: var(--mp-space-4);
  border-color: var(--border-subtle);
  opacity: 1;
}

/* ── Editable area ────────────────────────────────────────────────────────── */
.mp-rich-text__content {
  min-height: calc(var(--mp-rich-text-rows) * var(--mp-rich-text-line) + 2 * var(--mp-rich-text-pad-block));
  max-height: calc(var(--mp-rich-text-rows) * 2 * var(--mp-rich-text-line) + 2 * var(--mp-rich-text-pad-block));
  overflow-y: auto;
}

.mp-rich-text__content :deep(.ProseMirror) {
  min-height: calc(var(--mp-rich-text-rows) * var(--mp-rich-text-line) + 2 * var(--mp-rich-text-pad-block));
  padding: var(--mp-rich-text-pad-block) var(--mp-space-16);
  outline: none;
  font-size: var(--mp-fontSize-14);
  font-weight: var(--mp-fontWeight-regular);
  line-height: var(--mp-lineHeight-normal);
  color: inherit;
  overflow-wrap: anywhere;
}

/* Blocks reset at zero specificity (:where) so the one block-gap rule wins. */
.mp-rich-text__content :deep(.ProseMirror :where(p, ul, ol, blockquote)) {
  margin: 0;
}

.mp-rich-text__content :deep(.ProseMirror > * + *) {
  margin-top: var(--mp-space-8);
}

.mp-rich-text__content :deep(.ProseMirror :where(ul, ol)) {
  padding-inline-start: var(--mp-space-24);
}

.mp-rich-text__content :deep(.ProseMirror blockquote) {
  padding-inline-start: var(--mp-space-12);
  border-inline-start: var(--mp-space-2) solid var(--border-strong);
  color: var(--text-secondary);
}

/* Underlined as well as coloured, so a link never relies on colour alone. */
.mp-rich-text__content :deep(.ProseMirror a) {
  color: var(--accent-default);
  text-decoration: underline;
}

.mp-rich-text__content :deep(.ProseMirror p.is-editor-empty:first-child::before) {
  content: attr(data-placeholder);
  float: left;
  height: 0;
  color: var(--text-muted);
  pointer-events: none;
}

.mp-rich-text--disabled .mp-rich-text__content :deep(.ProseMirror) {
  cursor: default;
}

.mp-rich-text--disabled .mp-rich-text__content :deep(.ProseMirror a) {
  color: inherit;
}

/* ── Hint / error — the Vuetify messages row (settings-form.scss) ─────────── */
.mp-rich-text__details:empty {
  display: none;
}

.mp-rich-text__message {
  margin: calc(var(--mp-component-field-hintGap) - var(--mp-component-field-labelGap)) 0 0;
  font-size: var(--mp-fontSize-12);
  line-height: var(--mp-lineHeight-compact);
  color: var(--text-muted);
}

.mp-rich-text--error .mp-rich-text__message {
  color: rgb(var(--v-theme-error));
}

/* ── Popovers (teleported; global.scss paints the panel surface) ──────────── */
/* Radius, surface and border come from global.scss's popover rule. */
.mp-rich-text__link-panel {
  width: var(--mp-component-menu-formWidth);
  max-width: 100%;
}

.mp-rich-text__link-form {
  display: flex;
  flex-direction: column;
  gap: var(--mp-component-field-groupGap);
}

.mp-rich-text__link-actions {
  display: flex;
  justify-content: flex-end;
  gap: var(--mp-component-dialog-footerGap);
}

.mp-rich-text__tag-menu {
  min-width: var(--mp-component-menu-minWidth);
}
</style>
