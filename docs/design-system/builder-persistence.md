# Builder persistence glossary

Merchants should not relearn “how save works” on every builder. Use one of three modes and show the matching status chip via `MpBuilderShell` (`persistenceMode`).

| Mode | Chip (dirty → clean) | Primary CTA | Leave guard | Used by |
|---|---|---|---|---|
| **Explicit** | Unsaved → Saved | Save / Save & close | Yes — discard confirm | Journey, Email content, Theme code, Product wizard |
| **Autosave** | Unsaved → Autosaved | Publish / Save and Close | Flush on leave; confirm only if flush fails | Landing page editor |
| **Live draft** | Unpublished changes → Published | Publish | Yes while unpublished draft differs | Store theme builder, Chatbot |

## Rules

1. Every full-page builder uses `useDirtyLeaveGuard` (or autosave flush) so Back never silently drops work.
2. Exactly one visually primary CTA: Save, Publish, or Activate — not both filled-primary.
3. Never ship a Preview control without a handler (`MpBuilderPreviewDialog` or equivalent).
4. Node/panel “Apply” means local inspector commit; canvas **Save** persists the flow/document.

## Composables & components

- `src/composables/useDirtyLeaveGuard.ts` — route leave + optional `beforeunload`
- `src/components/MpBuilderShell.vue` — shared toolbar + panes + status chip
- `src/components/MpBuilderPreviewDialog.vue` — fullscreen preview overlay
- `src/components/MpConfirmDialog.vue` — discard / publish confirms
