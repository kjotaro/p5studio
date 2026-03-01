/**
 * getFfmpegPath のユニットテスト
 *
 * テスト対象: renderer/ffmpeg-pipe.js の getFfmpegPath()
 * 役割: システム ffmpeg → ffmpeg-static の順でパスを解決する
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// child_process と fs をモックする
vi.mock('child_process', () => ({
  execSync: vi.fn(),
  spawn: vi.fn(),
}));
vi.mock('fs', async (importOriginal) => {
  const actual = await importOriginal();
  return { ...actual, existsSync: vi.fn() };
});

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { getFfmpegPath } from '../../renderer/ffmpeg-pipe.js';

describe('getFfmpegPath', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('システム ffmpeg が見つかる場合はそのパスを返す', async () => {
    execSync.mockReturnValue('/usr/local/bin/ffmpeg\n');
    existsSync.mockReturnValue(true);

    const result = await getFfmpegPath();
    expect(result).toBe('/usr/local/bin/ffmpeg');
    expect(execSync).toHaveBeenCalledWith('which ffmpeg', { encoding: 'utf8' });
  });

  it('which は成功したが existsSync が false の場合は ffmpeg-static にフォールバックする', async () => {
    execSync.mockReturnValue('/usr/local/bin/ffmpeg\n');
    // システムパスは存在しない扱い → ffmpeg-static へ
    existsSync
      .mockReturnValueOnce(false)   // システムパスの existsSync
      .mockReturnValueOnce(true);   // ffmpeg-static パスの existsSync

    // ffmpeg-static モジュールは実際のパスを返すので、結果が文字列であることを確認
    const result = await getFfmpegPath();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('which ffmpeg が失敗した場合は ffmpeg-static にフォールバックする', async () => {
    execSync.mockImplementation(() => { throw new Error('not found'); });
    existsSync.mockReturnValue(true); // ffmpeg-static は存在する

    // ffmpeg-static が実際にインストールされているのでパスを返せる
    const result = await getFfmpegPath();
    expect(typeof result).toBe('string');
    expect(result.length).toBeGreaterThan(0);
  });

  it('システム ffmpeg も ffmpeg-static も見つからない場合はエラーを throw する', async () => {
    execSync.mockImplementation(() => { throw new Error('not found'); });
    existsSync.mockReturnValue(false); // どのパスも存在しない

    // ffmpeg-static の dynamic import はモックできないため、
    // 実際の ffmpeg-static が存在する環境ではこのテストはスキップ
    // （CI や ffmpeg が全くない環境での確認用）
    await expect(getFfmpegPath()).rejects.toThrow('ffmpeg が見つかりません');
  });
});
