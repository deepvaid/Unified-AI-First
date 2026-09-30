import type { Meta, StoryObj } from '@storybook/vue3'
import MpCodeEditor from './MpCodeEditor.vue'
import { grid } from '@/stories/storyTemplate'
import { surfaceFrame } from '@/stories/decorators'

const HTML = `{{ define "section:hero" }}
{{ $s := .Settings }}
<section class="section section--hero color-scheme-{{ $s.color_scheme | default "default" }}"
         data-section-id="{{ .Id }}">
  <div class="container text-{{ $s.alignment | default "left" }}">
    <h1 class="hero__title">{{ $s.heading }}</h1>
    {{ range .Blocks }}
      {{ block .Type . }}
    {{ end }}
  </div>
</section>
{{ end }}
`

const JSON_SAMPLE = `{
  "id": "default",
  "label": "Home",
  "layout": "default",
  "sections": {
    "hero-1": { "type": "hero", "settings": { "color_scheme": "default" } },
    "category-grid-2": { "type": "category-grid", "settings": {} }
  },
  "order": ["hero-1", "category-grid-2"]
}
`

const CSS_SAMPLE = `/* Lumos — theme-level custom properties */
:root {
  --color-primary: #5b5fc7;
  --font-heading: 'Inter', system-ui, sans-serif;
  --button-radius: 8px;
}

.btn--primary {
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--button-radius);
}
`

const JS_SAMPLE = `// Cart — progressive enhancement over the server-rendered markup.
(function () {
  const root = document.querySelector('[data-cart]');
  if (!root) return;
  root.addEventListener('click', (event) => {
    const trigger = event.target.closest('[data-cart-action]');
    if (trigger) root.dispatchEvent(new CustomEvent('cart:action', { detail: trigger.dataset }));
  });
})();
`

const meta = {
  title: 'Molecules/MpCodeEditor',
  component: MpCodeEditor,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
### Overview
\`MpCodeEditor\` is the design system's one code-editing surface — CodeMirror 6 behind a
\`v-model\`, with the chrome on tokens. Geometry comes from \`component.editor.codeFontSize\` /
\`codeLineHeight\`; the gutter, active line and selection sit on the surface ladder; every syntax
colour is one of the seven \`--code-*\` aliases (\`color.light.code.*\` / \`color.dark.code.*\`,
each a declared contrast pair), so the editor flips with the theme like any other surface.

**Use when:** a merchant edits theme files, custom CSS, a JSON schema, or a SQL/query field that
deserves highlighting and a real editing model (undo, bracket matching, folding).

**Don't use when:** the value is a one-line expression or a URL — that is a \`v-text-field\`.

### Usage
\`\`\`html
<MpCodeEditor :key="file.path" v-model="file.content" language="html" :aria-label="\`Editor content: \${file.path}\`" @save="saveAll" />
\`\`\`

### 🟢 Do's
- **Do** key the component by document: the undo history belongs to the file, so swapping
  \`modelValue\` for a different file would carry the previous file's undo stack along.
- **Do** handle \`save\` — Cmd/Ctrl+S inside the editor emits it and swallows the browser's dialog.
- **Do** give the pane a height; the editor fills its parent and scrolls inside it.

### 🔴 Don'ts
- **Don't** restyle \`.cm-*\` from a host — the theme lives here, on tokens.
- **Don't** pass a raw hex for a syntax colour — add the role to \`color.*.code\` first.

### A11y
- **Provides:** a labelled \`role="textbox"\` content area (\`ariaLabel\`), keyboard editing,
  Tab indents (Esc then Tab leaves the editor per CodeMirror's default keymap).
- **Consumer must:** name the document in \`ariaLabel\` and key the instance per document.
        `,
      },
    },
  },
  args: {
    modelValue: HTML,
    language: 'html',
    ariaLabel: 'Editor content: sections/hero.html',
    readonly: false,
    lineNumbers: true,
  },
  argTypes: {
    language: { control: 'select', options: ['html', 'json', 'css', 'javascript', 'text'] },
    'onUpdate:modelValue': { table: { category: 'events' }, description: 'The document text after every edit.' },
    onSave: { table: { category: 'events' }, description: 'Cmd/Ctrl+S inside the editor.' },
  },
} satisfies Meta<typeof MpCodeEditor>

export default meta
type Story = StoryObj<typeof meta>

/** A Go-template section file — the HTML grammar with Liquid-style `{{ }}` tags. */
export const Default: Story = {
  decorators: [surfaceFrame({ height: '360px' })],
}

/** The four grammars the theme code editor opens, side by side. */
export const Variants: Story = {
  name: 'Variants (languages)',
  render: grid({ MpCodeEditor }, [
    { label: 'HTML · Go template', args: { modelValue: HTML, language: 'html', ariaLabel: 'HTML sample' } },
    { label: 'JSON', args: { modelValue: JSON_SAMPLE, language: 'json', ariaLabel: 'JSON sample' } },
    { label: 'CSS', args: { modelValue: CSS_SAMPLE, language: 'css', ariaLabel: 'CSS sample' } },
    { label: 'JavaScript', args: { modelValue: JS_SAMPLE, language: 'javascript', ariaLabel: 'JavaScript sample' } },
  ], { columns: 'repeat(2, minmax(0, 1fr))', itemClass: 'sb-code-frame' }),
}

/** One geometry — the editor has no size ramp; the pane it fills decides. */
export const Sizes: Story = {
  name: 'Sizes (fills its pane)',
  render: grid({ MpCodeEditor }, [
    { label: 'Narrow pane', args: { modelValue: JSON_SAMPLE, language: 'json', ariaLabel: 'Narrow pane' } },
  ], { columns: 'minmax(0, 420px)' }),
}

/** Read-only and gutter-less — the two switches a host can flip. */
export const States: Story = {
  render: grid({ MpCodeEditor }, [
    { label: 'Editable', args: { modelValue: CSS_SAMPLE, language: 'css', ariaLabel: 'Editable' } },
    { label: 'Read-only', args: { modelValue: CSS_SAMPLE, language: 'css', readonly: true, ariaLabel: 'Read-only' } },
    { label: 'No line numbers', args: { modelValue: CSS_SAMPLE, language: 'css', lineNumbers: false, ariaLabel: 'No line numbers' } },
  ], { columns: 'repeat(auto-fit, minmax(320px, 1fr))' }),
}
