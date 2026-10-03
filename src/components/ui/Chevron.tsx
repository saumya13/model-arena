interface ChevronProps {
  /** "down" = expanded/open, "right" = collapsed/closed. */
  direction?: "down" | "right";
  className?: string;
}

export function Chevron({ direction = "down", className = "" }: ChevronProps) {
  return (
    <svg
      viewBox="0 0 12 12"
      className={`h-3 w-3 shrink-0 transition-transform ${direction === "right" ? "-rotate-90" : ""} ${className}`}
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
