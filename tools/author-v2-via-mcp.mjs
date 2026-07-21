import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

import { contentTables, weapons } from "./roguelite-content.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const workspace = path.dirname(root);
const mcpRoot = path.resolve(
  process.env.GDEVELOP_MCP_SERVER_ROOT || path.join(workspace, "gdevelop-mcp-server-repo"),
);
const libGDPath = path.resolve(
  process.env.GDEVELOP_LIBGD_PATH || path.join(workspace, "runtime-artifacts/libGD/libGD.js"),
);
const gdjsRoot = path.resolve(
  process.env.GDEVELOP_GDJS_ROOT || path.join(workspace, "runtime-artifacts/GDJS"),
);
const projectFile = path.join(root, "game.json");
const webDirectory = path.resolve(
  process.env.GDEVELOP_GAME_WEB_DIRECTORY || path.join(root, "web"),
);

await Promise.all([
  fs.access(path.join(mcpRoot, "src/index.js")),
  fs.access(libGDPath),
  fs.access(path.join(gdjsRoot, "Runtime")),
]);

const transport = new StdioClientTransport({
  command: process.execPath,
  args: [path.join(mcpRoot, "src/index.js")],
  env: {
    ...process.env,
    GDEVELOP_LIBGD_PATH: libGDPath,
    GDEVELOP_GDJS_ROOT: gdjsRoot,
  },
});
const client = new Client({ name: "shadow-paws-complete-author", version: "0.4.0" });

const call = async (name, args) => {
  const result = await client.callTool({ name, arguments: args });
  if (result.isError) {
    throw new Error(`${name}: ${result.content?.map((item) => item.text).join("\n")}`);
  }
  return result.structuredContent;
};

const instruction = (type, parameters = [], inverted = false) => ({
  type,
  parameters: parameters.map(String),
  inverted,
});
const standard = (conditions = [], actions = [], subEvents = []) => ({
  kind: "standard",
  conditions,
  actions,
  subEvents,
});
const comment = (text, color = { r: 51, g: 32, b: 92 }) => ({ kind: "comment", text, color });
const quoted = (value) => JSON.stringify(value);
const once = () => instruction("BuiltinCommonInstructions::Once");
const key = (name) => instruction("KeyPressed", ["", name]);
const sceneIs = (name, operator, value) => instruction("VarScene", [name, operator, value]);
const objectIs = (object, name, operator, value) =>
  instruction("VarObjet", [object, name, operator, value]);
const sceneVar = (name, operator, value) => instruction("ModVarScene", [name, operator, value]);
const sceneTextVar = (name, operator, value) => instruction("ModVarSceneTxt", [name, operator, value]);
const objectVar = (object, name, operator, value) =>
  instruction("ModVarObjet", [object, name, operator, value]);
const create = (name, x, y, layer = "") => instruction("Create", ["", name, x, y, layer]);
const collision = (a, b) => instruction("CollisionNP", [a, b, "", "", ""]);
const objectTimer = (object, timer, operator, value) =>
  instruction("CompareObjectTimer", [object, quoted(timer), operator, value]);
const resetObjectTimer = (object, timer) =>
  instruction("ResetObjectTimer", [object, quoted(timer)]);
const sceneTimer = (timer, value) => instruction("Timer", ["", value, quoted(timer)]);
const resetSceneTimer = (timer) => instruction("ResetTimer", ["", quoted(timer)]);
const text = (object, value) => instruction("TextObject::String", [object, "=", quoted(value)]);
const show = (object) => instruction("Show", [object]);
const hide = (object) => instruction("Hide", [object]);
const play = (resource, volume = 80, pitch = 1) =>
  instruction("PlaySound", ["", resource, "", volume, pitch]);
const animation = (name) =>
  instruction("AnimatableCapability::AnimatableBehavior::SetName", ["HeroRig", "Animation", "=", quoted(name)]);
const flipRig = (flipped) =>
  instruction("FlippableCapability::FlippableBehavior::FlipX", ["HeroRig", "Flippable", flipped ? "yes" : "no"]);
const layerTimeScale = (value) => instruction("ChangeLayerTimeScale", ["", "", value]);
const resize = (object, width, height) => [
  instruction("ResizableCapability::ResizableBehavior::SetWidth", [object, "Resizable", "=", width]),
  instruction("ResizableCapability::ResizableBehavior::SetHeight", [object, "Resizable", "=", height]),
];

const gameplayState = [sceneIs("State", "=", 1)];
const textStyle = {
  bold: true,
  outline: { enabled: true, thickness: 3, color: "17;10;39" },
  shadow: { enabled: true, color: "0;0;0", opacity: 180, distance: 4, blurRadius: 3 },
};

await client.connect(transport);
try {
  const created = await call("create_project", {
    projectFile,
    name: "Shadow Paws: Echoes of the Rift",
    description: "A complete native GDevelop side-scrolling action roguelite authored through MCP.",
    sceneName: "Game",
    renderingType: "2d",
    width: 960,
    height: 540,
    adaptGameResolutionAtRuntime: false,
    sizeOnStartupMode: "",
    loadingBackgroundResourceName: "rift-background-v2.png",
    loadingBackgroundColor: 0x080b21,
    loadingMinDuration: 0.35,
    showGDevelopSplash: false,
    overwrite: true,
  });
  const projectId = created.projectId;

  await call("set_global_variable", {
    projectId,
    name: "Content",
    value: contentTables,
  });
  await call("set_global_variable", {
    projectId,
    name: "MetaDefaults",
    value: { Echoes: 0, BestDepth: 0, Runs: 0 },
  });

  const resources = {
    "rift-background-v2.png": "rift-background-v2.png",
    "rift-bridge-ch2.png": "rift-bridge-ch2.png",
    "rift-altar-ch3.png": "rift-altar-ch3.png",
    "hero-v2.png": "hero-v2.png",
    "hound-v2.png": "hound-v2.png",
    "moth-v2.png": "moth-v2.png",
    "boss-v2.png": "boss-v2.png",
    "ground.svg": "ground.svg",
    "bridge-ground.svg": "bridge-ground.svg",
    "altar-ground.svg": "altar-ground.svg",
    "spirit-lantern.svg": "spirit-lantern.svg",
    "rift-pillar.svg": "rift-pillar.svg",
    "gem.svg": "gem.svg",
    "slash-v2.svg": "slash-v2.svg",
    "heavy-slash-v2.svg": "heavy-slash-v2.svg",
    "bolt-v2.svg": "bolt-v2.svg",
    "shockwave-v2.svg": "shockwave-v2.svg",
    "gate-v2.svg": "gate-v2.svg",
  };
  for (const [resourceName, fileName] of Object.entries(resources)) {
    await call("import_resource", {
      projectId,
      sourceFile: path.join(root, "assets", fileName),
      resourceName,
      kind: "image",
    });
  }
  const rigParts = ["head", "torso", "cape", "tail", "rear_upper_arm", "rear_forearm", "front_upper_arm", "front_forearm", "rear_thigh", "rear_shin", "front_thigh", "front_shin", "dagger"];
  for (const part of rigParts) {
    await call("import_resource", {
      projectId,
      sourceFile: path.join(root, "assets", "hero-rig-v3", `${part}.png`),
      resourceName: `hero-rig-v3/${part}.png`,
      kind: "image",
    });
  }
  await call("import_resource", {
    projectId,
    sourceFile: path.join(root, "assets", "hero-rig-v3.atlas"),
    resourceName: "hero-rig-v3.atlas",
    kind: "atlas",
    metadata: { embeddedResourcesMapping: Object.fromEntries(rigParts.map((part) => [`hero-rig-v3/${part}.png`, `hero-rig-v3/${part}.png`])) },
  });
  await call("import_resource", {
    projectId,
    sourceFile: path.join(root, "assets", "hero-rig-v3.json"),
    resourceName: "hero-rig-v3.json",
    kind: "spine",
    metadata: { embeddedResourcesMapping: { "hero-rig-v3.atlas": "hero-rig-v3.atlas" } },
  });
  await call("import_resource", {
    projectId,
    sourceFile: path.join(root, "assets", "impact-burst-v3.svg"),
    resourceName: "impact-burst-v3.svg",
    kind: "image",
  });
  for (const fileName of ["slash.wav", "impact.wav", "hit-confirm.wav", "heavy-impact.wav", "dash.wav", "pickup.wav", "boss-roar.wav"]) {
    await call("import_resource", {
      projectId,
      sourceFile: path.join(root, "assets", "sfx", fileName),
      resourceName: fileName,
      kind: "audio",
    });
  }

  await call("add_scene_layer", { projectId, sceneName: "Game", layerName: "HUD" });

  const sceneVariables = {
    State: 0,
    Room: 1,
    MaxRoom: 6,
    RoomType: 1,
    Biome: 1,
    SpawnRemaining: 0,
    Alive: 0,
    Kills: 0,
    Essence: 0,
    RunEchoes: 0,
    MetaEchoes: 0,
    BestDepth: 0,
    Runs: 0,
    Weapon: 0,
    Risk: 0,
    RewardMultiplier: 1,
    Affix: 0,
    PendingAffix: 0,
    AffixTier: 0,
    AffixName: "UNBOUND",
    FeralRank: 0,
    MoonRank: 0,
    RiftRank: 0,
    FeralSynergy: 0,
    MoonSynergy: 0,
    RiftSynergy: 0,
    ChoiceA: 0,
    ChoiceB: 0,
    ChoiceC: 0,
    Selected: 0,
    Shake: 0,
    BossSpawned: 0,
    RunTime: 0,
    HitStop: 0,
    Route: {
      Biomes: [1, 2, 3, 1, 2, 3],
      Encounters: [1, 2, 3, 1, 2, 3],
    },
  };
  for (const [name, value] of Object.entries(sceneVariables)) {
    await call("set_scene_variable", { projectId, sceneName: "Game", name, value });
  }
  if (process.env.GDEVELOP_GAME_TEST_MODE === "1") {
    for (const [name, value] of Object.entries({ TestMode: 0, TestStep: 0, TestAppliedStep: 0 })) {
      await call("set_scene_variable", { projectId, sceneName: "Game", name, value });
    }
  }

  const platformer = (maxSpeed, gravity = 1500) => ({
    name: "Platformer",
    type: "PlatformBehavior::PlatformerObjectBehavior",
    properties: {
      acceleration: 2300,
      deceleration: 2600,
      gravity,
      jumpSpeed: 690,
      jumpSustainTime: 0.16,
      maxFallingSpeed: 950,
      maxSpeed,
      ignoreDefaultControls: true,
    },
  });
  const objects = [
    { name: "ForestBackground", type: "Sprite", resourceName: "rift-background-v2.png" },
    { name: "BridgeBackground", type: "Sprite", resourceName: "rift-bridge-ch2.png" },
    { name: "AltarBackground", type: "Sprite", resourceName: "rift-altar-ch3.png" },
    { name: "MenuBackdrop", type: "Sprite", resourceName: "rift-background-v2.png" },
    {
      name: "ForestGround",
      type: "Sprite",
      resourceName: "ground.svg",
      collisionMask: { width: 128, height: 64 },
      behaviors: [{ name: "Platform", type: "PlatformBehavior::PlatformBehavior", properties: {} }],
    },
    {
      name: "BridgeGround",
      type: "Sprite",
      resourceName: "bridge-ground.svg",
      collisionMask: { width: 128, height: 64 },
      behaviors: [{ name: "Platform", type: "PlatformBehavior::PlatformBehavior", properties: {} }],
    },
    {
      name: "AltarGround",
      type: "Sprite",
      resourceName: "altar-ground.svg",
      collisionMask: { width: 128, height: 64 },
      behaviors: [{ name: "Platform", type: "PlatformBehavior::PlatformBehavior", properties: {} }],
    },
    { name: "SpiritLantern", type: "Sprite", resourceName: "spirit-lantern.svg" },
    { name: "RiftPillar", type: "Sprite", resourceName: "rift-pillar.svg" },
    {
      name: "Player",
      type: "Sprite",
      resourceName: "hero-v2.png",
      collisionMask: { width: 975, height: 849 },
      variables: {
        Health: 160,
        MaxHealth: 160,
        Damage: 30,
        Weapon: 0,
        SpellDamage: 16,
        ProjectileSpeed: 0,
        CritChance: 5,
        Burn: 0,
        Frost: 0,
        Pierce: 0,
        Facing: 1,
        AttackCooldown: 0.22,
        HeavyCooldown: 0.92,
        Combo: 0,
        DashCooldown: 1.15,
        Dashing: 0,
        Lifesteal: 0,
        Pose: 0,
      },
      behaviors: [platformer(360)],
    },
    {
      name: "HeroRig",
      type: "SpineObject::SpineObject",
      resourceName: "hero-rig-v3.json",
      spine: {
        scale: 0.2,
        animations: [
          { name: "idle", loop: true },
          { name: "run", loop: true },
          { name: "jump", loop: false },
          { name: "attack1", loop: false },
          { name: "attack2", loop: false },
          { name: "attack3", loop: false },
          { name: "heavy", loop: false },
          { name: "dash", loop: false },
          { name: "hurt", loop: false },
        ],
      },
    },
    {
      name: "Hound",
      type: "Sprite",
      resourceName: "hound-v2.png",
      collisionMask: { width: 1423, height: 734 },
      variables: { Health: 56, MaxHealth: 56, Damage: 9, Elite: 0, Reward: 1, Burn: 0, Frost: 0 },
      behaviors: [platformer(135)],
    },
    {
      name: "Moth",
      type: "Sprite",
      resourceName: "moth-v2.png",
      collisionMask: { width: 1076, height: 870 },
      variables: { Health: 44, MaxHealth: 44, Damage: 8, Elite: 0, Reward: 1, Burn: 0, Frost: 0 },
    },
    {
      name: "Boss",
      type: "Sprite",
      resourceName: "boss-v2.png",
      collisionMask: { width: 1444, height: 1014 },
      variables: { Health: 820, MaxHealth: 820, Damage: 20, Phase: 1, Elite: 1, Reward: 12, Burn: 0, Frost: 0 },
      behaviors: [platformer(115)],
    },
    { name: "Slash", type: "Sprite", resourceName: "slash-v2.svg", collisionMask: { width: 160, height: 100 }, variables: { Damage: 28, Burn: 0, Crit: 0 } },
    { name: "HeavySlash", type: "Sprite", resourceName: "heavy-slash-v2.svg", collisionMask: { width: 230, height: 170 }, variables: { Damage: 48, Burn: 0, Crit: 0 } },
    { name: "PlayerBolt", type: "Sprite", resourceName: "bolt-v2.svg", collisionMask: { width: 48, height: 48 }, variables: { Direction: 1, Damage: 28, Pierce: 0, Burn: 0, Crit: 0 } },
    { name: "Gem", type: "Sprite", resourceName: "gem.svg", collisionMask: { width: 32, height: 32 }, variables: { Value: 1 } },
    { name: "Bolt", type: "Sprite", resourceName: "bolt-v2.svg", collisionMask: { width: 48, height: 48 }, variables: { Direction: -1 } },
    { name: "Shockwave", type: "Sprite", resourceName: "shockwave-v2.svg", collisionMask: { width: 120, height: 76 }, variables: { Direction: -1 } },
    { name: "ImpactBurst", type: "Sprite", resourceName: "impact-burst-v3.svg" },
    { name: "Gate", type: "Sprite", resourceName: "gate-v2.svg" },
    { name: "HudMain", type: "TextObject::Text", text: "", characterSize: 22, color: "239;248;255", textStyle },
    { name: "HudSub", type: "TextObject::Text", text: "", characterSize: 17, color: "142;246;232", textStyle },
    { name: "HudBuild", type: "TextObject::Text", text: "", characterSize: 15, color: "255;209;126", textStyle },
    { name: "TitleText", type: "TextObject::Text", text: "SHADOW PAWS", characterSize: 64, color: "248;221;255", textStyle: { ...textStyle, alignment: "center" } },
    { name: "SubtitleText", type: "TextObject::Text", text: "ECHOES OF THE RIFT", characterSize: 26, color: "118;245;224", textStyle: { ...textStyle, alignment: "center" } },
    { name: "StartText", type: "TextObject::Text", text: "PRESS ENTER TO CHOOSE A RELIC", characterSize: 25, color: "255;209;126", textStyle: { ...textStyle, alignment: "center" } },
    { name: "MetaText", type: "TextObject::Text", text: "", characterSize: 18, color: "148;255;226", textStyle: { ...textStyle, alignment: "center" } },
    { name: "Controls", type: "TextObject::Text", text: "A/D MOVE   SPACE JUMP   J PRIMARY   K SPELL   SHIFT DASH", characterSize: 16, color: "203;196;232", textStyle },
    { name: "WeaponTitle", type: "TextObject::Text", text: "CHOOSE YOUR RELIC", characterSize: 34, color: "255;231;157", textStyle: { ...textStyle, alignment: "center" } },
    { name: "WeaponA", type: "TextObject::Text", text: "", characterSize: 21, color: "239;226;255", textStyle },
    { name: "WeaponB", type: "TextObject::Text", text: "", characterSize: 21, color: "239;226;255", textStyle },
    { name: "WeaponC", type: "TextObject::Text", text: "", characterSize: 21, color: "239;226;255", textStyle },
    { name: "RoomBanner", type: "TextObject::Text", text: "", characterSize: 31, color: "197;251;244", textStyle: { ...textStyle, alignment: "center" } },
    { name: "UpgradeTitle", type: "TextObject::Text", text: "THE RIFT OFFERS THREE ECHOES", characterSize: 30, color: "255;231;157", textStyle: { ...textStyle, alignment: "center" } },
    { name: "ChoiceA", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
    { name: "ChoiceB", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
    { name: "ChoiceC", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
    { name: "PathTitle", type: "TextObject::Text", text: "CHOOSE THE NEXT PATH", characterSize: 31, color: "255;231;157", textStyle: { ...textStyle, alignment: "center" } },
    { name: "PathSafe", type: "TextObject::Text", text: "[1]  MOONLIT PATH  ·  heal 18 HP", characterSize: 22, color: "148;255;226", textStyle },
    { name: "PathAbyss", type: "TextObject::Text", text: "[2]  ABYSS GATE  ·  elite enemies, richer Echoes, random gear affix", characterSize: 20, color: "255;139;199", textStyle },
    { name: "BossHud", type: "TextObject::Text", text: "", characterSize: 21, color: "255;139;199", textStyle: { ...textStyle, alignment: "center" } },
    { name: "DeathText", type: "TextObject::Text", text: "THE RIFT REMEMBERS\n\nPress R to rise again", characterSize: 38, color: "255;135;159", textStyle: { ...textStyle, alignment: "center" } },
    { name: "VictoryText", type: "TextObject::Text", text: "THE WARDEN FALLS\n\nThe Violet Rift is silent—for now.\nPress R for another hunt", characterSize: 36, color: "148;255;226", textStyle: { ...textStyle, alignment: "center" } },
  ];
  for (const object of objects) {
    await call("add_scene_object", {
      projectId,
      sceneName: "Game",
      animationName: "Idle",
      frameDuration: 0.12,
      loop: true,
      behaviors: [],
      variables: {},
      textStyle: {},
      ...object,
    });
  }

  const instances = [
    ["ForestBackground", -150, 0, "", -100, 1260, 540],
    ["BridgeBackground", -150, 0, "", -100, 1260, 540],
    ["AltarBackground", -150, 0, "", -100, 1260, 540],
    ["MenuBackdrop", 0, 0, "HUD", 60, 960, 540],
    ["ForestGround", -200, 470, "", 0, 1160, 100],
    ["ForestGround", 330, 350, "", 1, 220, 30],
    ["ForestGround", 640, 405, "", 1, 130, 24],
    ["BridgeGround", 960, 470, "", 0, 960, 100],
    ["BridgeGround", 1100, 390, "", 1, 170, 28],
    ["BridgeGround", 1375, 315, "", 1, 170, 28],
    ["BridgeGround", 1650, 390, "", 1, 150, 28],
    ["AltarGround", 1920, 470, "", 0, 1200, 100],
    ["AltarGround", 2140, 350, "", 1, 180, 28],
    ["AltarGround", 2520, 390, "", 1, 150, 24],
    ["ForestGround", 2880, 470, "", 0, 960, 100],
    ["ForestGround", 2990, 385, "", 1, 150, 26],
    ["ForestGround", 3270, 315, "", 1, 190, 28],
    ["ForestGround", 3590, 400, "", 1, 125, 22],
    ["BridgeGround", 3840, 470, "", 0, 960, 100],
    ["BridgeGround", 3970, 350, "", 1, 155, 26],
    ["BridgeGround", 4250, 285, "", 1, 170, 26],
    ["BridgeGround", 4540, 365, "", 1, 140, 24],
    ["AltarGround", 4800, 470, "", 0, 1200, 100],
    ["AltarGround", 4990, 360, "", 1, 160, 26],
    ["AltarGround", 5480, 360, "", 1, 160, 26],
    ["SpiritLantern", 985, 255, "", -3, 58, 190],
    ["SpiritLantern", 1785, 255, "", -3, 58, 190],
    ["RiftPillar", 1940, 170, "", -4, 110, 300],
    ["RiftPillar", 2760, 170, "", -4, 110, 300],
    ["SpiritLantern", 3060, 255, "", -3, 58, 190],
    ["SpiritLantern", 3650, 255, "", -3, 58, 190],
    ["RiftPillar", 3980, 170, "", -4, 110, 300],
    ["RiftPillar", 4630, 170, "", -4, 110, 300],
    ["RiftPillar", 4870, 170, "", -4, 110, 300],
    ["RiftPillar", 5660, 170, "", -4, 110, 300],
    ["Player", 140, 355, "", 10, 110, 110],
    ["HeroRig", 212, 465, "", 12],
    ["Gate", 865, 130, "", 8, 72, 340],
    ["Gate", 1825, 130, "", 8, 72, 340],
    ["Gate", 2785, 130, "", 8, 72, 340],
    ["Gate", 3745, 130, "", 8, 72, 340],
    ["Gate", 4705, 130, "", 8, 72, 340],
    ["HudMain", 20, 16, "HUD", 50],
    ["HudSub", 20, 49, "HUD", 50],
    ["HudBuild", 20, 76, "HUD", 50],
    ["TitleText", 244, 126, "HUD", 70],
    ["SubtitleText", 324, 210, "HUD", 70],
    ["StartText", 325, 338, "HUD", 70],
    ["MetaText", 325, 292, "HUD", 70],
    ["Controls", 20, 510, "HUD", 50],
    ["WeaponTitle", 225, 105, "HUD", 80],
    ["WeaponA", 190, 205, "HUD", 80],
    ["WeaponB", 190, 285, "HUD", 80],
    ["WeaponC", 190, 365, "HUD", 80],
    ["RoomBanner", 228, 105, "HUD", 60],
    ["UpgradeTitle", 180, 112, "HUD", 80],
    ["ChoiceA", 230, 205, "HUD", 80],
    ["ChoiceB", 230, 283, "HUD", 80],
    ["ChoiceC", 230, 361, "HUD", 80],
    ["PathTitle", 205, 120, "HUD", 80],
    ["PathSafe", 205, 245, "HUD", 80],
    ["PathAbyss", 205, 330, "HUD", 80],
    ["BossHud", 275, 112, "HUD", 60],
    ["DeathText", 220, 188, "HUD", 90],
    ["VictoryText", 160, 150, "HUD", 90],
  ];
  for (const [objectName, x, y, layer, zOrder, width, height, authoredVariables] of instances) {
    const instanceVariables = authoredVariables ||
      (objectName.endsWith("Ground")
        ? {
            RoomMetadata: {
              Room: Math.max(1, Math.min(6, Math.floor(x / 960) + 1)),
              Material: objectName.replace("Ground", ""),
            },
          }
        : {});
    await call("add_object_instance", {
      projectId,
      sceneName: "Game",
      objectName,
      x,
      y,
      layer,
      zOrder,
      ...(width ? { width } : {}),
      ...(height ? { height } : {}),
      variables: instanceVariables,
    });
  }

  for (const group of [
    { name: "Enemies", objectNames: ["Hound", "Moth", "Boss"] },
    { name: "PlayerAttacks", objectNames: ["Slash", "HeavySlash", "PlayerBolt"] },
    { name: "HostileAttacks", objectNames: ["Bolt", "Shockwave"] },
    { name: "Platforms", objectNames: ["ForestGround", "BridgeGround", "AltarGround"] },
  ]) {
    await call("add_object_group", { projectId, sceneName: "Game", ...group });
  }

  const events = [];
  events.push(comment("00 · SAVE DATA, TITLE, WEAPON CHOICE, AND RUN INITIALIZATION"));
  events.push(
    standard(
      [once()],
      [
        instruction("LoadFile", [quoted("shadow-paws-save")]),
        instruction("ReadNumberFromStorage", [quoted("shadow-paws-save"), quoted("meta.echoes"), "", "MetaEchoes"]),
        instruction("ReadNumberFromStorage", [quoted("shadow-paws-save"), quoted("meta.bestDepth"), "", "BestDepth"]),
        instruction("ReadNumberFromStorage", [quoted("shadow-paws-save"), quoted("meta.runs"), "", "Runs"]),
        resetSceneTimer("spawn"),
        resetSceneTimer("banner"),
        resetObjectTimer("Player", "attack"),
        resetObjectTimer("Player", "heavy"),
        resetObjectTimer("Player", "hurt"),
        resetObjectTimer("Player", "dash"),
        resetObjectTimer("Player", "combo"),
        resetObjectTimer("Player", "pose"),
        resetSceneTimer("hitstop"), layerTimeScale(1),
        hide("Player"), hide("HeroRig"), hide("Gate"), hide("BridgeBackground"), hide("AltarBackground"), hide("HudMain"), hide("HudSub"), hide("HudBuild"), hide("Controls"), hide("RoomBanner"),
        hide("WeaponTitle"), hide("WeaponA"), hide("WeaponB"), hide("WeaponC"),
        hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"),
        hide("PathTitle"), hide("PathSafe"), hide("PathAbyss"),
        hide("BossHud"), hide("DeathText"), hide("VictoryText"),
      ],
    ),
  );
  events.push(standard([sceneIs("State", "=", 0)], [
    show("MetaText"),
    instruction("TextObject::String", ["MetaText", "=", '"BANKED ECHOES  "+ToString(Variable(MetaEchoes))+"     BEST DEPTH  "+ToString(Variable(BestDepth))']),
  ]));
  events.push(
    standard([sceneIs("State", "=", 0), key("Return"), once()], [
      sceneVar("State", "=", 6), hide("MetaText"), show("WeaponTitle"), show("WeaponA"), show("WeaponB"), show("WeaponC"),
      hide("TitleText"), hide("SubtitleText"), hide("StartText"),
    ]),
  );
  for (const [index, objectName] of ["WeaponA", "WeaponB", "WeaponC"].entries()) {
    events.push(standard([sceneIs("State", "=", 6)], [
      instruction("TextObject::String", [
        objectName,
        "=",
        `"[${index + 1}]  "+GlobalVariableString(Content.Weapons[${index}].Name)+"  ·  "+GlobalVariableString(Content.Weapons[${index}].Summary)`,
      ]),
    ]));
  }
  for (const weapon of weapons) {
    events.push(standard([sceneIs("State", "=", 6), key(`Num${weapon.id}`), once()], [
      sceneVar("Weapon", "=", weapon.id), objectVar("Player", "Weapon", "=", weapon.id),
      objectVar("Player", "Damage", "=", `GlobalVariable(Content.Weapons[${weapon.id - 1}].Damage)`),
      objectVar("Player", "AttackCooldown", "=", `GlobalVariable(Content.Weapons[${weapon.id - 1}].AttackCooldown)`),
      objectVar("Player", "HeavyCooldown", "=", `GlobalVariable(Content.Weapons[${weapon.id - 1}].HeavyCooldown)`),
      objectVar("Player", "SpellDamage", "=", `GlobalVariable(Content.Weapons[${weapon.id - 1}].SpellDamage)`),
      objectVar("Player", "ProjectileSpeed", "=", `GlobalVariable(Content.Weapons[${weapon.id - 1}].ProjectileSpeed)`),
      objectVar("Player", "MaxHealth", "+", "min(50,floor(Variable(MetaEchoes)/20)*5)"),
      objectVar("Player", "Health", "=", "Player.Variable(MaxHealth)"),
      sceneVar("State", "=", 1), sceneVar("Room", "=", 1), sceneVar("Biome", "=", "RandomInRange(1,3)"),
      sceneVar("RoomType", "=", "RandomInRange(1,2)"), sceneVar("SpawnRemaining", "=", 3),
      sceneVar("Alive", "=", 0), sceneVar("Runs", "+", 1),
      hide("WeaponTitle"), hide("WeaponA"), hide("WeaponB"), hide("WeaponC"), hide("MenuBackdrop"),
      show("Player"), show("HeroRig"), instruction("Opacity", ["Player", "=", 0]), show("Gate"), show("HudMain"), show("HudSub"), show("HudBuild"), show("Controls"),
      show("RoomBanner"), text("RoomBanner", "THE HUNT BEGINS"),
      resetSceneTimer("banner"), resetSceneTimer("spawn"), play("boss-roar.wav", 48, 1.35),
    ]));
  }
  events.push(standard([sceneTimer("banner", 2.2)], [hide("RoomBanner")]));

  events.push(comment("00B · GENERATED BIOMES AND CAMERA BACKDROPS"));
  events.push(standard([], [
    instruction("SetX", ["ForestBackground", "=", "max(480,min(Player.X()+55,5280))-SceneWindowWidth()/2"]),
    instruction("SetX", ["BridgeBackground", "=", "max(480,min(Player.X()+55,5280))-SceneWindowWidth()/2"]),
    instruction("SetX", ["AltarBackground", "=", "max(480,min(Player.X()+55,5280))-SceneWindowWidth()/2"]),
    ...resize("ForestBackground", "SceneWindowWidth()", "SceneWindowHeight()"),
    ...resize("BridgeBackground", "SceneWindowWidth()", "SceneWindowHeight()"),
    ...resize("AltarBackground", "SceneWindowWidth()", "SceneWindowHeight()"),
  ]));
  events.push(standard([sceneIs("Biome", "=", 1)], [show("ForestBackground"), hide("BridgeBackground"), hide("AltarBackground")]));
  events.push(standard([sceneIs("Biome", "=", 2)], [hide("ForestBackground"), show("BridgeBackground"), hide("AltarBackground")]));
  events.push(standard([sceneIs("Biome", "=", 3)], [hide("ForestBackground"), hide("BridgeBackground"), show("AltarBackground")]));

  events.push(comment("01 · RESPONSIVE PLATFORMER MOVEMENT AND DASH"));
  events.push(standard([], [
    instruction("SetX", ["HeroRig", "=", "Player.X()+72"]),
    // A Spine object's origin is the skeleton root (the hero's foot line),
    // while Player.Y() is the top of the invisible platformer hitbox.
    instruction("SetY", ["HeroRig", "=", "Player.Y()+Player.Height()"]),
  ]));
  events.push(standard([...gameplayState, key("a")], [
    instruction("PlatformBehavior::SimulateLeftKey", ["Player", "Platformer"]),
    instruction("FlipX", ["Player", "yes"]), flipRig(true), objectVar("Player", "Facing", "=", -1),
  ]));
  events.push(standard([...gameplayState, key("d")], [
    instruction("PlatformBehavior::SimulateRightKey", ["Player", "Platformer"]),
    instruction("FlipX", ["Player", "no"]), flipRig(false), objectVar("Player", "Facing", "=", 1),
  ]));
  events.push(standard([...gameplayState, key("Space")], [
    instruction("PlatformBehavior::SimulateJumpKey", ["Player", "Platformer"]),
  ]));
  events.push(standard([...gameplayState, key("LShift"), once(), objectTimer("Player", "dash", ">", "Player.Variable(DashCooldown)")], [
    objectVar("Player", "Dashing", "=", 1), objectVar("Player", "Pose", "=", 5), resetObjectTimer("Player", "dash"), resetObjectTimer("Player", "pose"),
    instruction("Opacity", ["HeroRig", "=", 145]), animation("dash"), play("dash.wav", 75, 1), sceneVar("Shake", "=", 4),
  ]));
  events.push(standard([...gameplayState, objectIs("Player", "Dashing", "=", 1), objectTimer("Player", "dash", "<", 0.18)], [
    instruction("SetX", ["Player", "=", "Player.X()+Player.Variable(Facing)*720*TimeDelta()"]),
  ]));
  events.push(standard([objectIs("Player", "Dashing", "=", 1), objectTimer("Player", "dash", ">=", 0.18)], [
    objectVar("Player", "Dashing", "=", 0), objectVar("Player", "Pose", "=", 0), instruction("Opacity", ["HeroRig", "=", 255]),
  ]));

  events.push(standard([...gameplayState, objectIs("Player", "Pose", "=", 0), instruction("PlatformBehavior::IsOnFloor", ["Player", "Platformer"]), key("a")], [animation("run")]));
  events.push(standard([...gameplayState, objectIs("Player", "Pose", "=", 0), instruction("PlatformBehavior::IsOnFloor", ["Player", "Platformer"]), key("d")], [animation("run")]));
  events.push(standard([...gameplayState, objectIs("Player", "Pose", "=", 0), instruction("PlatformBehavior::IsOnFloor", ["Player", "Platformer"]), instruction("KeyPressed", ["", "a"], true), instruction("KeyPressed", ["", "d"], true)], [animation("idle")]));
  events.push(standard([...gameplayState, objectIs("Player", "Pose", "=", 0), instruction("PlatformBehavior::IsOnFloor", ["Player", "Platformer"], true)], [animation("jump")]));

  events.push(comment("02 · THREE DISTINCT WEAPONS, COMBOS, AND SPELL ATTACKS"));
  const comboAttack = (combo, facing, objectName, multiplier, nextCombo) => {
    const right = facing > 0;
    const x = objectName === "HeavySlash"
      ? right ? "Player.X()+62" : "Player.X()-205"
      : right ? "Player.X()+62" : "Player.X()-145";
    const y = objectName === "HeavySlash" ? "Player.Y()-24" : "Player.Y()+8";
    return standard(
      [...gameplayState, sceneIs("Weapon", "=", 1), key("j"), once(), objectIs("Player", "Combo", "=", combo), objectIs("Player", "Facing", facing > 0 ? ">" : "<", 0), objectTimer("Player", "attack", ">", "Player.Variable(AttackCooldown)")],
      [
        create(objectName, x, y),
        ...(!right ? [instruction("FlipX", [objectName, "yes"])] : []),
        objectVar(objectName, "Damage", "=", `Player.Variable(Damage)*${multiplier}`),
        objectVar(objectName, "Burn", "=", "Player.Variable(Burn)"), objectVar(objectName, "Crit", "=", "RandomInRange(1,100)"),
        resetObjectTimer(objectName, "life"), resetObjectTimer("Player", "attack"), resetObjectTimer("Player", "combo"),
        resetObjectTimer("Player", "pose"), objectVar("Player", "Pose", "=", combo + 1), objectVar("Player", "Combo", "=", nextCombo), animation(`attack${combo + 1}`),
        ...(objectName === "HeavySlash" ? [sceneVar("Shake", "=", 6)] : []),
        play("slash.wav", objectName === "HeavySlash" ? 90 : 72, objectName === "HeavySlash" ? 0.82 : `RandomFloatInRange(0.96,1.08)`),
      ],
    );
  };
  for (const facing of [1, -1]) {
    events.push(comboAttack(0, facing, "Slash", 1, 1));
    events.push(comboAttack(1, facing, "Slash", 1.18, 2));
    events.push(comboAttack(2, facing, "HeavySlash", 1.65, 0));
  }
  events.push(standard([objectIs("Player", "Combo", ">", 0), objectTimer("Player", "combo", ">", 0.72)], [objectVar("Player", "Combo", "=", 0)]));
  for (const facing of [1, -1]) {
    const right = facing > 0;
    events.push(standard([...gameplayState, sceneIs("Weapon", "=", 1), key("k"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "heavy", ">", "Player.Variable(HeavyCooldown)")], [
      create("HeavySlash", right ? "Player.X()+52" : "Player.X()-210", "Player.Y()-26"),
      ...(!right ? [instruction("FlipX", ["HeavySlash", "yes"])] : []),
      objectVar("HeavySlash", "Damage", "=", "Player.Variable(Damage)*2.15"),
      objectVar("HeavySlash", "Burn", "=", "Player.Variable(Burn)"), objectVar("HeavySlash", "Crit", "=", "RandomInRange(1,100)"),
      resetObjectTimer("HeavySlash", "life"), resetObjectTimer("Player", "heavy"), resetObjectTimer("Player", "pose"),
      objectVar("Player", "Pose", "=", 4), animation("heavy"), sceneVar("Shake", "=", 9), play("slash.wav", 95, 0.68),
    ]));

    events.push(standard([...gameplayState, sceneIs("Weapon", "=", 2), key("j"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "attack", ">", "Player.Variable(AttackCooldown)")], [
      create("HeavySlash", right ? "Player.X()+46" : "Player.X()-195", "Player.Y()-16"),
      ...(!right ? [instruction("FlipX", ["HeavySlash", "yes"])] : []),
      objectVar("HeavySlash", "Damage", "=", "Player.Variable(Damage)*1.35"),
      objectVar("HeavySlash", "Burn", "=", "Player.Variable(Burn)"), objectVar("HeavySlash", "Crit", "=", "RandomInRange(1,100)"),
      resetObjectTimer("HeavySlash", "life"), resetObjectTimer("Player", "attack"), resetObjectTimer("Player", "pose"),
      objectVar("Player", "Pose", "=", 2), animation("attack2"), play("slash.wav", 82, 0.82),
    ]));
    events.push(standard([...gameplayState, sceneIs("Weapon", "=", 2), key("k"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "heavy", ">", "Player.Variable(HeavyCooldown)")], [
      create("PlayerBolt", right ? "Player.X()+76" : "Player.X()-30", "Player.Y()+44"),
      ...(!right ? [instruction("FlipX", ["PlayerBolt", "yes"])] : []),
      objectVar("PlayerBolt", "Direction", "=", right ? 1 : -1),
      objectVar("PlayerBolt", "Damage", "=", "Player.Variable(Damage)+Player.Variable(SpellDamage)"),
      objectVar("PlayerBolt", "Pierce", "=", "Player.Variable(Pierce)"), objectVar("PlayerBolt", "Burn", "=", "Player.Variable(Burn)"), objectVar("PlayerBolt", "Crit", "=", "RandomInRange(1,100)"),
      resetObjectTimer("PlayerBolt", "life"), resetObjectTimer("Player", "heavy"), resetObjectTimer("Player", "pose"),
      objectVar("Player", "Pose", "=", 4), animation("heavy"), sceneVar("Shake", "=", 6), play("slash.wav", 88, 0.72),
    ]));
    events.push(standard([...gameplayState, sceneIs("Weapon", "=", 3), key("j"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "attack", ">", "Player.Variable(AttackCooldown)")], [
      create("PlayerBolt", right ? "Player.X()+78" : "Player.X()-28", "Player.Y()+38"),
      ...(!right ? [instruction("FlipX", ["PlayerBolt", "yes"])] : []),
      objectVar("PlayerBolt", "Direction", "=", right ? 1 : -1),
      objectVar("PlayerBolt", "Damage", "=", "Player.Variable(Damage)+Player.Variable(SpellDamage)*0.65"),
      objectVar("PlayerBolt", "Pierce", "=", "Player.Variable(Pierce)"), objectVar("PlayerBolt", "Burn", "=", "Player.Variable(Burn)"), objectVar("PlayerBolt", "Crit", "=", "RandomInRange(1,100)"),
      resetObjectTimer("PlayerBolt", "life"), resetObjectTimer("Player", "attack"), resetObjectTimer("Player", "pose"),
      objectVar("Player", "Pose", "=", 1), animation("attack1"), play("slash.wav", 64, 1.35),
    ]));
    events.push(standard([...gameplayState, sceneIs("Weapon", "=", 3), key("k"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "heavy", ">", "Player.Variable(HeavyCooldown)")], [
      create("HeavySlash", right ? "Player.X()+35" : "Player.X()-205", "Player.Y()-44"),
      ...(!right ? [instruction("FlipX", ["HeavySlash", "yes"])] : []),
      objectVar("HeavySlash", "Damage", "=", "Player.Variable(SpellDamage)*2.1+Variable(Risk)*5"),
      objectVar("HeavySlash", "Burn", "=", "Player.Variable(Burn)+1"), objectVar("HeavySlash", "Crit", "=", "RandomInRange(1,100)"),
      resetObjectTimer("HeavySlash", "life"), resetObjectTimer("Player", "heavy"), resetObjectTimer("Player", "pose"),
      objectVar("Player", "Pose", "=", 4), animation("heavy"), sceneVar("Shake", "=", 10), play("heavy-impact.wav", 88, 1.12),
    ]));
  }
  events.push(standard([...gameplayState], [
    instruction("SetX", ["PlayerBolt", "+", "PlayerBolt.Variable(Direction)*max(430,Player.Variable(ProjectileSpeed))*TimeDelta()"]),
  ]));
  events.push(standard([objectTimer("PlayerBolt", "life", ">", 3.2)], [instruction("Delete", ["PlayerBolt", ""])]));
  events.push(standard([objectTimer("Slash", "life", ">", 0.13)], [instruction("Delete", ["Slash", ""])]));
  events.push(standard([objectTimer("HeavySlash", "life", ">", 0.2)], [instruction("Delete", ["HeavySlash", ""])]));
  events.push(standard([objectIs("Player", "Pose", ">", 0), objectIs("Player", "Pose", "<", 4), objectTimer("Player", "pose", ">", 0.42)], [objectVar("Player", "Pose", "=", 0)]));
  events.push(standard([objectIs("Player", "Pose", "=", 4), objectTimer("Player", "pose", ">", 0.58)], [objectVar("Player", "Pose", "=", 0)]));

  events.push(comment("03 · FIVE-ROOM GENERATED ENCOUNTER DIRECTOR"));
  for (let room = 1; room <= 5; room += 1) {
    const roomStart = (room - 1) * 960;
    const roomEnd = room * 960;
    events.push(standard([...gameplayState, sceneIs("Room", "=", room), sceneIs("RoomType", "=", 1), sceneIs("SpawnRemaining", ">", 0), sceneTimer("spawn", "max(0.62,1.12-Variable(Risk)*0.07)")], [
      create("Hound", `min(${roomEnd - 120},${roomStart}+RandomInRange(520,760))`, 400), ...resize("Hound", 145, 76),
      objectVar("Hound", "Health", "=", "52+Variable(Room)*11+Variable(Risk)*24"), objectVar("Hound", "MaxHealth", "=", "Hound.Variable(Health)"),
      objectVar("Hound", "Damage", "=", "8+Variable(Room)+Variable(Risk)*2"), objectVar("Hound", "Reward", "=", "1+Variable(Risk)"), objectVar("Hound", "Elite", "=", 0),
      sceneVar("Alive", "+", 1), sceneVar("SpawnRemaining", "-", 1), resetSceneTimer("spawn"),
    ]));
    events.push(standard([...gameplayState, sceneIs("Room", "=", room), sceneIs("RoomType", "=", 2), sceneIs("SpawnRemaining", ">", 0), sceneTimer("spawn", "max(0.74,1.28-Variable(Risk)*0.06)")], [
      create("Hound", `min(${roomEnd - 150},${roomStart}+RandomInRange(500,700))`, 400), ...resize("Hound", 138, 72),
      objectVar("Hound", "Health", "=", "44+Variable(Room)*8+Variable(Risk)*18"), objectVar("Hound", "MaxHealth", "=", "Hound.Variable(Health)"),
      objectVar("Hound", "Damage", "=", "7+Variable(Room)+Variable(Risk)*2"), objectVar("Hound", "Reward", "=", "1+Variable(Risk)"), objectVar("Hound", "Elite", "=", 0),
      create("Moth", `min(${roomEnd - 110},${roomStart}+RandomInRange(560,790))`, "RandomInRange(185,275)"), ...resize("Moth", 112, 92),
      objectVar("Moth", "Health", "=", "38+Variable(Room)*8+Variable(Risk)*16"), objectVar("Moth", "MaxHealth", "=", "Moth.Variable(Health)"),
      objectVar("Moth", "Damage", "=", "6+Variable(Room)+Variable(Risk)*2"), objectVar("Moth", "Reward", "=", "1+Variable(Risk)"), objectVar("Moth", "Elite", "=", 0), resetObjectTimer("Moth", "shoot"),
      sceneVar("Alive", "+", 2), sceneVar("SpawnRemaining", "-", 1), resetSceneTimer("spawn"),
    ]));
    events.push(standard([...gameplayState, sceneIs("Room", "=", room), sceneIs("RoomType", "=", 3), sceneIs("SpawnRemaining", ">", 0), sceneTimer("spawn", "max(0.82,1.38-Variable(Risk)*0.06)")], [
      create("Hound", `min(${roomEnd - 125},${roomStart}+RandomInRange(540,770))`, 365), ...resize("Hound", 190, 102),
      objectVar("Hound", "Health", "=", "115+Variable(Room)*18+Variable(Risk)*34"), objectVar("Hound", "MaxHealth", "=", "Hound.Variable(Health)"),
      objectVar("Hound", "Damage", "=", "13+Variable(Room)+Variable(Risk)*3"), objectVar("Hound", "Reward", "=", "3+Variable(Risk)*2"), objectVar("Hound", "Elite", "=", 1),
      sceneVar("Alive", "+", 1), sceneVar("SpawnRemaining", "-", 1), resetSceneTimer("spawn"), sceneVar("Shake", "=", 5),
    ]));
    events.push(standard([...gameplayState, sceneIs("Room", "=", room), instruction("PosX", ["Player", ">", roomEnd - 140])], [instruction("SetX", ["Player", "=", roomEnd - 140])]));
    events.push(standard([...gameplayState, sceneIs("Room", "=", room), instruction("PosX", ["Player", "<", roomStart + 40])], [instruction("SetX", ["Player", "=", roomStart + 40])]));
  }
  events.push(standard([...gameplayState, sceneIs("Room", "=", 6), instruction("PosX", ["Player", "<", 4840])], [instruction("SetX", ["Player", "=", 4840])]));
  events.push(standard([...gameplayState, sceneIs("Room", "=", 6), instruction("PosX", ["Player", ">", 5800])], [instruction("SetX", ["Player", "=", 5800])]));

  events.push(comment("04 · ENEMY AI, RANGED FIRE, AND THE RIFT WARDEN"));
  events.push(standard([...gameplayState, objectTimer("Hound", "frost", ">", "Hound.Variable(Frost)"), instruction("PosX", ["Hound", ">", "Player.X()+36"])], [
    instruction("PlatformBehavior::SimulateLeftKey", ["Hound", "Platformer"]), instruction("FlipX", ["Hound", "no"]),
  ]));
  events.push(standard([...gameplayState, objectTimer("Hound", "frost", ">", "Hound.Variable(Frost)"), instruction("PosX", ["Hound", "<", "Player.X()-36"])], [
    instruction("PlatformBehavior::SimulateRightKey", ["Hound", "Platformer"]), instruction("FlipX", ["Hound", "yes"]),
  ]));
  events.push(standard([...gameplayState, objectTimer("Moth", "frost", ">", "Moth.Variable(Frost)"), instruction("PosX", ["Moth", ">", "Player.X()+150"])], [instruction("SetX", ["Moth", "-", "105*TimeDelta()"])]));
  events.push(standard([...gameplayState, objectTimer("Moth", "frost", ">", "Moth.Variable(Frost)"), instruction("PosX", ["Moth", "<", "Player.X()-150"])], [instruction("SetX", ["Moth", "+", "105*TimeDelta()"])]));
  events.push(standard([...gameplayState, objectTimer("Moth", "shoot", ">", 1.85)], [
    create("Bolt", "Moth.X()+Moth.Width()/2", "Moth.Y()+Moth.Height()/2"),
    objectVar("Bolt", "Direction", "=", "sign(Player.X()-Moth.X())"), resetObjectTimer("Bolt", "life"),
    resetObjectTimer("Moth", "shoot"), play("slash.wav", 42, 1.65),
  ]));
  events.push(standard([...gameplayState], [instruction("SetX", ["Bolt", "+", "Bolt.Variable(Direction)*310*TimeDelta()"])]));
  events.push(standard([objectTimer("Bolt", "life", ">", 4)], [instruction("Delete", ["Bolt", ""])]));

  events.push(standard([...gameplayState, sceneIs("Room", "=", 6), sceneIs("BossSpawned", "=", 0)], [
    create("Boss", 5340, 270), ...resize("Boss", 290, 210),
    objectVar("Boss", "Health", "=", "820+Variable(Risk)*90"), objectVar("Boss", "MaxHealth", "=", "Boss.Variable(Health)"), objectVar("Boss", "Damage", "=", "20+Variable(Risk)*3"), objectVar("Boss", "Phase", "=", 1),
    resetObjectTimer("Boss", "shock"), sceneVar("Alive", "=", 1), sceneVar("BossSpawned", "=", 1),
    show("BossHud"), play("boss-roar.wav", 92, 0.82), sceneVar("Shake", "=", 14),
  ]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", ">", "Player.X()+70"])], [instruction("PlatformBehavior::SimulateLeftKey", ["Boss", "Platformer"])]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", "<", "Player.X()-70"])], [instruction("PlatformBehavior::SimulateRightKey", ["Boss", "Platformer"])]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", "<", 4900])], [instruction("SetX", ["Boss", "=", 4900])]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", ">", 5700])], [instruction("SetX", ["Boss", "=", 5700])]));
  events.push(standard([objectIs("Boss", "Health", "<=", "Boss.Variable(MaxHealth)/2"), objectIs("Boss", "Phase", "=", 1)], [
    objectVar("Boss", "Phase", "=", 2), instruction("PlatformBehavior::MaxSpeed", ["Boss", "Platformer", "+", 85]),
    sceneVar("Shake", "=", 16), play("boss-roar.wav", 100, 1.05),
  ]));
  events.push(standard([...gameplayState, objectTimer("Boss", "shock", ">", "2.5-0.65*(Boss.Variable(Phase)-1)")], [
    create("Shockwave", "Boss.X()+Boss.Width()/2", "Boss.Y()+Boss.Height()-70"),
    objectVar("Shockwave", "Direction", "=", "sign(Player.X()-Boss.X())"), resetObjectTimer("Shockwave", "life"),
    resetObjectTimer("Boss", "shock"), play("boss-roar.wav", 62, 1.42), sceneVar("Shake", "=", 7),
  ]));
  events.push(standard([...gameplayState], [instruction("SetX", ["Shockwave", "+", "Shockwave.Variable(Direction)*390*TimeDelta()"])]));
  events.push(standard([objectTimer("Shockwave", "life", ">", 4)], [instruction("Delete", ["Shockwave", ""])]));

  events.push(comment("05 · HIT RESOLUTION, FLASH, LOOT, AND PLAYER DAMAGE"));
  const attackHit = (attackObject, enemyObject, critical) => {
    const heavy = attackObject === "HeavySlash";
    const projectile = attackObject === "PlayerBolt";
    const knockback = enemyObject === "Boss" ? (heavy ? 22 : 12) : (heavy ? 54 : 30);
    return standard(
      [
        ...gameplayState,
        collision(attackObject, enemyObject),
        objectIs(attackObject, "Crit", critical ? "<=" : ">", "Player.Variable(CritChance)"),
        once(),
      ],
      [
        objectVar(enemyObject, "Health", "-", `${attackObject}.Variable(Damage)*${critical ? 1.75 : 1}`),
        objectVar(enemyObject, "Burn", "=", `max(${enemyObject}.Variable(Burn),${attackObject}.Variable(Burn))`),
        objectVar(enemyObject, "Frost", "=", "Player.Variable(Frost)"), resetObjectTimer(enemyObject, "frost"), resetObjectTimer(enemyObject, "burn"),
        instruction("Opacity", [enemyObject, "=", 55]), resetObjectTimer(enemyObject, "hit"),
        instruction("SetX", [enemyObject, "+", `sign(${enemyObject}.X()-Player.X())*${knockback}`]),
        create("ImpactBurst", `${enemyObject}.X()+${enemyObject}.Width()/2-50`, `${enemyObject}.Y()+${enemyObject}.Height()/2-50`),
        ...resize("ImpactBurst", heavy ? 125 : 92, heavy ? 125 : 92), resetObjectTimer("ImpactBurst", "life"),
        ...(projectile
          ? [objectVar("PlayerBolt", "Pierce", "-", 1), instruction("SetX", ["PlayerBolt", "+", "PlayerBolt.Variable(Direction)*90"])]
          : [instruction("Delete", [attackObject, ""])]),
        sceneVar("Shake", "=", enemyObject === "Boss" ? (heavy ? 15 : 10) : (heavy ? 11 : 7)),
        sceneVar("HitStop", "=", heavy ? 2 : 1), resetSceneTimer("hitstop"), layerTimeScale(0.03),
        play("impact.wav", enemyObject === "Boss" ? 90 : 76, `RandomFloatInRange(0.92,1.08)`),
        play("hit-confirm.wav", critical ? 96 : (heavy ? 92 : 74), critical ? 1.42 : (heavy ? 0.8 : 1.1)),
        ...(heavy ? [play("heavy-impact.wav", 96, enemyObject === "Boss" ? 0.72 : 0.9)] : []),
      ],
    );
  };
  for (const attackObject of ["Slash", "HeavySlash", "PlayerBolt"]) {
    for (const enemyObject of ["Hound", "Moth", "Boss"]) {
      events.push(attackHit(attackObject, enemyObject, false));
      events.push(attackHit(attackObject, enemyObject, true));
    }
  }
  events.push(standard([objectIs("PlayerBolt", "Pierce", "<", 0)], [instruction("Delete", ["PlayerBolt", ""])]));
  for (const enemyObject of ["Hound", "Moth", "Boss"]) {
    events.push(standard([objectIs(enemyObject, "Burn", ">", 0), objectTimer(enemyObject, "burn", ">", 0.48)], [
      objectVar(enemyObject, "Health", "-", `${enemyObject}.Variable(Burn)`), resetObjectTimer(enemyObject, "burn"),
      instruction("Opacity", [enemyObject, "=", 120]),
    ]));
  }
  events.push(standard([sceneIs("HitStop", "=", 1), sceneTimer("hitstop", 0.045)], [layerTimeScale(1), sceneVar("HitStop", "=", 0)]));
  events.push(standard([sceneIs("HitStop", "=", 2), sceneTimer("hitstop", 0.085)], [layerTimeScale(1), sceneVar("HitStop", "=", 0)]));
  events.push(standard([objectTimer("ImpactBurst", "life", ">", 0.11)], [instruction("Delete", ["ImpactBurst", ""])]));
  for (const enemyObject of ["Hound", "Moth", "Boss"]) {
    events.push(standard([objectTimer(enemyObject, "hit", ">", 0.085)], [instruction("Opacity", [enemyObject, "=", 255])]));
  }
  const enemyDeath = (enemyObject) => standard([objectIs(enemyObject, "Health", "<=", 0)], [
    create("Gem", `${enemyObject}.X()+${enemyObject}.Width()/2`, `${enemyObject}.Y()+${enemyObject}.Height()/2`),
    objectVar("Gem", "Value", "=", `${enemyObject}.Variable(Reward)*Variable(RewardMultiplier)`),
    instruction("Delete", [enemyObject, ""]), sceneVar("Alive", "-", 1), sceneVar("Kills", "+", 1),
    objectVar("Player", "Health", "=", "min(Player.Variable(MaxHealth),Player.Variable(Health)+Player.Variable(Lifesteal))"),
  ]);
  events.push(enemyDeath("Hound"), enemyDeath("Moth"));
  events.push(standard([objectIs("Boss", "Health", "<=", 0)], [
    instruction("Delete", ["Boss", ""]), sceneVar("Alive", "=", 0), sceneVar("State", "=", 3),
    sceneVar("MetaEchoes", "+", "Variable(RunEchoes)+12+Variable(Risk)*4"), sceneVar("BestDepth", "=", 6),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.echoes"), "Variable(MetaEchoes)"]),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.bestDepth"), "Variable(BestDepth)"]),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.runs"), "Variable(Runs)"]),
    hide("BossHud"), show("VictoryText"), sceneVar("Shake", "=", 18), play("boss-roar.wav", 100, 0.55),
  ]));
  events.push(standard([collision("Player", "Gem")], [
    sceneVar("Essence", "+", "Gem.Variable(Value)"), sceneVar("RunEchoes", "+", "Gem.Variable(Value)"), instruction("Delete", ["Gem", ""]),
    objectVar("Player", "Health", "=", "min(Player.Variable(MaxHealth),Player.Variable(Health)+5)"), play("pickup.wav", 78, 1),
  ]));

  const playerHit = (enemyObject, damage, deleteAttacker = false) => standard(
    [...gameplayState, collision("Player", enemyObject), objectIs("Player", "Dashing", "=", 0), objectTimer("Player", "hurt", ">", 0.95)],
    [
      objectVar("Player", "Health", "-", damage), resetObjectTimer("Player", "hurt"), resetObjectTimer("Player", "pose"),
      instruction("SetX", ["Player", "+", `sign(Player.X()-${enemyObject}.X())*38`]),
      objectVar("Player", "Pose", "=", 6), animation("hurt"), instruction("Opacity", ["HeroRig", "=", 80]),
      sceneVar("Shake", "=", 13), sceneVar("HitStop", "=", 2), resetSceneTimer("hitstop"), layerTimeScale(0.03),
      play("impact.wav", 88, 0.74), play("heavy-impact.wav", 78, 0.68),
      ...(deleteAttacker ? [instruction("Delete", [enemyObject, ""])] : []),
    ],
  );
  events.push(playerHit("Hound", "Hound.Variable(Damage)"));
  events.push(playerHit("Moth", "Moth.Variable(Damage)"));
  events.push(playerHit("Boss", "Boss.Variable(Damage)"));
  events.push(playerHit("Bolt", 9, true));
  events.push(playerHit("Shockwave", 15, true));
  events.push(standard([objectTimer("Player", "hurt", ">", 0.16), objectIs("Player", "Dashing", "=", 0)], [instruction("Opacity", ["HeroRig", "=", 255])]));
  events.push(standard([objectIs("Player", "Pose", "=", 6), objectTimer("Player", "pose", ">", 0.26)], [objectVar("Player", "Pose", "=", 0)]));

  events.push(comment("06 · TWELVE BLESSINGS, FAMILY SYNERGIES, AND RISK ROUTES"));
  const offerUpgrade = (room) => standard([...gameplayState, sceneIs("Room", "=", room), sceneIs("SpawnRemaining", "=", 0), sceneIs("Alive", "=", 0)], [
    sceneVar("State", "=", 2), sceneVar("ChoiceA", "=", "RandomInRange(1,12)"),
    sceneVar("ChoiceB", "=", "1+mod(Variable(ChoiceA)+RandomInRange(1,10),12)"),
    sceneVar("ChoiceC", "=", "1+mod(Variable(ChoiceB)+RandomInRange(1,10),12)"), sceneVar("Selected", "=", 0),
    show("UpgradeTitle"), show("ChoiceA"), show("ChoiceB"), show("ChoiceC"), play("pickup.wav", 84, 0.78),
  ]);
  for (let room = 1; room <= 5; room += 1) events.push(offerUpgrade(room));
  events.push(standard([sceneIs("State", "=", 2), sceneIs("ChoiceC", "=", "Variable(ChoiceA)")], [
    sceneVar("ChoiceC", "=", "1+mod(Variable(ChoiceC),12)"),
  ]));
  events.push(standard([sceneIs("State", "=", 2), sceneIs("ChoiceC", "=", "Variable(ChoiceB)")], [
    sceneVar("ChoiceC", "=", "1+mod(Variable(ChoiceC),12)"),
  ]));
  for (const [choiceObject, variableName, keyNumber] of [["ChoiceA", "ChoiceA", 1], ["ChoiceB", "ChoiceB", 2], ["ChoiceC", "ChoiceC", 3]]) {
    events.push(standard([sceneIs("State", "=", 2)], [
      instruction("TextObject::String", [
        choiceObject,
        "=",
        `"[${keyNumber}]  "+GlobalVariableString(Content.Blessings[Variable(${variableName})-1].Name)+"  ·  "+GlobalVariableString(Content.Blessings[Variable(${variableName})-1].Summary)`,
      ]),
    ]));
  }
  events.push(standard([sceneIs("State", "=", 2), key("Num1"), once()], [sceneVar("Selected", "=", "Variable(ChoiceA)")]));
  events.push(standard([sceneIs("State", "=", 2), key("Num2"), once()], [sceneVar("Selected", "=", "Variable(ChoiceB)")]));
  events.push(standard([sceneIs("State", "=", 2), key("Num3"), once()], [sceneVar("Selected", "=", "Variable(ChoiceC)")]));
  const blessingActions = {
    1: [objectVar("Player", "Damage", "+", 8), sceneVar("FeralRank", "+", 1)],
    2: [objectVar("Player", "MaxHealth", "+", 24), objectVar("Player", "Health", "+", 24), sceneVar("FeralRank", "+", 1)],
    3: [objectVar("Player", "Lifesteal", "+", 4), sceneVar("FeralRank", "+", 1)],
    4: [objectVar("Player", "Burn", "+", 2), objectVar("Player", "Damage", "+", 4), sceneVar("FeralRank", "+", 1)],
    5: [objectVar("Player", "AttackCooldown", "=", "max(0.12,Player.Variable(AttackCooldown)-0.04)"), sceneVar("MoonRank", "+", 1)],
    6: [instruction("PlatformBehavior::MaxSpeed", ["Player", "Platformer", "+", 45]), objectVar("Player", "DashCooldown", "=", "max(0.48,Player.Variable(DashCooldown)-0.12)"), sceneVar("MoonRank", "+", 1)],
    7: [objectVar("Player", "CritChance", "+", 12), sceneVar("MoonRank", "+", 1)],
    8: [objectVar("Player", "Frost", "+", 0.18), sceneVar("MoonRank", "+", 1)],
    9: [objectVar("Player", "SpellDamage", "+", 14), sceneVar("RiftRank", "+", 1)],
    10: [objectVar("Player", "Pierce", "+", 1), sceneVar("RiftRank", "+", 1)],
    11: [objectVar("Player", "Damage", "+", "4+Variable(Risk)*3"), objectVar("Player", "SpellDamage", "+", "6+Variable(Risk)*4"), sceneVar("RiftRank", "+", 1)],
    12: [objectVar("Player", "Burn", "+", 3), sceneVar("RiftRank", "+", 1)],
  };
  for (const [id, actions] of Object.entries(blessingActions)) {
    events.push(standard([sceneIs("State", "=", 2), sceneIs("Selected", "=", id)], [...actions, sceneVar("State", "=", 5), play("pickup.wav", 92, 1.18)]));
  }
  events.push(standard([sceneIs("FeralRank", ">=", 2), sceneIs("FeralSynergy", "<", 1)], [objectVar("Player", "Damage", "+", 6), objectVar("Player", "Lifesteal", "+", 2), sceneVar("FeralSynergy", "=", 1)]));
  events.push(standard([sceneIs("FeralRank", ">=", 4), sceneIs("FeralSynergy", "<", 2)], [objectVar("Player", "Damage", "+", 14), objectVar("Player", "Burn", "+", 3), sceneVar("FeralSynergy", "=", 2)]));
  events.push(standard([sceneIs("MoonRank", ">=", 2), sceneIs("MoonSynergy", "<", 1)], [objectVar("Player", "AttackCooldown", "=", "max(0.11,Player.Variable(AttackCooldown)-0.035)"), objectVar("Player", "DashCooldown", "=", "max(0.45,Player.Variable(DashCooldown)-0.12)"), sceneVar("MoonSynergy", "=", 1)]));
  events.push(standard([sceneIs("MoonRank", ">=", 4), sceneIs("MoonSynergy", "<", 2)], [objectVar("Player", "CritChance", "+", 18), instruction("PlatformBehavior::MaxSpeed", ["Player", "Platformer", "+", 65]), sceneVar("MoonSynergy", "=", 2)]));
  events.push(standard([sceneIs("RiftRank", ">=", 2), sceneIs("RiftSynergy", "<", 1)], [objectVar("Player", "SpellDamage", "+", 15), objectVar("Player", "Pierce", "+", 1), sceneVar("RiftSynergy", "=", 1)]));
  events.push(standard([sceneIs("RiftRank", ">=", 4), sceneIs("RiftSynergy", "<", 2)], [objectVar("Player", "SpellDamage", "+", 25), objectVar("Player", "Burn", "+", 4), sceneVar("RiftSynergy", "=", 2)]));

  events.push(standard([sceneIs("State", "=", 5)], [
    hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"),
    show("PathTitle"), show("PathSafe"), show("PathAbyss"), sceneVar("State", "=", 7),
  ]));
  for (let room = 1; room <= 5; room += 1) {
    const nextRoom = room + 1;
    const nextX = room * 960 + 90;
    const safeSpawnCount = nextRoom === 6 ? 0 : 2 + Math.min(3, nextRoom);
    const commonPathActions = [
      hide("PathTitle"), hide("PathSafe"), hide("PathAbyss"), show("RoomBanner"), resetSceneTimer("banner"),
      sceneVar("Room", "=", nextRoom), sceneVar("State", "=", 1), sceneVar("Alive", "=", 0),
      sceneVar("Biome", "=", nextRoom === 6 ? 3 : "RandomInRange(1,3)"),
      instruction("SetX", ["Player", "=", nextX]), instruction("SetY", ["Player", "=", 350]), resetSceneTimer("spawn"),
    ];
    events.push(standard([sceneIs("State", "=", 7), sceneIs("Room", "=", room), key("Num1"), once()], [
      ...commonPathActions, text("RoomBanner", nextRoom === 6 ? "FINAL DESCENT  ·  THE RIFT WARDEN" : `ROOM ${nextRoom}  ·  MOONLIT PATH`),
      sceneVar("RoomType", "=", nextRoom === 6 ? 3 : "RandomInRange(1,2)"), sceneVar("SpawnRemaining", "=", safeSpawnCount),
      objectVar("Player", "Health", "=", "min(Player.Variable(MaxHealth),Player.Variable(Health)+18)"),
    ]));
    events.push(standard([sceneIs("State", "=", 7), sceneIs("Room", "=", room), key("Num2"), once()], [
      ...commonPathActions, text("RoomBanner", nextRoom === 6 ? "FINAL DESCENT  ·  THE RIFT WARDEN" : `ROOM ${nextRoom}  ·  ABYSS ${room}`),
      sceneVar("Risk", "+", 1), sceneVar("RewardMultiplier", "=", "1+Variable(Risk)*0.5"),
      sceneVar("RoomType", "=", 3), sceneVar("SpawnRemaining", "=", nextRoom === 6 ? 0 : safeSpawnCount + 1),
      sceneVar("PendingAffix", "=", "RandomInRange(1,6)"),
      sceneVar("RunEchoes", "+", "1+Variable(Risk)"), play("boss-roar.wav", 72, 0.8), sceneVar("Shake", "=", 9),
    ]));
  }

  const affixActions = {
    1: [objectVar("Player", "Damage", "+", 10)],
    2: [objectVar("Player", "Lifesteal", "+", 3)],
    3: [objectVar("Player", "AttackCooldown", "=", "max(0.1,Player.Variable(AttackCooldown)-0.03)")],
    4: [objectVar("Player", "MaxHealth", "+", 20), objectVar("Player", "Health", "+", 20)],
    5: [objectVar("Player", "SpellDamage", "+", 10), objectVar("Player", "Burn", "+", 2)],
    6: [objectVar("Player", "Pierce", "+", 1), objectVar("Player", "CritChance", "+", 5)],
  };
  for (const [id, actions] of Object.entries(affixActions)) {
    events.push(standard([sceneIs("PendingAffix", "=", id)], [
      ...actions,
      sceneVar("Affix", "=", id),
      sceneVar("AffixTier", "+", 1),
      sceneTextVar("AffixName", "=", `GlobalVariableString(Content.Affixes[${Number(id) - 1}].Name)`),
      instruction("TextObject::String", ["RoomBanner", "=", `"ABYSS GEAR  ·  "+GlobalVariableString(Content.Affixes[${Number(id) - 1}].Name)+"  ·  TIER "+ToString(Variable(AffixTier))`]),
      sceneVar("PendingAffix", "=", 0),
      play("pickup.wav", 96, 0.68),
    ]));
  }

  events.push(comment("07 · HUD, CAMERA SHAKE, DEFEAT, VICTORY, AND RESTART"));
  events.push(standard([], [
    instruction("SetX", ["MenuBackdrop", "=", 0]),
    instruction("SetY", ["MenuBackdrop", "=", 0]),
    ...resize("MenuBackdrop", "SceneWindowWidth()", "SceneWindowHeight()"),
    ...[
      "TitleText", "SubtitleText", "StartText", "MetaText",
      "WeaponTitle", "WeaponA", "WeaponB", "WeaponC",
      "RoomBanner", "UpgradeTitle", "ChoiceA", "ChoiceB", "ChoiceC",
      "PathTitle", "PathSafe", "PathAbyss", "BossHud", "DeathText", "VictoryText",
    ].map((objectName) => instruction("SetCenterX", [objectName, "=", "SceneWindowWidth()/2"])),
  ]));
  events.push(standard([sceneIs("State", ">", 0), sceneIs("Weapon", ">", 0)], [
    instruction("TextObject::String", ["HudMain", "=", '"HP  "+ToString(max(0,ceil(Player.Variable(Health))))+" / "+ToString(Player.Variable(MaxHealth))+"     DEPTH  "+ToString(Variable(Room))+" / "+ToString(Variable(MaxRoom))+"     RISK  "+ToString(Variable(Risk))']),
    instruction("TextObject::String", ["HudSub", "=", '"ECHOES  "+ToString(Variable(RunEchoes))+"     KILLS  "+ToString(Variable(Kills))+"     DAMAGE  "+ToString(Player.Variable(Damage))+"     CRIT  "+ToString(Player.Variable(CritChance))+"%"']),
    instruction("TextObject::String", ["HudBuild", "=", 'GlobalVariableString(Content.Weapons[Variable(Weapon)-1].Name)+"     FERAL "+ToString(Variable(FeralRank))+"   MOON "+ToString(Variable(MoonRank))+"   RIFT "+ToString(Variable(RiftRank))+"     GEAR "+VariableString(AffixName)+" "+ToString(Variable(AffixTier))']),
  ]));
  events.push(standard([sceneIs("BossSpawned", "=", 1), sceneIs("State", "=", 1)], [
    show("BossHud"), instruction("TextObject::String", ["BossHud", "=", '"RIFT WARDEN     "+ToString(max(0,ceil(Boss.Variable(Health))))+" / "+ToString(Boss.Variable(MaxHealth))']),
  ]));
  events.push(standard([], [
    instruction("SetCameraX", ["", "=", "max(480,min(Player.X()+55,5280))", "", 0]),
    instruction("SetCameraY", ["", "=", 270, "", 0]),
  ]));
  events.push(standard([sceneIs("State", "=", 0)], [
    instruction("SetCameraX", ["", "=", 480, "", 0]),
  ]));
  events.push(standard([sceneIs("Shake", ">", 0)], [
    instruction("SetCameraX", ["", "=", "max(480,min(Player.X()+55,5280))+RandomInRange(-Variable(Shake),Variable(Shake))", "", 0]),
    instruction("SetCameraY", ["", "=", "270+RandomInRange(-Variable(Shake),Variable(Shake))", "", 0]),
    sceneVar("Shake", "-", "36*TimeDelta()"),
  ]));
  events.push(standard([sceneIs("Shake", "<", 0)], [sceneVar("Shake", "=", 0)]));
  events.push(standard([...gameplayState], [sceneVar("RunTime", "+", "TimeDelta()") ]));
  events.push(standard([objectIs("Player", "Health", "<=", 0), sceneIs("State", "=", 1)], [
    sceneVar("State", "=", 4), sceneVar("MetaEchoes", "+", "floor(Variable(RunEchoes)/2)"),
    sceneVar("BestDepth", "=", "max(Variable(BestDepth),Variable(Room))"),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.echoes"), "Variable(MetaEchoes)"]),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.bestDepth"), "Variable(BestDepth)"]),
    instruction("EcrireFichierExp", [quoted("shadow-paws-save"), quoted("meta.runs"), "Variable(Runs)"]),
    show("DeathText"), hide("BossHud"), play("boss-roar.wav", 82, 0.5),
  ]));
  events.push(standard([sceneIs("State", ">=", 3), key("r"), once()], [instruction("Scene", ["", quoted("Game"), "yes"])]));
  events.push(standard([instruction("PosY", ["Player", ">", 650]), sceneIs("State", "=", 1)], [
    instruction("SetY", ["Player", "=", 300]), objectVar("Player", "Health", "-", 20), sceneVar("Shake", "=", 12),
  ]));

  if (process.env.GDEVELOP_GAME_TEST_MODE === "1") {
    const testCase = process.env.GDEVELOP_GAME_TEST_CASE || "combat";
    const testRoom = Math.max(1, Math.min(6, Number(process.env.GDEVELOP_GAME_TEST_ROOM || 1)));
    const bossTestCases = ["boss", "phase2", "victory"];
    const initialTestRoom = bossTestCases.includes(testCase) ? 6 : testRoom;
    const testPlayerX = bossTestCases.includes(testCase) ? 4890 : (initialTestRoom - 1) * 960 + 300;
    const initialTestState = testCase === "blessing" ? 2 : testCase === "path" ? 7 : 1;
    events.push(comment("TEST MODE · NATIVE SHORTCUTS FOR THE COMPLETE BROWSER SMOKE PATH"));
    events.push(standard([once()], [
      sceneVar("TestMode", "=", 1), sceneVar("State", "=", initialTestState), sceneVar("Room", "=", initialTestRoom),
      sceneVar("TestStep", "=", 0), sceneVar("TestAppliedStep", "=", 0),
      sceneVar("Weapon", "=", 1), sceneVar("Alive", "=", 1), sceneVar("SpawnRemaining", "=", 0),
      objectVar("Player", "Weapon", "=", 1), objectVar("Player", "Damage", "=", 30),
      objectVar("Player", "AttackCooldown", "=", 0.22), objectVar("Player", "HeavyCooldown", "=", 0.92),
      objectVar("Player", "Health", "=", 160), objectVar("Player", "MaxHealth", "=", 160),
      show("Player"), show("HeroRig"), show("Gate"), show("HudMain"), show("HudSub"), show("HudBuild"), show("Controls"),
      hide("TitleText"), hide("SubtitleText"), hide("StartText"), hide("MetaText"), hide("MenuBackdrop"), hide("RoomBanner"),
      hide("WeaponTitle"), hide("WeaponA"), hide("WeaponB"), hide("WeaponC"),
      hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"),
      hide("PathTitle"), hide("PathSafe"), hide("PathAbyss"), hide("DeathText"), hide("VictoryText"), hide("BossHud"),
      instruction("SetX", ["Player", "=", testPlayerX]), instruction("SetY", ["Player", "=", 355]),
      instruction("Opacity", ["Player", "=", 0]),
      ...(bossTestCases.includes(testCase)
        ? [sceneVar("BossSpawned", "=", 0), sceneVar("Alive", "=", 0), sceneVar("Biome", "=", 3)]
        : []),
      ...(testCase === "blessing"
        ? [
            sceneVar("ChoiceA", "=", 1), sceneVar("ChoiceB", "=", 5), sceneVar("ChoiceC", "=", 9),
            show("UpgradeTitle"), show("ChoiceA"), show("ChoiceB"), show("ChoiceC"),
          ]
        : []),
      ...(testCase === "path"
        ? [show("PathTitle"), show("PathSafe"), show("PathAbyss")]
        : []),
      ...(testCase === "affix"
        ? [sceneVar("Risk", "=", 1), sceneVar("RewardMultiplier", "=", 1.5), sceneVar("PendingAffix", "=", 5), show("RoomBanner")]
        : []),
      ...(testCase === "combat"
        ? [
            create("Hound", testPlayerX + 260, 394), ...resize("Hound", 145, 76),
            objectVar("Hound", "Health", "=", 120), objectVar("Hound", "MaxHealth", "=", 120),
            objectVar("Hound", "Damage", "=", 8), objectVar("Hound", "Reward", "=", 1),
          ]
        : []),
      ...(testCase === "defeat" ? [objectVar("Player", "Health", "=", 0)] : []),
    ]));
    if (testCase === "phase2" || testCase === "victory") {
      events.push(standard([
        sceneIs("TestMode", "=", 1), sceneIs("BossSpawned", "=", 1), objectIs("Boss", "Phase", "=", 1), once(),
      ], [
        objectVar("Boss", "Health", "=", testCase === "phase2" ? "Boss.Variable(MaxHealth)/2-1" : 0),
      ]));
    }
    if (testCase === "combat") {
      events.push(standard([
        sceneIs("TestMode", "=", 1), sceneIs("State", "=", 1), instruction("PosX", ["Player", "<", "Hound.X()-105"]),
      ], [
        instruction("SetX", ["Player", "+", "260*TimeDelta()"]), animation("run"),
      ]));
      events.push(standard([
        sceneIs("TestMode", "=", 1), sceneIs("State", "=", 1), instruction("PosX", ["Player", ">=", "Hound.X()-125"]),
        objectTimer("Player", "attack", ">", 0.3),
      ], [
        create("Slash", "Player.X()+62", "Player.Y()+8"),
        objectVar("Slash", "Damage", "=", 40), objectVar("Slash", "Burn", "=", 0), objectVar("Slash", "Crit", "=", 100),
        resetObjectTimer("Slash", "life"), resetObjectTimer("Player", "attack"), animation("attack1"),
      ]));
    }
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("State", "<", 3), key("Return"), once()], [
      sceneVar("TestStep", "+", 1),
    ]));
    events.push(standard([key("t")], [sceneVar("TestMode", "=", 1), sceneVar("State", "=", 1), show("Player"), show("HeroRig")]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("F8")], [
      animation("heavy"),
      instruction("AnimatableCapability::AnimatableBehavior::SetElapsedTime", ["HeroRig", "Animation", "=", 0.3]),
      instruction("AnimatableCapability::AnimatableBehavior::PauseAnimation", ["HeroRig", "Animation"]),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("F9")], [
      animation("idle"), instruction("AnimatableCapability::AnimatableBehavior::PlayAnimation", ["HeroRig", "Animation"]),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("u")], [
      sceneVar("Room", "=", 2), instruction("SetX", ["Player", "=", 1200]),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("o")], [
      sceneVar("Room", "=", 3), instruction("SetX", ["Player", "=", 2180]),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("F7"), once()], [
      instruction("Delete", ["Hound", ""]), instruction("Delete", ["Moth", ""]),
      instruction("Delete", ["Bolt", ""]), instruction("Delete", ["Shockwave", ""]),
      sceneVar("State", "=", 1), sceneVar("Alive", "=", 0), sceneVar("SpawnRemaining", "=", 0),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("TestStep", "=", 1), sceneIs("TestAppliedStep", "<", 1)], [
      sceneVar("State", "=", 2), sceneVar("ChoiceA", "=", 1), sceneVar("ChoiceB", "=", 5), sceneVar("ChoiceC", "=", 9), sceneVar("Selected", "=", 0),
      sceneVar("TestAppliedStep", "=", 1),
      show("UpgradeTitle"), show("ChoiceA"), show("ChoiceB"), show("ChoiceC"),
      hide("PathTitle"), hide("PathSafe"), hide("PathAbyss"),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), key("F2"), once()], [
      sceneVar("State", "=", 7), show("PathTitle"), show("PathSafe"), show("PathAbyss"),
      hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("TestStep", "=", 2), sceneIs("TestAppliedStep", "<", 2)], [
      instruction("Delete", ["Hound", ""]), instruction("Delete", ["Moth", ""]), instruction("Delete", ["Boss", ""]),
      sceneVar("Room", "=", 6), sceneVar("State", "=", 1), sceneVar("BossSpawned", "=", 0),
      sceneVar("Alive", "=", 0), sceneVar("SpawnRemaining", "=", 0), sceneVar("Biome", "=", 3),
      sceneVar("TestAppliedStep", "=", 2),
      instruction("SetX", ["Player", "=", 4890]), instruction("SetY", ["Player", "=", 350]),
      hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"), hide("PathTitle"), hide("PathSafe"), hide("PathAbyss"),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("TestStep", "=", 3), sceneIs("TestAppliedStep", "<", 3), objectIs("Boss", "Phase", "=", 1)], [
      objectVar("Boss", "Health", "=", "Boss.Variable(MaxHealth)/2-1"), sceneVar("TestAppliedStep", "=", 3),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("TestStep", "=", 4), sceneIs("TestAppliedStep", "<", 4)], [
      objectVar("Boss", "Health", "=", 0), sceneVar("TestAppliedStep", "=", 4),
    ]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("State", "=", 1), key("Escape"), once()], [objectVar("Player", "Health", "=", 0)]));
    events.push(standard([sceneIs("TestMode", "=", 1), sceneIs("State", ">=", 3), key("Return"), once()], [instruction("Scene", ["", quoted("Game"), "yes"])]));
  }

  const eventSections = [];
  let currentSection = null;
  for (const event of events) {
    if (event.kind === "comment") {
      currentSection = {
        kind: "group",
        name: event.text,
        folded: false,
        color: { r: 43, g: 28, b: 86 },
        events: [event],
      };
      eventSections.push(currentSection);
    } else if (currentSection) {
      currentSection.events.push(event);
    } else {
      eventSections.push(event);
    }
  }
  await call("set_scene_events", { projectId, sceneName: "Game", mode: "replace", events: eventSections });
  await call("save_project", { projectId });
  const description = await call("describe_native_project", { projectId });
  await call("export_project", { projectId, outputDirectory: webDirectory, sceneName: "Game" });
  await fs.writeFile(
    path.join(webDirectory, "manifest.webmanifest"),
    JSON.stringify({
      name: "Shadow Paws: Echoes of the Rift",
      short_name: "Shadow Paws",
      start_url: ".",
      display: "fullscreen",
      orientation: "landscape",
      background_color: "#080b21",
      theme_color: "#29115c",
    }, null, 2),
  );
  const sceneDescription = description.scenes[0];
  console.log(JSON.stringify({
    projectFile,
    webDirectory,
    objectCount: sceneDescription.objects.length,
    instanceCount: sceneDescription.instances,
    eventCount: sceneDescription.events,
    objectGroups: sceneDescription.objectGroups,
    sceneVariables: sceneDescription.variables,
    globalVariables: description.globalVariables,
  }, null, 2));
  await call("close_project", { projectId });
} finally {
  await client.close();
}
