/**
 * parseMetadata のユニットテスト
 *
 * テスト対象: renderer/render.js の parseMetadata()
 * 役割: スケッチ先頭の「// @p5studio fps=30 ...」コメントを解析する
 *
 * 戻り値: { values: { fps, duration, width, height }, specified: Set<string> }
 *   values   — 最終的なメタデータ値（未指定はデフォルト値）
 *   specified — スケッチコメントで明示的に指定されたキーのSet
 */
import { describe, it, expect } from 'vitest';
import { parseMetadata } from '../../renderer/render.js';

describe('parseMetadata', () => {
  // --- 戻り値の構造 ---

  it('戻り値は { values, specified } の形式である', () => {
    const result = parseMetadata('');
    expect(result).toHaveProperty('values');
    expect(result).toHaveProperty('specified');
    expect(result.specified).toBeInstanceOf(Set);
  });

  // --- 正常系 ---

  it('すべてのメタデータを正しく解析できる', () => {
    const code = '// @p5studio fps=60 duration=10 width=1920 height=1080\nfunction setup() {}';
    const { values, specified } = parseMetadata(code);
    expect(values).toEqual({ fps: 60, duration: 10, width: 1920, height: 1080 });
    expect(specified).toEqual(new Set(['fps', 'duration', 'width', 'height']));
  });

  it('メタデータコメントがない場合はデフォルト値を返し、specified は空', () => {
    const code = 'function setup() {}\nfunction draw() {}';
    const { values, specified } = parseMetadata(code);
    expect(values).toEqual({ fps: 30, duration: 6, width: 1280, height: 720 });
    expect(specified.size).toBe(0);
  });

  it('一部だけ指定した場合、指定したキーだけ specified に入る', () => {
    const code = '// @p5studio fps=60';
    const { values, specified } = parseMetadata(code);
    expect(values.fps).toBe(60);
    expect(values.duration).toBe(6);   // デフォルト
    expect(specified.has('fps')).toBe(true);
    expect(specified.has('duration')).toBe(false);
    expect(specified.has('width')).toBe(false);
  });

  it('コメント記号の直後にスペースがなくても解析できる（//@p5studio）', () => {
    const code = '//@p5studio fps=30 duration=6 width=1280 height=720';
    const { values } = parseMetadata(code);
    expect(values.fps).toBe(30);
  });

  it('メタデータが2行目以降にあっても解析できる', () => {
    const code = 'const x = 1;\n// @p5studio fps=24 duration=3 width=800 height=600';
    const { values } = parseMetadata(code);
    expect(values.fps).toBe(24);
  });

  // --- エッジケース ---

  it('知らないキー（color=red など）は無視される', () => {
    const code = '// @p5studio fps=30 duration=6 color=red width=1280 height=720';
    const { values, specified } = parseMetadata(code);
    expect(values).toEqual({ fps: 30, duration: 6, width: 1280, height: 720 });
    expect(specified.has('color')).toBe(false);
  });

  it('fps=0 の場合は 0 がそのまま入り、specified に記録される', () => {
    const code = '// @p5studio fps=0 duration=6 width=1280 height=720';
    const { values, specified } = parseMetadata(code);
    expect(values.fps).toBe(0);
    expect(specified.has('fps')).toBe(true);
  });

  it('空文字列を渡してもデフォルト値を返す', () => {
    const { values } = parseMetadata('');
    expect(values).toEqual({ fps: 30, duration: 6, width: 1280, height: 720 });
  });

  // --- config マージの優先度確認 ---

  it('specified に含まれるキーは config より優先されるべき（統合確認）', () => {
    // parseMetadata 単体のテスト: スケッチで width=1920 を指定したら specified に入る
    const code = '// @p5studio width=1920';
    const { values, specified } = parseMetadata(code);
    expect(values.width).toBe(1920);
    expect(specified.has('width')).toBe(true);
    // → 呼び出し元 (renderSketch) が specified.has('width') を確認して config を無視する
  });
});
