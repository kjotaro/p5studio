# p5studio の仕組み（内部解説）

> 自分が理解するための図解ドキュメント。README.md を書くときのベースにもなる。

---

## 全体像

p5studio は「スケッチ（.jsファイル）」を受け取って、2つのことができる。

```
スケッチ (.js)
     │
     ├─── dev コマンド  ──→ ブラウザで「ライブプレビュー」
     │
     └─── render コマンド ──→ 「MP4動画」として書き出し
```

---

## dev コマンドの仕組み

```
ターミナル:
  node cli/index.js dev sketches/example.js
```

内部でこの流れが起きる：

```
① cli/index.js
   コマンドを受け取り、studio/server.js を呼ぶ

② studio/server.js
   Express（Webサーバー）を起動
   → http://localhost:3000 でアクセス可能にする

③ ブラウザでアクセスすると…
   スケッチのコードが HTML に埋め込まれて返ってくる
   p5.js も CDN から読み込まれる
   → ブラウザ上で p5.js スケッチが動く！

④ chokidar（ファイル監視）
   sketches/example.js に変更があると検知

⑤ WebSocket（ws ライブラリ）
   サーバー → ブラウザに「リロードして」と通知
   ブラウザが自動でページをリロード
   → コードを保存するたびにブラウザが更新される！
```

図で表すと：

```
ターミナル             サーバー(Express)          ブラウザ
    │                      │                        │
    │── dev 起動 ──────→  │                        │
    │                      │←── http://localhost ──│
    │                      │── HTMLを返す ─────────→│
    │                      │                    p5.js動作
    │                      │                        │
    ↓ ファイルを保存       │                        │
chokidar検知              │                        │
    │── 変更通知 ─────→   │                        │
    │                      │── WebSocketで通知 ────→│
    │                      │                    自動リロード
```

**使っているライブラリ:**
- `express` → Web サーバー（HTML を返す）
- `chokidar` → ファイルの変更を監視する
- `ws` → WebSocket（サーバー↔ブラウザのリアルタイム通信）
- `open` → ブラウザを自動で開く

---

## render コマンドの仕組み

```
ターミナル:
  node cli/index.js render sketches/example.js
```

内部でこの流れが起きる：

```
① cli/index.js
   コマンドを受け取り、p5studio.config.js を読む（あれば）
   renderer/render.js を呼ぶ

② renderer/render.js: parseMetadata()
   スケッチの先頭コメントを読む
   // @p5studio fps=30 duration=6 width=1080 height=1080
   → fps, duration, width, height を取得

③ renderer/render.js: buildRenderHTML()
   スケッチコードを HTML に埋め込む
   + 特別な「コントロール用コード」を追加する
     → window.__P5STUDIO__ というオブジェクト

④ Puppeteer（ヘッドレスブラウザ）を起動
   「目に見えない Chrome ブラウザ」
   さっき作った HTML をそこで動かす

⑤ フレームキャプチャループ（totalFrames = fps × duration 回繰り返す）
   a. window.__P5STUDIO__.renderFrame(フレーム番号) を呼ぶ
      → p5.js の frameCount をそのフレーム番号にセット
      → draw() を1回だけ実行させる（noLoop で自動実行を止めている）
   b. canvas 要素をスクリーンショット → frame-000001.png として保存
   c. 次のフレームへ... × totalFrames 回繰り返す

⑥ renderer/ffmpeg-pipe.js
   PNG 画像を連番で ffmpeg に渡す
   ffmpeg が PNG を繋げて MP4 動画を作る
   一時ファイル（PNG たち）は削除

⑦ 完成した MP4 が out/example.mp4 に保存される
```

図で表すと：

```
スケッチ (.js)
    │
    │ parseMetadata()
    ↓
メタデータ取得（fps, duration, width, height）
    │
    │ buildRenderHTML()
    ↓
HTML生成（スケッチ + コントロールコード）
    │
    │ Puppeteer 起動
    ↓
ヘッドレスブラウザ（目に見えない Chrome）
    │
    │ フレームキャプチャループ ×(fps × duration) 回
    ↓
frame-000001.png
frame-000002.png
frame-000003.png
  ...
    │
    │ ffmpeg
    ↓
out/example.mp4 ✅
```

**使っているライブラリ:**
- `puppeteer` → ヘッドレス Chrome（目に見えないブラウザ）
- `ffmpeg` / `ffmpeg-static` → PNG → MP4 変換ツール

---

## window.__P5STUDIO__ とは？

render のときに「Puppeteer が p5.js を制御するための仕組み」。

通常の p5.js は「自分のペースで draw() を自動実行」するが、
レンダリング時には「Puppeteer が 1フレームずつ命令して実行」する必要がある。

```javascript
// 通常の p5.js の動き（draw が自動でずっと動く）
setup() → draw() → draw() → draw() → ...

// p5studio のレンダリング時（Puppeteer が1枚ずつ制御）
setup()
Puppeteer → renderFrame(0) → draw() → スクリーンショット
Puppeteer → renderFrame(1) → draw() → スクリーンショット
Puppeteer → renderFrame(2) → draw() → スクリーンショット
...
```

これが「決定論的アニメーション（frameCount を使う）」が大事な理由。
`millis()` や `Date.now()` を使うと「Puppeteer がいつスクリーンショットを撮るか」
に依存してしまい、フレームがズレる。

---

## Claude Code（AI）との連携の仕組み

```
Claude Code の動き:

① CLAUDE.md を読む
   → 「このプロジェクトは p5studio です」
   → 「スケッチは frameCount ベースで書く」
   → 「// @p5studio コメントを先頭に書く」

② ユーザが「バラ曲線のスケッチを作って」と言う

③ Claude が sketches/vortex-rose.js を書く

④ ユーザが「render して」と言う（または自分でコマンドを実行）
   → p5studio がスケッチを読んで MP4 を生成

⑤ ユーザが MP4 を見てフィードバック

⑥ Claude が修正する → ④ に戻る
```

AI（Claude）は「スケッチを書くだけ」。
p5studio CLI は「スケッチを動かすだけ」。
この分担が明確だから、AI との連携がうまく機能する。

---

## 設定の優先度（まとめ）

```
低 ←────────────────────────────────────────→ 高

組み込みデフォルト   p5studio.config.js   スケッチコメント
(fps:30, 1280×720)  (fps:30, 1080×1080)  (// @p5studio ...)
```

スケッチコメントが最強なので、「このスケッチだけ横長にしたい」ときは
スケッチに `// @p5studio width=1920 height=1080` と書けばよい。

---

## よくある疑問

**Q: なぜ Puppeteer（Chrome）を使うの？**
A: p5.js は「ブラウザ上で動く JavaScript」なので、ブラウザなしには動かせない。
   Node.js だけでは p5.js を実行できないため、ブラウザを内蔵している Puppeteer を使う。

**Q: ffmpeg って何？**
A: 動画・音声を変換するコマンドラインツール。世界中の動画ソフトに使われている。
   p5studio では「PNG の連番画像を MP4 に変換」するために使っている。

**Q: WebSocket って何？**
A: サーバーとブラウザが「常時つながった状態」で通信できる仕組み。
   通常の HTTP は「リクエストを送ったらレスポンスが返る」だけだが、
   WebSocket は「サーバーからブラウザに自発的に送れる」。
   これがあるからファイル変更を即座にブラウザに伝えられる。

**Q: p5studio.config.js はいつ読まれる？**
A: `render` コマンドを実行したときに、`process.cwd()`（コマンドを実行したフォルダ）の
   直下に `p5studio.config.js` があれば読み込まれる。
   `dev` コマンドでは現在読まれない（将来の改善ポイント）。
