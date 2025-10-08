import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        source: "/frozen-rankings",
        destination: "/ranking",
        permanent: false,
      },
      {
        source: "/name-ranking",
        destination: "/ranking",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
