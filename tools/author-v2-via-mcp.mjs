import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

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
const webDirectory = path.join(root, "web");

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
const client = new Client({ name: "shadow-paws-v2-author", version: "0.2.0" });

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
    description: "A native GDevelop side-scrolling roguelite vertical slice authored through MCP.",
    sceneName: "Game",
    renderingType: "2d",
    width: 960,
    height: 540,
    overwrite: true,
  });
  const projectId = created.projectId;

  const resources = {
    "rift-background-v2.png": "rift-background-v2.png",
    "hero-v2.png": "hero-v2.png",
    "hound-v2.png": "hound-v2.png",
    "moth-v2.png": "moth-v2.png",
    "boss-v2.png": "boss-v2.png",
    "ground.svg": "ground.svg",
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
  for (const fileName of ["slash.wav", "impact.wav", "dash.wav", "pickup.wav", "boss-roar.wav"]) {
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
    SpawnRemaining: 4,
    Alive: 0,
    Kills: 0,
    Essence: 0,
    ChoiceA: 0,
    ChoiceB: 0,
    ChoiceC: 0,
    Selected: 0,
    Shake: 0,
    BossSpawned: 0,
    RunTime: 0,
  };
  for (const [name, value] of Object.entries(sceneVariables)) {
    await call("set_scene_variable", { projectId, sceneName: "Game", name, value });
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
    { name: "Background", type: "Sprite", resourceName: "rift-background-v2.png" },
    {
      name: "Ground",
      type: "Sprite",
      resourceName: "ground.svg",
      collisionMask: { width: 128, height: 64 },
      behaviors: [{ name: "Platform", type: "PlatformBehavior::PlatformBehavior", properties: {} }],
    },
    {
      name: "Player",
      type: "Sprite",
      resourceName: "hero-v2.png",
      collisionMask: { width: 975, height: 849 },
      variables: {
        Health: 160,
        MaxHealth: 160,
        Damage: 32,
        Facing: 1,
        AttackCooldown: 0.28,
        Combo: 0,
        DashCooldown: 1.15,
        Dashing: 0,
        Lifesteal: 0,
      },
      behaviors: [platformer(360)],
    },
    {
      name: "Hound",
      type: "Sprite",
      resourceName: "hound-v2.png",
      collisionMask: { width: 1423, height: 734 },
      variables: { Health: 56, Damage: 9 },
      behaviors: [platformer(135)],
    },
    {
      name: "Moth",
      type: "Sprite",
      resourceName: "moth-v2.png",
      collisionMask: { width: 1076, height: 870 },
      variables: { Health: 44, Damage: 8 },
    },
    {
      name: "Boss",
      type: "Sprite",
      resourceName: "boss-v2.png",
      collisionMask: { width: 1444, height: 1014 },
      variables: { Health: 620, MaxHealth: 620, Damage: 20, Phase: 1 },
      behaviors: [platformer(115)],
    },
    { name: "Slash", type: "Sprite", resourceName: "slash-v2.svg", collisionMask: { width: 160, height: 100 }, variables: { Damage: 28 } },
    { name: "HeavySlash", type: "Sprite", resourceName: "heavy-slash-v2.svg", collisionMask: { width: 230, height: 170 }, variables: { Damage: 48 } },
    { name: "Gem", type: "Sprite", resourceName: "gem.svg", collisionMask: { width: 32, height: 32 } },
    { name: "Bolt", type: "Sprite", resourceName: "bolt-v2.svg", collisionMask: { width: 48, height: 48 }, variables: { Direction: -1 } },
    { name: "Shockwave", type: "Sprite", resourceName: "shockwave-v2.svg", collisionMask: { width: 120, height: 76 }, variables: { Direction: -1 } },
    { name: "Gate", type: "Sprite", resourceName: "gate-v2.svg" },
    { name: "HudMain", type: "TextObject::Text", text: "", characterSize: 22, color: "239;248;255", textStyle },
    { name: "HudSub", type: "TextObject::Text", text: "", characterSize: 17, color: "142;246;232", textStyle },
    { name: "TitleText", type: "TextObject::Text", text: "SHADOW PAWS", characterSize: 64, color: "248;221;255", textStyle: { ...textStyle, alignment: "center" } },
    { name: "SubtitleText", type: "TextObject::Text", text: "ECHOES OF THE RIFT", characterSize: 26, color: "118;245;224", textStyle: { ...textStyle, alignment: "center" } },
    { name: "StartText", type: "TextObject::Text", text: "PRESS ENTER TO HUNT", characterSize: 25, color: "255;209;126", textStyle: { ...textStyle, alignment: "center" } },
    { name: "Controls", type: "TextObject::Text", text: "A/D MOVE   SPACE JUMP   J COMBO   K HEAVY   SHIFT DASH", characterSize: 16, color: "203;196;232", textStyle },
    { name: "RoomBanner", type: "TextObject::Text", text: "", characterSize: 31, color: "197;251;244", textStyle: { ...textStyle, alignment: "center" } },
    { name: "UpgradeTitle", type: "TextObject::Text", text: "THE RIFT OFFERS THREE ECHOES", characterSize: 30, color: "255;231;157", textStyle: { ...textStyle, alignment: "center" } },
    { name: "ChoiceA", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
    { name: "ChoiceB", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
    { name: "ChoiceC", type: "TextObject::Text", text: "", characterSize: 22, color: "239;226;255", textStyle },
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
    ["Background", -300, 0, "", -100, 1260, 540],
    ["Background", 960, 0, "", -100, 960, 540],
    ["Background", 1920, 0, "", -100, 960, 540],
    ["Ground", -200, 470, "", 0, 3400, 100],
    ["Ground", 330, 350, "", 1, 220, 30],
    ["Ground", 1260, 330, "", 1, 220, 30],
    ["Ground", 2160, 360, "", 1, 250, 30],
    ["Player", 140, 355, "", 10, 110, 110],
    ["Gate", 865, 130, "", 8, 72, 340],
    ["Gate", 1825, 130, "", 8, 72, 340],
    ["HudMain", 20, 16, "HUD", 50],
    ["HudSub", 20, 49, "HUD", 50],
    ["TitleText", 244, 126, "HUD", 70],
    ["SubtitleText", 324, 210, "HUD", 70],
    ["StartText", 325, 338, "HUD", 70],
    ["Controls", 20, 510, "HUD", 50],
    ["RoomBanner", 228, 105, "HUD", 60],
    ["UpgradeTitle", 180, 112, "HUD", 80],
    ["ChoiceA", 230, 205, "HUD", 80],
    ["ChoiceB", 230, 283, "HUD", 80],
    ["ChoiceC", 230, 361, "HUD", 80],
    ["BossHud", 275, 76, "HUD", 60],
    ["DeathText", 220, 188, "HUD", 90],
    ["VictoryText", 160, 150, "HUD", 90],
  ];
  for (const [objectName, x, y, layer, zOrder, width, height] of instances) {
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
    });
  }

  const events = [];
  events.push(comment("00 · TITLE, STATE MACHINE, AND RUN INITIALIZATION"));
  events.push(
    standard(
      [once()],
      [
        resetSceneTimer("spawn"),
        resetSceneTimer("banner"),
        resetObjectTimer("Player", "attack"),
        resetObjectTimer("Player", "heavy"),
        resetObjectTimer("Player", "hurt"),
        resetObjectTimer("Player", "dash"),
        resetObjectTimer("Player", "combo"),
        hide("Player"), hide("Gate"), hide("HudMain"), hide("HudSub"), hide("Controls"), hide("RoomBanner"),
        hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"),
        hide("BossHud"), hide("DeathText"), hide("VictoryText"),
      ],
    ),
  );
  events.push(
    standard([sceneIs("State", "=", 0), key("Return"), once()], [
      sceneVar("State", "=", 1), show("Player"), show("Gate"), show("HudMain"), show("HudSub"), show("Controls"),
      hide("TitleText"), hide("SubtitleText"), hide("StartText"),
      show("RoomBanner"), text("RoomBanner", "CHAPTER I  ·  THE SHATTERED PATH"),
      resetSceneTimer("banner"), resetSceneTimer("spawn"), play("boss-roar.wav", 48, 1.35),
    ]),
  );
  events.push(standard([sceneTimer("banner", 2.2)], [hide("RoomBanner")]));

  events.push(comment("01 · RESPONSIVE PLATFORMER MOVEMENT AND DASH"));
  events.push(standard([...gameplayState, key("a")], [
    instruction("PlatformBehavior::SimulateLeftKey", ["Player", "Platformer"]),
    instruction("FlipX", ["Player", "yes"]), objectVar("Player", "Facing", "=", -1),
  ]));
  events.push(standard([...gameplayState, key("d")], [
    instruction("PlatformBehavior::SimulateRightKey", ["Player", "Platformer"]),
    instruction("FlipX", ["Player", "no"]), objectVar("Player", "Facing", "=", 1),
  ]));
  events.push(standard([...gameplayState, key("Space")], [
    instruction("PlatformBehavior::SimulateJumpKey", ["Player", "Platformer"]),
  ]));
  events.push(standard([...gameplayState, key("LShift"), once(), objectTimer("Player", "dash", ">", "Player.Variable(DashCooldown)")], [
    objectVar("Player", "Dashing", "=", 1), resetObjectTimer("Player", "dash"),
    instruction("Opacity", ["Player", "=", 145]), play("dash.wav", 75, 1), sceneVar("Shake", "=", 4),
  ]));
  events.push(standard([...gameplayState, objectIs("Player", "Dashing", "=", 1), objectTimer("Player", "dash", "<", 0.18)], [
    instruction("SetX", ["Player", "=", "Player.X()+Player.Variable(Facing)*720*TimeDelta()"]),
  ]));
  events.push(standard([objectIs("Player", "Dashing", "=", 1), objectTimer("Player", "dash", ">=", 0.18)], [
    objectVar("Player", "Dashing", "=", 0), instruction("Opacity", ["Player", "=", 255]),
  ]));

  events.push(comment("02 · THREE-HIT CLAW COMBO AND HEAVY ATTACK"));
  const comboAttack = (combo, facing, objectName, multiplier, nextCombo) => {
    const right = facing > 0;
    const x = objectName === "HeavySlash"
      ? right ? "Player.X()+62" : "Player.X()-205"
      : right ? "Player.X()+62" : "Player.X()-145";
    const y = objectName === "HeavySlash" ? "Player.Y()-24" : "Player.Y()+8";
    return standard(
      [...gameplayState, key("j"), once(), objectIs("Player", "Combo", "=", combo), objectIs("Player", "Facing", facing > 0 ? ">" : "<", 0), objectTimer("Player", "attack", ">", "Player.Variable(AttackCooldown)")],
      [
        create(objectName, x, y),
        ...(!right ? [instruction("FlipX", [objectName, "yes"])] : []),
        objectVar(objectName, "Damage", "=", `Player.Variable(Damage)*${multiplier}`),
        resetObjectTimer(objectName, "life"), resetObjectTimer("Player", "attack"), resetObjectTimer("Player", "combo"),
        objectVar("Player", "Combo", "=", nextCombo),
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
    events.push(standard([...gameplayState, key("k"), once(), objectIs("Player", "Facing", right ? ">" : "<", 0), objectTimer("Player", "heavy", ">", 1.05)], [
      create("HeavySlash", right ? "Player.X()+52" : "Player.X()-210", "Player.Y()-26"),
      ...(!right ? [instruction("FlipX", ["HeavySlash", "yes"])] : []),
      objectVar("HeavySlash", "Damage", "=", "Player.Variable(Damage)*2.15"),
      resetObjectTimer("HeavySlash", "life"), resetObjectTimer("Player", "heavy"),
      sceneVar("Shake", "=", 9), play("slash.wav", 95, 0.68),
    ]));
  }
  events.push(standard([objectTimer("Slash", "life", ">", 0.13)], [instruction("Delete", ["Slash", ""])]));
  events.push(standard([objectTimer("HeavySlash", "life", ">", 0.2)], [instruction("Delete", ["HeavySlash", ""])]));

  events.push(comment("03 · ROOM I AND ROOM II ENCOUNTER DIRECTOR"));
  events.push(standard([...gameplayState, sceneIs("Room", "=", 1), sceneIs("SpawnRemaining", ">", 0), sceneTimer("spawn", 1.08)], [
    create("Hound", "min(730,Player.X()+RandomInRange(430,590))", 400), ...resize("Hound", 145, 76),
    objectVar("Hound", "Health", "=", "56+Variable(Room)*8"), objectVar("Hound", "Damage", "=", 9),
    sceneVar("Alive", "+", 1), sceneVar("SpawnRemaining", "-", 1), resetSceneTimer("spawn"),
  ]));
  events.push(standard([...gameplayState, sceneIs("Room", "=", 2), sceneIs("SpawnRemaining", ">", 0), sceneTimer("spawn", 1.25)], [
    create("Hound", "min(1700,Player.X()+RandomInRange(420,610))", 400), ...resize("Hound", 152, 80),
    objectVar("Hound", "Health", "=", 80), objectVar("Hound", "Damage", "=", 11),
    create("Moth", "min(1710,Player.X()+RandomInRange(470,650))", "RandomInRange(190,280)"), ...resize("Moth", 118, 96),
    objectVar("Moth", "Health", "=", 50), objectVar("Moth", "Damage", "=", 8), resetObjectTimer("Moth", "shoot"),
    sceneVar("Alive", "+", 2), sceneVar("SpawnRemaining", "-", 1), resetSceneTimer("spawn"),
  ]));
  events.push(standard([...gameplayState, sceneIs("Room", "=", 1), instruction("PosX", ["Player", ">", 820])], [instruction("SetX", ["Player", "=", 820])]));
  events.push(standard([...gameplayState, sceneIs("Room", "=", 2), instruction("PosX", ["Player", ">", 1780])], [instruction("SetX", ["Player", "=", 1780])]));

  events.push(comment("04 · ENEMY AI, RANGED FIRE, AND THE RIFT WARDEN"));
  events.push(standard([...gameplayState, instruction("PosX", ["Hound", ">", "Player.X()+36"])], [
    instruction("PlatformBehavior::SimulateLeftKey", ["Hound", "Platformer"]), instruction("FlipX", ["Hound", "no"]),
  ]));
  events.push(standard([...gameplayState, instruction("PosX", ["Hound", "<", "Player.X()-36"])], [
    instruction("PlatformBehavior::SimulateRightKey", ["Hound", "Platformer"]), instruction("FlipX", ["Hound", "yes"]),
  ]));
  events.push(standard([...gameplayState, instruction("PosX", ["Moth", ">", "Player.X()+150"])], [instruction("SetX", ["Moth", "-", "105*TimeDelta()"])]));
  events.push(standard([...gameplayState, instruction("PosX", ["Moth", "<", "Player.X()-150"])], [instruction("SetX", ["Moth", "+", "105*TimeDelta()"])]));
  events.push(standard([...gameplayState, objectTimer("Moth", "shoot", ">", 1.85)], [
    create("Bolt", "Moth.X()+Moth.Width()/2", "Moth.Y()+Moth.Height()/2"),
    objectVar("Bolt", "Direction", "=", "sign(Player.X()-Moth.X())"), resetObjectTimer("Bolt", "life"),
    resetObjectTimer("Moth", "shoot"), play("slash.wav", 42, 1.65),
  ]));
  events.push(standard([...gameplayState], [instruction("SetX", ["Bolt", "+", "Bolt.Variable(Direction)*310*TimeDelta()"])]));
  events.push(standard([objectTimer("Bolt", "life", ">", 4)], [instruction("Delete", ["Bolt", ""])]));

  events.push(standard([...gameplayState, sceneIs("Room", "=", 3), sceneIs("BossSpawned", "=", 0)], [
    create("Boss", 2460, 270), ...resize("Boss", 290, 210),
    objectVar("Boss", "Health", "=", 620), objectVar("Boss", "MaxHealth", "=", 620), objectVar("Boss", "Phase", "=", 1),
    resetObjectTimer("Boss", "shock"), sceneVar("Alive", "=", 1), sceneVar("BossSpawned", "=", 1),
    show("BossHud"), play("boss-roar.wav", 92, 0.82), sceneVar("Shake", "=", 14),
  ]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", ">", "Player.X()+70"])], [instruction("PlatformBehavior::SimulateLeftKey", ["Boss", "Platformer"])]));
  events.push(standard([...gameplayState, instruction("PosX", ["Boss", "<", "Player.X()-70"])], [instruction("PlatformBehavior::SimulateRightKey", ["Boss", "Platformer"])]));
  events.push(standard([objectIs("Boss", "Health", "<=", 310), objectIs("Boss", "Phase", "=", 1)], [
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
  const attackHit = (attackObject, enemyObject) => standard(
    [collision(attackObject, enemyObject)],
    [
      objectVar(enemyObject, "Health", "-", `${attackObject}.Variable(Damage)`),
      instruction("Opacity", [enemyObject, "=", 80]), resetObjectTimer(enemyObject, "hit"),
      instruction("Delete", [attackObject, ""]), sceneVar("Shake", "=", enemyObject === "Boss" ? 10 : 6),
      play("impact.wav", enemyObject === "Boss" ? 88 : 72, `RandomFloatInRange(0.92,1.08)`),
    ],
  );
  for (const attackObject of ["Slash", "HeavySlash"]) {
    for (const enemyObject of ["Hound", "Moth", "Boss"]) events.push(attackHit(attackObject, enemyObject));
  }
  for (const enemyObject of ["Hound", "Moth", "Boss"]) {
    events.push(standard([objectTimer(enemyObject, "hit", ">", 0.085)], [instruction("Opacity", [enemyObject, "=", 255])]));
  }
  const enemyDeath = (enemyObject) => standard([objectIs(enemyObject, "Health", "<=", 0)], [
    create("Gem", `${enemyObject}.X()+${enemyObject}.Width()/2`, `${enemyObject}.Y()+${enemyObject}.Height()/2`),
    instruction("Delete", [enemyObject, ""]), sceneVar("Alive", "-", 1), sceneVar("Kills", "+", 1),
    objectVar("Player", "Health", "=", "min(Player.Variable(MaxHealth),Player.Variable(Health)+Player.Variable(Lifesteal))"),
  ]);
  events.push(enemyDeath("Hound"), enemyDeath("Moth"));
  events.push(standard([objectIs("Boss", "Health", "<=", 0)], [
    instruction("Delete", ["Boss", ""]), sceneVar("Alive", "=", 0), sceneVar("State", "=", 3),
    hide("BossHud"), show("VictoryText"), sceneVar("Shake", "=", 18), play("boss-roar.wav", 100, 0.55),
  ]));
  events.push(standard([collision("Player", "Gem")], [
    instruction("Delete", ["Gem", ""]), sceneVar("Essence", "+", 1),
    objectVar("Player", "Health", "=", "min(Player.Variable(MaxHealth),Player.Variable(Health)+5)"), play("pickup.wav", 78, 1),
  ]));

  const playerHit = (enemyObject, damage, deleteAttacker = false) => standard(
    [...gameplayState, collision("Player", enemyObject), objectIs("Player", "Dashing", "=", 0), objectTimer("Player", "hurt", ">", 0.95)],
    [
      objectVar("Player", "Health", "-", damage), resetObjectTimer("Player", "hurt"),
      instruction("Opacity", ["Player", "=", 105]), sceneVar("Shake", "=", 12), play("impact.wav", 86, 0.78),
      ...(deleteAttacker ? [instruction("Delete", [enemyObject, ""])] : []),
    ],
  );
  events.push(playerHit("Hound", "Hound.Variable(Damage)"));
  events.push(playerHit("Moth", "Moth.Variable(Damage)"));
  events.push(playerHit("Boss", "Boss.Variable(Damage)"));
  events.push(playerHit("Bolt", 9, true));
  events.push(playerHit("Shockwave", 15, true));
  events.push(standard([objectTimer("Player", "hurt", ">", 0.16), objectIs("Player", "Dashing", "=", 0)], [instruction("Opacity", ["Player", "=", 255])]));

  events.push(comment("06 · DISTINCT RANDOMIZED ROGUELITE BLESSINGS"));
  const offerUpgrade = (room) => standard([...gameplayState, sceneIs("Room", "=", room), sceneIs("SpawnRemaining", "=", 0), sceneIs("Alive", "=", 0)], [
    sceneVar("State", "=", 2), sceneVar("ChoiceA", "=", "RandomInRange(1,6)"),
    sceneVar("ChoiceB", "=", "1+mod(Variable(ChoiceA)+RandomInRange(1,4),6)"),
    sceneVar("ChoiceC", "=", "1+mod(Variable(ChoiceB)+RandomInRange(1,4),6)"), sceneVar("Selected", "=", 0),
    show("UpgradeTitle"), show("ChoiceA"), show("ChoiceB"), show("ChoiceC"), play("pickup.wav", 84, 0.78),
  ]);
  events.push(offerUpgrade(1), offerUpgrade(2));
  const blessingNames = {
    1: "FERAL EDGE  ·  +8 claw damage",
    2: "NINE LIVES  ·  +30 max HP and heal",
    3: "QUICKSILVER  ·  faster combo attacks",
    4: "WIND-STEP  ·  +60 movement speed",
    5: "PHASE SKIN  ·  shorter dash cooldown",
    6: "HUNTER'S FEAST  ·  heal on every kill",
  };
  for (const [choiceObject, variableName, keyNumber] of [["ChoiceA", "ChoiceA", 1], ["ChoiceB", "ChoiceB", 2], ["ChoiceC", "ChoiceC", 3]]) {
    for (const [id, label] of Object.entries(blessingNames)) {
      events.push(standard([sceneIs("State", "=", 2), sceneIs(variableName, "=", id)], [text(choiceObject, `[${keyNumber}]  ${label}`)]));
    }
  }
  events.push(standard([sceneIs("State", "=", 2), key("Num1"), once()], [sceneVar("Selected", "=", "Variable(ChoiceA)")]));
  events.push(standard([sceneIs("State", "=", 2), key("Num2"), once()], [sceneVar("Selected", "=", "Variable(ChoiceB)")]));
  events.push(standard([sceneIs("State", "=", 2), key("Num3"), once()], [sceneVar("Selected", "=", "Variable(ChoiceC)")]));
  const blessingActions = {
    1: [objectVar("Player", "Damage", "+", 8)],
    2: [objectVar("Player", "MaxHealth", "+", 30), objectVar("Player", "Health", "+", 30)],
    3: [objectVar("Player", "AttackCooldown", "=", "max(0.14,Player.Variable(AttackCooldown)-0.06)")],
    4: [instruction("PlatformBehavior::MaxSpeed", ["Player", "Platformer", "+", 60])],
    5: [objectVar("Player", "DashCooldown", "=", "max(0.55,Player.Variable(DashCooldown)-0.2)")],
    6: [objectVar("Player", "Lifesteal", "+", 5)],
  };
  for (const [id, actions] of Object.entries(blessingActions)) {
    events.push(standard([sceneIs("State", "=", 2), sceneIs("Selected", "=", id)], [...actions, sceneVar("State", "=", 5), play("pickup.wav", 92, 1.18)]));
  }
  const closeUpgrade = [hide("UpgradeTitle"), hide("ChoiceA"), hide("ChoiceB"), hide("ChoiceC"), show("RoomBanner"), resetSceneTimer("banner")];
  events.push(standard([sceneIs("State", "=", 5), sceneIs("Room", "=", 1)], [
    ...closeUpgrade, text("RoomBanner", "CHAPTER II  ·  WINGS IN THE DARK"),
    sceneVar("Room", "=", 2), sceneVar("State", "=", 1), sceneVar("SpawnRemaining", "=", 3), sceneVar("Alive", "=", 0),
    instruction("SetX", ["Player", "=", 1040]), resetSceneTimer("spawn"),
  ]));
  events.push(standard([sceneIs("State", "=", 5), sceneIs("Room", "=", 2)], [
    ...closeUpgrade, text("RoomBanner", "FINAL CHAPTER  ·  THE RIFT WARDEN"),
    sceneVar("Room", "=", 3), sceneVar("State", "=", 1), sceneVar("Alive", "=", 0),
    instruction("SetX", ["Player", "=", 2020]), resetSceneTimer("spawn"),
  ]));

  events.push(comment("07 · HUD, CAMERA SHAKE, DEFEAT, VICTORY, AND RESTART"));
  events.push(standard([sceneIs("State", ">", 0)], [
    instruction("TextObject::String", ["HudMain", "=", '"HP  "+ToString(max(0,ceil(Player.Variable(Health))))+" / "+ToString(Player.Variable(MaxHealth))+"     ROOM  "+ToString(Variable(Room))+" / 3"']),
    instruction("TextObject::String", ["HudSub", "=", '"ESSENCE  "+ToString(Variable(Essence))+"     KILLS  "+ToString(Variable(Kills))+"     CLAW  "+ToString(Player.Variable(Damage))']),
  ]));
  events.push(standard([sceneIs("BossSpawned", "=", 1), sceneIs("State", "=", 1)], [
    show("BossHud"), instruction("TextObject::String", ["BossHud", "=", '"RIFT WARDEN     "+ToString(max(0,ceil(Boss.Variable(Health))))+" / 620"']),
  ]));
  events.push(standard([], [
    instruction("SetCameraX", ["", "=", "max(480,min(Player.X()+55,2400))", "", 0]),
    instruction("SetCameraY", ["", "=", 270, "", 0]),
  ]));
  events.push(standard([sceneIs("State", "=", 0)], [
    instruction("SetCameraX", ["", "=", 480, "", 0]),
  ]));
  events.push(standard([sceneIs("Shake", ">", 0)], [
    instruction("SetCameraX", ["", "=", "max(480,min(Player.X()+55,2400))+RandomInRange(-Variable(Shake),Variable(Shake))", "", 0]),
    instruction("SetCameraY", ["", "=", "270+RandomInRange(-Variable(Shake),Variable(Shake))", "", 0]),
    sceneVar("Shake", "-", "36*TimeDelta()"),
  ]));
  events.push(standard([sceneIs("Shake", "<", 0)], [sceneVar("Shake", "=", 0)]));
  events.push(standard([...gameplayState], [sceneVar("RunTime", "+", "TimeDelta()") ]));
  events.push(standard([objectIs("Player", "Health", "<=", 0), sceneIs("State", "=", 1)], [
    sceneVar("State", "=", 4), show("DeathText"), hide("BossHud"), play("boss-roar.wav", 82, 0.5),
  ]));
  events.push(standard([sceneIs("State", ">=", 3), key("r"), once()], [instruction("Scene", ["", quoted("Game"), "yes"])]));
  events.push(standard([instruction("PosY", ["Player", ">", 650]), sceneIs("State", "=", 1)], [
    instruction("SetY", ["Player", "=", 300]), objectVar("Player", "Health", "-", 20), sceneVar("Shake", "=", 12),
  ]));

  await call("set_scene_events", { projectId, sceneName: "Game", mode: "replace", events });
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
  console.log(JSON.stringify({ projectFile, webDirectory, description }, null, 2));
  await call("close_project", { projectId });
} finally {
  await client.close();
}
