/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  env: {
    API_URL: process.env.API_URL,
    PRIVATE_KEY: process.env.PRIVATE_KEY,
    API_KEY: process.env.API_KEY,
    CONTRACT_ADDRESS: process.env.CONTRACT_ADDRESS,
    SERVER_URL: process.env.SERVER_URL,
  }
}

module.exports = nextConfig
