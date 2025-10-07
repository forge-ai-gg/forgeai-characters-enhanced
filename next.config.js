/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true, // For dynamic sprite generation
  },
  webpack: (config, { isServer }) => {
    // Exclude spritesheets directory from webpack bundling (99k+ PNG files loaded from S3)
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|webp)$/,
      include: /spritesheets/,
      type: "asset/resource",
      generator: {
        emit: false, // Don't emit these files
      },
    });

    // Ignore spritesheets directory in watch mode for better performance
    config.watchOptions = {
      ...config.watchOptions,
      ignored: ["**/node_modules/**", "**/spritesheets/**", "**/.next/**"],
    };

    return config;
  },
  // Exclude spritesheets from output file tracing (build optimization)
  experimental: {
    outputFileTracingExcludes: {
      "*": ["./spritesheets/**/*"],
    },
  },
};

module.exports = nextConfig;
