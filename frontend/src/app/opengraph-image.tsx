import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'FZ AUTH — Authentication & Licensing Platform';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#0a0a12',
          position: 'relative',
        }}
      >
        {/* Gradient border */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            padding: '3px',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7, #7c3aed)',
            display: 'flex',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: '#0a0a12',
              display: 'flex',
            }}
          />
        </div>

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          {/* Shield icon */}
          <svg
            width="96"
            height="96"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#7c3aed"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" stroke="#a855f7" />
          </svg>

          {/* Title */}
          <div
            style={{
              fontSize: 72,
              fontWeight: 800,
              color: '#ffffff',
              marginTop: 24,
              letterSpacing: '-2px',
            }}
          >
            FZ AUTH
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              color: '#a78bfa',
              marginTop: 12,
              letterSpacing: '1px',
            }}
          >
            Authentication & Licensing Platform
          </div>
        </div>

        {/* Bottom gradient line */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            width: 200,
            height: 4,
            borderRadius: 2,
            background: 'linear-gradient(90deg, transparent, #7c3aed, transparent)',
          }}
        />
      </div>
    ),
    { ...size }
  );
}
