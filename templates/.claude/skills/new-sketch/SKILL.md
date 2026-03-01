---
name: new-sketch
description: p5.js スケッチファイルを新規作成する
argument-hint: <sketch-name> [description]
allowed-tools: Read, Write, Glob, "Bash(node *)"
---

# /new-sketch — p5.js スケッチ新規作成

引数で指定された名前とオプションの説明を受け取り、p5.js スケッチファイルを `sketches/` ディレクトリに作成します。

## 処理手順

1. `sketches/` ディレクトリの既存ファイルを Glob で確認する
2. `sketches/<name>.js` が既に存在する場合は警告して確認を求める
3. 以下のテンプレートを元に `sketches/<name>.js` を作成する:
   - 先頭に `// @p5studio fps=30 duration=6 width=1280 height=720` メタデータを記述
   - 説明コメントを追加
   - `setup()` と `draw()` のテンプレートを記述
   - 引数の説明から適切な数式アートパターン（Rose Curve / Perlin Flow / Lissajous / Spirograph）を選択して雛形を組み込む
4. 作成完了後、以下を案内する:
   ```
   ✅ sketches/<name>.js を作成しました！

   プレビューを起動:
     npx p5studio dev sketches/<name>.js

   MP4 に書き出す:
     /render <name>
   ```

## スケッチ作成の注意点

- **決定論的に書くこと**: `millis()` や `Date.now()` ではなく `frameCount` を使う
- **メタデータは必ず先頭に書く**: `// @p5studio fps=30 duration=6 width=1280 height=720`
- **カラーモードは HSB 推奨**: `colorMode(HSB, 360, 100, 100, 100)`
- **残像エフェクトを活用**: `background(0, 0, 0, 8)` で軌跡を描ける

## 引数のパース

- 第1引数: スケッチ名（ファイル名になる。スペースはハイフンに変換）
- 残りの引数: スケッチの説明（どんなアートを作るか）

例:
```
/new-sketch perlin-flow パーリンノイズで流れる粒子のアニメーション
/new-sketch rose-curve バラ曲線のカラフルなアニメーション
/new-sketch lissajous リサジュー図形
```
