import { useMemo } from "react";
import type { CSSProperties } from "react";

// Upper bound so the grid still fully tiles the hero without gaps —
// `auto-fill` computes the real column count from the container's width,
// this just needs to be "enough" cells to fill it. The hero section is
// capped at max-w-7xl (1280px), so 38 columns at 34px covers it with
// margin; 20 rows comfortably covers the hero's content height, including
// wrapped headlines on narrow viewports.
const CELL_PX = 34;
const MAX_COLUMNS = 38;
const MAX_ROWS = 20;

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
        // Recentered toward the diagram (right) side and faded in sooner —
        // the hero's left column carries the headline and subheading, so
        // the "fully visible" core of the grid sits under the diagram
        // instead, leaving the text sitting on a visibly fainter backdrop.
        className="grid h-full w-full [mask-image:radial-gradient(ellipse_70%_75%_at_66%_42%,black_0%,black_28%,transparent_85%)] [-webkit-mask-image:radial-gradient(ellipse_70%_75%_at_66%_42%,black_0%,black_28%,transparent_85%)]"
        style={{
          gridTemplateColumns: `repeat(auto-fill, ${CELL_PX}px)`,
          gridAutoRows: `${CELL_PX}px`,
        }}
      >
        {cells.map((cell, i) => (
          <div
            key={i}
            className="grid-flicker-cell border-[0.5px] border-grid-line transition-colors duration-500 ease-out hover:bg-signal-tint"
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
