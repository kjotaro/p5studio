// @p5studio fps=30 duration=6 width=1080 height=1080
// Saturn Cube — 不可思議な回転キューブと土星の輪のような球体群

const FPS = 30;
const DURATION = 6;
const TOTAL_FRAMES = FPS * DURATION;
const NUM_SPHERES = 60;

function setup() {
  createCanvas(1080, 1080, WEBGL);
}

function draw() {
  const t = frameCount / TOTAL_FRAMES; // 0.0 ~ 1.0

  background(5, 5, 15);

  // ライティング
  ambientLight(40);
  pointLight(255, 180, 100, 300, -300, 400);
  pointLight(80, 120, 255, -400, 200, -300);

  // ─── 中央キューブ（不可思議な回転）───
  push();
  // 3軸それぞれ異なる周波数 + sin/cos のうねりで「不規則に見える回転」を作る
  rotateX(t * TWO_PI * 1.3 + sin(t * TWO_PI * 3) * 0.5);
  rotateY(t * TWO_PI * 0.7 + cos(t * TWO_PI * 2) * 0.4);
  rotateZ(sin(t * TWO_PI * 1.5) * 0.6);

  // normalMaterial は面の法線方向で色が変わる → 回転すると色が移り変わって不思議な見た目
  normalMaterial();
  box(140);
  pop();

  // ─── 土星の輪（球体群）───
  push();
  rotateX(QUARTER_PI); // 輪っかを斜めに傾ける

  for (let i = 0; i < NUM_SPHERES; i++) {
    const baseAngle = (i / NUM_SPHERES) * TWO_PI;

    // 球ごとに少し公転速度を変えて、均一すぎない動きにする
    const orbitSpeed = 0.3 + (i % 3) * 0.1;
    const angle = baseAngle + t * TWO_PI * orbitSpeed;

    // 軌道半径に揺らぎを加える
    const radius = 280 + sin(baseAngle * 5 + t * TWO_PI * 2) * 25;
    const x = cos(angle) * radius;
    const z = sin(angle) * radius;
    // 垂直方向にも小さく揺れる（輪の厚みを表現）
    const y = sin(angle * 3 + t * TWO_PI) * 20;

    push();
    translate(x, y, z);

    // 色相を球ごとにずらし、時間で回転させる
    const hue = (i / NUM_SPHERES) * 360 + t * 180;
    const r = 128 + 127 * sin(radians(hue));
    const g = 128 + 127 * sin(radians(hue + 120));
    const b = 128 + 127 * sin(radians(hue + 240));

    noStroke();
    emissiveMaterial(r * 0.5, g * 0.5, b * 0.5);
    ambientMaterial(r, g, b);

    // サイズもゆらゆら変化
    const size = 6 + sin(baseAngle * 2 + t * TWO_PI) * 3;
    sphere(size);
    pop();
  }
  pop();
}
