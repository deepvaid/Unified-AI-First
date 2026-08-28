# PARITY — Import Contacts

**Source:** All Contacts toolbar → `IMPORT` (a modal; no URL of its own)
**Rebuild:** the `MpDialog` in [`src/views/Contacts/AllContacts.vue`](../../../src/views/Contacts/AllContacts.vue)

---

## Shell

| # | Source | Rebuilt | Notes |
|---|---|---|---|
| 1 | Centred modal, ~650px | ✅ | `MpDialog size="md"` — replaced the sandbox's earlier `MpFormDrawer` |
| 2 | Title `Import Contacts` | ✅ | |
| 3 | Subtitle (verbatim) | ✅ | "Select the import method and upload your list. Download the example file to view the format." |
| 4 | Footer `CANCEL` / `CONTINUE` | ✅ | `Continue` → `Start import` on step 2 |
| 5 | Multi-step with no progress indication | ⚠️ **added** `MpWizardSteps` — see deviations |

## Always-present controls

| # | Control | Options | Default | Rebuilt |
|---|---|---|---|---|
| 6 | `Import Method` radio | File / FTP / Automated | File | ✅ |
| 7 | `Delimiter` radio | Comma / Tab / Colon / Semi-Colon | Comma | ✅ |
| 8 | `Select List*` | account lists | none | ✅ |
| 9 | `EXAMPLE` download link | — | — | ✅ as `Example file` |
| 10 | `CONTINUE` disabled until valid | — | — | ✅ plus a stated reason |

## Branch A — File import

| # | Source element | Rebuilt |
|---|---|---|
| 11 | `Select File*` label | ✅ |
| 12 | `SELECT FILE` button + native input, `accept=".csv,.txt,.zip"` | ✅ accept preserved |
| 13 | Hint `Select .csv, .txt, .zip file only. The zip file must contain only one .txt or .csv file.` | ✅ merged with the size cap into one associated hint |
| 14 | Hint `The file size limit is 128 MB.` | ✅ merged as above |
| 15 | Chosen filename shown | ✅ (the source shows nothing until Continue) |

## Branch B — FTP import

| # | Source element | Rebuilt |
|---|---|---|
| 16 | `Select File*` becomes a server-path dropdown | ✅ |
| 17 | Hint `Select CSV or TXT File from FTP server (SFTP Access)` | ✅ reworded |
| 18 | Upload button and 128 MB cap disappear | ✅ |
| 19 | Example server path `abhishek/import/tab_work.txt` | ✅ seeded with 4 realistic paths |

## Branch C — Automated import

| # | Source element | Rebuilt |
|---|---|---|
| 20 | Jobs table `NAME · MODIFIED AT · CREATED AT · ACTION` | ✅ (minus `ACTION` — see open items) |
| 21 | Empty state `No data available` | ✅ as `MpEmptyState`; seeded non-empty so the populated case is visible too |
| 22 | `Select File` **loses its asterisk** and becomes optional | ✅ label and `required` both change |
| 23 | Hint `Select CSV File for header row mappings. (Optional)` | ✅ reworded |

## Step 2 — Field mapping

| # | Item | Status |
|---|---|---|
| 24 | Column-to-field mapping table | ⚠️ **inferred** — unreachable on UAT without a real upload |
| 25 | Row summary (detected / valid / skipped) | ⚠️ **inferred** |
| 26 | `Back` to step 1 | ✅ |

## Behaviours

| # | Source behaviour | Rebuilt |
|---|---|---|
| 27 | Switching method re-renders the middle region only | ✅ delimiter and list persist |
| 28 | Continue disabled until file + list chosen | ✅ |
| 29 | Cancel closes with no confirmation | ✅ matched |
| 30 | Success feedback | ⚠️ **inferred** — toast |
| 31 | Error states (malformed file, oversize, partial failure) | ❌ **not built** — never observed |

## Verification

| # | Check | Result |
|---|---|---|
| 32 | `npm run type-check` | ✅ passes |
| 33 | axe-core WCAG 2.0/2.1 A + AA, dialog subtree | ✅ **0 violations** |
| 34 | All three method branches render | ✅ screenshot-verified |
| 35 | Zero non-system styles | ✅ |

---

## Deliberate deviations

1. **Every radio now carries its own label.** In the source all three Import Method radios report
   the accessible name `File Import`, and all four Delimiter radios report `Comma` — only the first
   option in each group is labelled (audit A1, critical). Each group also gets a real group name.

2. **The file input is labelled and its constraints are associated.** The source's
   `input[type=file]` has no label at all, and the format and size rules are unassociated text
   (audit A2, A5).

3. **`MpWizardSteps` was added.** `CONTINUE` implies further steps but the source says nothing about
   how many or what they are (audit F5).

4. **The disabled `Continue` explains itself** in the footer — "Choose a file and a list to
   continue." (audit A6, F3).

5. **A dialog replaced the drawer.** The pre-existing sandbox import was an `MpFormDrawer`; the
   source is a centred modal, and `MpDialog` is the design system's one modal shell.

6. **The Automated jobs table is seeded non-empty.** The source account's is empty, which is the
   worst case to design against; both states are now reachable.

## Open items carried forward

- **Step 2 is inferred, not observed.** Reaching it requires uploading a real file to a live
  account. Its true layout, controls, and whether more steps follow are unknown. This is the
  largest gap in this rebuild.
- **The `ACTION` column** in the Automated jobs table was never populated on UAT, so its controls
  are unknown and are not rebuilt.
- **Whether Automated Import exposes a schedule** (frequency, time, retention) at a later step.
- **The `EXAMPLE` template's contents** — the link is present but downloads nothing.
- **Error handling** for malformed, oversize or partially-failing files.
