export const weapons = [
  {
    id: 1,
    key: "claws",
    name: "TWIN CLAWS",
    summary: "fast three-hit combo · close-range execution",
    damage: 30,
    attackCooldown: 0.22,
    heavyCooldown: 0.92,
    spellDamage: 16,
    projectileSpeed: 0,
  },
  {
    id: 2,
    key: "moonblade",
    name: "MOONBLADE",
    summary: "wide deliberate cuts · crushing moon wave",
    damage: 40,
    attackCooldown: 0.34,
    heavyCooldown: 1.18,
    spellDamage: 30,
    projectileSpeed: 430,
  },
  {
    id: 3,
    key: "staff",
    name: "RIFT STAFF",
    summary: "ranged bolts · rune-scaled spell pressure",
    damage: 22,
    attackCooldown: 0.28,
    heavyCooldown: 0.86,
    spellDamage: 42,
    projectileSpeed: 610,
  },
];

export const blessings = [
  { id: 1, family: "Feral", name: "FERAL EDGE", summary: "+8 weapon damage" },
  { id: 2, family: "Feral", name: "NINE LIVES", summary: "+24 max health and heal" },
  { id: 3, family: "Feral", name: "HUNTER'S FEAST", summary: "heal on every kill" },
  { id: 4, family: "Feral", name: "RAVENOUS MARK", summary: "burning attacks and execute power" },
  { id: 5, family: "Moon", name: "QUICKSILVER", summary: "faster primary attacks" },
  { id: 6, family: "Moon", name: "WIND-STEP", summary: "movement speed and shorter dash" },
  { id: 7, family: "Moon", name: "PALE FANG", summary: "+12% critical chance" },
  { id: 8, family: "Moon", name: "FROST RUNE", summary: "hits stagger enemies" },
  { id: 9, family: "Rift", name: "ECHO RUNE", summary: "+14 spell damage" },
  { id: 10, family: "Rift", name: "CHAIN RUNE", summary: "projectiles pierce one more target" },
  { id: 11, family: "Rift", name: "VOID HEART", summary: "damage rises with route risk" },
  { id: 12, family: "Rift", name: "EMBER RUNE", summary: "attacks inflict stronger burn" },
];

export const affixes = [
  { id: 1, name: "SERRATED", summary: "+10 weapon damage" },
  { id: 2, name: "VAMPIRIC", summary: "+3 health restored on kill" },
  { id: 3, name: "QUICKSILVER", summary: "faster primary attacks" },
  { id: 4, name: "WARDED", summary: "+20 maximum health and heal" },
  { id: 5, name: "VOLATILE", summary: "stronger spells and burning hits" },
  { id: 6, name: "PIERCING", summary: "projectiles pierce and critical chance rises" },
];

export const roomArchetypes = [
  { id: 1, name: "HUNT", summary: "mixed hounds and moths", reward: 1 },
  { id: 2, name: "SWARM", summary: "dense ranged pressure", reward: 2 },
  { id: 3, name: "ELITE", summary: "empowered hunters", reward: 3 },
];

export const biomes = [
  { id: 1, name: "SHATTERED FOREST" },
  { id: 2, name: "MOON-ECLIPSE BRIDGE" },
  { id: 3, name: "HEART OF THE RIFT" },
];

export const contentTables = {
  Weapons: weapons.map((weapon) => ({
    Id: weapon.id,
    Key: weapon.key,
    Name: weapon.name,
    Summary: weapon.summary,
    Damage: weapon.damage,
    AttackCooldown: weapon.attackCooldown,
    HeavyCooldown: weapon.heavyCooldown,
    SpellDamage: weapon.spellDamage,
    ProjectileSpeed: weapon.projectileSpeed,
  })),
  Blessings: blessings.map(({ id, family, name, summary }) => ({
    Id: id,
    Family: family,
    Name: name,
    Summary: summary,
  })),
  Affixes: affixes.map(({ id, name, summary }) => ({
    Id: id,
    Name: name,
    Summary: summary,
  })),
  Rooms: roomArchetypes.map(({ id, name, summary, reward }) => ({
    Id: id,
    Name: name,
    Summary: summary,
    Reward: reward,
  })),
  Biomes: biomes.map(({ id, name }) => ({ Id: id, Name: name })),
};
