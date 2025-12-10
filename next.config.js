/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone', // Required for Docker deployment
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
      {
        protocol: 'https',
        hostname: 'media.q84sale.com',
        pathname: '/**',
      },
    ],
  },
}

module.exports = nextConfig
