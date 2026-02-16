import { spawnSync } from 'node:child_process';
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { generateSW } from 'workbox-build';

const rootDir = process.cwd();
const outputDir = path.resolve(rootDir, 'web-build');
const packageJsonPath = path.resolve(rootDir, 'package.json');
const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf8'));
const version = packageJson.version ?? '0.0.0';

const runExpoExport = () => {
  const localExpoBin = path.resolve(
    rootDir,
    'node_modules',
    '.bin',
    process.platform === 'win32' ? 'expo.cmd' : 'expo'
  );
  const command = existsSync(localExpoBin) ? localExpoBin : process.platform === 'win32' ? 'npx.cmd' : 'npx';
  const args = existsSync(localExpoBin)
    ? ['export', '--platform', 'web', '--output-dir', 'web-build']
    : ['expo', 'export', '--platform', 'web', '--output-dir', 'web-build'];

  const result = spawnSync(command, args, {
    cwd: rootDir,
    stdio: 'inherit'
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const buildServiceWorker = async () => {
  const cacheTag = `japan-price-tracker-${version}`;
  const { count, size, warnings } = await generateSW({
    cacheId: cacheTag,
    globDirectory: outputDir,
    swDest: path.resolve(outputDir, 'sw.js'),
    globPatterns: ['**/*.{js,css,html,json,png,svg,woff2,ttf,ico}'],
    cleanupOutdatedCaches: true,
    clientsClaim: true,
    skipWaiting: true,
    maximumFileSizeToCacheInBytes: 10 * 1024 * 1024,
    navigateFallback: '/index.html',
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/places\.googleapis\.com\/.*/i,
        handler: 'NetworkOnly'
      },
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: `pages-${cacheTag}`,
          networkTimeoutSeconds: 5
        }
      }
    ]
  });

  if (warnings.length > 0) {
    console.warn('[PWA] Workbox warnings:');
    warnings.forEach((warning) => {
      console.warn(`- ${warning}`);
    });
  }

  console.log(`[PWA] Service worker generated: ${count} files, ${size} bytes precached.`);
};

const main = async () => {
  runExpoExport();
  await buildServiceWorker();
};

main().catch((error) => {
  console.error('[PWA] Webapp build failed.', error);
  process.exit(1);
});
