import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const project = JSON.parse(await fs.readFile(path.join(root, "game.json"), "utf8"));
const scene = project.layouts.find((layout) => layout.name === "Game");
assert.ok(scene, "Game scene is missing");

const walkEvents = (events) => events.flatMap((event) => [event, ...walkEvents(event.events || [])]);
const allEvents = walkEvents(scene.events);
const allInstructions = allEvents.flatMap((event) => [
  ...(event.conditions || []),
  ...(event.actions || []),
]);
const instructionType = (instruction) => instruction.type?.value || instruction.type;
const variable = (variables, name) => variables.find((item) => item.name === name);
const child = (parent, name) => parent?.children?.find((item) => item.name === name);

assert.ok(scene.objects.length >= 44, "Expected the complete roguelite object set");
assert.ok(scene.instances.length >= 60, "Expected six editable room layouts and HUD instances");
assert.ok(scene.events.length >= 8, "Expected collapsible native event sections");
assert.ok(allEvents.length >= 180, "Expected the complete native roguelite event sheet");
assert.ok(
  allEvents.every((event) => event.type !== "BuiltinCommonInstructions::JsCode"),
  "JavaScript events are forbidden, including nested events",
);
assert.ok(
  scene.events.every((event) => event.type === "BuiltinCommonInstructions::Group"),
  "Top-level native events must be organized into editor-visible groups",
);
assert.ok(
  scene.objects.some((object) =>
    object.behaviors?.some(
      (behavior) => behavior.type === "PlatformBehavior::PlatformerObjectBehavior",
    ),
  ),
  "Platformer behavior is missing",
);
assert.ok(
  scene.objects.some((object) => object.name === "HeroRig" && object.type === "SpineObject::SpineObject"),
  "Native Spine hero rig is missing",
);
for (const objectName of ["Player", "HeroRig", "Hound", "Moth", "Boss", "Slash", "HeavySlash", "PlayerBolt", "ImpactBurst", "Bolt", "Shockwave", "MenuBackdrop", "WeaponTitle", "PathTitle", "HudBuild"]) {
  assert.ok(scene.objects.some((object) => object.name === objectName), `${objectName} is missing`);
}

const content = variable(project.variables, "Content");
assert.equal(content?.type, "structure", "Content must be a structured global variable");
assert.equal(child(content, "Weapons")?.children?.length, 3, "Expected three data-driven weapons");
assert.equal(child(content, "Blessings")?.children?.length, 12, "Expected twelve data-driven blessings");
assert.equal(child(content, "Affixes")?.children?.length, 6, "Expected six data-driven equipment affixes");
assert.equal(child(content, "Rooms")?.children?.length, 3, "Expected three encounter archetypes");
assert.equal(child(content, "Biomes")?.children?.length, 3, "Expected three generated biomes");

const maxRoom = variable(scene.variables, "MaxRoom");
assert.equal(maxRoom?.value, 6, "The run must contain five encounters and a boss room");
assert.equal(variable(scene.variables, "Route")?.type, "structure", "The route must be editable structured data");
for (const name of ["Risk", "RewardMultiplier", "Affix", "PendingAffix", "AffixTier", "AffixName", "FeralRank", "MoonRank", "RiftRank", "MetaEchoes", "BestDepth"]) {
  assert.ok(variable(scene.variables, name), `${name} scene variable is missing`);
}

const groups = new Map(scene.objectsGroups.map((group) => [group.name, group.objects.map((object) => object.name)]));
assert.deepEqual(groups.get("Enemies"), ["Hound", "Moth", "Boss"]);
assert.deepEqual(groups.get("PlayerAttacks"), ["Slash", "HeavySlash", "PlayerBolt"]);
assert.deepEqual(groups.get("HostileAttacks"), ["Bolt", "Shockwave"]);
assert.deepEqual(groups.get("Platforms"), ["ForestGround", "BridgeGround", "AltarGround"]);

assert.ok(
  scene.instances.some((instance) => instance.initialVariables?.some((item) => item.name === "RoomMetadata")),
  "Room instances must carry editable room metadata",
);

const actionCount = (type) => allInstructions.filter((instruction) => instructionType(instruction) === type).length;
assert.ok(actionCount("LoadFile") >= 1, "Persistent progression must load storage");
assert.ok(actionCount("ReadNumberFromStorage") >= 3, "Persistent progression values must be restored");
assert.ok(actionCount("EcrireFichierExp") >= 6, "Victory and defeat must bank progression");
assert.ok(actionCount("Scene") >= 1, "Victory and defeat must support a native scene restart");
assert.ok(actionCount("Create") >= 50, "Generated encounters and weapon attacks are missing");
assert.ok(actionCount("ModVarScene") >= 250, "Run, build, and route state actions are incomplete");
for (const resourceName of ["hero-rig-v3.json", "hero-rig-v3.atlas", "hound-v2.png", "moth-v2.png", "boss-v2.png", "slash.wav", "impact.wav", "hit-confirm.wav", "heavy-impact.wav"]) {
  assert.ok(
    project.resources.resources.some((resource) => resource.name === resourceName),
    `${resourceName} is missing`,
  );
}
const spine = project.resources.resources.find((resource) => resource.name === "hero-rig-v3.json");
assert.equal(spine.kind, "spine", "Hero rig must use a native Spine resource");
console.log(
  `Native verification passed: ${scene.objects.length} objects, ${scene.instances.length} instances, ${scene.events.length} event groups, ${allEvents.length} total native events, 3 weapons, 12 blessings, 6 gear affixes, 6 rooms, 0 JavaScript events.`,
);
