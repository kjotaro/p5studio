import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/e2e/**/*.test.js'],
    // Puppeteer + ffmpeg が動く時間を確保（最大3分）
    testTimeout: 180000,
    hookTimeout: 30000,
    // E2E は並列実行しない（リソース競合を避ける）
    pool: 'forks',
    singleFork: true,
  },
});
