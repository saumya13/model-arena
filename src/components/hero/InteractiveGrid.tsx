import { useMemo } from "react";
import type { CSSProperties } from "react";

// Upper bound so the grid still fully tiles the hero without gaps —
// `auto-fill` computes the real column count from the container's width,
// this just needs to be "enough" cells to fill it. The hero section is
// capped at max-w-7xl (1280px), so 50 columns at 28px covers it with
// margin; 24 rows comfortably covers the hero's content height, including
// wrapped headlines on narrow viewports.
const CELL_PX = 28;
const MAX_COLUMNS = 50;
const MAX_ROWS = 24;

interface CellConfig {
  duration: number;
  delay: number;
}

function randomCellConfig(): CellConfig {
  return {
    // Long, staggered cycles so only a sparse handful of cells are ever
    // mid-flash at once, rather than the whole grid pulsing in sync —
    // widened further to slow the overall pace of flickering.
    duration: 10 + Math.random() * 16,
    delay: Math.random() * 24,
  };
}

export function InteractiveGrid() {
  const cells = useMemo(
    () => Array.from({ length: MAX_COLUMNS * MAX_ROWS }, randomCellConfig),
    [],
  );

  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      <div
        className="grid h-full w-full [mask-image:radial-gradient(ellipse_75%_80%_at_50%_45%,black_0%,black_35%,transparent_90%)] [-webkit-mask-image:radial-gradient(ellipse_75%_80%_at_50%_45%,black_0%,black_35%,transparent_90%)]"
        style={{
          gridTemplateColumns: `repeat(auto-fill, ${CELL_PX}px)`,
          gridAutoRows: `${CELL_PX}px`,
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            className="grid-flicker-cell border-[0.5px] border-hairline transition-colors duration-500 ease-out hover:bg-signal-tint"
            style={
              {
                animationDuration: `${cell.duration}s`,
                animationDelay: `-${cell.delay}s`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Softens the grid right under the sticky header — the radial mask
          alone still left it fairly solid at the very top edge. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-paper to-transparent" />
    </div>
  );
}
