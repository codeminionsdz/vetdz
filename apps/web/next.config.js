/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@openpims/api", "@openpims/db"],
};

// On Windows creating symlinks during Next's standalone output can fail
// when developer mode or admin privileges are not available. Disable
// standalone output on Windows hosts to avoid EPERM symlink errors while
// running local validation/builds.
if (process.platform !== "win32") {
  nextConfig.output = "standalone";
}

module.exports = nextConfig;
