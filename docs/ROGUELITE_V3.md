# Shadow Paws complete roguelite specification

This document is the acceptance contract for the complete native GDevelop
edition. It describes game behavior, not a port of any one reference project.

## Run loop

1. Load persistent Echoes and show the title.
2. Choose one of three weapons: Twin Claws, Moonblade, or Rift Staff.
3. Clear five generated encounter rooms. Each room chooses one of three visual
   biomes and one of three encounter archetypes.
4. After every encounter, choose one of three blessings and then choose a safe
   route or an Abyss route.
5. Safe routes heal the player. Abyss routes increase enemy health, damage,
   density, and currency rewards for the remainder of the run, and roll a
   stackable gear affix.
6. Defeat the Rift Warden, bank the run's Echoes, and start another generated
   route. Defeat also banks a smaller share of earned Echoes.

## Build system

- Weapons change the primary attack, heavy/spell action, base damage, attack
  cadence, and projectile behavior.
- Blessings belong to Feral, Moon, or Rift families. Family ranks activate
  two-piece and four-piece synergies.
- Runes add native on-hit effects: burn, frost/stagger, critical strikes,
  projectile piercing, spell scaling, and life-on-kill.
- Six Abyss gear affixes add weapon damage, life-on-kill, attack speed, maximum
  health, spell/burn power, or piercing/critical chance. Repeated Abyss choices
  increase the displayed gear tier and stack the rolled effect.
- The HUD always exposes weapon, family ranks, risk, room depth, health,
  currency, and current damage.

## Native GDevelop constraints

- `game.json` is generated through the public MCP tools.
- Runtime gameplay uses only editable GDevelop objects, behaviors, variables,
  conditions, actions, comments, and event groups.
- The final project contains zero `BuiltinCommonInstructions::JsCode` events,
  including nested events.
- Structured global variables contain the weapon, blessing, affix, room,
  biome, and progression content tables.
- Object groups collect enemies, player attacks, hostile attacks, and platforms.
- Initial platform instances carry structured room/material metadata.

## Verification gates

- MCP protocol and real libGD authoring/export tests pass.
- The project verifier proves the complete content tables, six-room route,
  three weapons, twelve blessings, family synergies, risk path, storage
  actions, object groups, Spine hero, and zero JavaScript events.
- The generated browser build starts without console errors and a scripted
  smoke path covers title, weapon choice, combat, blessing choice, route
  choice, room transition, boss phase two, defeat/victory, and restart.
- The deployed URL serves the same commit that is merged to `main`.
