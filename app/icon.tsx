import { ImageResponse } from 'next/og';

export const size        = { width: 512, height: 512 };
export const contentType = 'image/png';

/**
 * PWA / favicon icon — 512×512
 * Same focus reticle as apple-icon.tsx, scaled to 512 canvas.
 */
export default function Icon() {
  const G  = '#00FF41';
  const BG = '#0A0A0F';

  // Scale factor: 512/180 ≈ 2.844
  // Outer ring: 148*2.844≈421 → use 420, border 11, top/left 46
  // Inner ring: 42*2.844≈119  → use 120, border 11, top/left 196
  // Ticks: 49*2.844≈139       → use 140, width 11
  //   Top tick:    top 46,  left 250
  //   Bottom tick: top 316, left 250
  //   Left tick:   top 250, left 46
  //   Right tick:  top 250, left 316
  // Center dot: 14*2.844≈40   → use 40, top/left 236

  return new ImageResponse(
    <div
      style={{
        width: 512, height: 512,
        backgroundColor: BG,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Outer ring */}
      <div style={{
        position: 'absolute',
        width: 420, height: 420,
        top: 46, left: 46,
        border: `11px solid ${G}`,
        borderRadius: '50%',
      }} />

      {/* Inner ring */}
      <div style={{
        position: 'absolute',
        width: 120, height: 120,
        top: 196, left: 196,
        border: `11px solid ${G}`,
        borderRadius: '50%',
      }} />

      {/* Top tick    */} <div style={{ position: 'absolute', width: 11, height: 140, backgroundColor: G, top: 46,  left: 250 }} />
      {/* Bottom tick */} <div style={{ position: 'absolute', width: 11, height: 140, backgroundColor: G, top: 316, left: 250 }} />
      {/* Left tick   */} <div style={{ position: 'absolute', width: 140, height: 11, backgroundColor: G, top: 250, left: 46  }} />
      {/* Right tick  */} <div style={{ position: 'absolute', width: 140, height: 11, backgroundColor: G, top: 250, left: 316 }} />

      {/* Center dot */}
      <div style={{
        position: 'absolute',
        width: 40, height: 40,
        backgroundColor: G,
        borderRadius: '50%',
        top: 236, left: 236,
      }} />
    </div>,
    { ...size },
  );
}
