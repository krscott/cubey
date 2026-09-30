import assert from "node:assert/strict";
import test from "node:test";
import {
  fitProjection,
  interpolateScene,
  projectScene,
  randomScene,
  rotate,
} from "../site/geometry.js";

function seededRandom() {
  let seed = 42;
  return () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 2 ** 32;
  };
}

test("random scenes and transitions stay finite, visible, and within the drawing area", () => {
  const random = seededRandom();
  let previous = randomScene(random);
  for (let i = 0; i < 2000; i++) {
    const target = randomScene(random);
    assert.ok(target.dimensions.every((v) => v >= 0.7 && v <= 3.5));
    assert.ok(target.distance >= 1.8 && target.distance <= 6.5);
    assert.ok(target.light[1] > 0 && target.light[2] < 0);
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const scene = interpolateScene(previous, target, t);
      const projection = projectScene(scene);
      assert.ok(projection.points.every((p) => p[2] > 0));
      assert.ok(projection.faces.length >= 1 && projection.faces.length <= 3);
      assert.ok(
        projection.faces.every(
          (f) => f.brightness >= 0.32 && f.brightness <= 1.000001,
        ),
      );
      for (const [width, height] of [
        [360, 600],
        [1200, 700],
        [700, 200],
      ]) {
        const points = fitProjection(projection.projected, width, height);
        for (const [x, y] of points) {
          assert.ok(Number.isFinite(x) && x >= 0 && x <= width);
          assert.ok(Number.isFinite(y) && y >= 0 && y <= height);
        }
        const xs = points.map((p) => p[0]);
        const ys = points.map((p) => p[1]);
        assert.ok(Math.abs(Math.min(...xs) + Math.max(...xs) - width) < 1e-8);
        assert.ok(Math.abs(Math.min(...ys) + Math.max(...ys) - height) < 1e-8);
      }
    }
    previous = target;
  }
});

test("distance changes perspective even with identical fitted size", () => {
  const scene = {
    dimensions: [2, 2, 2],
    distance: 2,
    rotation: [0, 0, 0, 1],
    light: [0, 5, -3],
  };
  const close = fitProjection(projectScene(scene).projected, 600, 600);
  const far = fitProjection(
    projectScene({ ...scene, distance: 6 }).projected,
    600,
    600,
  );
  const frontWidth = (p) => p[1][0] - p[0][0];
  const backWidth = (p) => p[5][0] - p[4][0];
  assert.ok(Math.abs(frontWidth(close) - frontWidth(far)) < 1e-8);
  assert.ok(
    frontWidth(close) / backWidth(close) > frontWidth(far) / backWidth(far),
  );
  assert.equal(projectScene(scene).faces.length, 1);
});

test("quaternion interpolation preserves rotations and takes the short arc", () => {
  const scene = randomScene(seededRandom());
  const opposite = { ...scene, rotation: scene.rotation.map((v) => -v) };
  const middle = interpolateScene(scene, opposite, 0.5);
  const point = [2, 3, 4];
  assert.ok(
    Math.abs(
      Math.hypot(...rotate(point, middle.rotation)) - Math.hypot(...point),
    ) < 1e-10,
  );
  rotate(point, middle.rotation).forEach((v, i) =>
    assert.ok(Math.abs(v - rotate(point, scene.rotation)[i]) < 1e-10),
  );
});
