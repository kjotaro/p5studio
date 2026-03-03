// @p5studio fps=30 duration=8 width=1080 height=1080
// Ocean Grain — 真上から見た海の波 + 荒めのグレインエフェクト

const FPS = 30;
const DURATION = 8;
const TOTAL_FRAMES = FPS * DURATION;

function setup() {
  createCanvas(1080, 1080);
  colorMode(HSB, 360, 100, 100, 100);
  noStroke();
  noiseSeed(42);
}

function draw() {
  const t = frameCount / TOTAL_FRAMES;

  background(210, 85, 10);

  // --- 真上から見た海面をPerlinノイズで描画 ---
  const step = 4;
  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      // 複数スケールのノイズを重ねて自然な波に
      const nx = x * 0.004;
      const ny = y * 0.004;
      const timeShift = t * TWO_PI;

      // 大きなうねり
      const n1 = noise(nx * 1.0, ny * 1.0, timeShift * 0.3);
      // 中くらいの波
      const n2 = noise(nx * 2.5 + 100, ny * 2.5 + 100, timeShift * 0.6) * 0.4;
      // 細かいさざ波
      const n3 = noise(nx * 6.0 + 300, ny * 6.0 + 300, timeShift * 1.0) * 0.15;

      const n = n1 + n2 + n3;

      // 色のマッピング: 波の高さに応じて色相・明度を変化
      const hue = map(n, 0.2, 1.2, 220, 180);
      const sat = map(n, 0.2, 1.2, 100, 75);
      const bri = map(n, 0.2, 1.2, 25, 70);

      fill(hue, sat, bri, 100);
      rect(x, y, step, step);
    }
  }

  // --- コースティクス（光の揺らめき）グリッドベースで安定 ---
  blendMode(ADD);
  const causticStep = 8;
  for (let cy = 0; cy < height; cy += causticStep) {
    for (let cx = 0; cx < width; cx += causticStep) {
      const nx = cx * 0.005;
      const ny = cy * 0.005;
      const timeShift = t * TWO_PI;

      const n = noise(nx * 3.0 + 50, ny * 3.0 + 50, timeShift * 0.8);

      if (n > 0.55) {
        const alpha = map(n, 0.55, 0.8, 0, 10);
        const size = map(n, 0.55, 0.8, 2, 10);
        fill(195, 30, 90, alpha);
        ellipse(cx, cy, size, size * 0.6);
      }
    }
  }
  blendMode(BLEND);

  // --- グレインエフェクト（Perlinノイズベースで滑らか） ---
  loadPixels();
  const d = pixelDensity();
  const pw = width * d;
  const ph = height * d;
  const grainIntensity = 20;
  const grainScale = 0.03;
  const grainTime = frameCount * 0.05;

  for (let py = 0; py < ph; py++) {
    for (let px = 0; px < pw; px++) {
      const i = (py * pw + px) * 4;
      const grain = (noise(px * grainScale, py * grainScale, grainTime) - 0.5) * 2 * grainIntensity;
      pixels[i]     += grain;
      pixels[i + 1] += grain;
      pixels[i + 2] += grain;
    }
  }
  updatePixels();
}
