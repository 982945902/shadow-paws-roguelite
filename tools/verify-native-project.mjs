import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = JSON.parse(await fs.readFile(path.join(root, "game.json"), "utf8"));
const scene = project.layouts.find((layout) => layout.name === "Game");
assert.ok(scene, "Game scene is missing");
assert.ok(scene.objects.length >= 20, "Expected the v2 native scene objects");
assert.ok(scene.instances.length >= 20, "Expected editable v2 initial instances");
assert.ok(scene.events.length >= 90, "Expected the complete native v2 event sheet");
assert.ok(
  scene.events.every((event) => event.type !== "BuiltinCommonInstructions::JsCode"),
  "Monolithic JavaScript events are forbidden",
);
assert.ok(
  scene.objects.some((object) =>
    object.behaviors?.some(
      (behavior) => behavior.type === "PlatformBehavior::PlatformerObjectBehavior",
    ),
  ),
  "Platformer behavior is missing",
);
for (const objectName of ["Player", "Hound", "Moth", "Boss", "Slash", "HeavySlash", "Bolt", "Shockwave"]) {
  assert.ok(scene.objects.some((object) => object.name === objectName), `${objectName} is missing`);
}
for (const resourceName of ["hero-v2.png", "hound-v2.png", "moth-v2.png", "boss-v2.png", "slash.wav", "impact.wav"]) {
  assert.ok(
    project.resources.resources.some((resource) => resource.name === resourceName),
    `${resourceName} is missing`,
  );
}
console.log(
  `Native verification passed: ${scene.objects.length} objects, ${scene.instances.length} instances, ${scene.events.length} top-level events, 0 JavaScript events.`,
);
