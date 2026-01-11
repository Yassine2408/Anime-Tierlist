const { withSentryConfig } = require("@sentry/nextjs");

/** @type {import('next').NextConfig} */
const nextConfig = {
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

module.exports = withSentryConfig(nextConfig, sentryOptions);
