/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force webpack instead of Turbopack
  // Turbopack in Next.js 16 has worker issues with some configurations
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  // SQLite better-sqlite3 is server-side only
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'better-sqlite3': 'commonjs better-sqlite3',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
