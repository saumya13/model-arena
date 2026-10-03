import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface ChartCardProps {
  title: string;
  subtitle: string;
  /** Optional controls (e.g. a metric toggle) shown top-right in both the card and the modal. */
  headerExtra?: ReactNode;
  /** Renders the plot at the given height — called once for the card and once for the expanded modal. */
  children: (height: number, expanded: boolean) => ReactNode;
}

/** A compact chart card; clicking it pops the same chart out, enlarged, in a modal. */
export function ChartCard({ title, subtitle, headerExtra, children }: ChartCardProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const renderHeader = (showExpandIcon: boolean) => (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h3 className="font-display text-lg font-semibold leading-tight text-ink">{title}</h3>
        <p className="mt-0.5 text-xs text-ink-soft">{subtitle}</p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {headerExtra && <div onClick={(e) => e.stopPropagation()}>{headerExtra}</div>}
        {showExpandIcon && (
          <svg
            viewBox="0 0 16 16"
            className="h-4 w-4 text-ink-faint transition group-hover:text-signal"
            aria-hidden
          >
            <path
              d="M9.5 2H14v4.5M14 2 9 7M6.5 14H2V9.5M2 14l5-5"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        )}
      </div>
    </div>
  );

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen(true)}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && setOpen(true)}
        aria-label={`Expand ${title} chart`}
        title="Click to expand"
        className="group cursor-pointer rounded-md border border-hairline-strong bg-panel p-4 transition hover:border-signal hover:shadow-md"
      >
        {renderHeader(true)}
        <div className="mt-3">{children(260, false)}</div>
      </div>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 px-4 backdrop-blur-md"
            role="dialog"
            aria-modal="true"
            aria-label={`${title} chart`}
            onClick={() => setOpen(false)}
          >
            <div
              className="max-h-[calc(100vh-3rem)] w-full max-w-5xl overflow-y-auto rounded-md border border-hairline bg-panel p-6 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start gap-4">
                <div className="min-w-0 flex-1">{renderHeader(false)}</div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close"
                  className="shrink-0 rounded px-2 text-xl leading-none text-ink-faint transition hover:text-ink"
                >
                  ×
                </button>
              </div>
              <div className="mt-4">{children(480, true)}</div>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
