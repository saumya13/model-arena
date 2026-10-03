interface ChevronProps {
  /** "down" = expanded/open, "right" = collapsed/closed, "left" = collapses toward/retracts left. */
  direction?: "down" | "right" | "left";
  className?: string;
}

const ROTATION: Record<string, string> = {
  right: "-rotate-90",
  left: "rotate-90",
};

export function Chevron({ direction = "down", className = "" }: ChevronProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 transition-transform ${ROTATION[direction] ?? ""} ${className}`}
      aria-hidden
    >
      <path
        d="M2.5 4.5 6 8l3.5-3.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
