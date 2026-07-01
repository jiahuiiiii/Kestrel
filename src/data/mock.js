export const THESES = [
  {
    id: 1,
    ticker: 'NVDA',
    name: 'NVIDIA Corporation',
    sector: 'Semiconductors',
    signal: false,
    status: 'watching',
    lastEvaluated: '2026-07-01T06:00:00Z',
    notes: 'Waiting for valuation to compress + confirmation that hyperscaler capex cycle is peaking.',
    quantConditions: [
      { id: 1, metric: 'forward_pe', operator: '<', value: 28, currentValue: 31.2, met: false },
      { id: 2, metric: 'price_vs_ma200', operator: '<', value: 1.05, currentValue: 0.97, met: true },
    ],
    catalysts: [
      { id: 1, description: 'Hyperscaler capex guidance cut in earnings call', triggered: false },
      { id: 2, description: 'Data center revenue deceleration confirmed (QoQ growth < 5%)', triggered: false },
    ],
    evaluations: [
      {
        id: 101,
        timestamp: '2026-07-01T06:00:00Z',
        signal: false,
        quantResults: [
          { metric: 'forward_pe', operator: '<', value: 28, currentValue: 31.2, met: false },
          { metric: 'price_vs_ma200', operator: '<', value: 1.05, currentValue: 0.97, met: true },
        ],
        catalystResults: [
          { description: 'Hyperscaler capex guidance cut in earnings call', verdict: false, confidence: 0.12, quote: null, articleHeadline: 'NVIDIA posts record Q1 revenue, guides higher' },
          { description: 'Data center revenue deceleration confirmed', verdict: false, confidence: 0.08, quote: null, articleHeadline: null },
        ],
        reason: '1/2 quant conditions met. 0/2 catalysts confirmed. Thesis not yet triggered.',
      },
      {
        id: 100,
        timestamp: '2026-06-30T06:00:00Z',
        signal: false,
        quantResults: [
          { metric: 'forward_pe', operator: '<', value: 28, currentValue: 32.8, met: false },
          { metric: 'price_vs_ma200', operator: '<', value: 1.05, currentValue: 1.01, met: true },
        ],
        catalystResults: [],
        reason: '1/2 quant conditions met. Catalyst scan: no relevant articles found.',
      },
    ],
  },
  {
    id: 2,
    ticker: 'AAPL',
    name: 'Apple Inc.',
    sector: 'Consumer Electronics',
    signal: true,
    status: 'signal',
    lastEvaluated: '2026-07-01T06:00:00Z',
    notes: 'All conditions met. Awaiting your review.',
    quantConditions: [
      { id: 3, metric: 'forward_pe', operator: '<', value: 25, currentValue: 24.1, met: true },
      { id: 4, metric: 'pb_ratio', operator: '<', value: 40, currentValue: 38.5, met: true },
    ],
    catalysts: [
      { id: 3, description: 'Apple Intelligence adoption metrics beat expectations in quarterly filing', triggered: true, triggeredAt: '2026-06-30T14:23:00Z' },
    ],
    evaluations: [
      {
        id: 201,
        timestamp: '2026-07-01T06:00:00Z',
        signal: true,
        quantResults: [
          { metric: 'forward_pe', operator: '<', value: 25, currentValue: 24.1, met: true },
          { metric: 'pb_ratio', operator: '<', value: 40, currentValue: 38.5, met: true },
        ],
        catalystResults: [
          {
            description: 'Apple Intelligence adoption metrics beat expectations in quarterly filing',
            verdict: true,
            confidence: 0.94,
            quote: '"Apple Intelligence features saw a 34% quarter-over-quarter increase in daily active users, surpassing analyst consensus of 22%."',
            articleHeadline: 'Apple Q2 2026: AI Features Drive Record Services Revenue',
          },
        ],
        reason: 'All 2/2 quant conditions met. Catalyst confirmed with high confidence (0.94). SIGNAL TRIGGERED.',
      },
    ],
  },
  {
    id: 3,
    ticker: 'MSFT',
    name: 'Microsoft Corporation',
    sector: 'Cloud & Software',
    signal: false,
    status: 'watching',
    lastEvaluated: '2026-07-01T06:00:00Z',
    notes: 'Azure growth reacceleration is the key catalyst. Watching for Copilot enterprise penetration data.',
    quantConditions: [
      { id: 5, metric: 'ev_ebitda', operator: '<', value: 22, currentValue: 26.8, met: false },
    ],
    catalysts: [
      { id: 4, description: 'Azure growth re-acceleration above 30% YoY in earnings', triggered: false },
      { id: 5, description: 'Copilot enterprise penetration exceeds 20% of M365 seats', triggered: false },
    ],
    evaluations: [
      {
        id: 301,
        timestamp: '2026-07-01T06:00:00Z',
        signal: false,
        quantResults: [
          { metric: 'ev_ebitda', operator: '<', value: 22, currentValue: 26.8, met: false },
        ],
        catalystResults: [
          { description: 'Azure growth re-acceleration above 30% YoY', verdict: false, confidence: 0.31, quote: null, articleHeadline: 'Microsoft Azure grows 27% in latest quarter, misses target' },
          { description: 'Copilot enterprise penetration exceeds 20%', verdict: false, confidence: 0.18, quote: null, articleHeadline: null },
        ],
        reason: '0/1 quant conditions met. 0/2 catalysts confirmed. Azure growth at 27%, below 30% threshold.',
      },
    ],
  },
  {
    id: 4,
    ticker: 'TSM',
    name: 'Taiwan Semiconductor',
    sector: 'Semiconductors',
    signal: false,
    status: 'watching',
    lastEvaluated: '2026-07-01T06:00:00Z',
    notes: 'Geopolitical risk premium makes this interesting if tensions ease and valuation dips.',
    quantConditions: [
      { id: 6, metric: 'forward_pe', operator: '<', value: 18, currentValue: 19.4, met: false },
      { id: 7, metric: 'price_vs_ma200', operator: '<', value: 1.0, currentValue: 1.06, met: false },
    ],
    catalysts: [
      { id: 6, description: 'US-Taiwan semiconductor partnership agreement announced', triggered: false },
      { id: 7, description: 'N2 node yield rates confirmed above 70% in analyst day', triggered: false },
    ],
    evaluations: [
      {
        id: 401,
        timestamp: '2026-07-01T06:00:00Z',
        signal: false,
        quantResults: [
          { metric: 'forward_pe', operator: '<', value: 18, currentValue: 19.4, met: false },
          { metric: 'price_vs_ma200', operator: '<', value: 1.0, currentValue: 1.06, met: false },
        ],
        catalystResults: [],
        reason: '0/2 quant conditions met. No relevant news articles found this cycle.',
      },
    ],
  },
];

export const PROPOSALS = [
  {
    id: 1,
    thesisId: 1,
    ticker: 'NVDA',
    type: 'adjust_threshold',
    status: 'pending',
    createdAt: '2026-07-01T06:01:00Z',
    proposedChange: {
      metric: 'forward_pe',
      currentValue: 28,
      suggestedValue: 30,
      rationale: 'Your P/E < 28 threshold sits at the 6th percentile of NVDA\'s 2-year range — it has triggered only twice in 24 months. Loosening to 30 (22nd percentile) increases signal frequency while still representing a meaningful discount to the 5-year average of 35.',
    },
  },
  {
    id: 2,
    thesisId: 1,
    ticker: 'NVDA',
    type: 'add_catalyst',
    status: 'pending',
    createdAt: '2026-06-29T06:01:00Z',
    proposedChange: {
      description: 'China export restriction tightening causes material revenue guidance cut',
      rationale: 'The last 14 NVDA news articles (past 7 days) mention China export controls in 11 of them. This is a recurring theme not captured in your current catalysts. If restrictions tighten further, it could be the trigger for both valuation compression and the capex re-evaluation you\'re watching for.',
    },
  },
  {
    id: 3,
    thesisId: 3,
    ticker: 'MSFT',
    type: 'adjust_threshold',
    status: 'rejected',
    createdAt: '2026-06-25T06:01:00Z',
    resolvedAt: '2026-06-25T09:14:00Z',
    proposedChange: {
      metric: 'ev_ebitda',
      currentValue: 22,
      suggestedValue: 24,
      rationale: 'EV/EBITDA < 22 has not triggered once in 18 months. Suggest loosening to 24.',
    },
  },
];
