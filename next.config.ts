import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "cdn.myanimelist.net" },
      { protocol: "https", hostname: "img.anili.st" },
      { protocol: "https", hostname: "s4.anilist.co" },
      { protocol: "https", hostname: "i.imgur.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: "/tierlist/share/:shareId",
        destination: "/tierlist/public/:shareId",
        permanent: true,
      },
    ];
  },
};

const sentryOptions = {
  silent: true,
  disableLogger: true,
};

export default withSentryConfig(nextConfig, sentryOptions);
