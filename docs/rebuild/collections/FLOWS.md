# FLOWS — Collections (Commerce)

Crawled 2026-08-29, UAT account 116000. No writes executed.

## 1. NEW COLLECTION ▾ → Automated Collection (`…/collections/new?type=dynamic`)

1. Full-page editor "New Automated Collection" (fields per AUDIT).
2. Conditions: default one rule row (Field=Title); `+ ADD RULE` appends rows; trash removes;
   incomplete rules show red outlines ("Variations"-style inline validation).
3. `SAVE` disabled until required fields valid.
4. `CANCEL` → **confirm dialog** "Cancel Collection Creation … cannot be undone" CANCEL/CONFIRM →
   CONFIRM returns to list.

- **Unverified:** SAVE outcome; Price-field operators (numeric); Sales channels `+` panel;
  image upload; Parent Collection option list.

## 2. NEW COLLECTION ▾ → Manual Collection (`…/collections/new?type=manual`)

Same shell; Products section instead of Conditions. `ADD PRODUCTS` → **Add Products modal**
(search icon, filter icon, row list w/ hover checkboxes, status chips, pagination 10/45, `ADD`
disabled until selection). Modal `ADD`/selection **not executed**; in-table Action column
(presumably remove) unverified while empty.

## 3. Edit collection (row kebab → Edit, or Title link)

Not opened this crawl — presumed the same editor prefilled (per module convention). **Unverified.**

## 4. Delete collection (row kebab)

**Not executed.** Confirm dialog unverified.

## 5. Bulk actions

Select rows → "N Selected · Choose an action ▾": Set as Active / Set as Inactive /
Delete Collections. **None executed.**

## 6. FILTERS

Status (Active|Inactive) · Type (Manual|Automated) · Parent Collection → APPLY / CANCEL.

## 7. Table mechanics

Sortable columns (URL `sortBy.*`), pagination, funnel icon on automated titles, parent subtitle.
