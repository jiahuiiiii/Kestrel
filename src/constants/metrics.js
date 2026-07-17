// Single source of truth for quant-metric display labels.
// Keys are the snake_case metric identifiers shared with the backend — they must
// match `quant_service.METRIC_MAP` exactly, since that map is what decides which
// metrics can actually be fetched. (The pre-integration list here was the mock's:
// `pb_ratio`/`ev_ebitda`/`price_vs_ma200`/`ps_ratio` are not metrics the backend
// has ever fetched, while most of the real ones had no label at all.)
export const METRIC_LABELS = {
  forward_pe:     'Forward P/E',
  trailing_pe:    'Trailing P/E',
  price_to_book:  'P/B Ratio',
  price_to_sales: 'P/S Ratio',
  peg_ratio:      'PEG Ratio',
  market_cap:     'Market Cap',
  dividend_yield: 'Dividend Yield',
  beta:           'Beta',
  current_price:  'Current Price',
  eps:            'EPS',
  profit_margin:  'Profit Margin',
  revenue_growth: 'Revenue Growth',
  debt_to_equity: 'Debt / Equity',
}

// Human label for a metric key, falling back to a de-snaked version of the raw
// key so an unmapped metric still reads as words rather than `price_to_book`.
export const metricLabel = (metric) =>
  METRIC_LABELS[metric] ?? String(metric ?? '').replace(/_/g, ' ')
