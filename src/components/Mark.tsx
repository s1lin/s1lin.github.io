/**
 * The mark: a cross on a block of ink. The favicon is the same drawing, and
 * Brick Locator's. In night mode the block takes the light ink and the cross
 * the dark stock, like everything else printed here.
 */
export function Mark({ className }: { className?: string }) {
  return (
    <svg className={`brand-mark ${className ?? ""}`} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" />
      <path d="M32 14v36M14 32h36" />
    </svg>
  );
}

/**
 * The mark as set out with compass and square: a circle struck from the
 * centre through the corners of the block, the centre lines, and the cross on
 * them, with the compass point left at the centre.
 */
export function MarkSetOut() {
  return (
    <svg
      className="mark-set-out"
      viewBox="0 0 120 120"
      role="img"
      aria-label="The mark set out with compass and square: a circle struck from its centre through the corners of the block, the centre lines, and the cross drawn on them"
    >
      <rect className="mark-set-out__block" x="36" y="36" width="48" height="48" />
      <g className="mark-set-out__guide">
        <path d="M4 60h112M60 4v112" strokeDasharray="10 3 2 3" />
        <circle cx="60" cy="60" r="33.94" strokeDasharray="2 2.5" />
        <path d="M60 60 84 36" />
      </g>
      <path className="mark-set-out__cross" d="M60 46.5v27M46.5 60h27" />
      <circle className="mark-set-out__pin" cx="60" cy="60" r="1.4" />
    </svg>
  );
}
