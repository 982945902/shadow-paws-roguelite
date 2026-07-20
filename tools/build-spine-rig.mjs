import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const partsDirectory = path.join(root, "assets", "hero-rig-v3");
const outputJson = path.join(root, "assets", "hero-rig-v3.json");
const outputAtlas = path.join(root, "assets", "hero-rig-v3.atlas");

const parts = {
  head: [312, 321],
  torso: [308, 414],
  cape: [505, 226],
  tail: [311, 327],
  rear_upper_arm: [159, 243],
  rear_forearm: [240, 214],
  front_upper_arm: [170, 238],
  front_forearm: [249, 184],
  rear_thigh: [165, 301],
  rear_shin: [175, 285],
  front_thigh: [204, 294],
  front_shin: [160, 287],
  dagger: [334, 338],
};

for (const name of Object.keys(parts)) {
  await fs.access(path.join(partsDirectory, `${name}.png`));
}

const atlas = Object.entries(parts)
  .map(([name, [width, height]]) => [
    `hero-rig-v3/${name}.png`,
    `size: ${width}, ${height}`,
    "format: RGBA8888",
    "filter: Linear, Linear",
    "repeat: none",
    name,
    `  bounds: 0, 0, ${width}, ${height}`,
  ].join("\n"))
  .join("\n\n");

const bones = [
  { name: "root" },
  { name: "hips", parent: "root", y: 300 },
  { name: "cape", parent: "hips", x: -70, y: 80, rotation: 8 },
  { name: "tail", parent: "hips", x: -85, y: 25, rotation: -8 },
  { name: "rear_thigh", parent: "hips", x: -34, y: -5, rotation: -3 },
  { name: "rear_shin", parent: "rear_thigh", y: -120, rotation: 5 },
  { name: "rear_upper_arm", parent: "hips", x: -42, y: 120, rotation: 8 },
  { name: "rear_forearm", parent: "rear_upper_arm", y: -92, rotation: -14 },
  { name: "torso", parent: "hips", y: 78 },
  { name: "head", parent: "torso", x: 36, y: 160 },
  { name: "front_thigh", parent: "hips", x: 36, y: -3, rotation: 3 },
  { name: "front_shin", parent: "front_thigh", y: -120, rotation: -5 },
  { name: "front_upper_arm", parent: "torso", x: 48, y: 78, rotation: -8 },
  { name: "front_forearm", parent: "front_upper_arm", y: -88, rotation: 14 },
  { name: "dagger", parent: "front_forearm", x: 66, y: -72, rotation: -24 },
];

const slots = [
  ["cape", "cape"],
  ["tail", "tail"],
  ["rear_thigh", "rear_thigh"],
  ["rear_shin", "rear_shin"],
  ["rear_upper_arm", "rear_upper_arm"],
  ["rear_forearm", "rear_forearm"],
  ["torso", "torso"],
  ["front_thigh", "front_thigh"],
  ["front_shin", "front_shin"],
  ["head", "head"],
  ["front_upper_arm", "front_upper_arm"],
  ["front_forearm", "front_forearm"],
  ["dagger", "dagger"],
].map(([name, bone]) => ({ name, bone, attachment: name }));

const attachmentOffsets = {
  cape: { x: -80, y: 20 },
  tail: { x: -70, y: -30 },
  rear_thigh: { y: -135 },
  rear_shin: { y: -128 },
  rear_upper_arm: { y: -105 },
  rear_forearm: { x: 52, y: -70 },
  torso: { y: 35 },
  front_thigh: { y: -132 },
  front_shin: { y: -130 },
  head: { x: 20, y: 28 },
  front_upper_arm: { y: -103 },
  front_forearm: { x: 55, y: -64 },
  dagger: { x: 110, y: 35 },
};

const attachments = Object.fromEntries(
  Object.entries(parts).map(([name, [width, height]]) => [
    name,
    {
      [name]: {
        ...(attachmentOffsets[name] || {}),
        width,
        height,
      },
    },
  ]),
);

const rotate = (...frames) => ({ rotate: frames.map(([time, value]) => ({ ...(time ? { time } : {}), value })) });
const loop = (a, b, duration = 0.72) => [[0, a], [duration / 2, b], [duration, a]];
const animations = {
  idle: {
    bones: {
      torso: rotate(...loop(-1.8, 1.8, 1.2)),
      head: rotate(...loop(1.5, -1.5, 1.2)),
      cape: rotate(...loop(-3, 4, 1.2)),
      tail: rotate(...loop(-7, 8, 1.2)),
      front_upper_arm: rotate(...loop(-2, 3, 1.2)),
    },
  },
  run: {
    bones: {
      torso: rotate(...loop(-5, 5, 0.48)),
      head: rotate(...loop(3, -3, 0.48)),
      cape: rotate(...loop(-12, 15, 0.48)),
      tail: rotate(...loop(-18, 18, 0.48)),
      front_thigh: rotate(...loop(-28, 31, 0.48)),
      front_shin: rotate(...loop(24, -25, 0.48)),
      rear_thigh: rotate(...loop(31, -28, 0.48)),
      rear_shin: rotate(...loop(-25, 24, 0.48)),
      front_upper_arm: rotate(...loop(22, -20, 0.48)),
      rear_upper_arm: rotate(...loop(-20, 22, 0.48)),
    },
  },
  jump: {
    bones: {
      torso: rotate([0, -8], [0.18, 5], [0.5, 0]),
      front_thigh: rotate([0, -16], [0.5, -8]),
      rear_thigh: rotate([0, 24], [0.5, 10]),
      front_shin: rotate([0, 42], [0.5, 20]),
      rear_shin: rotate([0, 30], [0.5, 15]),
      cape: rotate([0, -18], [0.5, 12]),
      tail: rotate([0, -20], [0.5, 10]),
    },
  },
  attack1: {
    bones: {
      torso: rotate([0, -8], [0.07, -15], [0.15, 10], [0.3, 0]),
      front_upper_arm: rotate([0, -36], [0.07, -55], [0.15, 76], [0.3, 0]),
      front_forearm: rotate([0, -24], [0.07, -36], [0.15, 42], [0.3, 0]),
      dagger: rotate([0, -18], [0.07, -30], [0.15, 28], [0.3, 0]),
      cape: rotate([0, 4], [0.15, -16], [0.3, 0]),
    },
  },
  attack2: {
    bones: {
      torso: rotate([0, 10], [0.08, 17], [0.17, -12], [0.34, 0]),
      front_upper_arm: rotate([0, 64], [0.08, 82], [0.17, -58], [0.34, 0]),
      front_forearm: rotate([0, 35], [0.08, 48], [0.17, -38], [0.34, 0]),
      dagger: rotate([0, 25], [0.08, 38], [0.17, -35], [0.34, 0]),
      tail: rotate([0, -5], [0.17, 20], [0.34, 0]),
    },
  },
  attack3: {
    bones: {
      torso: rotate([0, -14], [0.12, -22], [0.22, 18], [0.42, 0]),
      front_upper_arm: rotate([0, -62], [0.12, -88], [0.22, 128], [0.42, 0]),
      front_forearm: rotate([0, -42], [0.12, -65], [0.22, 68], [0.42, 0]),
      dagger: rotate([0, -35], [0.12, -52], [0.22, 56], [0.42, 0]),
      cape: rotate([0, 8], [0.22, -28], [0.42, 0]),
      tail: rotate([0, -18], [0.22, 25], [0.42, 0]),
    },
  },
  heavy: {
    bones: {
      torso: rotate([0, -18], [0.18, -25], [0.3, 25], [0.58, 0]),
      front_upper_arm: rotate([0, -78], [0.18, -105], [0.3, 145], [0.58, 0]),
      front_forearm: rotate([0, -55], [0.18, -78], [0.3, 88], [0.58, 0]),
      dagger: rotate([0, -45], [0.18, -70], [0.3, 82], [0.58, 0]),
      front_thigh: rotate([0, -10], [0.3, 18], [0.58, 0]),
      rear_thigh: rotate([0, 12], [0.3, -18], [0.58, 0]),
      cape: rotate([0, 12], [0.3, -36], [0.58, 0]),
      tail: rotate([0, -22], [0.3, 32], [0.58, 0]),
    },
  },
  dash: {
    bones: {
      torso: rotate([0, -18], [0.18, -18]),
      head: rotate([0, 8], [0.18, 8]),
      front_upper_arm: rotate([0, 25], [0.18, 25]),
      rear_upper_arm: rotate([0, 20], [0.18, 20]),
      cape: rotate([0, -38], [0.18, -38]),
      tail: rotate([0, -34], [0.18, -34]),
      front_thigh: rotate([0, 16], [0.18, 16]),
      rear_thigh: rotate([0, -14], [0.18, -14]),
    },
  },
  hurt: {
    bones: {
      torso: rotate([0, 18], [0.08, 24], [0.26, 0]),
      head: rotate([0, -15], [0.08, -22], [0.26, 0]),
      front_upper_arm: rotate([0, -28], [0.08, -38], [0.26, 0]),
      cape: rotate([0, 22], [0.08, 34], [0.26, 0]),
      tail: rotate([0, 20], [0.08, 30], [0.26, 0]),
    },
  },
};

const skeleton = {
  skeleton: {
    hash: "shadow-paws-hero-rig-v3",
    spine: "4.2.22",
    x: -360,
    y: -10,
    width: 760,
    height: 700,
    images: "./",
  },
  bones,
  slots,
  skins: [{ name: "default", attachments }],
  animations,
};

await fs.writeFile(outputAtlas, `${atlas}\n`);
await fs.writeFile(outputJson, `${JSON.stringify(skeleton, null, 2)}\n`);
console.log(JSON.stringify({ outputJson, outputAtlas, parts: Object.keys(parts).length, animations: Object.keys(animations) }, null, 2));
