---
name: render
description: p5.js スケッチを MP4 動画に書き出す
argument-hint: [sketch-name]
allowed-tools: "Bash(npx p5studio render *)", Glob
---

# /render — p5.js スケッチを MP4 に書き出す

指定されたスケッチ（または最近変更されたスケッチ）を MP4 動画に書き出します。

## 処理手順

1. 引数が指定されている場合:
   - `sketches/<name>.js` を対象ファイルとする
   - 存在しない場合は `sketches/` を Glob して類似ファイルを提案する

2. 引数が省略されている場合:
   - `sketches/` ディレクトリの全 `.js` ファイルを Glob する
   - 最近変更されたファイルを自動選択する（ユーザーに確認する）

3. 以下のコマンドを実行する:
   ```bash
   npx p5studio render sketches/<name>.js --output out/<name>.mp4
   ```

4. 完了後、以下を表示する:
   ```
   ✅ レンダリング完了！

   ファイル: out/<name>.mp4
   サイズ: X.XX MB

   Finder で開く: open out/<name>.mp4
   ```

## 注意点

- `out/` ディレクトリは自動作成される
- レンダリングには数分かかる場合がある（フレーム数 × キャプチャ時間）
- スケッチのメタデータコメント `// @p5studio fps=30 duration=6 ...` が設定を決定する
- メタデータがない場合はデフォルト値（30fps / 6秒 / 1280×720）が使われる

## 引数の例

```
/render                    ← 最近変更されたスケッチを選択
/render perlin-flow        ← sketches/perlin-flow.js を書き出す
/render rose-curve         ← sketches/rose-curve.js を書き出す
```
