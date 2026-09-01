# Recurring Campaign Reports — flows

The page has **no header actions**. Row-level flows only.

## Flow 1 — expand a recurring campaign

1. Click the row expander (▶).
2. Spinner renders inside the expander cell while occurrences load (~1-2s).
3. Child rows appear: `↳ Aug 30, 2026 at 01:20 AM` etc., one per send, same metric columns.
4. Click again to collapse.

States: loading (spinner), loaded (children), collapsed. No error state observed.

## Flow 2 — open a campaign report

1. Click a parent Name or a child occurrence label.
2. Navigates to `/accounts/:id/campaigns/:campaignId` — the standard campaign report
   (Dashboard / Overlay / ISP / Details tabs; audited in the 2026-08 Marketing slice).
3. Back via browser/breadcrumb.

## Flow 3 — pagination

1. Footer arrows page through 19 parents; rows-per-page select (default 10).

## Unverified

- Whether an occurrence row for a *deleted* campaign still links anywhere (no such data).
- Empty state (account has 19 records; not reachable without data manipulation).
