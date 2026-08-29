# IMPROVEMENTS — New Campaign rebuild

Each line: what changed vs UAT, and why. 🔤 = copy change for review. Flow deviations were
pre-approved ("fix flow friction too", Phase-2 answer 4).

## Flow
1. **Honest stepper (5 steps)** — UAT hides six screens behind four dots (spam check inside
   Content, Review inside Schedule); a step you can see is a step you can navigate back to.
2. **Spam check on demand, not a gate** — UAT blocks Content→Schedule behind a mandatory
   full-screen check. It's now an optional section with the same score gauge; result still saved.
3. **Autosave replaces save-nagging** — UAT shows "please Save on Step 2" / "click save before
   proceeding" while Next already saves. One "Draft saved" chip; both alerts deleted.
4. **Announced, dismissible autofill** — picking a list silently overwrites five sender fields in
   UAT. Now announced ("Sender details filled from …") and framed as editable.
5. **Confirm before irreversible sends** — Send now / Schedule / Start schedule sit behind an
   MpConfirmDialog stating audience size and consequences; UAT sends on a single click.
6. **Zero-contact warning is persistent and inline** (Contacts + Review), not a dismissible toast
   you can scroll past. 🔤 grammar fixed ("will not be send" → "cannot send until…").
7. **A/B group management on the card** — duplicate/delete per group card + explicit Add group,
   replacing UAT's select-a-checkbox-then-find-the-toolbar-icons pattern; live allocation meter
   ("62% allocated · remaining 38% receives the winning variant") instead of a static rule blurb.
8. **Deep-link forwarding** — old links (`?id`, Da Vinci `?source=davinci`) land on the right
   wizard for the draft's kind instead of a chooser dead-end.

## Visual / consistency
9. **One footer pattern on every step** (Back · hint · n/N · primary), fixing UAT's per-step
   drift (BACK/NEXT → SPAM CHECK/Save → Back/Next → BACK/REVIEW/SAVE).
10. **Method + criteria descriptions live under the field** as the select's hint, replacing two
    ~10-line hover-only ⓘ tooltips (also a keyboard/screen-reader win).
11. **Recurring panels**: radio cards with weekday filter chips instead of seven bare checkboxes.
12. **Review as labeled definition lists** with section pencils, chips for audience sources, and
    readable values (Language "English", not `en`; Send now shows "immediately on launch",
    not a fake date).
13. **Wizard chrome** matches the house builder pattern (ProductWizard/CreatePromotion):
    MpPageHeader + MpWizardSteps + sticky footer, `component.*` tokens throughout.

## Copy 🔤
14. Preheader caption rewritten (source: "Enter a short summary text that is to follows the
    subject line…").
15. Test-email subject default `Test — {subject}` (source leaked junk data: "Test bkjhkj knlj -").
16. Chooser copy sentence-cased + tile descriptions added ("One message to a chosen audience…").
17. Toggle explanations surfaced as visible captions instead of hover tooltips.

## Accessibility
18. Single labeled heading hierarchy per step (h2 step title, h3 sections) — the source starts at
    h4 with duplicated landmarks.
19. Every icon-only control carries an aria-label (section pencils, group duplicate/delete).
20. Weekday picker is a real chip group with `aria-label`; wizard steps announce current/complete.
21. All selects/inputs are labeled Vuetify fields (static top labels), not placeholder-as-label.
