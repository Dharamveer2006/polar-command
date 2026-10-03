/** @type {import('next').NextConfig} */
const isGithubPages = process.env.GITHUB_ACTIONS === 'true' || process.env.IS_PAGES === 'true';

const nextConfig = {
  ...(isGithubPages ? {
    output: 'export',
    trailingSlash: true,
    basePath: '/polar-command',
    assetPrefix: '/polar-command/',
    images: {
      unoptimized: true,
    },
  } : {}),
};

export default nextConfig;
