import { ImageResponse } from 'next/og';

// Image metadata
export const size = {
  width: 32,
  height: 32,
};
export const contentType = 'image/png';

// Text/Icon generation
export default function Icon() {
  return new ImageResponse(
    (
      // Image container
      <div
        style={{
          fontSize: 24,
          background: 'black', // Matches your requested "Black" theme
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white', // Icon color
          borderRadius: '50%', // Matches your requested "Round" shape
        }}
      >
        {/* This SVG matches the Lucide 'LayoutDashboard' icon exactly */}
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="7" height="9" x="3" y="3" rx="1" />
          <rect width="7" height="5" x="14" y="3" rx="1" />
          <rect width="7" height="9" x="14" y="12" rx="1" />
          <rect width="7" height="5" x="3" y="16" rx="1" />
        </svg>
      </div>
    ),
    // ImageResponse options
    {
      ...size,
    }
  );
}