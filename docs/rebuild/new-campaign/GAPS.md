# GAPS — New Campaign rebuild

## 1. Third-party drag-and-drop email editor (+ device-preview service)
**Where:** Content step → Edit content → `CampaignContentEditor.vue` (fullscreen MpDialog).
**Source behavior:** UAT embeds a third-party DnD builder ("Edit Content — Editor Type: DnD")
that also generates per-device inbox previews. It could not be crawled (it hard-froze the tab
for 60s+ while loading) and per the Phase-2 decision is **mocked**: static block palette,
non-editing canvas, and a simulated "Generate previews" flow producing desktop / tablet /
mobile / mobile-dark frames from `CampaignEmailPreview`.
**If ever built for real:** an `MpEmailEditorShell` wrapping the vendor iframe, with the
device-preview grid as a first-class design-system surface (the mock's layout is the spec).

## 2. Email content HTML
`useContent.ts` items have no stored HTML, so every campaign preview renders the same mock
abandoned-cart email (`CampaignEmailPreview`). Fine for the sandbox; a real integration needs
content-record HTML and an iframe-sandboxed renderer.

## 3. Spam-check failure state
Source copy exists ("Please contact Maropost Deliverability team…") but the failing visual was
not reachable on UAT and the sandbox check always scores 0. If wanted: a mock content flagged
"spammy" that returns a red gauge + that copy.

## 4. Emoji picker
UAT's subject/preheader/test-subject fields embed an emoji-picker popover. Not reproduced —
no design-system emoji-picker exists and the fields accept pasted emoji anyway. Spec if needed:
an `MpEmojiMenu` (v-menu + category grid) attachable via `append-inner` slot.

## 5. Entitlement gating for STO/CTO
All six schedule methods are always visible in the sandbox. The real platform gates
Send-Time/Conversion-Time Optimization per account; the sandbox has no entitlement model for
campaign features (PLG store gates clouds, not send methods).
