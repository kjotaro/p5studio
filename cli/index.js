#!/usr/bin/env node
import { program } from 'commander';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

/** プロジェクトルートの p5studio.config.js を読み込む（なければ空オブジェクト） */
async function loadConfig() {
  const configPath = resolve(process.cwd(), 'p5studio.config.js');
  try {
    const { default: cfg } = await import(configPath);
    return cfg ?? {};
  } catch {
    return {};
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '..', 'package.json'), 'utf8'));

program
  .name('p5studio')
  .description('p5.js × Claude Code integration framework for generative art')
  .version(pkg.version);

// dev コマンド
program
  .command('dev [sketch]')
  .description('ライブプレビューサーバーを起動する')
  .option('-p, --port <port>', 'ポート番号', '3000')
  .action(async (sketch, options) => {
    const { startServer } = await import('../studio/server.js');
    await startServer(sketch || 'sketches/example.js', parseInt(options.port));
  });

// render コマンド
program
  .command('render <sketch>')
  .description('スケッチを MP4 動画に書き出す')
  .option('-o, --output <path>', '出力ファイルパス')
  .option('--timeout <ms>', 'フレームレンダリングタイムアウト (ms)', '30000')
  .action(async (sketch, options) => {
    const { renderSketch } = await import('../renderer/render.js');
    const outputPath = options.output || sketch.replace(/^sketches\//, 'out/').replace(/\.js$/, '.mp4');
    const config = await loadConfig();
    await renderSketch(sketch, outputPath, { timeout: parseInt(options.timeout), config });
  });

// init コマンド
program
  .command('init [name]')
  .description('新しい p5studio プロジェクトを初期化する')
  .action(async (name) => {
    const { initProject } = await import('./init.js');
    await initProject(name || 'my-art');
  });

program.parse();
