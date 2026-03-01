import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // ユニット・統合テストのタイムアウト（10秒）
    testTimeout: 10000,
    // E2E タグ付きテストは別途 npm run test:e2e で実行
    exclude: ['tests/e2e/**', 'node_modules/**'],
  },
});
