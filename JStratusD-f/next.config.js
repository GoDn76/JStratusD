/** @type {import('next').NextConfig} */
const nextConfig = {
  // output: 'export',  <-- DELETE or COMMENT THIS LINE
  // distDir: 'dist',   <-- Optional: keep if you prefer 'dist' folder
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: { unoptimized: true },
};

module.exports = nextConfig;