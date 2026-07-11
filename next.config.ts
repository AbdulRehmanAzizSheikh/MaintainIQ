import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],
  },
  // Allow <img> tags with external src (for QR codes from Cloudinary)
  // Next.js 15 doesn't need this but it's good to be explicit
};

export default nextConfig;
