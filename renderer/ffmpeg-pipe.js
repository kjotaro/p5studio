import { spawn, execSync } from 'child_process';
import { existsSync, statSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';

/**
 * 使用可能な ffmpeg のパスを返す
 * システムインストール優先、なければ ffmpeg-static を使用
 */
export async function getFfmpegPath() {
  try {
    const systemFfmpeg = execSync('which ffmpeg', { encoding: 'utf8' }).trim();
    if (systemFfmpeg && existsSync(systemFfmpeg)) {
      return systemFfmpeg;
    }
  } catch {}

  // ffmpeg-static をフォールバックとして使用
  try {
    const { default: ffmpegStatic } = await import('ffmpeg-static');
    if (ffmpegStatic && existsSync(ffmpegStatic)) {
      return ffmpegStatic;
    }
  } catch {}

  throw new Error('ffmpeg が見つかりません。brew install ffmpeg でインストールしてください。');
}

/**
 * PNG フレーム群を MP4 に変換する
 */
export async function encodeVideo(framesDir, outputPath, meta) {
  const ffmpegPath = await getFfmpegPath();
  const inputPattern = join(framesDir, 'frame-%06d.png');
  const totalFrames = meta.fps * meta.duration;

  const spinner = ora('ffmpeg で MP4 に変換中...').start();

  return new Promise((resolve, reject) => {
    const args = [
      '-y',                          // 上書き確認なし
      '-framerate', String(meta.fps),
      '-i', inputPattern,
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-crf', '18',                  // 高品質
      '-preset', 'medium',
      outputPath
    ];

    const proc = spawn(ffmpegPath, args, { stdio: ['ignore', 'pipe', 'pipe'] });

    let stderr = '';

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
      // "frame=  120" のような進捗をパース
      const matches = [...stderr.matchAll(/frame=\s*(\d+)/g)];
      if (matches.length > 0) {
        const lastFrame = parseInt(matches[matches.length - 1][1]);
        const progress = Math.min(100, Math.round((lastFrame / totalFrames) * 100));
        spinner.text = `ffmpeg で MP4 に変換中... ${progress}% (frame ${lastFrame}/${totalFrames})`;
      }
    });

    proc.on('close', (code) => {
      if (code === 0) {
        spinner.succeed('MP4 変換完了');

        try {
          const stats = statSync(outputPath);
          const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
          console.log(chalk.gray(`  ファイルサイズ: ${sizeMB} MB`));
        } catch {}

        resolve();
      } else {
        spinner.fail('MP4 変換失敗');
        reject(new Error(`ffmpeg が終了コード ${code} で失敗しました:\n${stderr.slice(-500)}`));
      }
    });

    proc.on('error', (err) => {
      spinner.fail('ffmpeg 起動失敗');
      reject(new Error(`ffmpeg の起動に失敗しました: ${err.message}`));
    });
  });
}
