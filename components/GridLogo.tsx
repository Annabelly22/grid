'use client';

interface Props {
  size?: number;
  /** 'mark' = symbol only | 'lockup' = symbol + wordmark */
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * GRID Logo — "The Focus Grid"
 *
 * A 4×4 pixel grid where lit cells form the letter G.
 * Design language: precision over ornament. Every lit cell is earned.
 * Stoic reference: the grid is the discipline — the center point is what matters.
 *
 * Grid pattern (■ = lit #00FF41, □ = dim):
 *   ■ ■ ■ □
 *   ■ □ □ □
 *   ■ □ ■ ■
 *   ■ ■ ■ □
 */
export default function GridLogo({ size = 40, variant = 'mark', className = '' }: Props) {
  const CELL = 9;
  const GAP = 3;
  const STEP = CELL + GAP; // 12
  const DIM = '#1C1C28';
  const LIT = '#00FF41';
  const GLOW_ID = `grid-glow-${size}`;

  // (col, row) → lit?
  const LIT_CELLS: [number, number][] = [
    // Row 0
    [0,0],[1,0],[2,0],
    // Row 1
    [0,1],
    // Row 2
    [0,2],[2,2],[3,2],
    // Row 3
    [0,3],[1,3],[2,3],
  ];
  const litSet = new Set(LIT_CELLS.map(([c,r]) => `${c},${r}`));

  const COLS = 4;
  const ROWS = 4;
  const MARK_W = COLS * STEP - GAP; // 45
  const MARK_H = ROWS * STEP - GAP; // 45
  const WORDMARK_HEIGHT = 14;
  const WORDMARK_GAP = 10;

  const totalH = variant === 'lockup' ? MARK_H + WORDMARK_GAP + WORDMARK_HEIGHT : MARK_H;
  const scale = size / MARK_W;
  const viewH = totalH * scale;

  return (
    <svg
      className={className}
      width={size}
      height={variant === 'lockup' ? Math.round(viewH) : size}
      viewBox={`0 0 ${MARK_W} ${variant === 'lockup' ? totalH : MARK_W}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GRID"
    >
      <defs>
        <filter id={GLOW_ID} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Grid cells */}
      {Array.from({ length: ROWS }, (_, row) =>
        Array.from({ length: COLS }, (_, col) => {
          const isLit = litSet.has(`${col},${row}`);
          const x = col * STEP;
          const y = row * STEP;
          return (
            <rect
              key={`${col}-${row}`}
              x={x}
              y={y}
              width={CELL}
              height={CELL}
              fill={isLit ? LIT : DIM}
              filter={isLit ? `url(#${GLOW_ID})` : undefined}
            />
          );
        })
      )}

      {/* Wordmark */}
      {variant === 'lockup' && (
        <text
          x={MARK_W / 2}
          y={MARK_H + WORDMARK_GAP + WORDMARK_HEIGHT - 2}
          textAnchor="middle"
          fontFamily="'Orbitron', sans-serif"
          fontWeight="900"
          fontSize={WORDMARK_HEIGHT}
          letterSpacing="6"
          fill={LIT}
          filter={`url(#${GLOW_ID})`}
        >
          GRID
        </text>
      )}
    </svg>
  );
}
