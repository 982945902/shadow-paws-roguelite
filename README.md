# Shadow Paws: Echoes of the Rift

A polished native GDevelop side-scrolling roguelite vertical slice authored
through the GDevelop MCP server. The project deliberately contains no
monolithic JavaScript gameplay event: all objects, behaviors, variables,
conditions, and actions remain visible in the GDevelop editor.

Play the production build: https://shadow-paws-roguelite.vercel.app

## Controls

- `A` / `D`: move
- `Space`: jump
- `J`: three-hit claw combo
- `K`: heavy rift slash
- `Shift`: invulnerable dash
- `1` / `2` / `3`: choose an upgrade
- `R`: restart after defeat or victory

## Vertical slice

- Three connected chapters with a scrolling camera and encounter gates.
- Responsive platformer movement, three-hit combo, heavy attack, dash, hit
  flash, camera shake, knock-through invulnerability, and procedural sound FX.
- Rift Hounds, flying Moth shooters, hostile projectiles, loot, and healing.
- Randomized three-choice blessings that change damage, health, attack speed,
  movement, dash cooldown, or kill healing.
- A large Rift Warden boss with a faster second phase and ground shockwaves.
- Title, HUD, chapter banners, blessing selection, defeat, victory, and restart
  flows.

## Native architecture

- `Player`, `Hound`, and `Boss` use GDevelop's Platformer character behavior.
- `Ground` uses the native Platform behavior.
- Scene variables hold the state machine, rooms, encounter director, randomized
  choices, camera shake, and run statistics.
- Object variables hold health, damage, combo state, facing, dash state, and
  build modifiers.
- The event sheet handles 106 top-level native events, with zero JavaScript
  events.
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

This creates `game.json` and exports a static web build to `web/`. Run
`npm run sfx` to regenerate the five deterministic procedural sound effects.
