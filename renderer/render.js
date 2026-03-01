import puppeteer from 'puppeteer';
import { readFileSync, mkdirSync, existsSync } from 'fs';
import { resolve, dirname, basename } from 'path';
import { tmpdir } from 'os';
import { join } from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { encodeVideo } from './ffmpeg-pipe.js';

const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js';

/**
 * スケッチファイル先頭のメタデータコメントを解析する
 * // @p5studio fps=30 duration=6 width=1280 height=720
 */
export function parseMetadata(sketchCode) {
  const defaults = { fps: 30, duration: 6, width: 1280, height: 720 };
  const match = sketchCode.match(/\/\/\s*@p5studio\s+(.+)/);

  const specified = new Set();
  const meta = { ...defaults };

  if (match) {
    const pairs = match[1].matchAll(/(\w+)=(\d+)/g);
    for (const [, key, val] of pairs) {
      if (key in meta) {
        meta[key] = parseInt(val);
        specified.add(key); // スケッチコメントで明示的に指定されたキーを記録
      }
    }
  }

  return { values: meta, specified };
}

/**
 * Puppeteer に注入するレンダリングプロトコル HTML を生成する
 */
function buildRenderHTML(sketchCode, meta) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; overflow: hidden; }
    canvas { display: block; }
  </style>
</head>
<body>
  <script src="${P5_CDN}"></script>
  <script>
    // p5studio レンダリングプロトコル
    window.__P5STUDIO__ = {
      ready: false,
      lastRenderedFrame: -1,
      _p5instance: null,
      renderFrame(frameNum) {
        if (!this._p5instance) return;
        this._p5instance._frameCount = frameNum;
        this._p5instance.redraw();
        this.lastRenderedFrame = frameNum;
      }
    };

    // p5.js インスタンスモード検出
    const sketchCode = ${JSON.stringify(sketchCode)};
    const isInstanceMode = /new\\s+p5\\s*\\(/.test(sketchCode);

    if (isInstanceMode) {
      // インスタンスモード: そのまま実行し、インスタンスを捕捉
      const origP5 = window.p5;
      window.p5 = function(sketch, node) {
        const inst = new origP5(sketch, node);
        window.__P5STUDIO__._p5instance = inst;
        inst.noLoop();
        return inst;
      };
      window.p5.prototype = origP5.prototype;
      eval(sketchCode);
    } else {
      // グローバルモード: p5 インスタンスを遅延取得
      eval(sketchCode);
      // setup() 実行後に _renderer 経由でインスタンスを取得
      const origSetup = window.setup;
      window.setup = function() {
        if (origSetup) origSetup();
        // グローバル p5 インスタンスは window._renderer._pInst に存在する
        window.__P5STUDIO__._p5instance = window._renderer && window._renderer._pInst;
        if (window.__P5STUDIO__._p5instance) {
          window.__P5STUDIO__._p5instance.noLoop();
        }
        window.__P5STUDIO__.ready = true;
      };
    }
  </script>
</body>
</html>`;
}

/**
 * メインのレンダリング関数
 */
export async function renderSketch(sketchPath, outputPath, options = {}) {
  const timeout = options.timeout || 30000;
  const absSketchPath = resolve(process.cwd(), sketchPath);

  if (!existsSync(absSketchPath)) {
    console.error(chalk.red(`エラー: スケッチファイルが見つかりません: ${absSketchPath}`));
    process.exit(1);
  }

  const sketchCode = readFileSync(absSketchPath, 'utf8');
  const { values: meta, specified } = parseMetadata(sketchCode);

  // p5studio.config.js の値をマージ（スケッチコメントで明示された値は上書きしない）
  const config = options.config ?? {};
  for (const [key, val] of Object.entries(config)) {
    if (!specified.has(key) && key in meta) {
      meta[key] = val;
    }
  }

  const totalFrames = meta.fps * meta.duration;

  // 出力ディレクトリを作成
  const outputDir = dirname(resolve(process.cwd(), outputPath));
  mkdirSync(outputDir, { recursive: true });

  // 一時PNGディレクトリ
  const tmpDir = join(tmpdir(), `p5studio-${Date.now()}`);
  mkdirSync(tmpDir, { recursive: true });

  console.log(chalk.green.bold('\n🎬 p5studio レンダリング開始'));
  console.log(chalk.white(`  スケッチ: ${chalk.cyan(sketchPath)}`));
  console.log(chalk.white(`  設定:     ${chalk.cyan(`${meta.width}×${meta.height} / ${meta.fps}fps / ${meta.duration}秒 (${totalFrames}フレーム)`)}`));
  console.log(chalk.white(`  出力:     ${chalk.cyan(outputPath)}\n`));

  const spinner = ora('ブラウザを起動中...').start();

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      `--window-size=${meta.width},${meta.height}`,
    ]
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: meta.width, height: meta.height });

    // エラーログ
    page.on('console', msg => {
      if (msg.type() === 'error') {
        console.error(chalk.red(`[ブラウザ] ${msg.text()}`));
      }
    });

    // HTMLをロード
    const html = buildRenderHTML(sketchCode, meta);
    await page.setContent(html, { waitUntil: 'networkidle2', timeout });

    // p5.js の準備完了を待つ
    spinner.text = 'p5.js 初期化待機中...';
    await page.waitForFunction(() => window.__P5STUDIO__.ready, { timeout });

    // フレームキャプチャループ
    for (let frame = 0; frame < totalFrames; frame++) {
      spinner.text = `フレームをキャプチャ中... ${frame + 1}/${totalFrames}`;

      // フレームをレンダリング
      await page.evaluate((f) => {
        window.__P5STUDIO__.renderFrame(f);
      }, frame);

      // レンダリング完了を待つ
      await page.waitForFunction(
        (f) => window.__P5STUDIO__.lastRenderedFrame === f,
        { timeout },
        frame
      );

      // canvas をスクリーンショット
      const canvas = await page.$('canvas');
      if (!canvas) throw new Error('canvas 要素が見つかりません');

      const framePath = join(tmpDir, `frame-${String(frame + 1).padStart(6, '0')}.png`);
      await canvas.screenshot({ path: framePath });
    }

    spinner.succeed(`${totalFrames} フレームのキャプチャ完了`);

    // ffmpeg で MP4 に変換
    await encodeVideo(tmpDir, outputPath, meta);

    console.log(chalk.green.bold(`\n✅ レンダリング完了: ${outputPath}`));
  } finally {
    await browser.close();
    // 一時ファイル削除
    try {
      const { rmSync } = await import('fs');
      rmSync(tmpDir, { recursive: true, force: true });
    } catch {}
  }
}
