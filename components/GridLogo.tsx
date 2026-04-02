'use client';

interface Props {
  size?: number;
  /** 'mark' = symbol only | 'lockup' = symbol + wordmark */
  variant?: 'mark' | 'lockup';
  className?: string;
}

/**
 * GRID Logo — Focus Reticle
 *
 * Outer ring → inner ring → four tick marks → center dot.
 * Meaning: precision, focus, direction. The center is what matters.
 * Every element points inward — toward the thing you're working on.
 */
export default function GridLogo({ size = 40, variant = 'mark', className = '' }: Props) {
  const W  = 44;
  const CX = 22, CY = 22;
  const R1 = 20;   // outer ring
  const R2 = 8;    // inner ring
  const RC = 2.5;  // center dot
  const C  = '#00FF41';
  const GLOW_ID = `grid-glow-${size}`;

  const WORDMARK_H   = 11;
  const WORDMARK_GAP = 9;
  const totalH = variant === 'lockup' ? W + WORDMARK_GAP + WORDMARK_H : W;

  return (
    <svg
      className={className}
      width={size}
      height={variant === 'lockup' ? Math.round(size * (totalH / W)) : size}
      viewBox={`0 0 ${W} ${totalH}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label="GRID"
    >
      <defs>
        <filter id={GLOW_ID} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g filter={`url(#${GLOW_ID})`}>
        {/* Outer ring */}
        <circle cx={CX} cy={CY} r={R1} stroke={C} strokeWidth="1.5" />

        {/* Four tick marks — bridge from inner ring edge to outer ring */}
        <line x1={CX}      y1={CY - R1} x2={CX}      y2={CY - R2 - 2} stroke={C} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={CX}      y1={CY + R2 + 2} x2={CX}  y2={CY + R1}     stroke={C} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={CX - R1} y1={CY}      x2={CX - R2 - 2} y2={CY}      stroke={C} strokeWidth="1.5" strokeLinecap="round" />
        <line x1={CX + R2 + 2} y1={CY}  x2={CX + R1} y2={CY}          stroke={C} strokeWidth="1.5" strokeLinecap="round" />

        {/* Inner ring */}
        <circle cx={CX} cy={CY} r={R2} stroke={C} strokeWidth="1.5" />

        {/* Center dot */}
        <circle cx={CX} cy={CY} r={RC} fill={C} />
      </g>

      {/* Wordmark */}
      {variant === 'lockup' && (
        <text
          x={W / 2}
          y={W + WORDMARK_GAP + WORDMARK_H - 1}
          textAnchor="middle"
          fontFamily="'Orbitron', sans-serif"
          fontWeight="900"
          fontSize={WORDMARK_H}
          letterSpacing="5"
          fill={C}
          filter={`url(#${GLOW_ID})`}
        >
          GRID
        </text>
      )}
    </svg>
  );
}
