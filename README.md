# Shadow Paws: Rift Survivor

A native GDevelop 2D side-scrolling roguelite authored through the GDevelop MCP
server. The project deliberately contains no monolithic JavaScript gameplay
event: objects, behaviors, variables, conditions, and actions are visible in
the GDevelop editor.

## Controls

- `A` / `D`: move
- `Space`: jump
- `J`: slash
- `1` / `2` / `3`: choose an upgrade
- `R`: restart after defeat or victory

## Native architecture

- `Player` and `Enemy` use GDevelop's Platformer character behavior.
- `Ground` uses the native Platform behavior.
- Scene variables hold run state, XP, level, spawn timing, and game state.
- Object variables hold health, damage, facing, and attack cooldown.
- The event sheet handles spawning, combat, drops, upgrades, HUD, camera, death,
  and restart.
- `game.json` is the editable source of truth; `web/` is a reproducible GDJS export.

## Regenerate through MCP

The authoring script talks to `gdevelop-mcp-server` over MCP stdio. By default it
expects the server and GDevelop artifacts beside this repository in the Codex
workspace. Public clones can provide explicit paths:

```sh
npm install
GDEVELOP_MCP_SERVER_ROOT=/path/to/gdevelop-mcp-server \
GDEVELOP_LIBGD_PATH=/path/to/libGD.js \
GDEVELOP_GDJS_ROOT=/path/to/GDJS \
npm run author
```

This creates `game.json` and exports a static web build to `web/`.
