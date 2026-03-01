// @p5studio fps=30 duration=6 width=1280 height=720
// Rose Curve (バラ曲線) — p5studio サンプルスケッチ

let angle = 0;

function setup() {
  createCanvas(1280, 720);
  colorMode(HSB, 360, 100, 100, 100);
  background(0);
  strokeWeight(1.5);
  noFill();
}

function draw() {
  // 残像エフェクト
  background(0, 0, 0, 8);

  translate(width / 2, height / 2);

  const k = 5;           // 花びらの数 (奇数 → k枚, 偶数 → 2k枚)
  const r = min(width, height) * 0.42;
  const speed = TWO_PI / (30 * 6);  // 6秒で1周

  // 1フレームに複数点を描画してなめらかに
  const steps = 60;
  for (let i = 0; i < steps; i++) {
    const t = (frameCount * steps + i) * speed / steps;
    const rr = r * cos(k * t);
    const x = rr * cos(t);
    const y = rr * sin(t);

    const hue = (t / TWO_PI * 360 + frameCount * 2) % 360;
    stroke(hue, 80, 95, 85);
    point(x, y);
  }

  angle += speed;
}
