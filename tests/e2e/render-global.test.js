/**
 * E2E テスト: グローバルモードスケッチのレンダリング
 *
 * 実際に CLI を呼び出して MP4 が正しく生成されるか確認する。
 * Puppeteer + ffmpeg を動かすため時間がかかる（30〜90秒）。
 * 実行: npm run test:e2e
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { execa } from 'execa';
import { existsSync, statSync, rmSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '../..');
const CLI = resolve(ROOT, 'cli/index.js');
const OUTPUT = resolve(ROOT, 'tests/e2e/out/render-global-test.mp4');

// テスト前に出力ファイルを削除
beforeAll(() => {
  if (existsSync(OUTPUT)) rmSync(OUTPUT);
});

// テスト後もクリーンアップ
afterAll(() => {
  if (existsSync(OUTPUT)) rmSync(OUTPUT);
});

describe('render コマンド（グローバルモード: example.js）', () => {
  it('MP4 ファイルが生成される', async () => {
    const { exitCode } = await execa('node', [
      CLI,
      'render',
      'sketches/example.js',
      '--output', OUTPUT,
    ], {
      cwd: ROOT,
      // 標準エラーはテスト失敗時に表示するためキャプチャ
      reject: false,
    });

    expect(exitCode, 'CLI が exit code 0 で終了すること').toBe(0);
    expect(existsSync(OUTPUT), 'MP4 ファイルが存在すること').toBe(true);
  });

  it('生成された MP4 が 0 バイトより大きい', () => {
    // 前のテストが成功していることが前提
    if (!existsSync(OUTPUT)) return;
    const stats = statSync(OUTPUT);
    expect(stats.size, 'ファイルサイズが 0 より大きいこと').toBeGreaterThan(0);
  });

  it('存在しないスケッチを指定すると exit code 1 で終了する', async () => {
    const { exitCode } = await execa('node', [
      CLI,
      'render',
      'sketches/does-not-exist.js',
    ], {
      cwd: ROOT,
      reject: false,
    });

    expect(exitCode).toBe(1);
  });
});
