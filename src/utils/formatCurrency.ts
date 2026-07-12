/** Whole-dollar currency formatting (no cents) — the default for KPIs and table money cells. */
export const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n)

/** Cents-precise currency formatting — for line items where exact amounts matter. */
export const formatCurrencyCents = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
