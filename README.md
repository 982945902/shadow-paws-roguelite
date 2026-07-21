# Shadow Paws: Echoes of the Rift

A native GDevelop side-scrolling action roguelite authored through the
GDevelop MCP server. Every gameplay system remains editable as GDevelop
objects, behaviors, variables, conditions, actions, and event groups. The
project contains zero JavaScript events.

Play the production build: https://shadow-paws-roguelite.vercel.app

## Controls

- `A` / `D`: move
- `Space`: jump
- `J`: primary weapon attack
- `K`: weapon spell / heavy attack
- `Shift`: invulnerable dash
- `1` / `2` / `3`: choose a weapon or blessing
- `1` / `2`: choose a safe or Abyss route
- `R`: restart after defeat or victory

## Complete run

- Five generated encounter rooms followed by the Rift Warden boss. Each room
  rolls a biome, encounter archetype, enemy mix, and reward pressure.
- Three weapons with distinct native event logic: Twin Claws, Moonblade, and
  Rift Staff. Primary and spell/heavy actions change per weapon.
- Twelve blessings across the Feral, Moon, and Rift families. Two-piece and
  four-piece family synergies create focused builds.
- Safe routes heal. Abyss routes add risk, elite density, reward scaling, and
  one of six stackable gear affixes.
- Burn, frost/stagger, critical strikes, projectile piercing, spell scaling,
  life-on-kill, hit-stop, knockback, camera shake, and layered hit audio.
- Persistent Echoes, best depth, and run count are loaded at startup and banked
  on victory or defeat.
- Three visual biomes: Shattered Forest, Moon-Eclipse Bridge, and Heart of the
  Rift, with six hand-authored platform layouts and randomized presentation.
- A native Spine cutout rig with 15 bones, 13 painted attachments, and nine
  authored animations for idle, run, jump, combo, heavy, dash, and hurt poses.
- Rift Hounds, flying Moth shooters, elite variants, hostile projectiles,
  pickups, and a two-phase Rift Warden with ground shockwaves.

## Native architecture

- `Player`, `Hound`, and `Boss` use GDevelop's Platformer character behavior.
- `Ground` uses the native Platform behavior.
- Structured global variables hold the three weapons, twelve blessings, six
  gear affixes, three room archetypes, and three biomes.
- Scene variables hold the state machine, generated route, encounter director,
  risk, family ranks, equipment, camera shake, and persistent run statistics.
- Object variables hold health, damage, combo state, facing, dash state, and
  build modifiers.
- Nine collapsible event groups contain 207 native events, with zero JavaScript
  events, including nested events.
- Native object groups collect enemies, player attacks, hostile attacks, and
  platforms. Room instances carry structured editable metadata.
- The authored 960×540 view is pillarboxed on wider displays so HUD overlays,
  room boundaries, and title backgrounds never expose adjacent scenes.
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
`npm run sfx` to regenerate the seven deterministic procedural sound effects.
`npm run rig:build` rebuilds the Spine skeleton data from the checked-in
transparent attachments. `tools/split-rig-atlas.py` can re-cut the source atlas
when Pillow is available.

## Verify

```sh
npm run verify:native
```

The verifier walks nested event groups and asserts the content tables, room
metadata, object groups, storage actions, Spine rig, complete run systems, and
zero JavaScript events. Browser smoke builds are generated with
`GDEVELOP_GAME_TEST_MODE=1` and never enter the production export.
