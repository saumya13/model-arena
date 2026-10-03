// Categorical palette for the metrics charts — the 8-slot order validated by
// the dataviz skill's palette reference against the app's white chart surface
// (adjacent-pair CVD/contrast gates all pass; see references/palette.md).
// Order is fixed and never re-sorted: a model is assigned the next free slot
// the first time it appears across run history and keeps that color for the
// rest of the session, even if later runs drop it from the selection.
const CATEGORICAL_PALETTE = [
  "#2a78d6", // blue
  "#eb6834", // orange
  "#1baf7a", // aqua
  "#eda100", // yellow
  "#e87ba4", // magenta
  "#008300", // green
  "#4a3aa7", // violet
  "#e34948", // red
] as const;

// Beyond the validated 8-slot ceiling, fold any further series into a single
// muted gray rather than generating/cycling a 9th hue (indistinguishable
// under CVD — see the skill's anti-patterns reference).
const OVERFLOW_COLOR = "#898781";

export function assignSeriesColors(idsInFirstAppearanceOrder: string[]): Map<string, string> {
  const colors = new Map<string, string>();
  idsInFirstAppearanceOrder.forEach((id, i) => {
    colors.set(id, CATEGORICAL_PALETTE[i] ?? OVERFLOW_COLOR);
  });
  return colors;
}
