/** @type {import('next').NextConfig} */
const nextConfig = {
  headers: async () => [
    {
      source: "/",
      headers: [
        {
          key: "Cross-Origin-Embedder-Policy",
          value: "require-corp",
        },
        {
          key: "Cross-Origin-Opener-Policy",
          value: "same-origin",
        },
      ],
    },
  ],
  webpack: (config, { isServer }) => {
    // Add your webpack configurations here
    return config;
  },
};

export default nextConfig;
