/** @type {import('next').NextConfig} */
const nextConfig = {
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
