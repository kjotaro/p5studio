import express from 'express';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import chokidar from 'chokidar';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import chalk from 'chalk';
import open from 'open';

const __dirname = dirname(fileURLToPath(import.meta.url));

// p5.js CDN URL
const P5_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.4/p5.min.js';

function buildHTML(sketchCode, sketchPath) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>p5studio dev — ${sketchPath}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #000; overflow: hidden; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    canvas { display: block; }
    #p5studio-overlay {
      position: fixed;
      top: 12px;
      right: 16px;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      color: rgba(255,255,255,0.7);
      background: rgba(0,0,0,0.5);
      padding: 4px 10px;
      border-radius: 4px;
      pointer-events: none;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <div id="p5studio-overlay">p5studio dev | <span id="fps-counter">--</span> fps</div>
  <script src="${P5_CDN}"></script>
  <script>
${sketchCode}
  </script>
  <script>
    // FPS カウンター
    let lastTime = performance.now();
    let frameCount = 0;
    function updateFPS() {
      frameCount++;
      const now = performance.now();
      if (now - lastTime >= 1000) {
        document.getElementById('fps-counter').textContent = frameCount;
        frameCount = 0;
        lastTime = now;
      }
      requestAnimationFrame(updateFPS);
    }
    requestAnimationFrame(updateFPS);

    // WebSocket ライブリロード
    (function() {
      function connect() {
        const ws = new WebSocket('ws://' + location.host);
        ws.onmessage = (e) => {
          if (e.data === 'reload') {
            console.log('[p5studio] ファイル変更を検知 → リロード');
            location.reload();
          }
        };
        ws.onclose = () => {
          console.log('[p5studio] 接続切断 → 再接続を試みます...');
          setTimeout(connect, 1000);
        };
      }
      connect();
    })();
  </script>
</body>
</html>`;
}

export async function startServer(sketchPath, port = 3000) {
  const absSketchPath = resolve(process.cwd(), sketchPath);

  if (!existsSync(absSketchPath)) {
    console.error(chalk.red(`エラー: スケッチファイルが見つかりません: ${absSketchPath}`));
    process.exit(1);
  }

  const app = express();
  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // スケッチ配信
  app.get('/', (req, res) => {
    try {
      const sketchCode = readFileSync(absSketchPath, 'utf8');
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.send(buildHTML(sketchCode, sketchPath));
    } catch (err) {
      res.status(500).send(`<pre>エラー: ${err.message}</pre>`);
    }
  });

  // WebSocket 接続管理
  const clients = new Set();
  wss.on('connection', (ws) => {
    clients.add(ws);
    ws.on('close', () => clients.delete(ws));
  });

  function notifyReload() {
    for (const client of clients) {
      if (client.readyState === 1) client.send('reload');
    }
  }

  // ファイル監視
  const watcher = chokidar.watch(absSketchPath, { ignoreInitial: true });
  watcher.on('change', () => {
    console.log(chalk.cyan(`[p5studio] 変更検知: ${sketchPath}`));
    notifyReload();
  });

  // サーバー起動
  httpServer.listen(port, () => {
    const url = `http://localhost:${port}`;
    console.log(chalk.green.bold('\n🎨 p5studio dev サーバー起動'));
    console.log(chalk.white(`  スケッチ: ${chalk.cyan(sketchPath)}`));
    console.log(chalk.white(`  URL:      ${chalk.cyan(url)}`));
    console.log(chalk.gray('  Ctrl+C で終了\n'));
    open(url);
  });
}
