// Camera coordinates: x right, y up, z away from the viewer.
export const dot = (a, b) => a.reduce((sum, value, i) => sum + value * b[i], 0);
const normalize = (v) => v.map((value) => value / Math.hypot(...v));

export function normalSample(mean, deviation, min, max, random = Math.random) {
  let value;
  do {
    const u = 1 - random();
    const v = random();
    value =
      mean +
      deviation * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  } while (value < min || value > max);
  return value;
}

export function randomScene(random = Math.random) {
  const u = random();
  const a = 2 * Math.PI * random();
  const b = 2 * Math.PI * random();
  return {
    dimensions: Array.from({ length: 3 }, () =>
      normalSample(2, 0.65, 0.7, 3.5, random),
    ),
    // Distance is measured in bounding-sphere radii, so every box stays in front of the camera.
    distance: normalSample(3.5, 1.1, 1.8, 6.5, random),
    rotation: [
      Math.sqrt(1 - u) * Math.sin(a),
      Math.sqrt(1 - u) * Math.cos(a),
      Math.sqrt(u) * Math.sin(b),
      Math.sqrt(u) * Math.cos(b),
    ],
    light: [(random() - 0.5) * 8, 3 + random() * 5, -2 - random() * 4],
  };
}

export function interpolateScene(from, to, t) {
  const blend = (a, b) => a + (b - a) * t;
  const vector = (a, b) => a.map((value, i) => blend(value, b[i]));
  // q and -q describe the same rotation. Choose the shorter arc.
  const rotation =
    dot(from.rotation, to.rotation) < 0
      ? to.rotation.map((v) => -v)
      : to.rotation;
  return {
    dimensions: vector(from.dimensions, to.dimensions),
    distance: blend(from.distance, to.distance),
    rotation: normalize(vector(from.rotation, rotation)),
    light: vector(from.light, to.light),
  };
}

export function rotate([x, y, z], [qx, qy, qz, qw]) {
  const tx = 2 * (qy * z - qz * y);
  const ty = 2 * (qz * x - qx * z);
  const tz = 2 * (qx * y - qy * x);
  return [
    x + qw * tx + qy * tz - qz * ty,
    y + qw * ty + qz * tx - qx * tz,
    z + qw * tz + qx * ty - qy * tx,
  ];
}

const vertices = [
  [-1, -1, -1],
  [1, -1, -1],
  [1, 1, -1],
  [-1, 1, -1],
  [-1, -1, 1],
  [1, -1, 1],
  [1, 1, 1],
  [-1, 1, 1],
];
const faces = [
  { indices: [0, 3, 2, 1], normal: [0, 0, -1] },
  { indices: [4, 5, 6, 7], normal: [0, 0, 1] },
  { indices: [0, 4, 7, 3], normal: [-1, 0, 0] },
  { indices: [1, 2, 6, 5], normal: [1, 0, 0] },
  { indices: [0, 1, 5, 4], normal: [0, -1, 0] },
  { indices: [3, 7, 6, 2], normal: [0, 1, 0] },
];

export function projectScene(scene) {
  const distance = (scene.distance * Math.hypot(...scene.dimensions)) / 2;
  const points = vertices.map((vertex) => {
    const point = rotate(
      vertex.map((v, i) => (v * scene.dimensions[i]) / 2),
      scene.rotation,
    );
    return [point[0], point[1], point[2] + distance];
  });
  const projected = points.map(([x, y, z]) => [x / z, -y / z]);
  const visible = faces
    .flatMap(({ indices, normal }) => {
      const center = [0, 1, 2].map(
        (axis) =>
          indices.reduce((sum, index) => sum + points[index][axis], 0) / 4,
      );
      const rotatedNormal = rotate(normal, scene.rotation);
      if (dot(rotatedNormal, center) >= 0) return [];
      const lightDirection = normalize(
        scene.light.map((v, i) => v - center[i]),
      );
      return [
        {
          indices,
          depth: center[2],
          brightness:
            0.32 + 0.68 * Math.max(0, dot(rotatedNormal, lightDirection)),
        },
      ];
    })
    .sort((a, b) => b.depth - a.depth);
  return { points, projected, faces: visible };
}

export function fitProjection(projected, width, height) {
  const xs = projected.map((p) => p[0]);
  const ys = projected.map((p) => p[1]);
  const minX = Math.min(...xs),
    maxX = Math.max(...xs);
  const minY = Math.min(...ys),
    maxY = Math.max(...ys);
  const scale = 0.68 * Math.min(width / (maxX - minX), height / (maxY - minY));
  return projected.map(([x, y]) => [
    width / 2 + (x - (minX + maxX) / 2) * scale,
    height / 2 + (y - (minY + maxY) / 2) * scale,
  ]);
}
