/** @type {import('next').NextConfig} */
const apiTarget = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.PUBLIC_API_BASE_URL || 'http://localhost:9090';

const nextConfig = {
  // output: 'export',  <-- DELETE or COMMENT THIS LINE
  // distDir: 'dist',   <-- Optional: keep if you prefer 'dist' folder
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiTarget}/:path*`,
      },
    ];
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
    PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL,
    NEXT_PUBLIC_GOOGLE_CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    PUBLIC_GOOGLE_CLIENT_ID: process.env.PUBLIC_GOOGLE_CLIENT_ID,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;