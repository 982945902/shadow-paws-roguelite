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
const client = new Client({ name: "shadow-paws-author", version: "0.1.0" });

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
const quoted = (value) => JSON.stringify(value);
const standard = (conditions = [], actions = [], subEvents = []) => ({
  kind: "standard",
  conditions,
  actions,
  subEvents,
});
const comment = (text, color = { r: 64, g: 45, b: 98 }) => ({
  kind: "comment",
  text,
  color,
});
const sceneIs = (name, operator, value) => instruction("VarScene", [name, operator, value]);
const objectIs = (object, name, operator, value) =>
  instruction("VarObjet", [object, name, operator, value]);
const key = (name) => instruction("KeyPressed", ["", name]);
const once = () => instruction("BuiltinCommonInstructions::Once");
const create = (name, x, y, layer = "") =>
  instruction("Create", ["", name, x, y, layer]);
const sceneVar = (name, operator, value) =>
  instruction("ModVarScene", [name, operator, value]);
const objectVar = (object, name, operator, value) =>
  instruction("ModVarObjet", [object, name, operator, value]);

await client.connect(transport);
try {
  const created = await call("create_project", {
    projectFile,
    name: "Shadow Paws: Rift Survivor",
    description: "A native GDevelop 2D side-scrolling roguelite authored through MCP.",
    sceneName: "Game",
    renderingType: "2d",
    width: 960,
    height: 540,
    overwrite: true,
  });
  const projectId = created.projectId;

  const resources = {
    "player.svg": "player.svg",
    "enemy.svg": "enemy.svg",
    "ground.svg": "ground.svg",
    "background.svg": "background.svg",
    "slash.svg": "slash.svg",
    "gem.svg": "gem.svg",
  };
  for (const [resourceName, fileName] of Object.entries(resources)) {
    await call("import_resource", {
      projectId,
      sourceFile: path.join(root, "assets", fileName),
      resourceName,
      kind: "image",
    });
  }

  await call("add_scene_layer", { projectId, sceneName: "Game", layerName: "HUD" });

  const sceneVariables = {
    Level: 1,
    XP: 0,
    NeededXP: 3,
    Kills: 0,
    RunTime: 0,
    ChoosingUpgrade: 0,
    GameOver: 0,
    Victory: 0,
  };
  for (const [name, value] of Object.entries(sceneVariables)) {
    await call("set_scene_variable", { projectId, sceneName: "Game", name, value });
  }

  const platformer = (ignoreDefaultControls, maxSpeed) => ({
    name: "Platformer",
    type: "PlatformBehavior::PlatformerObjectBehavior",
    properties: {
      acceleration: 1900,
      deceleration: 1900,
      gravity: 1500,
      jumpSpeed: 650,
      jumpSustainTime: 0.18,
      maxFallingSpeed: 900,
      maxSpeed,
      ignoreDefaultControls,
    },
  });

  const objects = [
    { name: "Background", type: "Sprite", resourceName: "background.svg", collisionMask: { width: 960, height: 540 } },
    {
      name: "Ground",
      type: "Sprite",
      resourceName: "ground.svg",
      collisionMask: { width: 128, height: 64 },
      behaviors: [
        {
          name: "Platform",
          type: "PlatformBehavior::PlatformBehavior",
          properties: {},
        },
      ],
    },
    {
      name: "Player",
      type: "Sprite",
      resourceName: "player.svg",
      collisionMask: { width: 64, height: 80 },
      variables: { Health: 100, MaxHealth: 100, Damage: 25, Facing: 1, AttackCooldown: 0.45 },
      behaviors: [platformer(true, 320)],
    },
    {
      name: "Enemy",
      type: "Sprite",
      resourceName: "enemy.svg",
      collisionMask: { width: 64, height: 64 },
      variables: { Health: 40, Damage: 12 },
      behaviors: [platformer(true, 115)],
    },
    { name: "Slash", type: "Sprite", resourceName: "slash.svg", collisionMask: { width: 96, height: 64 }, variables: { Damage: 25 } },
    { name: "Gem", type: "Sprite", resourceName: "gem.svg", collisionMask: { width: 32, height: 32 } },
    { name: "Hud", type: "TextObject::Text", text: "", characterSize: 24, color: "245;235;255" },
    { name: "Title", type: "TextObject::Text", text: "SHADOW PAWS  ·  RIFT SURVIVOR", characterSize: 22, color: "139;233;199" },
    { name: "Controls", type: "TextObject::Text", text: "A/D MOVE   SPACE JUMP   J SLASH", characterSize: 17, color: "190;179;230" },
    { name: "UpgradeText", type: "TextObject::Text", text: "LEVEL UP!\n\n[1] CLAW  +10 damage\n[2] HEART +25 max HP\n[3] HASTE +40 speed", characterSize: 31, color: "255;244;194" },
    { name: "GameOverText", type: "TextObject::Text", text: "THE RIFT CLAIMED A LIFE\n\nPress R to begin another run", characterSize: 38, color: "255;128;145" },
    { name: "VictoryText", type: "TextObject::Text", text: "RIFT SEALED!\n\nYou survived 120 seconds\nPress R for another run", characterSize: 38, color: "139;233;199" },
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
      ...object,
    });
  }

  const instances = [
    ["Background", -2400, 0, "", -100, 7200, 540],
    ["Ground", -2400, 460, "", 0, 7200, 100],
    ["Ground", 360, 350, "", 1, 240, 32],
    ["Ground", 850, 300, "", 1, 220, 32],
    ["Ground", 1320, 370, "", 1, 260, 32],
    ["Ground", 1830, 315, "", 1, 230, 32],
    ["Ground", -340, 330, "", 1, 240, 32],
    ["Player", 180, 370, "", 10, 64, 80],
    ["Enemy", 760, 396, "", 9, 64, 64],
    ["Hud", 20, 18, "HUD", 20],
    ["Title", 20, 56, "HUD", 20],
    ["Controls", 20, 507, "HUD", 20],
    ["UpgradeText", 270, 142, "HUD", 30],
    ["GameOverText", 170, 190, "HUD", 30],
    ["VictoryText", 210, 165, "HUD", 30],
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
  const playing = [sceneIs("GameOver", "=", 0), sceneIs("ChoosingUpgrade", "=", 0)];
  const collision = (a, b) => instruction("CollisionNP", [a, b, "", "", ""]);
  const events = [
    comment("01 · RUN INITIALIZATION"),
    standard(
      [once()],
      [
        instruction("ResetTimer", ["", quoted("spawn")]),
        instruction("ResetObjectTimer", ["Player", quoted("attack")]),
        instruction("ResetObjectTimer", ["Player", quoted("hurt")]),
        instruction("Hide", ["UpgradeText"]),
        instruction("Hide", ["GameOverText"]),
        instruction("Hide", ["VictoryText"]),
      ],
    ),

    comment("02 · NATIVE PLATFORMER INPUT"),
    standard([...playing, key("a")], [
      instruction("PlatformBehavior::SimulateLeftKey", ["Player", "Platformer"]),
      instruction("FlipX", ["Player", "yes"]),
      objectVar("Player", "Facing", "=", -1),
    ]),
    standard([...playing, key("d")], [
      instruction("PlatformBehavior::SimulateRightKey", ["Player", "Platformer"]),
      instruction("FlipX", ["Player", "no"]),
      objectVar("Player", "Facing", "=", 1),
    ]),
    standard([...playing, key("Space")], [
      instruction("PlatformBehavior::SimulateJumpKey", ["Player", "Platformer"]),
    ]),

    comment("03 · CLAW ATTACK"),
    standard(
      [
        ...playing,
        key("j"),
        once(),
        objectIs("Player", "Facing", ">", 0),
        instruction("CompareObjectTimer", ["Player", quoted("attack"), ">", "Player.Variable(AttackCooldown)"]),
      ],
      [
        create("Slash", "Player.X() + 48", "Player.Y() + 8"),
        objectVar("Slash", "Damage", "=", "Player.Variable(Damage)"),
        instruction("ResetObjectTimer", ["Slash", quoted("life")]),
        instruction("ResetObjectTimer", ["Player", quoted("attack")]),
      ],
    ),
    standard(
      [
        ...playing,
        key("j"),
        once(),
        objectIs("Player", "Facing", "<", 0),
        instruction("CompareObjectTimer", ["Player", quoted("attack"), ">", "Player.Variable(AttackCooldown)"]),
      ],
      [
        create("Slash", "Player.X() - 82", "Player.Y() + 8"),
        instruction("FlipX", ["Slash", "yes"]),
        objectVar("Slash", "Damage", "=", "Player.Variable(Damage)"),
        instruction("ResetObjectTimer", ["Slash", quoted("life")]),
        instruction("ResetObjectTimer", ["Player", quoted("attack")]),
      ],
    ),
    standard(
      [instruction("CompareObjectTimer", ["Slash", quoted("life"), ">", 0.14])],
      [instruction("Delete", ["Slash", ""])],
    ),
    standard(
      [collision("Slash", "Enemy")],
      [
        objectVar("Enemy", "Health", "-", "Slash.Variable(Damage)"),
        instruction("Delete", ["Slash", ""]),
      ],
    ),

    comment("04 · ENEMY WAVES AND LOOT"),
    standard(
      [
        ...playing,
        instruction("Timer", ["", "2.2 - min(Variable(Level) * 0.12, 1.4)", quoted("spawn")]),
      ],
      [
        create("Enemy", "Player.X() + RandomInRange(560, 820)", 396),
        objectVar("Enemy", "Health", "=", "35 + Variable(Level) * 8"),
        objectVar("Enemy", "Damage", "=", "10 + Variable(Level) * 2"),
        instruction("ResetTimer", ["", quoted("spawn")]),
      ],
    ),
    standard(
      [...playing, instruction("PosX", ["Enemy", ">", "Player.X() + 10"])],
      [
        instruction("PlatformBehavior::SimulateLeftKey", ["Enemy", "Platformer"]),
        instruction("FlipX", ["Enemy", "yes"]),
      ],
    ),
    standard(
      [...playing, instruction("PosX", ["Enemy", "<", "Player.X() - 10"])],
      [
        instruction("PlatformBehavior::SimulateRightKey", ["Enemy", "Platformer"]),
        instruction("FlipX", ["Enemy", "no"]),
      ],
    ),
    standard(
      [objectIs("Enemy", "Health", "<=", 0)],
      [
        create("Gem", "Enemy.X() + 16", "Enemy.Y() + 16"),
        instruction("Delete", ["Enemy", ""]),
        sceneVar("Kills", "+", 1),
      ],
    ),
    standard(
      [collision("Player", "Gem")],
      [instruction("Delete", ["Gem", ""]), sceneVar("XP", "+", 1)],
    ),
    standard(
      [
        ...playing,
        collision("Player", "Enemy"),
        instruction("CompareObjectTimer", ["Player", quoted("hurt"), ">", 0.75]),
      ],
      [
        objectVar("Player", "Health", "-", "Enemy.Variable(Damage)"),
        instruction("ResetObjectTimer", ["Player", quoted("hurt")]),
      ],
    ),

    comment("05 · ROGUELITE LEVEL-UP CHOICES"),
    standard(
      [sceneIs("XP", ">=", "Variable(NeededXP)"), sceneIs("ChoosingUpgrade", "=", 0)],
      [
        sceneVar("XP", "-", "Variable(NeededXP)"),
        sceneVar("NeededXP", "+", 2),
        sceneVar("Level", "+", 1),
        sceneVar("ChoosingUpgrade", "=", 1),
        instruction("Show", ["UpgradeText", ""]),
      ],
    ),
    standard(
      [sceneIs("ChoosingUpgrade", "=", 1), key("Num1"), once()],
      [
        objectVar("Player", "Damage", "+", 10),
        sceneVar("ChoosingUpgrade", "=", 0),
        instruction("Hide", ["UpgradeText"]),
      ],
    ),
    standard(
      [sceneIs("ChoosingUpgrade", "=", 1), key("Num2"), once()],
      [
        objectVar("Player", "MaxHealth", "+", 25),
        objectVar("Player", "Health", "+", 25),
        sceneVar("ChoosingUpgrade", "=", 0),
        instruction("Hide", ["UpgradeText"]),
      ],
    ),
    standard(
      [sceneIs("ChoosingUpgrade", "=", 1), key("Num3"), once()],
      [
        instruction("PlatformBehavior::MaxSpeed", ["Player", "Platformer", "+", 40]),
        sceneVar("ChoosingUpgrade", "=", 0),
        instruction("Hide", ["UpgradeText"]),
      ],
    ),

    comment("06 · RUN CLOCK, DEATH, VICTORY, RESTART"),
    standard(playing, [sceneVar("RunTime", "+", "TimeDelta()")]),
    standard(
      [objectIs("Player", "Health", "<=", 0), sceneIs("GameOver", "=", 0)],
      [sceneVar("GameOver", "=", 1), instruction("Show", ["GameOverText", ""])],
    ),
    standard(
      [sceneIs("RunTime", ">=", 120), sceneIs("GameOver", "=", 0)],
      [
        sceneVar("Victory", "=", 1),
        sceneVar("GameOver", "=", 1),
        instruction("Show", ["VictoryText", ""]),
      ],
    ),
    standard(
      [sceneIs("GameOver", "=", 1), key("r"), once()],
      [instruction("Scene", ["", quoted("Game"), "yes"])],
    ),
    standard(
      [instruction("PosY", ["Player", ">", 650]), sceneIs("GameOver", "=", 0)],
      [instruction("SetY", ["Player", "=", 300]), objectVar("Player", "Health", "-", 15)],
    ),

    comment("07 · CAMERA AND HUD"),
    standard([], [
      instruction("CenterCameraOnObject", ["", "Player", "yes", "", 0]),
      instruction("SetCameraY", ["", "=", 270, "", 0]),
    ]),
    standard([], [
      instruction("TextObject::String", [
        "Hud",
        "=",
        '"HP " + ToString(Player.Variable(Health)) + " / " + ToString(Player.Variable(MaxHealth)) + "    LV " + ToString(Variable(Level)) + "    XP " + ToString(Variable(XP)) + "/" + ToString(Variable(NeededXP)) + "    KILLS " + ToString(Variable(Kills)) + "    TIME " + ToString(floor(Variable(RunTime)))',
      ]),
    ]),
  ];

  await call("set_scene_events", {
    projectId,
    sceneName: "Game",
    mode: "replace",
    events,
  });
  await call("save_project", { projectId });
  const description = await call("describe_native_project", { projectId });
  await call("export_project", {
    projectId,
    outputDirectory: webDirectory,
    sceneName: "Game",
  });
  console.log(JSON.stringify({ projectFile, webDirectory, description }, null, 2));
  await call("close_project", { projectId });
} finally {
  await client.close();
}
