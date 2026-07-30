# 06 — Independent Audit (Phase 6)

**Method:** 3 fresh agents with no involvement in Phases 3–5's implementation, run in parallel: Audit A (static sweep — hard-coded values, light-token byte-diff vs `master`, accent identity, dead code), Audit B (code-level a11y re-verification + Storybook coverage), Audit C (live browser — visual regression both themes × 3 viewports, live DOM a11y checks, Storybook spot-check). Findings cross-referenced against `04-implementation-plan.md`'s locked decisions and `05-execution-log.md`'s narrative — only genuinely new gaps are reported, not re-litigated prior-program findings.

**Scope:** 179 files changed across 45 commits since `master` (merge-base `33f8fe0`).

---

## Summary

| Severity | Count |
|---|---|
| Blocker | 0 |
| High | 1 |
| Medium | 4 |
| Low | 3 |
| **Total** | **8** |

The single High finding was a real regression — not introduced by any tracked work package, but by two of my own later manual fixes (commits `22f9830`, `c662b42`, made in response to direct user feedback after Phase 5 and before this audit) that unintentionally reverted an already-shipped, already-verified accessibility fix. This is exactly the kind of gap an independent audit exists to catch, and it was caught by two auditors (A and B) independently computing the same contrast numbers.

---

## Findings

### AUD2-001 — MpDataTableToolbar search field resting-border contrast regression

| Field | Detail |
|---|---|
| **Severity** | High (found independently by Audit A and Audit B) |
| **File** | `src/components/MpDataTableToolbar.vue` |
| **Evidence** | Commits `22f9830`/`c662b42` (post-Phase-5 manual fixes, made at the user's direct request to restyle the toolbar search as a white pill) replaced WP-F2's compliant `background: var(--surface-secondary)` fill-based cue with `border: 1px solid var(--border-default)` against a now-identical `--surface-primary` background. Computed: light ≈1.26:1, dark ≈1.58:1 — both far under the 3:1 non-text contrast floor, effectively re-opening A11Y-001/002 for this component. Neither commit is WP-prefixed, so neither appears in `05-execution-log.md`'s narrative, which is why this wasn't self-caught before the audit. |
| **Status** | **Fixed** during Phase 6 remediation (see below) — verified live at 3.57:1 light / 5.90:1 dark. |

### AUD2-002 — `useDaVinciToasts.ts` pause-on-hover (A11Y-009) never implemented

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **File** | `src/composables/useDaVinciToasts.ts`, `src/components/copilot/DvToastStack.vue` |
| **Evidence** | `04-implementation-plan.md` WP-C1 explicitly scoped this as a required, separate deliverable ("apply the A11Y-009 pause-on-hover fix to `useDaVinciToasts.ts` (its own commit)"), but the WP-C1 foundation agent's own logged notes say it deliberately left both files untouched per a narrower reading of its task instructions, without flagging the pause-on-hover requirement as a dropped item. |
| **Status** | **Fixed** during Phase 6 remediation. |

### AUD2-003 — AppBar.stories.ts not updated for the new command-palette type-tabs

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **File** | `src/components/layout/AppBar.stories.ts` |
| **Evidence** | WP-C3 added a real, interactive type-tab row to the command palette but Storybook coverage for AppBar was not touched — a plan acceptance bullet left unmet. |
| **Status** | **Fixed** during Phase 6 remediation. |

### AUD2-004 — WidgetLibraryStep.stories.ts not updated to explicitly demonstrate the new grouping

| Field | Detail |
|---|---|
| **Severity** | Medium |
| **File** | `src/components/dashboards/wizard/WidgetLibraryStep.stories.ts` |
| **Evidence** | WP-C5's UX-002 grouping renders incidentally in the existing `Default` story (since "all" is the component's default state), but no story or doc note explicitly demonstrates/documents the new section-header behavior. |
| **Status** | **Fixed** during Phase 6 remediation. |

### AUD2-005 — Command-palette arrow-key navigation: inconclusive under automated testing

| Field | Detail |
|---|---|
| **Severity** | Medium → downgraded to informational after investigation |
| **File** | `src/components/layout/AppBar.vue` |
| **Evidence** | Audit C reported real DOM focus moving off the search input onto the palette's new "All" type-tab button after ArrowDown, in 2 of several trials, explicitly flagged as inconsistent and unconfirmed. I independently re-investigated live: across multiple clean, careful trials (confirmed palette open, confirmed focus state before and after each keypress), **focus never left the search input** — disproving the auditor's specific theory. A separate, milder anomaly did reproduce: the active-row highlight did not always visibly advance on a single simulated ArrowDown, but typing, clicking, and Escape showed similarly inconsistent behavior across trials tied to *when* the synthetic key/click was dispatched relative to prior focus state (e.g. clicking an already-focused input doesn't refire Vue's `@focus` handler, which is correct, expected behavior, not a bug) — consistent with automated key-dispatch/timing artifacts in this environment rather than a reproducible product defect. |
| **Correction** | None applied — no code change made on inconclusive evidence, to avoid introducing a real regression while fixing a possibly-nonexistent one. |
| **Validation** | Recommend a real (non-automated) manual keyboard pass — tab to the search field, type a query, and press Arrow Down/Up several times, confirming focus stays on the input and the highlighted row advances — before treating this as fully closed. |

### AUD2-006 — DvOrbitOrb.vue / DaVinciAI.vue: WP-C9 hex migration incomplete (Low)

| Field | Detail |
|---|---|
| **Severity** | Low |
| **File** | `src/components/copilot/voice/DvOrbitOrb.vue`, `src/views/DaVinci/DaVinciAI.vue` |
| **Evidence** | WP-C9 named both files in scope; `DvOrbitOrb.vue` centralized 2 hex values into local (not tokens.json) custom properties, and `DaVinciAI.vue`'s 4 gradient hex values remain with only an inline comment justifying the exception, not a logged plan allowlist entry. |
| **Status** | **Fixed** during Phase 6 remediation (DvOrbitOrb's 2 values folded into tokens.json alongside DvOrbCanvas's existing `--dv-orb-*` group; DaVinciAI's exception logged explicitly). |

### AUD2-007 — global.scss: WP-C7 scroll-shadow hardcodes `28px` twice instead of using the spacing token (Low)

| Field | Detail |
|---|---|
| **Severity** | Low |
| **File** | `src/styles/global.scss:557` |
| **Evidence** | `tokens.json` already defines `spacing.7 = 28px` (generated as `--mp-spacing-7`); this program's own WP-F3 tokenized comparable literals in the same file, but WP-C7's later addition used a raw `28px` twice. |
| **Status** | **Fixed** during Phase 6 remediation. |

### AUD2-008 — Tickets.vue: itemLabel adoption not applicable (Low, informational)

| Field | Detail |
|---|---|
| **Severity** | Low |
| **File** | `src/views/Service/Tickets.vue` |
| **Evidence** | WP-C3's plan named Tickets.vue for `itemLabel` adoption, but Tickets' UI has no per-row kebab menu to retrofit (only one ticket's action menu is ever open at a time) — the plan's assumption didn't hold for this view. |
| **Correction** | Documented as moot, no code change needed. If per-ticket disambiguation is wanted later, the one open-ticket action menu could get a dynamic `aria-label`. |

---

## What passed (confirmed correct, not re-flagged)

- **D5 (light-token byte-diff):** only `color.light.onSurfaceVariant` (WP-F1) plus new `moduleTile.*` leaves (additions, not modifications, WP-C9) changed in `tokens.json`'s light section.
- **D7 (accent identity):** cyan dark primary `#2CC4FF` and light accent unchanged everywhere, including two independent live re-checks (dashboard chart colors, Settings select checkmark).
- **D6 (showcase isolation):** `Deck`/`Reel`/`Showcase*`/`scripts/trailer` diffs are empty; the one `PosPreview.vue` touch (WP-F5 compat-alias rename) is value-preserving, already logged.
- **Toast migration cleanliness:** zero remaining `v-snackbar` outside the intentional exclusion; spot-checked files show no orphaned refs.
- **A11Y-001 through A11Y-010** (the original Phase 1 findings): all genuinely fixed in current code, re-verified against source, not just the log's claims — full detail in Audit B's notes.
- **MpConfirmDialog `consequences`, MpRowActionsMenu `itemLabel`, AppBar command-palette type-tabs, MpToastStack's full a11y contract** (persistent live region, role swap, real working pause/resume): all genuinely correct.
- **AppBar utility icon circles, notification badge clipping, Studio-shell header/sidebar background parity, toolbar trailing scroll-shadow:** all re-verified live, in both themes, matching what was claimed when each was fixed.
- **9 new Phase 5 story files:** all present, all following house CSF3/autodocs convention; `play()` function sanity-checked (6 functions across 5 files) against real component source — no bugs found.

---

## Remediation

All High and Medium findings (AUD2-001 through AUD2-004) were fixed during this same Phase 6 session; AUD2-005 was investigated and downgraded to informational (no fix applied, recommendation logged instead) rather than force a speculative change. AUD2-006 and AUD2-007 (Low) were also fixed since they were small, safe, and directly plan-aligned. AUD2-008 (Low) required no code change. See `05-execution-log.md` for the per-fix detail and commit references.
