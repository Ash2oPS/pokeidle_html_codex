const TEAM_JSON_PATHS = [
  "pokemon_data/1_bulbasaur/1_bulbasaur_data.json",
  "pokemon_data/4_charmander/4_charmander_data.json",
  "pokemon_data/7_squirtle/7_squirtle_data.json",
  "pokemon_data/25_pikachu/25_pikachu_data.json",
  "pokemon_data/39_jigglypuff/39_jigglypuff_data.json",
  "pokemon_data/52_meowth/52_meowth_data.json",
];

const ENEMY_JSON_PATHS = [
  "pokemon_data/150_mewtwo/150_mewtwo_data.json",
  "pokemon_data/149_dragonite/149_dragonite_data.json",
  "pokemon_data/130_gyarados/130_gyarados_data.json",
  "pokemon_data/65_alakazam/65_alakazam_data.json",
  "pokemon_data/143_snorlax/143_snorlax_data.json",
  "pokemon_data/94_gengar/94_gengar_data.json",
];

const MAX_TEAM_SIZE = 6;
const BASE_STEP_MS = 1000 / 60;
const ATTACK_INTERVAL_MS = 800;
const PROJECTILE_SPEED_PX_PER_SECOND = 260;
const DAMAGE_SCALE = 1.7;
const KO_RESPAWN_DELAY_MS = 1350;
const KO_FLASH_DURATION_MS = 650;
const FLOATING_TEXT_LIFETIME_MS = 950;

const SPECIAL_ATTACK_TYPES = new Set([
  "fire",
  "water",
  "grass",
  "electric",
  "ice",
  "psychic",
  "dragon",
  "dark",
]);

const TYPE_EFFECTIVENESS = {
  normal: { rock: 0.5, ghost: 0, steel: 0.5 },
  fire: {
    fire: 0.5,
    water: 0.5,
    grass: 2,
    ice: 2,
    bug: 2,
    rock: 0.5,
    dragon: 0.5,
    steel: 2,
  },
  water: { fire: 2, water: 0.5, grass: 0.5, ground: 2, rock: 2, dragon: 0.5 },
  electric: { water: 2, electric: 0.5, grass: 0.5, ground: 0, flying: 2, dragon: 0.5 },
  grass: {
    fire: 0.5,
    water: 2,
    grass: 0.5,
    poison: 0.5,
    ground: 2,
    flying: 0.5,
    bug: 0.5,
    rock: 2,
    dragon: 0.5,
    steel: 0.5,
  },
  ice: { fire: 0.5, water: 0.5, grass: 2, ground: 2, flying: 2, dragon: 2, steel: 0.5, ice: 0.5 },
  fighting: {
    normal: 2,
    ice: 2,
    poison: 0.5,
    flying: 0.5,
    psychic: 0.5,
    bug: 0.5,
    rock: 2,
    ghost: 0,
    dark: 2,
    steel: 2,
    fairy: 0.5,
  },
  poison: { grass: 2, poison: 0.5, ground: 0.5, rock: 0.5, ghost: 0.5, steel: 0, fairy: 2 },
  ground: { fire: 2, electric: 2, grass: 0.5, poison: 2, flying: 0, bug: 0.5, rock: 2, steel: 2 },
  flying: { electric: 0.5, grass: 2, fighting: 2, bug: 2, rock: 0.5, steel: 0.5 },
  psychic: { fighting: 2, poison: 2, psychic: 0.5, dark: 0, steel: 0.5 },
  bug: {
    fire: 0.5,
    grass: 2,
    fighting: 0.5,
    poison: 0.5,
    flying: 0.5,
    psychic: 2,
    ghost: 0.5,
    dark: 2,
    steel: 0.5,
    fairy: 0.5,
  },
  rock: { fire: 2, ice: 2, fighting: 0.5, ground: 0.5, flying: 2, bug: 2, steel: 0.5 },
  ghost: { normal: 0, psychic: 2, ghost: 2, dark: 0.5 },
  dragon: { dragon: 2, steel: 0.5, fairy: 0 },
  dark: { fighting: 0.5, psychic: 2, ghost: 2, dark: 0.5, fairy: 0.5 },
  steel: {
    fire: 0.5,
    water: 0.5,
    electric: 0.5,
    ice: 2,
    rock: 2,
    fairy: 2,
    steel: 0.5,
  },
  fairy: { fire: 0.5, fighting: 2, poison: 0.5, dragon: 2, dark: 2, steel: 0.5 },
};

const TYPE_COLORS = {
  normal: [210, 200, 180],
  fire: [255, 122, 64],
  water: [76, 163, 255],
  electric: [255, 214, 60],
  grass: [122, 206, 106],
  ice: [145, 239, 255],
  fighting: [222, 92, 88],
  poison: [190, 98, 230],
  ground: [218, 176, 92],
  flying: [150, 178, 255],
  psychic: [255, 120, 185],
  bug: [175, 201, 75],
  rock: [191, 166, 110],
  ghost: [145, 120, 226],
  dragon: [117, 117, 255],
  dark: [124, 108, 97],
  steel: [163, 184, 199],
  fairy: [255, 176, 219],
};

const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

const state = {
  mode: "loading",
  error: null,
  timeMs: 0,
  team: [],
  enemy: null,
  enemyRoster: [],
  battle: null,
  viewport: { width: 960, height: 540, dpr: 1 },
  layout: null,
  lastFrameTimestamp: 0,
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function calcLevel(stats, bonus = 0) {
  const hp = Number(stats?.hp || 0);
  const attack = Number(stats?.attack || 0);
  const defense = Number(stats?.defense || 0);
  const speed = Number(stats?.speed || 0);
  const specialAttack = Number(stats?.["special-attack"] || 0);
  const specialDefense = Number(stats?.["special-defense"] || 0);
  const sum = hp + attack + defense + speed + specialAttack + specialDefense;
  return clamp(Math.round(sum / 12) + bonus, 1, 100);
}

function resolveSpritePath(jsonPath, spriteRelativePath) {
  if (!spriteRelativePath) {
    return null;
  }
  const slashIndex = jsonPath.lastIndexOf("/");
  const folderPath = slashIndex >= 0 ? jsonPath.slice(0, slashIndex) : ".";
  return `${folderPath}/${spriteRelativePath}`;
}

function loadImage(imagePath) {
  if (!imagePath) {
    return Promise.resolve(null);
  }
  return new Promise((resolve) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => resolve(null);
    image.src = imagePath;
  });
}

function getDefensiveTypes(payload) {
  if (!Array.isArray(payload?.defensive_types) || payload.defensive_types.length === 0) {
    return ["normal"];
  }
  return payload.defensive_types.map((typeName) => String(typeName || "normal").toLowerCase());
}

function getTypeMultiplier(attackType, defenderTypes) {
  let multiplier = 1;
  const attackTable = TYPE_EFFECTIVENESS[String(attackType || "normal").toLowerCase()] || {};
  for (const defenderTypeRaw of defenderTypes || []) {
    const defenderType = String(defenderTypeRaw || "normal").toLowerCase();
    if (Object.prototype.hasOwnProperty.call(attackTable, defenderType)) {
      multiplier *= attackTable[defenderType];
    }
  }
  return multiplier;
}

function getAttackStat(attacker, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(attacker?.stats?.["special-attack"] || attacker?.stats?.attack || 1));
  }
  return Math.max(1, Number(attacker?.stats?.attack || attacker?.stats?.["special-attack"] || 1));
}

function getDefenseStat(defender, attackType) {
  const attackTypeNorm = String(attackType || "normal").toLowerCase();
  if (SPECIAL_ATTACK_TYPES.has(attackTypeNorm)) {
    return Math.max(1, Number(defender?.stats?.["special-defense"] || defender?.stats?.defense || 1));
  }
  return Math.max(1, Number(defender?.stats?.defense || defender?.stats?.["special-defense"] || 1));
}

function computeDamage(attacker, defender, attackType, typeMultiplier) {
  if (typeMultiplier <= 0) {
    return 0;
  }

  const level = Math.max(1, Number(attacker?.level || 1));
  const attackStat = getAttackStat(attacker, attackType);
  const defenseStat = getDefenseStat(defender, attackType);
  const levelFactor = (2 * level) / 5 + 2;
  const basePower = 70;
  const baseDamage = ((levelFactor * basePower * (attackStat / defenseStat)) / 50) + 2;

  const attackerTypes = Array.isArray(attacker?.defensiveTypes) ? attacker.defensiveTypes : [];
  const normalizedType = String(attackType || "normal").toLowerCase();
  const stab = attackerTypes.includes(normalizedType) || attacker?.offensiveType === normalizedType ? 1.25 : 1;
  const crit = Math.random() < 0.08 ? 1.5 : 1;
  const variance = 0.9 + Math.random() * 0.2;
  const total = baseDamage * stab * typeMultiplier * crit * variance * DAMAGE_SCALE;

  return Math.max(1, Math.round(total));
}

function rgba(rgb, alpha) {
  const color = Array.isArray(rgb) ? rgb : [220, 236, 255];
  return `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
}

function getTypeColor(typeName) {
  return TYPE_COLORS[String(typeName || "normal").toLowerCase()] || [220, 236, 255];
}

class PokemonBattleManager {
  constructor({ team, enemyRoster, attackIntervalMs, respawnDelayMs = KO_RESPAWN_DELAY_MS }) {
    this.team = team;
    this.enemyRoster = enemyRoster;
    this.attackIntervalMs = attackIntervalMs;
    this.enemyRespawnDelayMs = respawnDelayMs;
    this.turnIndex = 0;
    this.enemyIndex = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.lastImpact = null;
    this.enemiesDefeated = 0;
    this.attackTimerMs = attackIntervalMs;
    this.pendingRespawnMs = 0;
    this.koFlashMs = 0;
    this.defeatedEnemyName = null;
    this.enemy = this.cloneEnemyFromRoster(0);
  }

  cloneEnemyFromRoster(index) {
    if (!this.enemyRoster[index]) {
      return null;
    }
    const source = this.enemyRoster[index];
    return {
      ...source,
      hpCurrent: source.hpMax,
    };
  }

  getEnemy() {
    return this.enemy;
  }

  getProjectiles() {
    return this.projectiles;
  }

  getFloatingTexts() {
    return this.floatingTexts;
  }

  isEnemyRespawning() {
    return this.pendingRespawnMs > 0;
  }

  getKoTransition() {
    return {
      active: this.isEnemyRespawning(),
      enemy_name_fr: this.defeatedEnemyName,
      remaining_ms: Math.max(0, Math.round(this.pendingRespawnMs)),
      total_ms: this.enemyRespawnDelayMs,
      flash_ms: Math.max(0, Math.round(this.koFlashMs)),
    };
  }

  getNextAttackerName() {
    if (!this.team.length) {
      return null;
    }
    return this.team[this.turnIndex % this.team.length]?.nameFr || null;
  }

  update(deltaMs, layout) {
    this.updateFloatingTexts(deltaMs);
    this.updateKoTransition(deltaMs);

    if (!layout || !this.enemy || this.team.length === 0) {
      return;
    }
    if (this.isEnemyRespawning() || this.enemy.hpCurrent <= 0) {
      return;
    }

    this.attackTimerMs -= deltaMs;
    while (this.attackTimerMs <= 0 && this.enemy.hpCurrent > 0) {
      this.spawnNextProjectile(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    this.updateProjectiles(deltaMs, layout);
  }

  updateKoTransition(deltaMs) {
    if (this.koFlashMs > 0) {
      this.koFlashMs = Math.max(0, this.koFlashMs - deltaMs);
    }

    if (this.pendingRespawnMs <= 0) {
      return;
    }

    this.pendingRespawnMs = Math.max(0, this.pendingRespawnMs - deltaMs);
    if (this.pendingRespawnMs === 0) {
      this.spawnNextEnemy();
    }
  }

  updateFloatingTexts(deltaMs) {
    const survivors = [];
    for (const text of this.floatingTexts) {
      text.lifeMs -= deltaMs;
      if (text.lifeMs <= 0) {
        continue;
      }
      text.x += text.vx * (deltaMs / 1000);
      text.y += text.vy * (deltaMs / 1000);
      text.vy += 30 * (deltaMs / 1000);
      survivors.push(text);
    }
    this.floatingTexts = survivors;
  }

  spawnNextProjectile(layout) {
    if (!this.team.length) {
      return;
    }

    const attackerIndex = this.turnIndex % this.team.length;
    const attacker = this.team[attackerIndex];
    const slot = layout.teamMembers[attackerIndex];
    this.turnIndex = (attackerIndex + 1) % this.team.length;

    if (!attacker || !slot || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    const attackType = attacker.offensiveType || attacker.defensiveTypes[0] || "normal";
    this.projectiles.push({
      x: slot.x,
      y: slot.y - slot.size * 0.12,
      targetX: layout.centerX,
      targetY: layout.centerY - layout.enemySize * 0.16,
      speed: PROJECTILE_SPEED_PX_PER_SECOND,
      radius: clamp(slot.size * 0.11, 6, 12),
      attackType,
      attackerIndex,
      attackerNameFr: attacker.nameFr,
    });
  }

  updateProjectiles(deltaMs, layout) {
    const survivors = [];
    const frameDistance = (PROJECTILE_SPEED_PX_PER_SECOND * deltaMs) / 1000;

    for (const projectile of this.projectiles) {
      projectile.targetX = layout.centerX;
      projectile.targetY = layout.centerY - layout.enemySize * 0.16;

      const dx = projectile.targetX - projectile.x;
      const dy = projectile.targetY - projectile.y;
      const distance = Math.hypot(dx, dy);

      if (distance <= frameDistance || distance <= 0.0001) {
        this.applyHit(projectile);
        continue;
      }

      projectile.x += (dx / distance) * frameDistance;
      projectile.y += (dy / distance) * frameDistance;
      survivors.push(projectile);
    }

    this.projectiles = survivors;
  }

  addFloatingDamageText({ damage, attackType, typeMultiplier, targetX, targetY }) {
    let label = "";
    if (typeMultiplier >= 2) {
      label = "SUPER";
    } else if (typeMultiplier > 0 && typeMultiplier < 1) {
      label = "RESIST";
    } else if (typeMultiplier === 0) {
      label = "IMMUNE";
    }

    this.floatingTexts.push({
      x: targetX + (Math.random() - 0.5) * 26,
      y: targetY - 10,
      vx: (Math.random() - 0.5) * 26,
      vy: -92 - Math.random() * 24,
      lifeMs: FLOATING_TEXT_LIFETIME_MS,
      maxLifeMs: FLOATING_TEXT_LIFETIME_MS,
      damage,
      label,
      attackType,
      color: getTypeColor(attackType),
    });
  }

  applyHit(projectile) {
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    const attacker = this.team[projectile.attackerIndex];
    if (!attacker) {
      return;
    }

    const typeMultiplier = getTypeMultiplier(projectile.attackType, this.enemy.defensiveTypes);
    const damage = computeDamage(attacker, this.enemy, projectile.attackType, typeMultiplier);

    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    this.lastImpact = {
      attackerNameFr: attacker.nameFr,
      attackType: projectile.attackType,
      damage,
      typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
    };
    this.addFloatingDamageText({
      damage,
      attackType: projectile.attackType,
      typeMultiplier,
      targetX: projectile.targetX,
      targetY: projectile.targetY,
    });

    if (this.enemy.hpCurrent <= 0) {
      this.enemiesDefeated += 1;
      this.defeatedEnemyName = this.enemy.nameFr;
      this.pendingRespawnMs = this.enemyRespawnDelayMs;
      this.koFlashMs = KO_FLASH_DURATION_MS;
      this.projectiles = [];
      this.attackTimerMs = this.attackIntervalMs;
    }
  }

  spawnNextEnemy() {
    if (!this.enemyRoster.length) {
      this.enemy = null;
      return;
    }

    this.enemyIndex = (this.enemyIndex + 1) % this.enemyRoster.length;
    this.enemy = this.cloneEnemyFromRoster(this.enemyIndex);
    this.projectiles = [];
    this.pendingRespawnMs = 0;
    this.koFlashMs = 0;
    this.defeatedEnemyName = null;
    this.attackTimerMs = this.attackIntervalMs * 0.68;
  }
}

async function loadPokemonEntity(jsonPath, role, teamIndex = 0) {
  const response = await fetch(jsonPath);
  if (!response.ok) {
    throw new Error(`Impossible de charger ${jsonPath}`);
  }

  const payload = await response.json();
  const spritePath = resolveSpritePath(jsonPath, payload?.sprites?.front);
  const spriteImage = await loadImage(spritePath);
  const defensiveTypes = getDefensiveTypes(payload);
  const offensiveType = String(payload?.offensive_type || defensiveTypes[0] || "normal").toLowerCase();

  const levelBonus = role === "enemy" ? 20 + teamIndex * 2 : 6 + teamIndex * 2;
  const level = calcLevel(payload.stats, levelBonus);

  const hpBase = Number(payload?.stats?.hp || 40);
  const hpScale = role === "enemy" ? 9.2 : 6.2;
  const hpMax = clamp(Math.round(hpBase * hpScale + level * 6), 120, 2400);

  return {
    role,
    jsonPath,
    id: Number(payload.pokedex_number || 0),
    nameFr: payload.name_fr || payload.name_en || "Pokemon",
    nameEn: payload.name_en || "pokemon",
    level,
    hpMax,
    hpCurrent: hpMax,
    stats: payload.stats || {},
    defensiveTypes,
    offensiveType,
    spritePath,
    spriteImage,
  };
}

function computeLayout() {
  const width = state.viewport.width;
  const height = state.viewport.height;
  const centerX = width * 0.5;
  const centerY = height * 0.5 + 18;
  const enemySize = clamp(Math.min(width, height) * 0.25, 130, 210);

  const teamCount = state.team.length;
  const radiusX = clamp(Math.min(width, height) * 0.39, 170, 360);
  const radiusY = radiusX * 0.66;
  const teamMembers = [];

  for (let i = 0; i < teamCount; i += 1) {
    const angle = -Math.PI / 2 + (Math.PI * 2 * i) / Math.max(teamCount, 1);
    const bob = Math.sin(state.timeMs * 0.003 + i * 1.45) * 4;
    const x = centerX + Math.cos(angle) * radiusX;
    const y = centerY + Math.sin(angle) * radiusY + bob;
    const size = clamp(enemySize * 0.55, 70, 120);
    teamMembers.push({ x, y, size });
  }

  return {
    centerX,
    centerY,
    enemySize,
    hpBarWidth: clamp(enemySize * 2.3, 240, 420),
    hpBarHeight: clamp(enemySize * 0.12, 20, 32),
    hpBarY: clamp(height * 0.11, 34, 120),
    teamMembers,
  };
}

function drawPokemonSprite(entity, x, y, size, options = {}) {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = Number.isFinite(options.alpha) ? options.alpha : 1;

  ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
  ctx.beginPath();
  ctx.ellipse(0, size * 0.52, size * 0.34, size * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  if (entity.spriteImage) {
    const ratio = entity.spriteImage.width / Math.max(entity.spriteImage.height, 1);
    let drawWidth = size;
    let drawHeight = size;
    if (ratio > 1) {
      drawHeight = size / ratio;
    } else {
      drawWidth = size * ratio;
    }
    ctx.drawImage(entity.spriteImage, -drawWidth * 0.5, -drawHeight * 0.45, drawWidth, drawHeight);
  } else {
    ctx.fillStyle = "rgba(180, 198, 232, 0.36)";
    ctx.strokeStyle = "rgba(226, 238, 255, 0.6)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f7fbff";
    ctx.font = `bold ${Math.round(size * 0.28)}px Trebuchet MS`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(entity.nameFr.slice(0, 1), 0, 0);
  }

  ctx.restore();
}

function drawNameAndLevel(entity, x, y, enemy = false) {
  ctx.save();
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#f7fbff";
  ctx.font = enemy ? "700 28px Trebuchet MS" : "700 18px Trebuchet MS";
  ctx.fillText(entity.nameFr, x, y);

  ctx.shadowBlur = 0;
  ctx.fillStyle = "#bdd0ee";
  ctx.font = enemy ? "700 18px Trebuchet MS" : "700 15px Trebuchet MS";
  ctx.fillText(`Niv. ${entity.level}`, x, y + (enemy ? 24 : 20));
  ctx.restore();
}

function drawEnemyHpBar(enemy, centerX, centerY, width, height) {
  const ratio = enemy.hpMax > 0 ? clamp(enemy.hpCurrent / enemy.hpMax, 0, 1) : 0;
  const x = centerX - width * 0.5;
  const y = centerY;
  const radius = height * 0.36;

  ctx.save();
  ctx.fillStyle = "rgba(6, 16, 31, 0.78)";
  ctx.fillRect(x - 10, y - 8, width + 20, height + 16);

  ctx.fillStyle = "#3a1215";
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.fill();

  ctx.fillStyle = "#39cf72";
  ctx.beginPath();
  ctx.roundRect(x, y, width * ratio, height, radius);
  ctx.fill();

  ctx.strokeStyle = "rgba(248, 253, 255, 0.34)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, radius);
  ctx.stroke();

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = "#f7fbff";
  ctx.font = "700 13px Trebuchet MS";
  ctx.fillText(`${enemy.hpCurrent} / ${enemy.hpMax}`, x + width * 0.5, y + height * 0.54);
  ctx.restore();
}

function drawProjectiles(projectiles) {
  for (const projectile of projectiles || []) {
    const rgb = getTypeColor(projectile.attackType);
    const radius = projectile.radius || 8;

    ctx.save();
    const aura = ctx.createRadialGradient(
      projectile.x,
      projectile.y,
      Math.max(1, radius * 0.2),
      projectile.x,
      projectile.y,
      radius * 2.6,
    );
    aura.addColorStop(0, rgba(rgb, 0.98));
    aura.addColorStop(0.45, rgba(rgb, 0.58));
    aura.addColorStop(1, rgba(rgb, 0));

    ctx.fillStyle = aura;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius * 2.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgba(rgb, 0.95);
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(255, 255, 255, 0.8)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(projectile.x, projectile.y, radius * 0.72, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function drawFloatingDamageTexts(floatingTexts) {
  for (const text of floatingTexts || []) {
    const lifeRatio = clamp(text.lifeMs / Math.max(1, text.maxLifeMs), 0, 1);
    const alpha = lifeRatio;
    const rgb = Array.isArray(text.color) ? text.color : [220, 236, 255];

    ctx.save();
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.globalAlpha = alpha;
    ctx.lineJoin = "round";

    ctx.font = "700 24px Trebuchet MS";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(8, 15, 28, 0.9)";
    ctx.strokeText(`-${text.damage}`, text.x, text.y);
    ctx.fillStyle = rgba(rgb, 0.98);
    ctx.fillText(`-${text.damage}`, text.x, text.y);

    if (text.label) {
      ctx.font = "700 12px Trebuchet MS";
      ctx.lineWidth = 3;
      ctx.strokeText(text.label, text.x, text.y - 19);
      ctx.fillStyle = "#f5fbff";
      ctx.fillText(text.label, text.x, text.y - 19);
    }

    ctx.restore();
  }
}

function drawEnemyKoEffect(layout, koTransition) {
  if (!koTransition?.active) {
    return;
  }

  const progress = 1 - koTransition.remaining_ms / Math.max(1, koTransition.total_ms);
  const pulse = 0.55 + 0.45 * Math.sin(state.timeMs * 0.03);
  const radius = layout.enemySize * (0.45 + progress * 1.1 + pulse * 0.1);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  const burst = ctx.createRadialGradient(
    layout.centerX,
    layout.centerY,
    layout.enemySize * 0.12,
    layout.centerX,
    layout.centerY,
    radius * 1.9,
  );
  burst.addColorStop(0, "rgba(255, 247, 206, 0.65)");
  burst.addColorStop(0.45, "rgba(255, 150, 120, 0.35)");
  burst.addColorStop(1, "rgba(255, 120, 120, 0)");
  ctx.fillStyle = burst;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, radius * 1.9, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 248, 225, ${0.55 * (1 - progress) + 0.2})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(layout.centerX, layout.centerY, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.restore();
}

function formatEffectiveness(multiplier) {
  if (multiplier >= 2) {
    return "Super efficace";
  }
  if (multiplier > 0 && multiplier < 1) {
    return "Peu efficace";
  }
  if (multiplier === 0) {
    return "Sans effet";
  }
  return "";
}

function drawBattleInfo(layout) {
  if (!state.battle) {
    return;
  }

  const nextAttacker = state.battle.getNextAttackerName();
  const impact = state.battle.lastImpact;
  const koTransition = state.battle.getKoTransition();
  const baseY = state.viewport.height - 118;

  ctx.save();
  ctx.fillStyle = "rgba(6, 17, 32, 0.72)";
  ctx.fillRect(20, baseY, 510, 98);

  ctx.fillStyle = "#f7fbff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.font = "700 15px Trebuchet MS";
  ctx.fillText(`Prochain attaquant: ${nextAttacker || "-"}`, 34, baseY + 28);

  ctx.fillStyle = "#bdd0ee";
  ctx.font = "700 14px Trebuchet MS";
  ctx.fillText(`Ennemis vaincus: ${state.battle.enemiesDefeated}`, 34, baseY + 52);

  if (impact) {
    const label = formatEffectiveness(impact.typeMultiplier);
    const detail = `${impact.attackerNameFr} -> ${impact.enemyNameFr} : -${impact.damage} (${impact.attackType})`;
    ctx.fillStyle = "#d8e8ff";
    ctx.font = "700 13px Trebuchet MS";
    ctx.fillText(detail, 34, baseY + 76);

    if (label) {
      ctx.fillStyle = "#9dd9ff";
      ctx.fillText(label, layout.centerX + layout.enemySize * 0.65, layout.centerY - layout.enemySize * 0.85);
    }
  }

  if (koTransition.active) {
    const waitSeconds = (koTransition.remaining_ms / 1000).toFixed(1);
    ctx.fillStyle = "#ffd4b5";
    ctx.font = "700 13px Trebuchet MS";
    ctx.fillText(`KO de ${koTransition.enemy_name_fr || "l'ennemi"} -> prochain spawn dans ${waitSeconds}s`, 34, baseY + 96);
  }
  ctx.restore();
}

function drawBackground(width, height) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#11253f");
  gradient.addColorStop(1, "#080f1e");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.translate(width * 0.5, height * 0.5 + 18);
  for (let i = 0; i < 3; i += 1) {
    ctx.strokeStyle = `rgba(154, 184, 236, ${0.19 - i * 0.05})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 180 + i * 95, 90 + i * 46, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLoadingOrError(text) {
  const { width, height } = state.viewport;
  drawBackground(width, height);
  ctx.fillStyle = "#f7fbff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = "700 30px Trebuchet MS";
  ctx.fillText(text, width * 0.5, height * 0.48);
}

function render() {
  const { width, height } = state.viewport;
  ctx.clearRect(0, 0, width, height);

  if (state.mode === "loading") {
    drawLoadingOrError("Chargement de l'arene...");
    return;
  }
  if (state.mode === "error") {
    drawLoadingOrError(state.error || "Erreur de chargement");
    return;
  }

  const layout = state.layout || computeLayout();
  state.layout = layout;
  const koTransition = state.battle ? state.battle.getKoTransition() : null;

  drawBackground(width, height);
  drawProjectiles(state.battle ? state.battle.getProjectiles() : []);
  drawEnemyKoEffect(layout, koTransition);

  if (state.enemy) {
    const enemyAlpha = koTransition?.active ? 0.45 + 0.55 * Math.abs(Math.sin(state.timeMs * 0.035)) : 1;
    drawEnemyHpBar(
      state.enemy,
      layout.centerX,
      layout.hpBarY,
      layout.hpBarWidth,
      layout.hpBarHeight,
    );
    drawPokemonSprite(state.enemy, layout.centerX, layout.centerY, layout.enemySize, { alpha: enemyAlpha });
    drawNameAndLevel(state.enemy, layout.centerX, layout.centerY + layout.enemySize * 0.58, true);
  }

  for (let i = 0; i < state.team.length; i += 1) {
    const member = state.team[i];
    const slot = layout.teamMembers[i];
    if (!slot) {
      continue;
    }
    drawPokemonSprite(member, slot.x, slot.y, slot.size);
    drawNameAndLevel(member, slot.x, slot.y + slot.size * 0.62, false);
  }

  drawFloatingDamageTexts(state.battle ? state.battle.getFloatingTexts() : []);
  drawBattleInfo(layout);
}

function update(deltaMs) {
  state.timeMs += deltaMs;
  const layout = computeLayout();
  state.layout = layout;

  if (state.battle) {
    state.battle.update(deltaMs, layout);
    state.enemy = state.battle.getEnemy();
  }
}

function gameLoop(timestamp) {
  if (!state.lastFrameTimestamp) {
    state.lastFrameTimestamp = timestamp;
  }
  const deltaMs = Math.min(40, timestamp - state.lastFrameTimestamp);
  state.lastFrameTimestamp = timestamp;
  update(deltaMs);
  render();
  window.requestAnimationFrame(gameLoop);
}

function resizeCanvas() {
  const maxWidth = 1200;
  const maxHeight = 760;
  const width = clamp(window.innerWidth - 32, 320, maxWidth);
  const height = clamp(window.innerHeight - 32, 280, maxHeight);
  const dpr = Math.max(1, window.devicePixelRatio || 1);

  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  state.viewport = { width, height, dpr };
  state.layout = computeLayout();
  render();
}

function exportTextState() {
  const layout = state.layout || computeLayout();
  const battle = state.battle;

  const enemy = state.enemy
    ? {
        name_fr: state.enemy.nameFr,
        level: state.enemy.level,
        hp_current: state.enemy.hpCurrent,
        hp_max: state.enemy.hpMax,
        defensive_types: state.enemy.defensiveTypes,
        x: Math.round(layout.centerX),
        y: Math.round(layout.centerY),
      }
    : null;

  const team = state.team.map((member, index) => {
    const slot = layout.teamMembers[index];
    return {
      name_fr: member.nameFr,
      level: member.level,
      offensive_type: member.offensiveType,
      x: slot ? Math.round(slot.x) : null,
      y: slot ? Math.round(slot.y) : null,
    };
  });

  const payload = {
    mode: state.mode,
    coordinate_system: {
      origin: "top-left",
      x_axis: "right-positive",
      y_axis: "down-positive",
    },
    viewport: {
      width: Math.round(state.viewport.width),
      height: Math.round(state.viewport.height),
    },
    attack_interval_ms: ATTACK_INTERVAL_MS,
    next_attacker: battle ? battle.getNextAttackerName() : null,
    enemies_defeated: battle ? battle.enemiesDefeated : 0,
    active_projectiles: (battle ? battle.getProjectiles() : []).map((projectile) => ({
      type: projectile.attackType,
      x: Math.round(projectile.x),
      y: Math.round(projectile.y),
      attacker_name_fr: projectile.attackerNameFr,
    })),
    floating_damage_texts: (battle ? battle.getFloatingTexts() : []).map((text) => ({
      damage: text.damage,
      label: text.label || "",
      x: Math.round(text.x),
      y: Math.round(text.y),
      life_ms: Math.round(text.lifeMs),
    })),
    last_impact: battle ? battle.lastImpact : null,
    ko_transition: battle ? battle.getKoTransition() : null,
    enemy,
    team,
  };

  return JSON.stringify(payload);
}

window.render_game_to_text = exportTextState;
window.advanceTime = (ms) => {
  const totalMs = Number.isFinite(ms) ? Math.max(0, Number(ms)) : 0;
  const steps = Math.max(1, Math.round(totalMs / BASE_STEP_MS));
  const stepMs = steps > 0 ? totalMs / steps : BASE_STEP_MS;
  for (let i = 0; i < steps; i += 1) {
    update(stepMs || BASE_STEP_MS);
  }
  render();
};

async function initializeScene() {
  try {
    const teamPaths = TEAM_JSON_PATHS.slice(0, MAX_TEAM_SIZE);
    const [team, enemyRoster] = await Promise.all([
      Promise.all(teamPaths.map((path, idx) => loadPokemonEntity(path, "team", idx))),
      Promise.all(ENEMY_JSON_PATHS.map((path, idx) => loadPokemonEntity(path, "enemy", idx))),
    ]);

    if (!enemyRoster.length) {
      throw new Error("Aucun Pokemon ennemi disponible");
    }

    state.team = team;
    state.enemyRoster = enemyRoster;
    state.battle = new PokemonBattleManager({
      team,
      enemyRoster,
      attackIntervalMs: ATTACK_INTERVAL_MS,
    });
    state.enemy = state.battle.getEnemy();
    state.mode = "ready";
  } catch (error) {
    state.mode = "error";
    state.error = error instanceof Error ? error.message : "Erreur inconnue";
  }
  state.layout = computeLayout();
  render();
}

async function toggleFullscreen() {
  if (!document.fullscreenElement) {
    await canvas.requestFullscreen();
    return;
  }
  await document.exitFullscreen();
}

document.addEventListener("keydown", (event) => {
  if (event.key.toLowerCase() === "f") {
    event.preventDefault();
    toggleFullscreen().catch(() => {});
  }
});

window.addEventListener("resize", resizeCanvas);
document.addEventListener("fullscreenchange", resizeCanvas);

resizeCanvas();
initializeScene();
window.requestAnimationFrame(gameLoop);
