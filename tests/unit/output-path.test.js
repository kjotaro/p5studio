/**
 * 出力パス自動生成ロジックのユニットテスト
 *
 * テスト対象: cli/index.js の render コマンド内パス変換
 *   sketch.replace(/^sketches\//, 'out/').replace(/\.js$/, '.mp4')
 *
 * ※ この変換ロジックは CLI に直書きされているため、
 *    同じロジックをここで再現してテストする。
 *    将来的に関数として切り出されたら import に変更すること。
 */
import { describe, it, expect } from 'vitest';

// CLI と同じパス変換ロジックを関数として定義
function resolveOutputPath(sketchPath, outputOption) {
  if (outputOption) return outputOption;
  return sketchPath.replace(/^sketches\//, 'out/').replace(/\.js$/, '.mp4');
}

describe('出力パス自動生成', () => {
  // --- 正常系 ---

  it('sketches/foo.js → out/foo.mp4 に変換される', () => {
    expect(resolveOutputPath('sketches/foo.js')).toBe('out/foo.mp4');
  });

  it('sketches/example.js → out/example.mp4 に変換される（実際の使用例）', () => {
    expect(resolveOutputPath('sketches/example.js')).toBe('out/example.mp4');
  });

  it('--output オプションが指定された場合はその値をそのまま使う', () => {
    expect(resolveOutputPath('sketches/foo.js', 'my-output/video.mp4')).toBe('my-output/video.mp4');
  });

  // --- エッジケース ---

  it('sketches/ プレフィックスがない場合は out/ が付かない', () => {
    // sketches/ 以外のパスから render した場合の動作確認
    const result = resolveOutputPath('custom/foo.js');
    expect(result).toBe('custom/foo.mp4');
  });

  it('.js 以外の拡張子の場合は .js→.mp4 変換が起きない', () => {
    // .js で終わらないパスは replace が効かない（現状の仕様）
    const result = resolveOutputPath('sketches/foo.ts');
    expect(result).toBe('out/foo.ts'); // .js→.mp4 変換なし
  });

  it('ファイル名にドットが含まれる場合も末尾の .js だけ変換される', () => {
    const result = resolveOutputPath('sketches/rose.curve.js');
    expect(result).toBe('out/rose.curve.mp4');
  });
});
