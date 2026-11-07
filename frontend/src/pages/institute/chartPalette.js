// Chart colours for the institute panel, checked with the dataviz palette validator against the
// card surface (#FEFEFE): all pass colour-blind separation; amber is light on white, so every
// chart also offers a table view and direct value labels.
export const SERIES = {
  blue: "#4F6BED",
  pink: "#EF1C61",
  amber: "#D9930F",
  purple: "#8B6FE0",
  green: "#2F9E6E",
};

// Fixed categorical order — never cycled, never re-ordered by rank.
export const CATEGORICAL = [SERIES.blue, SERIES.pink, SERIES.amber, SERIES.purple, SERIES.green];

// Participation states (status colours, always shown with a label).
export const STATUS = {
  submitted: SERIES.green,
  "in-progress": SERIES.blue,
  "not-started": "#C9CCDB",
};

export const NEUTRAL = "#9A97AD";
