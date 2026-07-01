// Single source of truth for quant-metric display labels.
// Keys are the snake_case metric identifiers shared with the backend (see
// docs/API_CONTRACT.md → "Shared enums"). Add new metrics here only.
export const METRIC_LABELS = {
  forward_pe:     'Forward P/E',
  pb_ratio:       'P/B Ratio',
  ev_ebitda:      'EV/EBITDA',
  price_vs_ma200: 'Price / 200d MA',
  ps_ratio:       'P/S Ratio',
  debt_to_equity: 'Debt / Equity',
}

// Human label for a metric key, falling back to the raw key if unknown.
export const metricLabel = (metric) => METRIC_LABELS[metric] ?? metric
