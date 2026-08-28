# AUDIT — Import Contacts

**Source:** `https://uat.maropost.com/accounts/116000/contacts` → **IMPORT** button (modal, no route of its own)
**Crawled:** 2026-08-28 · account 116000 (Regular UID Cloud-UAT) · Chrome, authenticated session
**Legacy stack:** Vue 2 + Vuetify 2 (`v-dialog--active`, `v-input--radio-group`)

> **Scope note.** The brief listed "import contact" against the URL `/accounts/116000/contact/new`.
> That URL is **not** an import flow — it is the manual single-contact create form, already audited
> in [`../new-contact/AUDIT.md`](../new-contact/AUDIT.md) and already rebuilt as
> `src/views/Contacts/CreateContact.vue`. The real import flow is a **modal launched from the
> All Contacts toolbar**, and is what this document audits. Confirm which one was intended —
> see Phase 2 questions.

> Crawl method: opened the modal and exercised all three Import Method branches, recording how the
> form re-renders for each. **Nothing was uploaded and CONTINUE was never reached** — step 2
> (field mapping) is therefore unverified. Closed with CANCEL.

---

## 1. Page purpose and primary user task

Bulk-load contacts into a list from a delimited file. Three delivery mechanisms share one form:
a browser upload, a pull from the account's SFTP drop, or a recurring scheduled job.

The **primary task** is: choose where the file comes from, tell the system how it is delimited,
and pick the list the contacts land in — then map its columns to contact fields (step 2, unverified).

**This is a modal, not a page**, and it has no URL of its own — it cannot be linked to, bookmarked,
resumed, or reached by browser back.

---

## 2. Layout structure and hierarchy

```
All Contacts page
└── Toolbar        "Contacts (491.4K)"        [IMPORT] [NEW CONTACT]
    └── Modal "Import Contacts"   (~650px, centred, dims page, internally scrollable)
        ├── Title      "Import Contacts"                        (H4)
        ├── Subtitle   "Select the import method and upload your list.
        │               Download the example file to view the format."
        ├── Group      "Import Method"   ○ File Import  ○ FTP Import  ○ Automated Import
        ├── ── branch-dependent region ──   (see §4)
        ├── Group      "Delimiter"       ○ Comma  ○ Tab  ○ Colon  ○ Semi-Colon
        ├── Label      "Select the list to import contacts."
        ├── Field      Select List*
        └── Footer     [CANCEL]  [CONTINUE]        (CONTINUE disabled)
```

The modal is tall enough to scroll internally at 704px viewport height, and the footer scrolls
with the content rather than pinning.

---

## 3. Component inventory → design-system mapping

| # | Legacy element | Observed behaviour | Marobase equivalent |
|---|---|---|---|
| 1 | `v-dialog` "Import Contacts" | Centred modal, dims page, internal scroll | **`MpDialog`** `size="md"` — never a raw `v-dialog` |
| 2 | Title (H4) + subtitle | Plain text | `MpDialog` `title` + `subtitle` |
| 3 | Radio group "Import Method" | 3 options, re-renders the region below | `MpFormField` + `v-radio-group` |
| 4 | Radio group "Delimiter" | 4 options, default Comma | `MpFormField` + `v-radio-group` |
| 5 | `SELECT FILE` button + native `input[type=file]` | `accept=".csv,.txt,.zip"` | `v-btn` + hidden file input (see GAPS) |
| 6 | `EXAMPLE` download link w/ `get_app` icon | Downloads a template file | `v-btn variant="text" prepend-icon` |
| 7 | `v-select` of server paths (FTP branch) | e.g. `abhishek/import/tab_work.txt` | `v-select` |
| 8 | Data table (Automated branch) | NAME / MODIFIED AT / CREATED AT / ACTION + "No data available" | `v-data-table` + **`MpEmptyState`** |
| 9 | `v-autocomplete` `Select List*` | Required, gates CONTINUE | `v-autocomplete` |
| 10 | CANCEL / CONTINUE | CONTINUE disabled until file + list chosen | `MpDialog` `#footer` |

**Rebuild note:** a 2-step Import Contacts drawer **already exists** in
`src/views/Contacts/AllContacts.vue` (source/upload + Field Mapping, `MpFormDrawer size="lg"`).
It was built without a UAT crawl and does **not** match this source — it has no Import Method
branch, no delimiter, and no FTP/Automated paths. See PARITY.

---

## 4. Data fields, labels and copy (verbatim)

### Always present

- Title: `Import Contacts`
- Subtitle: `Select the import method and upload your list. Download the example file to view the format.`
- Group label: `Import Method` — `File Import` · `FTP Import` · `Automated Import` (default **File Import**)
- Group label: `Delimiter` — `Comma` · `Tab` · `Colon` · `Semi-Colon` (default **Comma**)
- Label: `Select the list to import contacts.`
- Field: `Select List*` (required)
- Buttons: `CANCEL` · `CONTINUE` (disabled)
- Download link: `EXAMPLE`

### Branch A — `File Import` (default)

| Element | Copy (verbatim) |
|---|---|
| Field label | `Select File*` |
| Hint above | `Select .csv, .txt, .zip file only. The zip file must contain only one .txt or .csv file.` |
| Button | `SELECT FILE` |
| Hint below | `The file size limit is 128 MB.` |

Native input: `accept=".csv,.txt,.zip"`.

### Branch B — `FTP Import`

| Element | Copy (verbatim) |
|---|---|
| Field label | `Select File*` |
| Control | dropdown of server paths — observed value `abhishek/import/tab_work.txt` |
| Hint below | `Select CSV or TXT File from FTP server (SFTP Access)` |

The upload button and the 128 MB limit disappear; the `.zip` allowance is dropped from the copy
(CSV/TXT only).

### Branch C — `Automated Import`

| Element | Copy (verbatim) |
|---|---|
| Table columns | `NAME` · `MODIFIED AT` · `CREATED AT` · `ACTION` |
| Table empty state | `No data available` |
| Field label | `Select File` — **note: no asterisk in this branch** |
| Hint | `Select CSV File for header row mappings. (Optional)` |
| Button | `SELECT FILE` |

A list of existing automated import jobs appears above the form; in this account it is empty.
The file becomes optional here because it only supplies header names for mapping.

---

## 5. Interactions and behaviours

| Action | Result |
|---|---|
| Click `IMPORT` | Modal opens over the contacts table; page dims |
| Switch Import Method | The region between "Import Method" and "Delimiter" re-renders entirely; Delimiter and Select List persist |
| Switch to FTP | Upload button → server-path dropdown; hint text and accepted formats change |
| Switch to Automated | Jobs table appears above; `Select File*` loses its asterisk and becomes optional |
| `CONTINUE` | **Disabled** on load and in every branch until a file and a list are chosen |
| `CANCEL` | Closes the modal; no confirmation |
| `EXAMPLE` | Downloads a template file (not exercised) |

- **The Delimiter choice is offered before any file exists**, in every branch, and is never
  validated against the file's actual content.
- **CONTINUE implies at least one further step** — almost certainly column-to-field mapping, given
  the Automated branch's "header row mappings" copy. Not reached.

---

## 6. Accessibility findings

Verified against the live DOM.

| # | Severity | Finding | WCAG |
|---|---|---|---|
| A1 | **Critical** | **Radio options share one label.** All three Import Method radios report the accessible label `File Import`; all four Delimiter radios report `Comma`. Only the first option in each group is labelled — the rest are announced as duplicates of it. A screen-reader user cannot distinguish FTP Import from Automated Import, or Tab from Semi-Colon. | 1.3.1, 4.1.2 |
| A2 | High | **The file input has no label** (`NO-LABEL` on the native `input[type=file]`). `Select File*` is a nearby styled `<div>`, not a `<label>`. | 1.3.1, 3.3.2 |
| A3 | High | **Radio groups are not `fieldset`/`role="radiogroup"` with an accessible group name.** `Import Method` and `Delimiter` are styled text, not group labels. | 1.3.1 |
| A4 | High | **Modal title is `H4`** and is the only heading in the dialog. | 1.3.1, 2.4.6 |
| A5 | Medium | **The two file-format hints are not programmatically associated** with the control — `Select .csv, .txt, .zip file only…` and `The file size limit is 128 MB.` are unassociated text, so a screen-reader user meets the constraints only after an error. | 3.3.2 |
| A6 | Medium | **`CONTINUE` is disabled with no stated reason.** Nothing announces that a file and a list are required to proceed. | 3.3.2 |
| A7 | Medium | **The Automated Import jobs table has an `ACTION` column** whose controls were not present to inspect; the empty state `No data available` is a bare cell with no `role="status"`. | 4.1.3 |
| A8 | Medium | **Modal footer scrolls out of view**; at a 704px viewport the user must scroll inside the dialog to reach CANCEL/CONTINUE, with no persistent affordance. | — |
| A9 | Low | Uppercase labels (`SELECT FILE`, `CANCEL`, `CONTINUE`, `EXAMPLE`) are CSS-transformed; accessible names are correct. | — |

---

## 7. UX friction points

| # | Friction | Why it hurts |
|---|---|---|
| F1 | **Three unrelated jobs share one form.** A one-off upload, an SFTP pull, and a recurring scheduled job have different mental models, different prerequisites and different outcomes, but are presented as three radio buttons on a single screen that silently rewrites itself. | Automated Import in particular is a *scheduling* task wearing an *upload* form. |
| F2 | **Delimiter is asked before the file.** The user picks a delimiter for a file the system hasn't seen, and it is never checked against the file. A wrong choice surfaces as a broken mapping later. | Inverts the natural order; the system could detect this. |
| F3 | **`Select File*` loses its asterisk in the Automated branch** with no explanation beyond a parenthetical `(Optional)`. The same label means required in two branches and optional in the third. | Required markers become unreliable. |
| F4 | **File constraints are split across three separate lines** — formats above the button, size below it, zip rule mid-sentence — and vanish entirely in the FTP branch where different rules apply. | Constraints are hardest to find at the moment of choosing. |
| F5 | **No progress indication for a multi-step flow.** `CONTINUE` implies more steps but nothing says how many or what they are. | |
| F6 | **The modal has no URL.** A 128 MB upload with a mapping step cannot be linked, resumed, or recovered after an accidental dismiss. | Worst-case: a long upload lost to a stray click. |
| F7 | **`CANCEL` mid-upload has no confirmation.** | |
| F8 | **The Automated Import jobs table is buried inside a create modal.** Managing existing scheduled imports requires opening the "import contacts" dialog and selecting a radio button. | Management hidden inside creation. |
| F9 | **The empty jobs table renders as a bare header row plus "No data available"**, occupying a third of the modal to say nothing. | |
| F10 | **"LDS"-style jargon:** `(SFTP Access)` appears with no explanation of how a user obtains or configures that access. | Dead end for anyone not already set up. |

---

## 8. Realistic mock-data shape for the rebuild

```ts
type ImportMethod = 'file' | 'ftp' | 'automated'
type Delimiter = 'comma' | 'tab' | 'colon' | 'semicolon'

interface ContactImport {
  method: ImportMethod
  file?: File                 // file branch: .csv/.txt/.zip, ≤128 MB
  ftpPath?: string            // ftp branch: e.g. 'abhishek/import/tab_work.txt'
  delimiter: Delimiter        // default 'comma'
  listId: string              // required
  mapping?: Record<string, string>   // step 2 — shape unverified
}

interface AutomatedImportJob {
  id: string
  name: string
  modifiedAt: string
  createdAt: string
}
```

- Seed 3–4 FTP server paths and 3–4 automated jobs so neither control is only ever seen empty
  (the source account shows an empty jobs table, which is the *worst* case to design against).
- `useCdpEntities.lists` already backs `Select List*`.

---

## 9. Unverified — carried into Phase 2 questions

1. **Step 2 (field mapping) was never reached** — it requires uploading a real file to a live
   account. Its layout, its controls, and how many further steps follow are all unknown. This is
   the single biggest gap in this audit.
2. **Success state** — what happens after the final submit (toast, progress screen, emailed report).
3. **Error states** — malformed file, wrong delimiter, oversize file, duplicate rows, partial
   failure. None observed.
4. **The `ACTION` column** in the Automated Import jobs table — no rows existed to reveal its controls.
5. **Whether Automated Import exposes a schedule** (frequency, time, retention) at a later step.
6. **The `EXAMPLE` template's contents** — not downloaded.
7. **Whether the existing sandbox import drawer should be replaced or extended** to match this
   source. See PARITY.
