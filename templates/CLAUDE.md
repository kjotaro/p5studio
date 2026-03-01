# p5studio プロジェクト — Claude Code 指示書

## プロジェクト構造

```
.
├── sketches/          ← p5.js スケッチファイル (.js)
├── assets/            ← 画像・音声などのアセット
├── out/               ← レンダリング済み MP4 (.gitignore に追加済み)
└── CLAUDE.md          ← この指示書
```

## ワークフロー

```bash
# 1. 新しいスケッチを作成
/new-sketch perlin-flow

# 2. ライブプレビューで確認
npx p5studio dev sketches/perlin-flow.js

# 3. 編集を繰り返す（ブラウザが自動リロードされる）

# 4. MP4 に書き出す
/render perlin-flow
```

---

## スケッチの書き方

### メタデータコメント（必須）

スケッチ先頭に必ず記述してください:

```javascript
// @p5studio fps=30 duration=6 width=1280 height=720
```

| パラメータ | 説明 | デフォルト |
|-----------|------|----------|
| `fps` | フレームレート | 30 |
| `duration` | 動画の秒数 | 6 |
| `width` | 幅 (px) | 1280 |
| `height` | 高さ (px) | 720 |

### p5studio.config.js（プロジェクト共通設定）

プロジェクトルートに `p5studio.config.js` を置くと、全スケッチのデフォルト値を変更できます。
スケッチの `// @p5studio` コメントで個別に上書きもできます。

```javascript
// p5studio.config.js
export default {
  fps: 30,
  duration: 6,
  width: 1080,  // 正方形（SNS向け）
  height: 1080,
};
```

優先度（高いほど優先）：**スケッチコメント > p5studio.config.js > 組み込みデフォルト値**

### 決定論的アニメーションの原則（重要！）

レンダリング時、p5studio は `frameCount` を制御してフレームを1枚ずつキャプチャします。

**OK ✅ — `frameCount` を使う（再現性あり）:**
```javascript
function draw() {
  const t = frameCount / (fps * duration);  // 0.0 〜 1.0
  const x = width * t;
}
```

**NG ❌ — `millis()` や `Date.now()` を使う（再現性なし）:**
```javascript
function draw() {
  const t = millis() / 1000;  // レンダリング時に正しく動作しない
}
```

---

## p5.js API クイックリファレンス

### ノイズ・ランダム
```javascript
noise(x, y, z)        // Perlin ノイズ (0.0〜1.0)
noiseSeed(seed)       // ノイズの種を固定
random(min, max)      // ランダム値
randomSeed(seed)      // ランダムの種を固定
```

### 描画
```javascript
point(x, y)           // 点
line(x1,y1, x2,y2)    // 線
ellipse(x,y,w,h)      // 楕円
rect(x,y,w,h)         // 矩形
beginShape()          // カスタム図形開始
vertex(x, y)          //   頂点追加
endShape(CLOSE)       // カスタム図形終了
```

### 色
```javascript
colorMode(HSB, 360, 100, 100, 100)  // HSB モード推奨
stroke(h, s, b, a)    // 線の色
fill(h, s, b, a)      // 塗りの色
background(r, g, b, a) // 背景（a < 255 で残像エフェクト）
```

### 数学
```javascript
map(val, min1,max1, min2,max2)  // 値のリマップ
lerp(a, b, t)                   // 線形補間
sin(angle) / cos(angle)         // 三角関数 (ラジアン)
TWO_PI / PI / HALF_PI           // 定数
```

---

## 数式アートパターン集

### 1. Rose Curve（バラ曲線）

```javascript
// k が奇数 → k 枚、k が偶数 → 2k 枚の花びら
const k = 5;
const r = 300 * cos(k * angle);
const x = r * cos(angle);
const y = r * sin(angle);
```

### 2. Lissajous（リサジュー図形）

```javascript
const a = 3, b = 2, delta = PI / 4;
const x = 300 * sin(a * angle + delta);
const y = 300 * sin(b * angle);
```

### 3. Spirograph（スピログラフ）

```javascript
const R = 200, r = 50, d = 80;
const x = (R - r) * cos(angle) + d * cos((R - r) / r * angle);
const y = (R - r) * sin(angle) - d * sin((R - r) / r * angle);
```

### 4. Perlin Flow Field（パーリンノイズ流場）

```javascript
// パーティクルが流場に沿って流れるアニメーション
const noiseScale = 0.005;
const angle = noise(x * noiseScale, y * noiseScale, frameCount * 0.01) * TWO_PI * 4;
const vx = cos(angle) * speed;
const vy = sin(angle) * speed;
```

### 5. 残像エフェクト

```javascript
// draw() の先頭で半透明の背景を重ねる
background(0, 0, 0, 15);  // alpha が小さいほど残像が長く残る
```

---

## スケッチのテンプレート

```javascript
// @p5studio fps=30 duration=6 width=1280 height=720
// <スケッチ名> — <説明>

function setup() {
  createCanvas(1280, 720);
  colorMode(HSB, 360, 100, 100, 100);
  background(0);
  // 初期化処理
}

function draw() {
  // 残像エフェクト（任意）
  background(0, 0, 0, 8);

  // t: 0.0 〜 1.0 の正規化された時刻
  const t = frameCount / (30 * 6);

  // 描画処理
  translate(width / 2, height / 2);
  // ...
}
```
