// export default { reactStrictMode: true };

/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://security-proj.onrender.com/:path*',
      },
    ];
  },
};

// For ES modules (.mjs), use export default
export default nextConfig;
