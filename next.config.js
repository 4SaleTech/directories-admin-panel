/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: ['./src/presentation/styles'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'staging-media.q84sale.com',
        pathname: '/images/**',
      },
    ],
  },
}

module.exports = nextConfig
