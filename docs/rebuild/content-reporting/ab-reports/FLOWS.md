# A/B Campaign Reports — flows

## Flow 1 — filter by date

1. Click Start Date → mini calendar popover; pick a day.
2. Click End Date → same.
3. List refetches filtered by send window. (Filtering verified only as UI; did not assert the
   result set — flagged unverified.)

## Flow 2 — expand a test

1. Click expander on a parent row.
2. Child rows render: variant A, variant B, remainder/final (name suffixes differ per test),
   each with Sent At + metrics.

## Flow 3 — open the A/B comparison detail

1. Click a parent Name → `/campaigns/:id/ab_report`.
2. Detail renders: 3 columns (Final "Decided by TopChoice" tinted + A + B), KPI tiles,
   linked metric table, Overview rows, Details section.
3. Any metric count links to the campaign sub-report (delivered_report / open_report /
   link_report / bounce_report). Followed one level only.
4. Back via breadcrumb "A/B Campaign Reports".

States: list loading spinner; lazy child-row spinner; detail loads in one shot.

## Unverified

- Date filter's exact matching semantics (Sent At vs Updated At).
- Whether an unsent A/B test's detail hides the Final column (all sampled tests had one).
- The four metric sub-report pages (existing campaign-report scope, not this slice).
