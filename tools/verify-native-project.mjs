import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = JSON.parse(await fs.readFile(path.join(root, "game.json"), "utf8"));
const scene = project.layouts.find((layout) => layout.name === "Game");
assert.ok(scene, "Game scene is missing");
assert.ok(scene.objects.length >= 10, "Expected native scene objects");
assert.ok(scene.instances.length >= 10, "Expected editable initial instances");
assert.ok(scene.events.length >= 20, "Expected a substantial native event sheet");
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
console.log(
  `Native verification passed: ${scene.objects.length} objects, ${scene.instances.length} instances, ${scene.events.length} top-level events, 0 JavaScript events.`,
);
