# Journey Builder — design-system gaps & open items

1. **Mini-map** — production shows a Vue Flow mini-map (200×154) bottom-right. No design-system
   component exists and the tree canvas is a scroll surface, so it was not built. *Suggested spec:*
   `MpCanvasMinimap` taking a scroll container ref and rendering a proportional viewport rectangle;
   useful for the landing-page and store-theme builders too.

2. **Free-form canvas vs tree layout** — production is a Vue Flow graph (drag nodes anywhere,
   connect handles, multiple triggers, End steps with outgoing edges). The sandbox keeps the
   `JourneyFlowColumn` tree, which makes drag-to-position, handle-to-handle connecting and a
   second trigger impossible. Every audited *step type, form and action* exists; only the free
   placement does not. A canvas-grade `MpFlowCanvas` is a large component decision, flagged here
   rather than approximated.

3. **Node face as a component prop** — the compact/card faces are two templates inside
   `JourneyFlowColumn`. If other flows (data journeys, mini previews) want density switching, a
   `density` prop on a shared `MpFlowNode` would be the home for it.

4. **Product Purchased → "Product categories" tab** — its fields were not captured (the tab was
   not clicked; the pane was hidden). Rebuild carries the Product tab and Order status controls
   only. The template wizard's `categories` / `source` config keys are preserved.

5. **Truncated production copy** — three intro sentences came back cut off and were completed
   conservatively: Subscription Changed ("…from unsubscribed to subscribed."), Add to Do Not Mail
   ("…preventing them from receiving further emails."), End ("…helps you know which path contacts
   took."). Confirm against the source strings.

6. **Server copy unverified** — Save / Save-as-draft success text and the `validateJourney`
   message list live server-side or in an unreachable composable; the rebuild uses "Journey
   saved", "Draft saved" and the verified fallback "Journey is incomplete." (decision 5).

7. **Detach semantics** — calling production's Detach changed nothing observable. The rebuild
   keeps the sandbox meaning (unlink, park in the detached tray) per decision 6.

8. **Contact search** — production looks the contact up server-side and highlights the step they
   are in. The rebuild's deterministic mock always "finds" the contact; no-result copy is invented.

9. **Multiple triggers** — production lets you add a second trigger node; the tree has one root.
   Clicking a trigger in the palette replaces the root (or seeds an empty canvas).

## Resolved elsewhere

- `docs/rebuild/new-journey/GAPS.md` §6 (builder zoom behaviour) — answered by decision 1 and
  implemented here: CSS `zoom` stays, the face switches at 75 %, positions do not move.
