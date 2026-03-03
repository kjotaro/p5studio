// @p5studio fps=30 duration=9 width=1080 height=1080
// Text Zoom — 立体アルファベットが一文字ずつ迫ってくるアニメーション

const FPS = 30;
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const APPROACH_FRAMES = 6;
const HOLD_FRAMES = 3;

let schedule = [];

// 立体文字を描画する関数
function draw3DText(letter, x, y, size, alpha, rotation) {
  push();
  translate(x, y);
  rotate(rotation);
  textSize(size);

  const depth = max(4, floor(size * 0.02));
  const offsetX = size * 0.003;
  const offsetY = size * 0.004;

  // --- 影レイヤー ---
  for (let d = depth; d >= 1; d--) {
    const ratio = d / depth;
    const shade = map(ratio, 0, 1, 120, 30);
    const a = alpha * map(ratio, 0, 1, 0.9, 0.4);
    fill(shade, shade, shade, a);
    text(letter, offsetX * d, offsetY * d);
  }

  // --- 側面レイヤー ---
  for (let d = depth; d >= 1; d--) {
    const ratio = d / depth;
    const shade = map(ratio, 0, 1, 200, 80);
    fill(shade, shade, shade, alpha);
    text(letter, offsetX * d * 0.5, offsetY * d * 0.5);
  }

  // --- 表面 ---
  fill(255, 255, 255, alpha);
  text(letter, 0, 0);

  // --- ハイライト ---
  fill(255, 255, 255, alpha * 0.3);
  text(letter, -offsetX * 0.3, -offsetY * 0.3);

  pop();
}

function setup() {
  createCanvas(1080, 1080);
  textAlign(CENTER, CENTER);
  textStyle(BOLD);
  randomSeed(99);

  // A〜Zの26文字ぴったりでスケジュール生成
  let frame = 0;
  for (let i = 0; i < 26; i++) {
    const letter = LETTERS[i];
    const tilt = random(-PI, PI);
    schedule.push({ startFrame: frame, letter, tilt });
    if (i < 25) {
      frame += floor(random(7, 12));
    }
  }
}

function draw() {
  background(0);

  const f = frameCount;

  for (let i = 0; i < schedule.length; i++) {
    const entry = schedule[i];
    const local = f - entry.startFrame;

    if (local < 0 || local >= APPROACH_FRAMES + HOLD_FRAMES) continue;

    if (local < APPROACH_FRAMES) {
      const progress = local / APPROACH_FRAMES;
      const eased = 1 - pow(1 - progress, 4);

      const size = map(eased, 0, 1, 15, 1800);
      const alpha = map(eased, 0, 1, 40, 255);
      const rotation = entry.tilt * (1 - eased);

      draw3DText(entry.letter, width / 2, height / 2, size, alpha, rotation);

    } else {
      const holdProgress = (local - APPROACH_FRAMES) / HOLD_FRAMES;
      const alpha = map(holdProgress, 0, 1, 255, 100);

      draw3DText(entry.letter, width / 2, height / 2, 1800, alpha, 0);
    }
  }
}
