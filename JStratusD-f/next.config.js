/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  <-- DELETE or COMMENT THIS LINE
  // distDir: 'dist',   <-- Optional: keep if you prefer 'dist' folder
  env: {
    PUBLIC_API_BASE_URL: process.env.PUBLIC_API_BASE_URL,
    PUBLIC_GOOGLE_CLIENT_ID: process.env.PUBLIC_GOOGLE_CLIENT_ID,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;