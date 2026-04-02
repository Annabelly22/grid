import { ImageResponse } from 'next/og';

export const size        = { width: 180, height: 180 };
export const contentType = 'image/png';

/**
 * iOS home screen icon — 180×180
 * Focus reticle: outer ring → tick marks → inner ring → center dot
 *
 * iOS uses <link rel="apple-touch-icon"> for Add to Home Screen.
 * Next.js App Router serves this file at /apple-icon.png and
 * auto-inserts that link tag into every page's <head>.
 */
export default function AppleIcon() {
  const G  = '#00FF41';
  const BG = '#0A0A0F';

  // Geometry (all values in px, canvas 180×180, center 90×90)
  // Outer ring: ⌀148, border 4 → inner radius 70, inner edge at y=20
  // Inner ring: ⌀42,  border 4 → outer radius 21, top at y=69, bottom at y=111
  // Ticks: connect outer inner edge to inner ring edge (height = 69-20 = 49)
  // Center dot: ⌀14, centered at (83,83)

  return new ImageResponse(
    <div
      style={{
        width: 180, height: 180,
        backgroundColor: BG,
        display: 'flex',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Outer ring */}
      <div style={{
        position: 'absolute',
        width: 148, height: 148,
        top: 16, left: 16,
        border: `4px solid ${G}`,
        borderRadius: '50%',
      }} />

      {/* Inner ring */}
      <div style={{
        position: 'absolute',
        width: 42, height: 42,
        top: 69, left: 69,
        border: `4px solid ${G}`,
        borderRadius: '50%',
      }} />

      {/* Top tick    */} <div style={{ position: 'absolute', width: 4, height: 49, backgroundColor: G, top: 20,  left: 88 }} />
      {/* Bottom tick */} <div style={{ position: 'absolute', width: 4, height: 49, backgroundColor: G, top: 111, left: 88 }} />
      {/* Left tick   */} <div style={{ position: 'absolute', width: 49, height: 4, backgroundColor: G, top: 88,  left: 20 }} />
      {/* Right tick  */} <div style={{ position: 'absolute', width: 49, height: 4, backgroundColor: G, top: 88,  left: 111 }} />

      {/* Center dot */}
      <div style={{
        position: 'absolute',
        width: 14, height: 14,
        backgroundColor: G,
        borderRadius: '50%',
        top: 83, left: 83,
      }} />
    </div>,
    { ...size },
  );
}
