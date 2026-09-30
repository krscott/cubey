import {
  fitProjection,
  interpolateScene,
  projectScene,
  randomScene,
} from "./geometry.js";

const canvas = document.querySelector("canvas");
const context = canvas.getContext("2d");
const button = document.querySelector("button");
const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
let scene = randomScene();
let transition = null;
let frame = null;

function draw() {
  const { width, height } = canvas.getBoundingClientRect();
  const ratio = Math.min(devicePixelRatio || 1, 3);
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  const projection = projectScene(scene);
  const points = fitProjection(projection.projected, width, height);
  context.lineWidth = 1.25;
  context.lineJoin = "round";
  context.strokeStyle = "#45433f";
  for (const face of projection.faces) {
    context.beginPath();
    face.indices.forEach((index, i) => {
      const [x, y] = points[index];
      if (i === 0) context.moveTo(x, y);
      else context.lineTo(x, y);
    });
    context.closePath();
    const shade = Math.round(85 + face.brightness * 160);
    context.fillStyle = `rgb(${shade}, ${shade - 2}, ${shade - 6})`;
    context.fill();
    context.stroke();
  }
}

function animate(now) {
  frame = null;
  if (transition) {
    const t = Math.min(1, (now - transition.start) / 420);
    scene = interpolateScene(
      transition.from,
      transition.to,
      t * t * (3 - 2 * t),
    );
    if (t === 1) transition = null;
  }
  draw();
  if (transition) frame = requestAnimationFrame(animate);
}

button.addEventListener("click", () => {
  const target = randomScene();
  if (reducedMotion.matches) {
    scene = target;
    transition = null;
    draw();
  } else {
    transition = { from: scene, to: target, start: performance.now() };
    if (frame === null) frame = requestAnimationFrame(animate);
  }
});

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches && transition) {
    scene = transition.to;
    transition = null;
    cancelAnimationFrame(frame);
    frame = null;
    draw();
  }
});
new ResizeObserver(draw).observe(canvas);
