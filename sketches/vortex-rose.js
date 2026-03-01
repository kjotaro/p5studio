// @p5studio fps=30 duration=8 width=1080 height=1080
// Vortex Rose — グロウ＆ライン強弱で魅せるバラ曲線

const FPS = 30;
const DURATION = 8;
const TOTAL_FRAMES = FPS * DURATION;

function setup() {
  createCanvas(1080, 1080);
  colorMode(HSB, 360, 100, 100, 100);
  background(0);
}

function draw() {
  // 残像：短めにして動きをクッキリ見せる
  background(0, 0, 5, 30);

  translate(width / 2, height / 2);

  // 1フレームに大量の点を描いて密度を維持しつつ、スピードは目で追えるテンポに
  const stepsPerFrame = 120;
  // 5周に落とすことで「ギリギリ目で追えるスピード」に調整
  const totalSteps = TOTAL_FRAMES * stepsPerFrame;

  for (let i = 0; i < stepsPerFrame; i++) {
    const step = (frameCount - 1) * stepsPerFrame + i;
    const theta = (step / totalSteps) * TWO_PI * 5; // 10周 → 5周に半減

    // k=5 のバラ曲線
    const k = 5;
    const maxR = width * 0.46;
    const r = maxR * cos(k * theta);
    const x = r * cos(theta);
    const y = r * sin(theta);

    // 花びら先端ほど太く（curvature が大きい = 先端に近い）
    const curvature = abs(cos(k * theta)); // 0〜1
    const weight = map(curvature, 0, 1, 0.3, 5.5);

    // 虹色 + フレームごとに色相をシフトしてカラフルに
    const hue = (theta * 57.3 * 1.5 + frameCount * 3) % 360;

    // ── 外グロウ（広く薄く：雰囲気）──
    drawingContext.shadowBlur = 45;
    drawingContext.shadowColor = `hsl(${hue}, 100%, 55%)`;
    stroke(hue, 100, 100, 20);
    strokeWeight(weight * 6);
    point(x, y);

    // ── 内グロウ（締まったブルーム）──
    drawingContext.shadowBlur = 15;
    drawingContext.shadowColor = `hsl(${hue}, 80%, 80%)`;
    stroke(hue, 100, 100, 50);
    strokeWeight(weight * 2.5);
    point(x, y);

    // ── コアライン（細く鮮明）──
    drawingContext.shadowBlur = 0;
    stroke(hue, 20, 100, 98);
    strokeWeight(weight * 0.6);
    point(x, y);
  }

  // グロウをリセット（他の描画に影響しないよう）
  drawingContext.shadowBlur = 0;
}
