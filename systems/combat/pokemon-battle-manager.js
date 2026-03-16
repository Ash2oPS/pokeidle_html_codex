function fallbackClamp(value, min, max) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return min;
  }
  return Math.min(max, Math.max(min, numeric));
}

function fallbackToSafeInt(value, fallback = 0) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) {
    return fallback;
  }
  return Math.floor(numeric);
}

function fallbackRandomInt(min, max) {
  const lower = Math.floor(Number(min) || 0);
  const upper = Math.floor(Number(max) || 0);
  if (upper <= lower) {
    return lower;
  }
  return lower + Math.floor(Math.random() * (upper - lower + 1));
}

function fallbackRandomRange(min, max) {
  const lower = Number(min) || 0;
  const upper = Number(max) || 0;
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return 0;
  }
  if (upper <= lower) {
    return lower;
  }
  return lower + Math.random() * (upper - lower);
}

function fallbackEaseInOutSine(t) {
  const value = Number(t) || 0;
  return -(Math.cos(Math.PI * value) - 1) / 2;
}

function fallbackRgba(rgb, alpha = 1) {
  const source = Array.isArray(rgb) ? rgb : [255, 255, 255];
  const r = Math.max(0, Math.min(255, Number(source[0]) || 0));
  const g = Math.max(0, Math.min(255, Number(source[1]) || 0));
  const b = Math.max(0, Math.min(255, Number(source[2]) || 0));
  const a = Math.max(0, Math.min(1, Number(alpha) || 0));
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

const FALLBACK_TWEEN_EASING = {
  Linear: {
    None: (value) => Number(value) || 0,
  },
  Cubic: {
    Out: (value) => {
      const t = Number(value) || 0;
      return 1 - Math.pow(1 - t, 3);
    },
  },
};

export function createPokemonBattleRuntime(deps = {}) {
  const {
    state,
    clamp = fallbackClamp,
    toSafeInt = fallbackToSafeInt,
    Tween,
    Easing = FALLBACK_TWEEN_EASING,
    tweenGroup = null,
    normalizeType = (typeName) => String(typeName || '').toLowerCase(),
    getTypeColor = () => [255, 255, 255],
    rgba = fallbackRgba,
    normalizeTalentId = (talentId) => String(talentId || ''),
    getPassiveBehaviorIdForTalentId = () => '',
    resolveCombatTurnDecision = () => ({
      action: 'attack',
      reason: 'default',
      passiveBehaviorId: '',
      talentId: '',
    }),
    applyTeamTalentOverrides = () => {},
    getEntityOffensiveType = () => 'normal',
    getEntityTalentId = () => '',
    getTypeMultiplier = () => 1,
    getTalentCritBonusChance = () => 0,
    getTalentTeleportSwapChance = () => 0,
    isTeleportPlusPlusTalent = () => false,
    getStackedTeamAuraAttackBonus = () => 0,
    hasAlwaysHitTalent = () => false,
    computeDamage = () => ({ damage: 0, isCritical: false }),
    randomInt = fallbackRandomInt,
    randomRange = fallbackRandomRange,
    easeInOutSine = fallbackEaseInOutSine,
    stopTweenIfRunning = () => {},
    createFloatingTextVisualTween = () => null,
    stopFloatingTextVisualTween = () => {},
    createProjectileTravelTween = () => null,
    stopProjectileTravelTween = () => {},
    blendRgb = (left) => left,
    getFloatingTextTonePalette = () => ({
      main: [255, 255, 255],
      secondary: [214, 226, 243],
      alpha: 1,
      fill: [255, 255, 255],
      stroke: [0, 0, 0],
      glow: [255, 255, 255],
    }),
    getFloatingTextToneVisualStyle = () => ({
      spawnJitterX: 6,
      spawnLiftY: 28,
      verticalRiseSpeed: 52,
      verticalRiseVariance: 18,
      pulseStrength: 0.18,
    }),
    resolveFloatingDamageTone = () => 'normal',
    buildFloatingDamageLabels = () => ({
      primary: '0',
      secondary: '',
    }),
    shouldRenderCelebrationParticles = () => false,
    normalizeBallTypeForVisual = (ballType) => String(ballType || 'poke_ball'),
    getBallRenderTheme = () => ({
      shellTop: [255, 255, 255],
      shellBottom: [220, 220, 220],
      shellOutline: [64, 64, 64],
      centerTop: [255, 255, 255],
      centerBottom: [220, 220, 220],
      centerOutline: [64, 64, 64],
      buttonOuter: [255, 255, 255],
      buttonInner: [220, 220, 220],
      buttonOutline: [64, 64, 64],
      accent: [255, 255, 255],
    }),
    createProjectileTrailPoint = (point) => point,
    getProjectileTrailMaxPoints = () => 10,
    getProjectileTrailTypeVfxProfile = () => null,
    computeLayout = () => null,
    ATTACK_INTERVAL_MS = 1000,
    ATTACK_MISS_CHANCE = 0,
    TURN_ACTION_ATTACK = 'attack',
    TURN_ACTION_SKIP = 'skip',
    TALENT_NONE_ID = 'NONE',
    TALENT_MIND_CONTROL_ID = 'MIND_CONTROL',
    TALENT_ORIGIN_MIMICRY_ID = 'ORIGIN_MIMICRY',
    TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER = 1,
    MAX_TEAM_SIZE = 6,
    KO_RESPAWN_DELAY_MS = 350,
    KO_ANIMATION_DURATION_MS = 420,
    ATTACK_FLASH_DURATION_MS = 150,
    ATTACK_FLASH_WHITE_BLEND = 0,
    SKIP_TURN_EFFECT_DURATION_MIN_MS = 250,
    SKIP_TURN_EFFECT_DURATION_MAX_MS = 900,
    SKIP_TURN_EFFECT_FADE_RATIO = 0.5,
    SKIP_TURN_EFFECT_GRAYSCALE_MAX = 0.7,
    ATTACK_CHARGE_MIN_WINDOW_MS = 100,
    ATTACK_CHARGE_WINDOW_RATIO = 0.25,
    TELEPORT_SWAP_SCALE_DURATION_MS = 200,
    ENEMY_DAMAGE_FLASH_DURATION_MS = 180,
    ENEMY_DAMAGE_FLASH_RED_BLEND = 0.5,
    FLOATING_TEXT_LIFETIME_MS = 1200,
    PROJECTILE_SPEED_PX_PER_SECOND = 1200,
    PROJECTILE_TWEEN_DURATION_MIN_MS = 60,
    PROJECTILE_TWEEN_DURATION_MAX_MS = 260,
    PROJECTILE_TWEEN_ARC_BASE_PX = 10,
    PROJECTILE_TWEEN_ARC_RANDOM_PX = 30,
    PROJECTILE_TRAIL_POINT_MIN_SPACING_PX = 5,
    PROJECTILE_TRAIL_POINT_BASE_SPACING_PX = 16,
    PROJECTILE_TRAIL_POINT_MAX_SPACING_PX = 28,
    PROJECTILE_SPRITE_PX = 64,
    CAPTURE_THROW_MS = 260,
    CAPTURE_SHAKE_MS = 340,
    CAPTURE_POST_MS = 220,
    CAPTURE_SUCCESS_BURST_MS = 260,
    CAPTURE_FAIL_BREAK_MS = 200,
    CAPTURE_FAIL_REAPPEAR_MS = 140,
    ENEMY_TIMER_STYLE_ROUTE = 'route',
    ENEMY_TIMER_STYLE_ONLY_ONE = 'only_one',
    ROUTE_DEFEAT_TIMER_MS = 20000,
  } = deps;

  const projectileSpriteCache = new Map();

function drawProjectileGlyph(spriteCtx, typeName, size) {
  const mid = size * 0.5;
  const outer = size * 0.34;

  spriteCtx.save();
  spriteCtx.translate(mid, mid);
  spriteCtx.fillStyle = "rgba(255, 255, 255, 0.97)";
  spriteCtx.strokeStyle = "rgba(6, 11, 24, 0.35)";
  spriteCtx.lineWidth = Math.max(1.2, size * 0.03);

  switch (typeName) {
    case "fire": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer);
      spriteCtx.bezierCurveTo(outer * 0.6, -outer * 0.22, outer * 0.56, outer * 0.4, 0, outer * 0.86);
      spriteCtx.bezierCurveTo(-outer * 0.6, outer * 0.4, -outer * 0.62, -outer * 0.22, 0, -outer);
      spriteCtx.fill();
      break;
    }
    case "water": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer);
      spriteCtx.quadraticCurveTo(outer * 0.88, -outer * 0.1, outer * 0.34, outer * 0.58);
      spriteCtx.quadraticCurveTo(0, outer * 0.92, -outer * 0.34, outer * 0.58);
      spriteCtx.quadraticCurveTo(-outer * 0.88, -outer * 0.1, 0, -outer);
      spriteCtx.fill();
      break;
    }
    case "grass": {
      spriteCtx.beginPath();
      spriteCtx.ellipse(0, 0, outer * 0.86, outer * 0.56, -0.68, 0, Math.PI * 2);
      spriteCtx.fill();
      spriteCtx.strokeStyle = "rgba(6, 11, 24, 0.26)";
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.56, outer * 0.36);
      spriteCtx.lineTo(outer * 0.52, -outer * 0.32);
      spriteCtx.stroke();
      break;
    }
    case "electric": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.28, -outer * 0.82);
      spriteCtx.lineTo(outer * 0.1, -outer * 0.14);
      spriteCtx.lineTo(-outer * 0.06, -outer * 0.14);
      spriteCtx.lineTo(outer * 0.29, outer * 0.84);
      spriteCtx.lineTo(-outer * 0.12, outer * 0.14);
      spriteCtx.lineTo(outer * 0.08, outer * 0.14);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "ice": {
      spriteCtx.strokeStyle = "rgba(255, 255, 255, 0.95)";
      spriteCtx.lineWidth = Math.max(1.8, size * 0.045);
      for (let i = 0; i < 3; i += 1) {
        const angle = (Math.PI / 3) * i;
        const dx = Math.cos(angle) * outer * 0.84;
        const dy = Math.sin(angle) * outer * 0.84;
        spriteCtx.beginPath();
        spriteCtx.moveTo(-dx, -dy);
        spriteCtx.lineTo(dx, dy);
        spriteCtx.stroke();
      }
      break;
    }
    case "psychic": {
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.82, 0, Math.PI * 2);
      spriteCtx.stroke();
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.38, 0, Math.PI * 2);
      spriteCtx.fill();
      break;
    }
    case "dragon": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.86);
      for (let i = 1; i < 8; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 8;
        const r = i % 2 === 0 ? outer * 0.85 : outer * 0.38;
        spriteCtx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "dark": {
      spriteCtx.beginPath();
      spriteCtx.arc(-outer * 0.12, 0, outer * 0.78, -Math.PI * 0.86, Math.PI * 0.86);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "destination-out";
      spriteCtx.beginPath();
      spriteCtx.arc(outer * 0.28, -outer * 0.06, outer * 0.72, -Math.PI * 0.95, Math.PI * 0.95);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "source-over";
      break;
    }
    case "fighting": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.88);
      spriteCtx.lineTo(outer * 0.28, -outer * 0.2);
      spriteCtx.lineTo(outer * 0.88, 0);
      spriteCtx.lineTo(outer * 0.28, outer * 0.2);
      spriteCtx.lineTo(0, outer * 0.88);
      spriteCtx.lineTo(-outer * 0.28, outer * 0.2);
      spriteCtx.lineTo(-outer * 0.88, 0);
      spriteCtx.lineTo(-outer * 0.28, -outer * 0.2);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "poison": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.9);
      spriteCtx.lineTo(outer * 0.82, 0);
      spriteCtx.lineTo(0, outer * 0.9);
      spriteCtx.lineTo(-outer * 0.82, 0);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "ground":
    case "rock": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.9, outer * 0.22);
      spriteCtx.lineTo(-outer * 0.4, -outer * 0.8);
      spriteCtx.lineTo(outer * 0.2, -outer * 0.62);
      spriteCtx.lineTo(outer * 0.84, -outer * 0.08);
      spriteCtx.lineTo(outer * 0.32, outer * 0.84);
      spriteCtx.lineTo(-outer * 0.62, outer * 0.64);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "flying": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.94, outer * 0.12);
      spriteCtx.quadraticCurveTo(-outer * 0.1, -outer * 0.84, outer * 0.94, outer * 0.12);
      spriteCtx.quadraticCurveTo(0, -outer * 0.2, -outer * 0.94, outer * 0.12);
      spriteCtx.fill();
      break;
    }
    case "bug": {
      spriteCtx.beginPath();
      spriteCtx.ellipse(0, 0, outer * 0.5, outer * 0.72, 0, 0, Math.PI * 2);
      spriteCtx.fill();
      for (const dir of [-1, 1]) {
        spriteCtx.beginPath();
        spriteCtx.moveTo(dir * outer * 0.3, -outer * 0.24);
        spriteCtx.lineTo(dir * outer * 0.86, -outer * 0.62);
        spriteCtx.moveTo(dir * outer * 0.38, 0);
        spriteCtx.lineTo(dir * outer * 0.96, 0);
        spriteCtx.moveTo(dir * outer * 0.32, outer * 0.26);
        spriteCtx.lineTo(dir * outer * 0.86, outer * 0.62);
        spriteCtx.stroke();
      }
      break;
    }
    case "ghost": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(-outer * 0.72, outer * 0.56);
      spriteCtx.lineTo(-outer * 0.72, -outer * 0.1);
      spriteCtx.quadraticCurveTo(-outer * 0.72, -outer * 0.86, 0, -outer * 0.86);
      spriteCtx.quadraticCurveTo(outer * 0.72, -outer * 0.86, outer * 0.72, -outer * 0.1);
      spriteCtx.lineTo(outer * 0.72, outer * 0.56);
      spriteCtx.lineTo(outer * 0.38, outer * 0.34);
      spriteCtx.lineTo(0, outer * 0.58);
      spriteCtx.lineTo(-outer * 0.34, outer * 0.34);
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    case "steel": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.92);
      spriteCtx.lineTo(outer * 0.8, -outer * 0.34);
      spriteCtx.lineTo(outer * 0.8, outer * 0.34);
      spriteCtx.lineTo(0, outer * 0.92);
      spriteCtx.lineTo(-outer * 0.8, outer * 0.34);
      spriteCtx.lineTo(-outer * 0.8, -outer * 0.34);
      spriteCtx.closePath();
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "destination-out";
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.3, 0, Math.PI * 2);
      spriteCtx.fill();
      spriteCtx.globalCompositeOperation = "source-over";
      break;
    }
    case "fairy": {
      spriteCtx.beginPath();
      spriteCtx.moveTo(0, -outer * 0.9);
      for (let i = 1; i < 10; i += 1) {
        const angle = -Math.PI / 2 + (Math.PI * 2 * i) / 10;
        const r = i % 2 === 0 ? outer * 0.9 : outer * 0.42;
        spriteCtx.lineTo(Math.cos(angle) * r, Math.sin(angle) * r);
      }
      spriteCtx.closePath();
      spriteCtx.fill();
      break;
    }
    default: {
      spriteCtx.beginPath();
      spriteCtx.arc(0, 0, outer * 0.72, 0, Math.PI * 2);
      spriteCtx.fill();
      break;
    }
  }

  spriteCtx.restore();
}

function createProjectileSprite(typeName) {
  const type = normalizeType(typeName);
  const size = PROJECTILE_SPRITE_PX;
  const rgb = getTypeColor(type);
  const sprite = document.createElement("canvas");
  sprite.width = size;
  sprite.height = size;
  const spriteCtx = sprite.getContext("2d");
  if (!spriteCtx) {
    return null;
  }

  const mid = size * 0.5;
  const aura = spriteCtx.createRadialGradient(mid, mid, size * 0.08, mid, mid, size * 0.5);
  aura.addColorStop(0, rgba(rgb, 0.98));
  aura.addColorStop(0.4, rgba(rgb, 0.5));
  aura.addColorStop(1, rgba(rgb, 0));

  spriteCtx.fillStyle = aura;
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.5, 0, Math.PI * 2);
  spriteCtx.fill();

  spriteCtx.fillStyle = rgba(rgb, 0.86);
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.34, 0, Math.PI * 2);
  spriteCtx.fill();

  spriteCtx.strokeStyle = "rgba(255, 255, 255, 0.8)";
  spriteCtx.lineWidth = Math.max(1.2, size * 0.022);
  spriteCtx.beginPath();
  spriteCtx.arc(mid, mid, size * 0.35, 0, Math.PI * 2);
  spriteCtx.stroke();

  drawProjectileGlyph(spriteCtx, type, size);

  spriteCtx.fillStyle = "rgba(255, 255, 255, 0.36)";
  spriteCtx.beginPath();
  spriteCtx.ellipse(size * 0.38, size * 0.3, size * 0.12, size * 0.07, -0.38, 0, Math.PI * 2);
  spriteCtx.fill();

  return sprite;
}

function getProjectileSprite(typeName) {
  const type = normalizeType(typeName);
  if (projectileSpriteCache.has(type)) {
    return projectileSpriteCache.get(type);
  }
  const sprite = createProjectileSprite(type);
  projectileSpriteCache.set(type, sprite);
  return sprite;
}

class PokemonBattleManager {
  constructor({
    team,
    attackIntervalMs,
    getAttackIntervalMs,
    respawnDelayMs = KO_RESPAWN_DELAY_MS,
    createEnemy,
    onEnemySpawn,
    onEnemyDefeated,
    getEnemyTimerConfig,
    onEnemyTimerExpired,
    canTeamAttack,
  }) {
    this.team = Array.isArray(team) ? team : [];
    this.attackIntervalMs = attackIntervalMs;
    this.getAttackIntervalMs = typeof getAttackIntervalMs === "function" ? getAttackIntervalMs : null;
    this.enemyRespawnDelayMs = respawnDelayMs;
    this.createEnemy = typeof createEnemy === "function" ? createEnemy : () => null;
    this.onEnemySpawn = typeof onEnemySpawn === "function" ? onEnemySpawn : () => {};
    this.onEnemyDefeated = typeof onEnemyDefeated === "function" ? onEnemyDefeated : () => {};
    this.getEnemyTimerConfig =
      typeof getEnemyTimerConfig === "function"
        ? getEnemyTimerConfig
        : () => ({ enabled: false, style: ENEMY_TIMER_STYLE_ROUTE });
    this.onEnemyTimerExpired = typeof onEnemyTimerExpired === "function" ? onEnemyTimerExpired : () => {};
    this.canTeamAttack = typeof canTeamAttack === "function" ? canTeamAttack : () => true;
    this.turnIndex = 0;
    this.projectiles = [];
    this.floatingTexts = [];
    this.hitEffects = [];
    this.enemyHitPulse = { remainingMs: 0, tween: null };
    this.enemyDamageFlash = { remainingMs: 0, tween: null };
    this.lastImpact = null;
    this.lastTurnEvent = null;
    this.enemiesDefeated = 0;
    this.attackTimerMs = attackIntervalMs;
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.slotRecoil = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotAttackFlash = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotSkipTurnFx = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotTeleportScale = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.teleportDamageBoostBySlot = Array.from({ length: MAX_TEAM_SIZE }, () => 1);
    this.teleportBoostVisualBySlot = Array.from({ length: MAX_TEAM_SIZE }, () => 0);
    this.pendingTeleportSwapAfterRespawn = null;
    this.enemyTimerEnabled = false;
    this.enemyTimerDurationMs = 0;
    this.enemyTimerMs = 0;
    this.enemyTimerStyle = ENEMY_TIMER_STYLE_ROUTE;
    this.enemy = null;
    this.pendingEnemyDamage = 0;
    this.enemyDefeatReserved = false;
    this.enemyDefeatReservedBySlot = -1;
    this.spawnEnemy();
  }

  getEffectiveAttackIntervalMs() {
    const dynamicValue = this.getAttackIntervalMs ? Number(this.getAttackIntervalMs()) : NaN;
    if (Number.isFinite(dynamicValue) && dynamicValue > 0) {
      return dynamicValue;
    }
    return this.attackIntervalMs;
  }

  setAttackInterval(nextIntervalMs) {
    const nextInterval = Math.max(65, toSafeInt(nextIntervalMs, ATTACK_INTERVAL_MS));
    const prevInterval = Math.max(65, toSafeInt(this.attackIntervalMs, ATTACK_INTERVAL_MS));
    const timer = Number(this.attackTimerMs);
    if (!Number.isFinite(timer)) {
      this.attackIntervalMs = nextInterval;
      this.attackTimerMs = nextInterval;
      return;
    }
    if (Math.abs(nextInterval - prevInterval) > 0.01) {
      const remainingRatio = clamp(timer / prevInterval, 0, 1);
      this.attackTimerMs = nextInterval * remainingRatio;
    }
    this.attackIntervalMs = nextInterval;
  }

  resetTurnOrder(startSlotIndex = 0, options = {}) {
    const normalizedStartIndex = clamp(toSafeInt(startSlotIndex, 0), 0, MAX_TEAM_SIZE - 1);
    this.turnIndex = normalizedStartIndex;
    if (options?.resetAttackTimer !== false) {
      this.attackTimerMs = Math.max(1, this.getEffectiveAttackIntervalMs());
    }
  }

  syncTeam(team) {
    const previousTeam = Array.isArray(this.team) ? this.team : [];
    const previousBoostByPokemonId = new Map();
    const previousBoostVisualByPokemonId = new Map();
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const member = previousTeam[i];
      const pokemonId = Number(member?.id || 0);
      if (pokemonId <= 0) {
        continue;
      }
      const previousBoost = Math.max(1, Number(this.teleportDamageBoostBySlot?.[i] || 1));
      const previousVisual = clamp(Number(this.teleportBoostVisualBySlot?.[i] || 0), 0, 1);
      previousBoostByPokemonId.set(
        pokemonId,
        Math.max(previousBoost, Number(previousBoostByPokemonId.get(pokemonId) || 1)),
      );
      previousBoostVisualByPokemonId.set(
        pokemonId,
        Math.max(previousVisual, Number(previousBoostVisualByPokemonId.get(pokemonId) || 0)),
      );
    }

    this.stopAllSlotEffectTweens();
    this.team = Array.isArray(team) ? team : [];
    this.turnIndex = this.team.length === 0 ? 0 : this.turnIndex % MAX_TEAM_SIZE;
    this.slotSkipTurnFx = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.slotTeleportScale = Array.from({ length: MAX_TEAM_SIZE }, () => null);
    this.teleportDamageBoostBySlot = Array.from({ length: MAX_TEAM_SIZE }, () => 1);
    this.teleportBoostVisualBySlot = Array.from({ length: MAX_TEAM_SIZE }, () => 0);
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const member = this.team[i];
      const pokemonId = Number(member?.id || 0);
      if (pokemonId <= 0) {
        continue;
      }
      const preservedBoost = Math.max(1, Number(previousBoostByPokemonId.get(pokemonId) || 1));
      this.teleportDamageBoostBySlot[i] = preservedBoost;
      this.teleportBoostVisualBySlot[i] = Math.max(
        clamp(Number(previousBoostVisualByPokemonId.get(pokemonId) || 0), 0, 1),
        preservedBoost > 1.001 ? 1 : 0,
      );
    }
    this.refreshPlacementDependentTalentOverrides();
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

  clearProjectiles() {
    for (const projectile of this.projectiles) {
      stopProjectileTravelTween(projectile);
    }
    this.projectiles = [];
  }

  clearFloatingTexts() {
    for (const text of this.floatingTexts) {
      stopFloatingTextVisualTween(text);
    }
    this.floatingTexts = [];
  }

  getHitEffects() {
    return this.hitEffects;
  }

  stopEnemyHitPulseTween() {
    stopTweenIfRunning(this.enemyHitPulse?.tween);
    if (this.enemyHitPulse) {
      this.enemyHitPulse.tween = null;
    }
  }

  stopEnemyDamageFlashTween() {
    stopTweenIfRunning(this.enemyDamageFlash?.tween);
    if (this.enemyDamageFlash) {
      this.enemyDamageFlash.tween = null;
    }
  }

  setEnemyHitPulseMs(remainingMs = 0) {
    const safeMs = Math.max(0, Number(remainingMs) || 0);
    this.stopEnemyHitPulseTween();
    this.enemyHitPulse.remainingMs = safeMs;
  }

  setEnemyDamageFlashMs(remainingMs = 0) {
    const safeMs = Math.max(0, Number(remainingMs) || 0);
    this.stopEnemyDamageFlashTween();
    this.enemyDamageFlash.remainingMs = safeMs;
  }

  triggerEnemyHitPulse(durationMs = 120) {
    const safeDurationMs = Math.max(1, Math.round(Number(durationMs) || 120));
    this.setEnemyHitPulseMs(safeDurationMs);
    const pulseRef = this.enemyHitPulse;
    pulseRef.tween = new Tween(pulseRef, tweenGroup)
      .to({ remainingMs: 0 }, safeDurationMs)
      .easing(Easing.Cubic.Out)
      .onComplete(() => {
        if (this.enemyHitPulse === pulseRef) {
          pulseRef.tween = null;
        }
      })
      .start(state.timeMs);
  }

  triggerEnemyDamageFlash(durationMs = ENEMY_DAMAGE_FLASH_DURATION_MS) {
    const safeDurationMs = Math.max(1, Math.round(Number(durationMs) || ENEMY_DAMAGE_FLASH_DURATION_MS));
    this.setEnemyDamageFlashMs(safeDurationMs);
    const flashRef = this.enemyDamageFlash;
    flashRef.tween = new Tween(flashRef, tweenGroup)
      .to({ remainingMs: 0 }, safeDurationMs)
      .easing(Easing.Cubic.Out)
      .onComplete(() => {
        if (this.enemyDamageFlash === flashRef) {
          flashRef.tween = null;
        }
      })
      .start(state.timeMs);
  }

  stopSlotRecoilTween(slotIndex) {
    const recoil = this.slotRecoil?.[slotIndex];
    stopTweenIfRunning(recoil?.tween);
    if (this.slotRecoil && slotIndex >= 0 && slotIndex < this.slotRecoil.length) {
      this.slotRecoil[slotIndex] = null;
    }
  }

  stopSlotAttackFlashTween(slotIndex) {
    const flash = this.slotAttackFlash?.[slotIndex];
    stopTweenIfRunning(flash?.tween);
    if (this.slotAttackFlash && slotIndex >= 0 && slotIndex < this.slotAttackFlash.length) {
      this.slotAttackFlash[slotIndex] = null;
    }
  }

  stopSlotSkipTurnTween(slotIndex) {
    const skipFx = this.slotSkipTurnFx?.[slotIndex];
    stopTweenIfRunning(skipFx?.tween);
    if (this.slotSkipTurnFx && slotIndex >= 0 && slotIndex < this.slotSkipTurnFx.length) {
      this.slotSkipTurnFx[slotIndex] = null;
    }
  }

  stopSlotTeleportScaleTween(slotIndex) {
    const scaleFx = this.slotTeleportScale?.[slotIndex];
    stopTweenIfRunning(scaleFx?.tween);
    if (this.slotTeleportScale && slotIndex >= 0 && slotIndex < this.slotTeleportScale.length) {
      this.slotTeleportScale[slotIndex] = null;
    }
  }

  stopAllSlotEffectTweens() {
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      this.stopSlotRecoilTween(i);
      this.stopSlotAttackFlashTween(i);
      this.stopSlotSkipTurnTween(i);
      this.stopSlotTeleportScaleTween(i);
    }
  }

  resetCombatVisualTweens() {
    this.setEnemyHitPulseMs(0);
    this.setEnemyDamageFlashMs(0);
    this.stopAllSlotEffectTweens();
  }

  getEnemyHitPulseRatio() {
    return clamp(Number(this.enemyHitPulse?.remainingMs || 0) / 120, 0, 1);
  }

  isEnemyRespawning() {
    return this.pendingRespawnMs > 0;
  }

  getEnemyTimerConfigSnapshot() {
    const raw = this.getEnemyTimerConfig ? this.getEnemyTimerConfig(this.enemy) : null;
    const enabled = Boolean(raw?.enabled);
    const durationMs = enabled ? Math.max(1000, toSafeInt(raw?.durationMs, ROUTE_DEFEAT_TIMER_MS)) : 0;
    const style = raw?.style === ENEMY_TIMER_STYLE_ONLY_ONE ? ENEMY_TIMER_STYLE_ONLY_ONE : ENEMY_TIMER_STYLE_ROUTE;
    return { enabled, durationMs, style };
  }

  resetEnemyTimer() {
    const config = this.getEnemyTimerConfigSnapshot();
    this.enemyTimerEnabled = config.enabled;
    this.enemyTimerDurationMs = config.durationMs;
    this.enemyTimerMs = config.enabled ? config.durationMs : 0;
    this.enemyTimerStyle = config.style;
  }

  isEnemyTimerRunning() {
    return this.enemyTimerEnabled && Boolean(this.enemy) && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning();
  }

  getEnemyTimerState() {
    const durationMs = Math.max(0, toSafeInt(this.enemyTimerDurationMs, 0));
    const remainingMs = Math.max(0, Number(this.enemyTimerMs) || 0);
    const remainingRatio = durationMs > 0 ? clamp(remainingMs / durationMs, 0, 1) : 0;
    return {
      enabled: this.enemyTimerEnabled,
      running: this.isEnemyTimerRunning(),
      style: this.enemyTimerStyle,
      duration_ms: Math.round(durationMs),
      remaining_ms: Math.round(remainingMs),
      remaining_ratio: Math.round(remainingRatio * 1000) / 1000,
    };
  }

  advanceEnemyTimer(deltaMs) {
    if (!this.isEnemyTimerRunning()) {
      return;
    }
    this.enemyTimerMs = Math.max(0, this.enemyTimerMs - Math.max(0, Number(deltaMs) || 0));
  }

  expireEnemyFromTimer() {
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }
    const expiredEnemy = this.enemy;
    this.clearProjectiles();
    this.clearFloatingTexts();
    this.hitEffects = [];
    this.resetCombatVisualTweens();
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.resetQueuedAttackState();
    this.lastImpact = null;
    this.lastTurnEvent = null;
    try {
      this.onEnemyTimerExpired(expiredEnemy);
    } catch {
      // Ignore callback failures and continue the combat loop.
    }
    this.spawnEnemy();
  }

  buildCaptureTotalMs(captured) {
    if (captured) {
      return CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_SUCCESS_BURST_MS + CAPTURE_POST_MS;
    }
    return CAPTURE_THROW_MS + CAPTURE_SHAKE_MS + CAPTURE_FAIL_BREAK_MS + CAPTURE_FAIL_REAPPEAR_MS + CAPTURE_POST_MS;
  }

  getCaptureSequencePhase(sequence = this.captureSequence) {
    if (!sequence) {
      return null;
    }

    const elapsed = sequence.elapsedMs;
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (elapsed < CAPTURE_THROW_MS) {
      return "throw";
    }
    if (elapsed < shakeEnd) {
      return "shake";
    }

    if (sequence.captured) {
      return elapsed < shakeEnd + CAPTURE_SUCCESS_BURST_MS ? "success" : "post";
    }

    const breakEnd = shakeEnd + CAPTURE_FAIL_BREAK_MS;
    if (elapsed < breakEnd) {
      return "break";
    }
    return elapsed < breakEnd + CAPTURE_FAIL_REAPPEAR_MS ? "reappear" : "post";
  }

  getCaptureSequence() {
    if (!this.captureSequence) {
      return null;
    }
    const chanceDisplay = Number(this.captureSequence.chanceDisplay);
    const ballType = normalizeBallTypeForVisual(this.captureSequence.ballType);
    return {
      phase: this.getCaptureSequencePhase(),
      captured: this.captureSequence.captured,
      critical: Boolean(this.captureSequence.isCritical),
      ball_type: ballType,
      chance_display: Number.isFinite(chanceDisplay) ? Math.round(clamp(chanceDisplay, 0, 1) * 10000) / 10000 : null,
      elapsed_ms: Math.round(this.captureSequence.elapsedMs),
      total_ms: Math.round(this.captureSequence.totalMs),
      remaining_ms: Math.max(0, Math.round(this.captureSequence.totalMs - this.captureSequence.elapsedMs)),
    };
  }

  getCaptureSequenceState() {
    return this.captureSequence;
  }

  getEnemyImpactPoint(layout) {
    const fallbackX = Number(layout?.centerX) || 0;
    const fallbackY = Number(layout?.centerY) || 0;
    const x = Number(layout?.enemyImpactX);
    const y = Number(layout?.enemyImpactY);
    return {
      x: Number.isFinite(x) ? x : fallbackX,
      y: Number.isFinite(y) ? y : fallbackY,
    };
  }

  resetQueuedAttackState() {
    this.pendingEnemyDamage = 0;
    this.enemyDefeatReserved = false;
    this.enemyDefeatReservedBySlot = -1;
  }

  isEnemyDefeatReserved() {
    return Boolean(this.enemyDefeatReserved) && Boolean(this.enemy) && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning();
  }

  consumeQueuedProjectileDamage(projectile) {
    const plannedDamage = Math.max(0, Number(projectile?.plannedDamage) || 0);
    if (plannedDamage > 0) {
      this.pendingEnemyDamage = Math.max(0, this.pendingEnemyDamage - plannedDamage);
    }
    if (projectile?.reservesDefeat) {
      this.enemyDefeatReserved = false;
      this.enemyDefeatReservedBySlot = -1;
    }
  }

  buildPrecomputedHitOutcome(attackerIndex, attacker, attackType) {
    const resolvedType = String(attackType || attacker?.offensiveType || attacker?.defensiveTypes?.[0] || "normal");
    const teleportDamageBoost = this.consumeTeleportDamageBoostForSlot(attackerIndex);
    if (!attacker || !this.enemy || this.enemy.hpCurrent <= 0) {
      return {
        attackType: resolvedType,
        missed: false,
        typeMultiplier: 1,
        isCritical: false,
        damage: 0,
        teamAuraAttackBonus: 0,
        teleportDamageBoost,
      };
    }

    const cannotMiss = hasAlwaysHitTalent(attacker?.talent, attacker?.id);
    const missed = !cannotMiss && Math.random() < ATTACK_MISS_CHANCE;
    if (missed) {
      return {
        attackType: resolvedType,
        missed: true,
        typeMultiplier: 1,
        isCritical: false,
        damage: 0,
        teamAuraAttackBonus: 0,
        teleportDamageBoost,
      };
    }

    const typeMultiplier = getTypeMultiplier(resolvedType, this.enemy.defensiveTypes);
    const critChanceBonus = getTalentCritBonusChance(attacker?.talent, attacker?.id);
    const teamAuraAttackBonus = this.getTeamAuraAttackBonusForAttacker(attackerIndex, attacker);
    const damageOutcome = computeDamage(attacker, this.enemy, resolvedType, typeMultiplier, {
      critChanceBonus,
      damageMultiplier: (1 + teamAuraAttackBonus) * teleportDamageBoost,
    });
    const baseDamage = Math.max(0, Number(damageOutcome?.damage || 0));
    const damage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(baseDamage));

    return {
      attackType: resolvedType,
      missed: false,
      typeMultiplier,
      isCritical: Boolean(damageOutcome?.isCritical),
      damage,
      teamAuraAttackBonus,
      teleportDamageBoost,
    };
  }

  consumeTurnSlot() {
    const slotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    const attacker = this.team[slotIndex] || null;
    this.turnIndex = (slotIndex + 1) % MAX_TEAM_SIZE;
    return { slotIndex, attacker };
  }

  resolveTurnDecisionForSlot(slotIndex, attacker = this.team[slotIndex] || null) {
    const decision = resolveCombatTurnDecision({
      attacker,
      enemy: this.enemy,
    });
    const talentId = normalizeTalentId(decision.talentId || attacker?.talent?.id || TALENT_NONE_ID);
    const safeSkipAction = typeof TURN_ACTION_SKIP === "string" ? TURN_ACTION_SKIP : "skip";
    const baseAction = decision.action === TURN_ACTION_ATTACK ? TURN_ACTION_ATTACK : safeSkipAction;
    const attackBlockedByZone = baseAction === TURN_ACTION_ATTACK && !this.canTeamAttack();
    const action = attackBlockedByZone ? safeSkipAction : baseAction;
    const reason = attackBlockedByZone ? "zone_no_attack" : decision.reason;
    return {
      action,
      reason,
      talentId,
      passiveBehaviorId: String(decision.passiveBehaviorId || getPassiveBehaviorIdForTalentId(talentId)),
    };
  }

  getRandomAllySlotIndex(attackerIndex, options = {}) {
    const requireAttackReady = Boolean(options.requireAttackReady);
    const candidates = [];
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      if (i === attackerIndex) {
        continue;
      }
      const ally = this.team[i];
      if (!ally) {
        continue;
      }
      if (requireAttackReady) {
        const allyDecision = this.resolveTurnDecisionForSlot(i, ally);
        if (allyDecision.action !== TURN_ACTION_ATTACK) {
          continue;
        }
      }
      candidates.push(i);
    }
    if (candidates.length <= 0) {
      return -1;
    }
    const pickIndex = randomInt(0, candidates.length - 1);
    return candidates[pickIndex];
  }

  resolveAttackTypeForAttacker(attackerIndex, attacker = this.team[attackerIndex] || null) {
    const defaultType = attacker?.offensiveType || attacker?.defensiveTypes?.[0] || "normal";
    if (!attacker) {
      return String(defaultType || "normal");
    }
    const talentId = getEntityTalentId(attacker, attacker?.id);
    if (talentId !== TALENT_ORIGIN_MIMICRY_ID) {
      return String(defaultType || "normal");
    }
    const allyIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: false });
    if (allyIndex < 0) {
      return String(defaultType || "normal");
    }
    const ally = this.team[allyIndex];
    const copiedType = ally?.offensiveType || ally?.defensiveTypes?.[0] || defaultType;
    return String(copiedType || defaultType || "normal");
  }

  getTeamAuraAttackBonusForAttacker(attackerIndex, attacker = this.team[attackerIndex] || null) {
    if (!attacker) {
      return 0;
    }
    return getStackedTeamAuraAttackBonus(this.team, attackerIndex, getEntityOffensiveType(attacker));
  }

  recordTurnEvent(slotIndex, attacker, decision, overrides = {}) {
    const talentId = normalizeTalentId(decision?.talentId || attacker?.talent?.id || TALENT_NONE_ID);
    this.lastTurnEvent = {
      slot_index: slotIndex,
      attacker_name_fr: attacker?.nameFr || null,
      action: String(decision?.action || "skip"),
      reason: String(decision?.reason || "unknown"),
      talent_id: talentId,
      passive_behavior_id: String(decision?.passiveBehaviorId || getPassiveBehaviorIdForTalentId(talentId)),
      ...overrides,
    };
  }

  getLastTurnEvent() {
    return this.lastTurnEvent ? { ...this.lastTurnEvent } : null;
  }

  getNextTurnPreview() {
    const nextOccupied = this.getNextOccupiedSlotInfo();
    if (!nextOccupied) {
      return null;
    }
    const attacker = this.team[nextOccupied.slotIndex] || null;
    const decision = this.resolveTurnDecisionForSlot(nextOccupied.slotIndex, attacker);
    return {
      slot_index: nextOccupied.slotIndex,
      skipped_empty_slots: nextOccupied.skippedEmptySlots,
      attacker_name_fr: attacker?.nameFr || null,
      action: decision.action,
      reason: decision.reason,
      talent_id: decision.talentId,
      passive_behavior_id: decision.passiveBehaviorId,
    };
  }

  getNextOccupiedSlotInfo() {
    const baseSlotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    for (let offset = 0; offset < MAX_TEAM_SIZE; offset += 1) {
      const slotIndex = (baseSlotIndex + offset) % MAX_TEAM_SIZE;
      if (this.team[slotIndex]) {
        return {
          slotIndex,
          skippedEmptySlots: offset,
        };
      }
    }
    return null;
  }

  getNextAttackSlotTimeline() {
    const preview = this.getNextTurnPreview();
    if (!preview) {
      return null;
    }
    const interval = Math.max(1, this.attackIntervalMs);
    const normalizedTimer = ((this.attackTimerMs % interval) + interval) % interval;
    const progressToNextAttack = 1 - normalizedTimer / interval;
    const canAttack = preview.action === TURN_ACTION_ATTACK;
    const timeUntilAttackMs = normalizedTimer + preview.skipped_empty_slots * interval;
    return {
      preview,
      interval,
      normalizedTimer,
      progressToNextAttack,
      canAttack,
      timeUntilAttackMs: Math.max(0, timeUntilAttackMs),
    };
  }

  getTurnIndicator(layout) {
    const slots = layout?.teamSlots;
    if (!Array.isArray(slots) || slots.length < MAX_TEAM_SIZE) {
      return null;
    }

    const timeline = this.getNextAttackSlotTimeline();
    if (!timeline) {
      return null;
    }

    const nextAttackSlotIndex = timeline.preview.slot_index;
    const slot = slots[nextAttackSlotIndex];
    if (!slot) {
      return null;
    }

    return {
      slot_index: nextAttackSlotIndex,
      x: slot.x,
      y: slot.y + slot.size * 0.34,
      radius: clamp(slot.size * 0.3, 19, 34),
      has_pokemon: true,
      can_attack: timeline.canAttack,
      next_turn_action: timeline.preview.action,
      next_turn_reason: timeline.preview.reason,
      passive_behavior_id: timeline.preview.passive_behavior_id,
      progress_to_next_attack: Math.round(clamp(timeline.progressToNextAttack, 0, 1) * 1000) / 1000,
      time_until_attack_ms: Math.round(timeline.timeUntilAttackMs),
    };
  }

  getSlotChargeGlow(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (
      safeSlotIndex < 0
      || !this.enemy
      || this.enemy.hpCurrent <= 0
      || this.isEnemyRespawning()
    ) {
      return 0;
    }

    const timeline = this.getNextAttackSlotTimeline();
    if (!timeline || !timeline.canAttack || timeline.preview.slot_index !== safeSlotIndex) {
      return 0;
    }

    const chargeWindowMs = Math.min(
      Math.max(ATTACK_CHARGE_MIN_WINDOW_MS, timeline.interval * ATTACK_CHARGE_WINDOW_RATIO),
      Math.max(ATTACK_CHARGE_MIN_WINDOW_MS, timeline.interval - 12),
    );
    const timeUntilAttackMs = Math.max(0, timeline.timeUntilAttackMs);
    if (timeUntilAttackMs > chargeWindowMs) {
      return 0;
    }

    const ratio = clamp(1 - timeUntilAttackMs / Math.max(1, chargeWindowMs), 0, 1);
    const pulse = 0.84 + Math.sin((chargeWindowMs - timeUntilAttackMs) * 0.022 + safeSlotIndex * 0.7) * 0.16;
    return clamp(ratio * pulse, 0, 1);
  }

  getSlotRecoilOffset(slotIndex, layout) {
    const slot = layout?.teamSlots?.[slotIndex];
    const recoil = this.slotRecoil[slotIndex];
    if (!slot || !recoil) {
      return { x: 0, y: 0 };
    }

    const dx = slot.x - layout.centerX;
    const dy = slot.y - layout.centerY;
    const length = Math.hypot(dx, dy) || 1;
    const ratio = clamp(Number(recoil.progress || 0), 0, 1);
    const curve = Math.sin(Math.PI * ratio) * (1 - ratio * 0.55);
    const distance = (4 + slot.size * 0.07) * curve * recoil.strength;
    return {
      x: (dx / length) * distance,
      y: (dy / length) * distance,
    };
  }

  updateSlotRecoil(deltaMs) {
    void deltaMs;
  }

  triggerSlotRecoil(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return;
    }
    this.stopSlotRecoilTween(safeSlotIndex);
    const recoilState = {
      progress: 0,
      strength: 1 + Math.random() * 0.18,
      tween: null,
    };
    this.slotRecoil[safeSlotIndex] = recoilState;
    recoilState.tween = new Tween(recoilState, tweenGroup)
      .to({ progress: 1 }, 240)
      .easing(Easing.Linear.None)
      .onComplete(() => {
        if (this.slotRecoil[safeSlotIndex] === recoilState) {
          this.slotRecoil[safeSlotIndex] = null;
        }
      })
      .start(state.timeMs);
  }

  updateSlotAttackFlash(deltaMs) {
    void deltaMs;
  }

  triggerSlotAttackFlash(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return;
    }
    this.stopSlotAttackFlashTween(safeSlotIndex);
    const flashState = {
      blend: ATTACK_FLASH_WHITE_BLEND,
      tween: null,
    };
    this.slotAttackFlash[safeSlotIndex] = flashState;
    flashState.tween = new Tween(flashState, tweenGroup)
      .to({ blend: 0 }, ATTACK_FLASH_DURATION_MS)
      .easing(Easing.Cubic.Out)
      .onComplete(() => {
        if (this.slotAttackFlash[safeSlotIndex] === flashState) {
          this.slotAttackFlash[safeSlotIndex] = null;
        }
      })
      .start(state.timeMs);
  }

  getSlotAttackFlashBlend(slotIndex) {
    const flash = this.slotAttackFlash[slotIndex];
    if (!flash) {
      return 0;
    }
    return clamp(Number(flash.blend || 0), 0, ATTACK_FLASH_WHITE_BLEND);
  }

  getSkipTurnEffectDurationMs() {
    return clamp(
      Math.round(Math.max(1, Number(this.attackIntervalMs) || ATTACK_INTERVAL_MS) * 0.96),
      SKIP_TURN_EFFECT_DURATION_MIN_MS,
      SKIP_TURN_EFFECT_DURATION_MAX_MS,
    );
  }

  updateSlotSkipTurnEffects(deltaMs) {
    void deltaMs;
  }

  triggerSlotSkipTurnEffect(slotIndex, options = {}) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0 || !this.team[safeSlotIndex]) {
      return;
    }
    const durationMs = clamp(
      Math.round(Number(options.durationMs) || this.getSkipTurnEffectDurationMs()),
      SKIP_TURN_EFFECT_DURATION_MIN_MS,
      SKIP_TURN_EFFECT_DURATION_MAX_MS,
    );
    this.stopSlotSkipTurnTween(safeSlotIndex);
    const skipState = {
      progress: 0,
      durationMs,
      phaseSeed: Math.random() * Math.PI * 2,
      tween: null,
    };
    this.slotSkipTurnFx[safeSlotIndex] = skipState;
    skipState.tween = new Tween(skipState, tweenGroup)
      .to({ progress: 1 }, durationMs)
      .easing(Easing.Linear.None)
      .onComplete(() => {
        if (this.slotSkipTurnFx[safeSlotIndex] === skipState) {
          this.slotSkipTurnFx[safeSlotIndex] = null;
        }
      })
      .start(state.timeMs);
  }

  getSlotSkipTurnVisual(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return null;
    }
    const effect = this.slotSkipTurnFx[safeSlotIndex];
    if (!effect) {
      return null;
    }
    const durationMs = Math.max(1, Number(effect.durationMs) || 1);
    const progress = clamp(Number(effect.progress || 0), 0, 1);
    const elapsedMs = progress * durationMs;
    const fadeRatio = clamp(SKIP_TURN_EFFECT_FADE_RATIO, 0.08, 0.45);
    const fadeIn = easeInOutSine(clamp(progress / fadeRatio, 0, 1));
    const fadeOut = easeInOutSine(clamp((1 - progress) / fadeRatio, 0, 1));
    const envelope = clamp(Math.min(fadeIn, fadeOut), 0, 1);
    const phaseSeed = Number(effect.phaseSeed || 0);
    const tremor = envelope * (0.78 + Math.sin(elapsedMs * 0.037 + phaseSeed) * 0.14);
    const offsetX = Math.sin(elapsedMs * 0.19 + phaseSeed) * (0.55 + tremor * 1.45);
    const offsetY = Math.sin(elapsedMs * 0.24 + phaseSeed * 1.37) * (0.22 + tremor * 0.52);
    return {
      offsetX,
      offsetY,
      scaleX: 1 - tremor * 0.016,
      scaleY: 1 + tremor * 0.006,
      grayscaleBlend: clamp(easeInOutSine(envelope) * SKIP_TURN_EFFECT_GRAYSCALE_MAX, 0, 1),
    };
  }

  updateSlotTeleportScale(deltaMs) {
    void deltaMs;
  }

  triggerSlotTeleportScale(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return;
    }
    this.stopSlotTeleportScaleTween(safeSlotIndex);
    const scaleState = {
      progress: 0,
      durationMs: TELEPORT_SWAP_SCALE_DURATION_MS,
      tween: null,
    };
    this.slotTeleportScale[safeSlotIndex] = scaleState;
    scaleState.tween = new Tween(scaleState, tweenGroup)
      .to({ progress: 1 }, TELEPORT_SWAP_SCALE_DURATION_MS)
      .easing(Easing.Linear.None)
      .onComplete(() => {
        if (this.slotTeleportScale[safeSlotIndex] === scaleState) {
          this.slotTeleportScale[safeSlotIndex] = null;
        }
      })
      .start(state.timeMs);
  }

  getSlotTeleportScale(slotIndex) {
    const scaleFx = this.slotTeleportScale[slotIndex];
    if (!scaleFx) {
      return 1;
    }
    const ratio = clamp(Number(scaleFx.progress || 0), 0, 1);
    const minScale = 0.16;
    if (ratio <= 0.5) {
      const downRatio = ratio / 0.5;
      return clamp(1 - (1 - minScale) * downRatio, minScale, 1);
    }
    const upRatio = (ratio - 0.5) / 0.5;
    return clamp(minScale + (1 - minScale) * upRatio, minScale, 1);
  }

  getTeleportDamageBoostForSlot(slotIndex) {
    return Math.max(1, Number(this.teleportDamageBoostBySlot?.[slotIndex] || 1));
  }

  getTeleportBoostVisualIntensityForSlot(slotIndex) {
    return clamp(Number(this.teleportBoostVisualBySlot?.[slotIndex] || 0), 0, 1);
  }

  updateTeleportBoostVisuals(deltaMs) {
    const dt = Math.max(0, Number(deltaMs) || 0) / 1000;
    if (dt <= 0) {
      return;
    }
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const hasBoost = this.getTeleportDamageBoostForSlot(i) > 1.001;
      const current = clamp(Number(this.teleportBoostVisualBySlot[i] || 0), 0, 1);
      const next = hasBoost
        ? clamp(current + dt * 3.4, 0, 1)
        : clamp(current - dt * 2.2, 0, 1);
      this.teleportBoostVisualBySlot[i] = next;
    }
  }

  consumeTeleportDamageBoostForSlot(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return 1;
    }
    const multiplier = Math.max(1, Number(this.teleportDamageBoostBySlot[safeSlotIndex] || 1));
    this.teleportDamageBoostBySlot[safeSlotIndex] = 1;
    if (multiplier > 1.001) {
      this.teleportBoostVisualBySlot[safeSlotIndex] = Math.max(
        0.5,
        Number(this.teleportBoostVisualBySlot[safeSlotIndex] || 0),
      );
    }
    return multiplier;
  }

  refreshPlacementDependentTalentOverrides() {
    const teamCollections = [];
    if (Array.isArray(this.team)) {
      teamCollections.push(this.team);
    }
    if (Array.isArray(state.team) && state.team !== this.team) {
      teamCollections.push(state.team);
    }
    for (const teamMembers of teamCollections) {
      applyTeamTalentOverrides(teamMembers);
    }
  }

  swapTeamSlots(firstSlotIndex, secondSlotIndex) {
    const a = clamp(toSafeInt(firstSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    const b = clamp(toSafeInt(secondSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (a < 0 || b < 0 || a === b) {
      return false;
    }

    const tempMember = this.team[a];
    this.team[a] = this.team[b];
    this.team[b] = tempMember;

    const tempBoost = this.teleportDamageBoostBySlot[a];
    this.teleportDamageBoostBySlot[a] = this.teleportDamageBoostBySlot[b];
    this.teleportDamageBoostBySlot[b] = tempBoost;
    const tempTeleportBoostVisual = this.teleportBoostVisualBySlot[a];
    this.teleportBoostVisualBySlot[a] = this.teleportBoostVisualBySlot[b];
    this.teleportBoostVisualBySlot[b] = tempTeleportBoostVisual;

    if (Array.isArray(state.team) && state.team !== this.team && a < state.team.length && b < state.team.length) {
      const tempStateMember = state.team[a];
      state.team[a] = state.team[b];
      state.team[b] = tempStateMember;
    }

    if (Array.isArray(state.saveData?.team) && a < state.saveData.team.length && b < state.saveData.team.length) {
      const tempSavedId = state.saveData.team[a];
      state.saveData.team[a] = state.saveData.team[b];
      state.saveData.team[b] = tempSavedId;
    }
    this.refreshPlacementDependentTalentOverrides();
    return true;
  }

  resolveTeleportEffectLayout(layout) {
    if (layout?.teamSlots?.length >= MAX_TEAM_SIZE) {
      return layout;
    }
    if (state.layout?.teamSlots?.length >= MAX_TEAM_SIZE) {
      return state.layout;
    }
    return computeLayout();
  }

  addTeleportSwapEffects(firstSlotIndex, secondSlotIndex, layout, options = {}) {
    if (!layout) {
      return;
    }
    const firstSlot = layout?.teamSlots?.[firstSlotIndex];
    const secondSlot = layout?.teamSlots?.[secondSlotIndex];
    if (!firstSlot || !secondSlot) {
      return;
    }
    const psychicColor = getTypeColor("psychic");
    const midX = (firstSlot.x + secondSlot.x) * 0.5 + randomRange(-18, 18);
    const midY = (firstSlot.y + secondSlot.y) * 0.5 + randomRange(-24, 24);

    this.hitEffects.push(
      {
        kind: "teleport_trail",
        x: firstSlot.x,
        y: firstSlot.y - firstSlot.size * 0.08,
        toX: secondSlot.x,
        toY: secondSlot.y - secondSlot.size * 0.08,
        ctrlX: midX,
        ctrlY: midY,
        lifeMs: 220,
        maxLifeMs: 220,
        lineWidth: Math.max(2.2, Math.min(firstSlot.size, secondSlot.size) * 0.075),
        color: psychicColor,
      },
      {
        kind: "teleport_trail",
        x: secondSlot.x,
        y: secondSlot.y - secondSlot.size * 0.08,
        toX: firstSlot.x,
        toY: firstSlot.y - firstSlot.size * 0.08,
        ctrlX: midX + randomRange(-18, 18),
        ctrlY: midY + randomRange(-18, 18),
        lifeMs: 190,
        maxLifeMs: 190,
        lineWidth: Math.max(1.8, Math.min(firstSlot.size, secondSlot.size) * 0.052),
        color: psychicColor,
      },
    );

    this.hitEffects.push({
      kind: "ring",
      x: firstSlot.x,
      y: firstSlot.y,
      radius: 5,
      expandSpeed: 275,
      lifeMs: 180,
      maxLifeMs: 180,
      lineWidth: 2.1,
      color: psychicColor,
    });
    this.hitEffects.push({
      kind: "ring",
      x: secondSlot.x,
      y: secondSlot.y,
      radius: 5,
      expandSpeed: 275,
      lifeMs: 180,
      maxLifeMs: 180,
      lineWidth: 2.1,
      color: psychicColor,
    });
    this.hitEffects.push({
      kind: "teleport_flash",
      x: firstSlot.x,
      y: firstSlot.y,
      radius: firstSlot.size * 0.16,
      expandSpeed: 190,
      lifeMs: 160,
      maxLifeMs: 160,
      color: psychicColor,
    });
    this.hitEffects.push({
      kind: "teleport_flash",
      x: secondSlot.x,
      y: secondSlot.y,
      radius: secondSlot.size * 0.16,
      expandSpeed: 190,
      lifeMs: 160,
      maxLifeMs: 160,
      color: psychicColor,
    });
    this.hitEffects.push({
      kind: "ring",
      x: (firstSlot.x + secondSlot.x) * 0.5,
      y: (firstSlot.y + secondSlot.y) * 0.5,
      radius: Math.max(8, Math.min(firstSlot.size, secondSlot.size) * 0.2),
      expandSpeed: 180,
      lifeMs: 150,
      maxLifeMs: 150,
      lineWidth: 1.9,
      color: psychicColor,
    });

    const sparkCount = shouldRenderCelebrationParticles() ? 14 : 8;
    for (let i = 0; i < sparkCount; i += 1) {
      const angle = (Math.PI * 2 * i) / Math.max(1, sparkCount) + Math.random() * 0.4;
      const speed = 70 + Math.random() * 130;
      const lifeMs = 110 + Math.random() * 140;
      const sourceX = i % 2 === 0 ? firstSlot.x : secondSlot.x;
      const sourceY = i % 2 === 0 ? firstSlot.y : secondSlot.y;
      this.hitEffects.push({
        kind: "spark",
        x: sourceX,
        y: sourceY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 16,
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.4 + Math.random() * 2.1,
        color: psychicColor,
      });
    }

    const boostedSlotIndex = clamp(toSafeInt(options?.boostedSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    const boostedSlot = layout?.teamSlots?.[boostedSlotIndex];
    if (boostedSlot) {
      this.hitEffects.push({
        kind: "teleport_flash",
        x: boostedSlot.x,
        y: boostedSlot.y,
        radius: boostedSlot.size * 0.22,
        expandSpeed: 210,
        lifeMs: 240,
        maxLifeMs: 240,
        color: psychicColor,
      });
      this.hitEffects.push({
        kind: "ring",
        x: boostedSlot.x,
        y: boostedSlot.y,
        radius: Math.max(8, boostedSlot.size * 0.2),
        expandSpeed: 240,
        lifeMs: 230,
        maxLifeMs: 230,
        lineWidth: 2.4,
        color: psychicColor,
      });
    }

    this.triggerSlotTeleportScale(firstSlotIndex);
    this.triggerSlotTeleportScale(secondSlotIndex);
  }

  buildTeleportSwapPlan(attackerIndex, attacker, decision) {
    if (!attacker || decision?.action !== TURN_ACTION_ATTACK) {
      return null;
    }
    const swapChance = getTalentTeleportSwapChance(attacker?.talent, attacker?.id);
    if (swapChance <= 0 || Math.random() >= swapChance) {
      return null;
    }

    const allySlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: false });
    if (allySlotIndex < 0) {
      return null;
    }
    const attackerSlotIndex = clamp(toSafeInt(attackerIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (attackerSlotIndex < 0 || attackerSlotIndex === allySlotIndex) {
      return null;
    }
    return {
      attackerSlotIndex,
      allySlotIndex,
      teleportPlusPlus: isTeleportPlusPlusTalent(attacker?.talent, attacker?.id),
    };
  }

  applyTeleportSwapPlan(plan, layout, options = {}) {
    const attackerSlotIndex = clamp(toSafeInt(plan?.attackerSlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    const allySlotIndex = clamp(toSafeInt(plan?.allySlotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (attackerSlotIndex < 0 || allySlotIndex < 0 || attackerSlotIndex === allySlotIndex) {
      return { swapped: false };
    }

    const nextScheduledSlotIndex = ((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) % MAX_TEAM_SIZE;
    const nextScheduledMember = this.team[nextScheduledSlotIndex] || null;
    const allyBeforeSwap = this.team[allySlotIndex];

    if (!this.swapTeamSlots(attackerSlotIndex, allySlotIndex)) {
      return { swapped: false };
    }

    let boostedSlotIndex = -1;
    if (Boolean(plan?.teleportPlusPlus) && allyBeforeSwap) {
      boostedSlotIndex = this.team.indexOf(allyBeforeSwap);
      if (boostedSlotIndex >= 0) {
        this.teleportDamageBoostBySlot[boostedSlotIndex] = Math.max(
          TALENT_TELEPORT_PLUS_PLUS_DAMAGE_MULTIPLIER,
          Number(this.teleportDamageBoostBySlot[boostedSlotIndex] || 1),
        );
        this.teleportBoostVisualBySlot[boostedSlotIndex] = 1;
      }
    }

    if (nextScheduledMember) {
      const nextMemberSlotIndex = this.team.indexOf(nextScheduledMember);
      if (nextMemberSlotIndex >= 0) {
        this.turnIndex = nextMemberSlotIndex;
      }
    }

    if (!options.idleMode) {
      const effectLayout = this.resolveTeleportEffectLayout(layout);
      this.addTeleportSwapEffects(attackerSlotIndex, allySlotIndex, effectLayout, { boostedSlotIndex });
    }
    return {
      swapped: true,
      fromSlotIndex: attackerSlotIndex,
      toSlotIndex: allySlotIndex,
      boostedSlotIndex,
    };
  }

  queueTeleportSwapAfterRespawn(plan) {
    this.pendingTeleportSwapAfterRespawn = plan ? { ...plan } : null;
  }

  applyPendingTeleportSwapAfterRespawn(layout, options = {}) {
    const plan = this.pendingTeleportSwapAfterRespawn;
    if (!plan) {
      return { swapped: false };
    }
    this.pendingTeleportSwapAfterRespawn = null;
    return this.applyTeleportSwapPlan(plan, layout, options);
  }

  tryApplyTeleportSwap(attackerIndex, attacker, decision, layout, options = {}) {
    const plan = this.buildTeleportSwapPlan(attackerIndex, attacker, decision);
    if (!plan) {
      return { swapped: false };
    }
    return this.applyTeleportSwapPlan(plan, layout, options);
  }

  getEnemyDamageFlashBlend() {
    const remainingMs = Math.max(0, Number(this.enemyDamageFlash?.remainingMs || 0));
    if (remainingMs <= 0) {
      return 0;
    }
    const ratio = clamp(remainingMs / Math.max(1, ENEMY_DAMAGE_FLASH_DURATION_MS), 0, 1);
    return ENEMY_DAMAGE_FLASH_RED_BLEND * ratio;
  }

  getKoTransition() {
    const captureTotal = this.captureSequence?.totalMs || this.enemyRespawnDelayMs;
    return {
      active: this.isEnemyRespawning(),
      enemy_name_fr: this.defeatedEnemyName,
      remaining_ms: Math.max(0, Math.round(this.pendingRespawnMs)),
      total_ms: Math.round(captureTotal),
      shrink_active: this.koAnimMs > 0,
      shrink_progress: clamp(1 - this.koAnimMs / Math.max(1, KO_ANIMATION_DURATION_MS), 0, 1),
    };
  }

  getNextAttackerName() {
    return this.getNextTurnPreview()?.attacker_name_fr || null;
  }

  flushRespawnForIdleMode() {
    if (this.pendingRespawnMs > 0 || this.captureSequence || (this.enemy && this.enemy.hpCurrent <= 0)) {
      const completedCapture = this.captureSequence;
      if (completedCapture && typeof completedCapture.onComplete === "function" && !completedCapture.onCompleteExecuted) {
        completedCapture.onCompleteExecuted = true;
        try {
          completedCapture.onComplete();
        } catch {
          // Ignore reward callback failures and continue the combat loop.
        }
      }
      this.pendingRespawnMs = 0;
      this.captureSequence = null;
      this.koAnimMs = 0;
      this.resetQueuedAttackState();
      this.clearProjectiles();
      this.clearFloatingTexts();
      this.hitEffects = [];
      this.resetCombatVisualTweens();
      this.lastTurnEvent = null;
      if (!this.enemy || this.enemy.hpCurrent <= 0) {
        this.spawnEnemy();
      }
    }
  }

  simulateAttackTickInstant(layout) {
    const turn = this.consumeTurnSlot();
    const attackerIndex = turn.slotIndex;
    const attacker = turn.attacker;
    const decision = this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    this.recordTurnEvent(attackerIndex, attacker, decision);
    if (decision.action !== TURN_ACTION_ATTACK) {
      if (attacker) {
        this.triggerSlotSkipTurnEffect(attackerIndex);
      }
      return;
    }

    const attackType = this.resolveAttackTypeForAttacker(attackerIndex, attacker);
    const impactPoint = this.getEnemyImpactPoint(layout);
    const queuedHits = [
      {
        attackType,
        attackerIndex,
        attackerNameFr: attacker.nameFr,
        targetX: impactPoint.x,
        targetY: impactPoint.y,
        suppressTurnEvent: false,
      },
    ];
    if (decision.talentId === TALENT_MIND_CONTROL_ID) {
      const supportSlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: true });
      const supportAttacker = supportSlotIndex >= 0 ? this.team[supportSlotIndex] : null;
      if (supportAttacker) {
        queuedHits.push({
          attackType: this.resolveAttackTypeForAttacker(supportSlotIndex, supportAttacker),
          attackerIndex: supportSlotIndex,
          attackerNameFr: supportAttacker.nameFr,
          targetX: impactPoint.x,
          targetY: impactPoint.y,
          suppressTurnEvent: true,
        });
      }
    }
    for (const hit of queuedHits) {
      this.applyHit(
        {
          attackType: hit.attackType,
          attackerIndex: hit.attackerIndex,
          attackerNameFr: hit.attackerNameFr,
          targetX: hit.targetX,
          targetY: hit.targetY,
        },
        {
          idleMode: true,
          suppressTurnEvent: hit.suppressTurnEvent,
          layout,
        },
      );
    }
  }

  updateIdleCombat(deltaMs, layout) {
    let remainingMs = Math.max(0, Number(deltaMs) || 0);
    let safety = 0;
    const safetyMax = Math.max(24, Math.ceil(remainingMs / Math.max(1, Math.min(this.attackIntervalMs, 250))) + 24);

    while (remainingMs > 0.01 && safety < safetyMax) {
      this.flushRespawnForIdleMode();
      if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
        break;
      }

      const timeToAttack = Math.max(0, Number(this.attackTimerMs) || 0);
      const timerRunning = this.isEnemyTimerRunning();
      const timeToTimeout = timerRunning ? Math.max(0, Number(this.enemyTimerMs) || 0) : Number.POSITIVE_INFINITY;
      let advanceMs = remainingMs;
      if (timeToAttack <= 0) {
        advanceMs = 0;
      } else {
        advanceMs = Math.min(advanceMs, timeToAttack);
      }
      if (timerRunning) {
        if (timeToTimeout <= 0) {
          advanceMs = 0;
        } else {
          advanceMs = Math.min(advanceMs, timeToTimeout);
        }
      }

      if (advanceMs > 0) {
        this.attackTimerMs -= advanceMs;
        this.advanceEnemyTimer(advanceMs);
        remainingMs -= advanceMs;
      }

      let eventHandled = false;
      if (this.attackTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.simulateAttackTickInstant(layout);
        this.attackTimerMs += this.attackIntervalMs;
        eventHandled = true;
      }
      if (this.isEnemyTimerRunning() && this.enemyTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.expireEnemyFromTimer();
        eventHandled = true;
      }

      safety += 1;
      if (!eventHandled && advanceMs <= 0) {
        break;
      }
    }
  }

  update(deltaMs, layout, options = {}) {
    const idleMode = Boolean(options.idleMode);
    this.setAttackInterval(this.getEffectiveAttackIntervalMs());
    this.updateFloatingTexts(deltaMs);
    this.updateHitEffects(deltaMs);
    this.updateKoTransition(deltaMs);
    this.updateSlotRecoil(deltaMs);
    this.updateSlotAttackFlash(deltaMs);
    this.updateSlotSkipTurnEffects(deltaMs);
    this.updateSlotTeleportScale(deltaMs);
    this.updateTeleportBoostVisuals(deltaMs);
    if (!layout) {
      return;
    }

    if (idleMode) {
      this.resetQueuedAttackState();
      this.updateIdleCombat(deltaMs, layout);
      this.clearProjectiles();
      this.clearFloatingTexts();
      this.hitEffects = [];
      this.resetCombatVisualTweens();
      return;
    }

    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    this.advanceEnemyTimer(deltaMs);
    this.attackTimerMs -= deltaMs;
    while (this.attackTimerMs <= 0) {
      if (this.isEnemyDefeatReserved()) {
        this.attackTimerMs = 0;
        break;
      }
      this.spawnNextProjectile(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    this.updateProjectiles(deltaMs, layout);
    if (this.isEnemyTimerRunning() && this.enemyTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0) {
      this.expireEnemyFromTimer();
    }
  }

  updateKoTransition(deltaMs) {
    if (this.koAnimMs > 0) {
      this.koAnimMs = Math.max(0, this.koAnimMs - deltaMs);
    }
    this.updateCaptureSequence(deltaMs);

    if (this.pendingRespawnMs <= 0) {
      return;
    }

    this.pendingRespawnMs = Math.max(0, this.pendingRespawnMs - deltaMs);
    if (this.pendingRespawnMs === 0) {
      const completedCapture = this.captureSequence;
      if (completedCapture && typeof completedCapture.onComplete === "function" && !completedCapture.onCompleteExecuted) {
        completedCapture.onCompleteExecuted = true;
        try {
          completedCapture.onComplete();
        } catch {
          // Ignore reward callback failures and continue the combat loop.
        }
      }
      this.captureSequence = null;
      this.spawnEnemy();
    }
  }

  updateCaptureSequence(deltaMs) {
    const sequence = this.captureSequence;
    if (!sequence) {
      return;
    }
    const isCritical = Boolean(sequence.isCritical);
    const celebrationParticles = shouldRenderCelebrationParticles();
    const ballTheme = getBallRenderTheme(sequence.ballType);

    sequence.elapsedMs = Math.min(sequence.totalMs, sequence.elapsedMs + deltaMs);
    const shakeEnd = CAPTURE_THROW_MS + CAPTURE_SHAKE_MS;

    if (sequence.captured && !sequence.burstSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.burstSpawned = true;
      const count = celebrationParticles ? (isCritical ? 24 : 14) : 0;
      for (let i = 0; i < count; i += 1) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.35;
        const speed = (isCritical ? 120 : 90) + Math.random() * (isCritical ? 190 : 150);
        const lifeMs = (isCritical ? 360 : 320) + Math.random() * (isCritical ? 460 : 380);
        const colorPool = isCritical ? ballTheme.criticalSuccessColors : ballTheme.successColors;
        const color = colorPool[i % colorPool.length] || [255, 255, 255];
        sequence.particles.push({
          kind: "success",
          x: sequence.targetX,
          y: sequence.targetY + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 16,
          size: 1.8 + Math.random() * 2.6,
          lifeMs,
          maxLifeMs: lifeMs,
          color,
        });
      }
    }

    if (!sequence.captured && !sequence.breakSpawned && sequence.elapsedMs >= shakeEnd) {
      sequence.breakSpawned = true;
      const pieces = celebrationParticles ? 10 : 0;
      for (let i = 0; i < pieces; i += 1) {
        const angle = (Math.PI * 2 * i) / pieces + Math.random() * 0.42;
        const speed = 60 + Math.random() * 170;
        const lifeMs = 260 + Math.random() * 240;
        sequence.particles.push({
          kind: "break",
          x: sequence.targetX,
          y: sequence.targetY + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 28,
          size: 2 + Math.random() * 2.7,
          rotation: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 9,
          lifeMs,
          maxLifeMs: lifeMs,
          color: ballTheme.breakColors[Math.floor(Math.random() * ballTheme.breakColors.length)] || [255, 255, 255],
        });
      }
    }

    const dt = deltaMs / 1000;
    const survivors = [];
    for (const particle of sequence.particles) {
      particle.lifeMs -= deltaMs;
      if (particle.lifeMs <= 0) {
        continue;
      }
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      particle.vy += 220 * dt;
      particle.vx *= clamp(1 - 1.8 * dt, 0.2, 1);
      if (particle.kind === "break") {
        particle.rotation += particle.spin * dt;
      }
      survivors.push(particle);
    }
    sequence.particles = survivors;
  }

  updateFloatingTexts(deltaMs) {
    const survivors = [];
    for (const text of this.floatingTexts) {
      text.lifeMs -= deltaMs;
      if (text.lifeMs <= 0) {
        stopFloatingTextVisualTween(text);
        continue;
      }
      text.x += text.vx * (deltaMs / 1000);
      text.y += text.vy * (deltaMs / 1000);
      text.vy += 30 * (deltaMs / 1000);
      survivors.push(text);
    }
    this.floatingTexts = survivors;
  }

  updateHitEffects(deltaMs) {
    const dt = deltaMs / 1000;
    const survivors = [];
    for (const effect of this.hitEffects) {
      effect.lifeMs -= deltaMs;
      if (effect.lifeMs <= 0) {
        continue;
      }

      if (effect.kind === "spark") {
        effect.x += effect.vx * dt;
        effect.y += effect.vy * dt;
        const drag = clamp(1 - 3.2 * dt, 0.15, 1);
        effect.vx *= drag;
        effect.vy = effect.vy * drag + 24 * dt;
      } else if (effect.kind === "ring") {
        effect.radius += effect.expandSpeed * dt;
      } else if (effect.kind === "teleport_flash") {
        effect.radius += (Number(effect.expandSpeed) || 180) * dt;
      }
      survivors.push(effect);
    }
    this.hitEffects = survivors;
  }

  enqueueAttackProjectile(layout, attackerIndex, attacker, options = {}) {
    const slot = layout?.teamSlots?.[attackerIndex];
    if (!attacker || !slot || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return null;
    }

    const attackType = String(options.attackType || this.resolveAttackTypeForAttacker(attackerIndex, attacker));
    const targetOffsetX = Number(options.targetOffsetX) || 0;
    const targetOffsetY = Number(options.targetOffsetY) || 0;
    const trailProfile = getProjectileTrailTypeVfxProfile(attackType);
    const trailStepDistance = clamp(
      Number(trailProfile.spacingPx) || PROJECTILE_TRAIL_POINT_BASE_SPACING_PX,
      PROJECTILE_TRAIL_POINT_MIN_SPACING_PX,
      PROJECTILE_TRAIL_POINT_MAX_SPACING_PX,
    );
    const startX = slot.x;
    const startY = slot.y - slot.size * 0.12;
    const impactPoint = this.getEnemyImpactPoint(layout);
    const targetX = impactPoint.x + targetOffsetX;
    const targetY = impactPoint.y + targetOffsetY;
    const precomputedHit = this.buildPrecomputedHitOutcome(attackerIndex, attacker, attackType);
    const rawTurnDecision = options?.turnDecision && typeof options.turnDecision === "object"
      ? options.turnDecision
      : this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    const turnDecision = {
      ...rawTurnDecision,
      action: TURN_ACTION_ATTACK,
    };
    const plannedDamage = Math.max(0, Number(precomputedHit.damage) || 0);
    const projectedHpAfter = Math.max(
      0,
      (Number(this.enemy.hpCurrent) || 0) - Math.max(0, Number(this.pendingEnemyDamage) || 0) - plannedDamage,
    );
    const reservesDefeat = plannedDamage > 0 && projectedHpAfter <= 0;
    if (plannedDamage > 0) {
      this.pendingEnemyDamage += plannedDamage;
    }
    if (reservesDefeat) {
      this.enemyDefeatReserved = true;
      this.enemyDefeatReservedBySlot = attackerIndex;
    }
    this.triggerSlotRecoil(attackerIndex);
    this.triggerSlotAttackFlash(attackerIndex);
    this.addAttackLaunchEffects({ attackType, startX, startY });
    const initialDistance = Math.hypot(targetX - startX, targetY - startY) || 1;
    const directionX = (targetX - startX) / initialDistance;
    const directionY = (targetY - startY) / initialDistance;
    const perpendicularX = -directionY;
    const perpendicularY = directionX;
    const arcDistanceScale = clamp(initialDistance / 260, 0.7, 1.3);
    const arcAmplitude =
      (PROJECTILE_TWEEN_ARC_BASE_PX + Math.random() * PROJECTILE_TWEEN_ARC_RANDOM_PX) *
      arcDistanceScale *
      (Math.random() < 0.5 ? -1 : 1);
    const travelDurationMs = clamp(
      Math.round((initialDistance / Math.max(1, PROJECTILE_SPEED_PX_PER_SECOND)) * 1000),
      PROJECTILE_TWEEN_DURATION_MIN_MS,
      PROJECTILE_TWEEN_DURATION_MAX_MS,
    );
    const projectile = {
      x: startX,
      y: startY,
      prevX: startX,
      prevY: startY,
      startX,
      startY,
      targetX,
      targetY,
      initialDistance,
      directionX,
      directionY,
      perpendicularX,
      perpendicularY,
      arcAmplitude,
      speed: PROJECTILE_SPEED_PX_PER_SECOND,
      travelDurationMs,
      travelTween: null,
      travelTweenState: null,
      travelTweenCompleted: false,
      radius: clamp(slot.size * 0.11, 6, 12),
      attackType,
      attackerIndex,
      attackerNameFr: attacker.nameFr,
      attackerSnapshot: {
        id: Number(attacker.id || 0),
        nameFr: String(attacker.nameFr || ""),
        talent: attacker.talent || null,
        offensiveType: attacker.offensiveType || null,
        defensiveTypes: Array.isArray(attacker.defensiveTypes) ? [...attacker.defensiveTypes] : [],
      },
      turnDecision,
      spinPhase: Math.random() * Math.PI * 2,
      spinVelocity: (1.8 + Math.random() * 2.2) * (Math.random() < 0.5 ? -1 : 1),
      rotation: 0,
      lifetimeMs: 0,
      trail: [],
      trailStepDistance,
      trailCarryDistance: trailStepDistance,
      precomputedHit,
      plannedDamage,
      reservesDefeat,
    };
    createProjectileTravelTween(projectile, travelDurationMs);
    this.projectiles.push(projectile);
    return projectile;
  }

  spawnNextProjectile(layout) {
    if (this.isEnemyDefeatReserved()) {
      return;
    }
    const turn = this.consumeTurnSlot();
    const attackerIndex = turn.slotIndex;
    const attacker = turn.attacker;
    const decision = this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    this.recordTurnEvent(attackerIndex, attacker, decision);
    if (decision.action !== TURN_ACTION_ATTACK || !attacker) {
      if (attacker && decision.action !== TURN_ACTION_ATTACK) {
        this.triggerSlotSkipTurnEffect(attackerIndex);
      }
      return;
    }

    const mainProjectile = this.enqueueAttackProjectile(layout, attackerIndex, attacker, { turnDecision: decision });
    if (!mainProjectile) {
      return;
    }

    if (decision.talentId === TALENT_MIND_CONTROL_ID && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyDefeatReserved()) {
      const supportSlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: true });
      const supportAttacker = supportSlotIndex >= 0 ? this.team[supportSlotIndex] : null;
      if (supportAttacker) {
        const supportDecision = this.resolveTurnDecisionForSlot(supportSlotIndex, supportAttacker);
        this.enqueueAttackProjectile(layout, supportSlotIndex, supportAttacker, {
          targetOffsetX: randomRange(-7, 7),
          targetOffsetY: randomRange(-5, 5),
          turnDecision: supportDecision,
        });
      }
    }
  }

  addAttackLaunchEffects({ attackType, startX, startY }) {
    const color = getTypeColor(attackType);
    this.hitEffects.push({
      kind: "ring",
      x: startX,
      y: startY,
      radius: 3,
      expandSpeed: 180,
      lifeMs: 125,
      maxLifeMs: 125,
      lineWidth: 1.6,
      color,
    });

    const launchCount = shouldRenderCelebrationParticles() ? 4 : 0;
    for (let i = 0; i < launchCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 58 + Math.random() * 120;
      const lifeMs = 100 + Math.random() * 150;
      this.hitEffects.push({
        kind: "spark",
        x: startX,
        y: startY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 22,
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.2 + Math.random() * 2.1,
        color,
      });
    }
  }

  updateProjectiles(deltaMs, layout) {
    const survivors = [];
    const dt = deltaMs / 1000;
    const trailMaxPoints = getProjectileTrailMaxPoints();

    for (const projectile of this.projectiles) {
      projectile.prevX = projectile.x;
      projectile.prevY = projectile.y;
      const impactPoint = this.getEnemyImpactPoint(layout);
      projectile.targetX = impactPoint.x;
      projectile.targetY = impactPoint.y;
      projectile.lifetimeMs += deltaMs;
      const tweenProgress = clamp(Number(projectile.travelTweenState?.progress || 0), 0, 1);
      const startX = Number(projectile.startX ?? projectile.x ?? 0);
      const startY = Number(projectile.startY ?? projectile.y ?? 0);
      const targetX = Number(projectile.targetX ?? startX);
      const targetY = Number(projectile.targetY ?? startY);
      const travelX = targetX - startX;
      const travelY = targetY - startY;
      const travelDistance = Math.max(0.0001, Math.hypot(travelX, travelY));
      const perpendicularX = -travelY / travelDistance;
      const perpendicularY = travelX / travelDistance;
      const arcAmplitude = Number(projectile.arcAmplitude || 0);
      const arcRatio = Math.sin(tweenProgress * Math.PI);
      const arcOffsetX = perpendicularX * arcAmplitude * arcRatio;
      const arcOffsetY = perpendicularY * arcAmplitude * arcRatio;

      projectile.x = startX + travelX * tweenProgress + arcOffsetX;
      projectile.y = startY + travelY * tweenProgress + arcOffsetY;
      projectile.spinPhase += projectile.spinVelocity * dt;
      const movementX = projectile.x - projectile.prevX;
      const movementY = projectile.y - projectile.prevY;
      const movementDistance = Math.hypot(movementX, movementY);
      if (movementDistance > 0.0001) {
        projectile.rotation = Math.atan2(movementY, movementX) + projectile.spinPhase * 0.24;
      }

      const timeoutMs = Math.max(1000, Number(projectile.travelDurationMs || 0) + 520);
      const hasArrived = tweenProgress >= 0.999 || projectile.travelTweenCompleted;
      if (hasArrived || projectile.lifetimeMs > timeoutMs) {
        stopProjectileTravelTween(projectile);
        this.applyHit(projectile, { layout });
        continue;
      }

      if (trailMaxPoints > 0) {
        const existingTrail = Array.isArray(projectile.trail) ? projectile.trail : [];
        let writeIndex = 0;
        for (const point of existingTrail) {
          point.lifeMs -= deltaMs;
          if (point.lifeMs > 0) {
            existingTrail[writeIndex] = point;
            writeIndex += 1;
          }
        }
        existingTrail.length = writeIndex;

        const stepDistance = clamp(
          Number(projectile.trailStepDistance) || PROJECTILE_TRAIL_POINT_BASE_SPACING_PX,
          PROJECTILE_TRAIL_POINT_MIN_SPACING_PX,
          PROJECTILE_TRAIL_POINT_MAX_SPACING_PX,
        );
        const carryDistance = clamp(Number(projectile.trailCarryDistance) || 0, 0, stepDistance - 0.001);
        const totalDistance = carryDistance + movementDistance;
        if (existingTrail.length <= 0) {
          existingTrail.push(createProjectileTrailPoint(projectile.prevX, projectile.prevY));
        }
        if (movementDistance > 0.0001 && totalDistance >= stepDistance) {
          const sampleCount = Math.min(4, Math.floor(totalDistance / stepDistance));
          const firstDistance = stepDistance - carryDistance;
          for (let sampleIndex = 0; sampleIndex < sampleCount; sampleIndex += 1) {
            const sampleDistance = firstDistance + sampleIndex * stepDistance;
            const t = clamp(sampleDistance / movementDistance, 0, 1);
            existingTrail.push(
              createProjectileTrailPoint(
                projectile.prevX + movementX * t,
                projectile.prevY + movementY * t,
              ),
            );
          }
          projectile.trailCarryDistance = totalDistance - sampleCount * stepDistance;
        } else {
          projectile.trailCarryDistance = totalDistance;
        }
        if (existingTrail.length > trailMaxPoints) {
          existingTrail.splice(0, existingTrail.length - trailMaxPoints);
        }
        projectile.trail = existingTrail;
      } else if (Array.isArray(projectile.trail) && projectile.trail.length > 0) {
        projectile.trail.length = 0;
        projectile.trailCarryDistance = 0;
      }

      survivors.push(projectile);
    }

    this.projectiles = survivors;
  }

  addFloatingDamageText({
    damage,
    attackType,
    typeMultiplier,
    isCritical = false,
    targetX,
    targetY,
    isMiss = false,
    targetVisualSize = 0,
  }) {
    const safeMultiplier = Math.max(0, Number(typeMultiplier) || 0);
    const tone = resolveFloatingDamageTone({
      isMiss,
      typeMultiplier: safeMultiplier,
      isCritical,
    });
    const labels = buildFloatingDamageLabels({
      isMiss,
      typeMultiplier: safeMultiplier,
      isCritical,
    });
    const palette = getFloatingTextTonePalette(tone);
    const toneStyle = getFloatingTextToneVisualStyle(tone);
    const damageValue = isMiss ? 0 : Math.max(0, Number(damage) || 0);
    const damageScaleBoost = isMiss
      ? 0
      : clamp(
          Math.log10(damageValue + 1) * 0.22
            + (safeMultiplier >= 1.999 ? 0.09 : 0)
            + (isCritical ? 0.2 : 0),
          0,
          0.68,
        );
    const visualTween = createFloatingTextVisualTween(FLOATING_TEXT_LIFETIME_MS, {
      tone,
      scaleBoost: damageScaleBoost,
      intensityBoost: isCritical ? 0.4 : safeMultiplier >= 1.999 ? 0.2 : 0,
    });

    const safeVisualSize = Math.max(0, Number(targetVisualSize) || 0);
    const extraSpawnLiftY = Math.max(24, safeVisualSize * 0.52);

    this.floatingTexts.push({
      x: targetX + (Math.random() - 0.5) * toneStyle.spawnJitterX,
      y: targetY - toneStyle.spawnLiftY - extraSpawnLiftY,
      vx: 0,
      vy: -toneStyle.verticalRiseSpeed - Math.random() * toneStyle.verticalRiseVariance,
      lifeMs: FLOATING_TEXT_LIFETIME_MS,
      maxLifeMs: FLOATING_TEXT_LIFETIME_MS,
      damage: isMiss ? 0 : damage,
      isMiss,
      label: labels.summary,
      labelPrimary: labels.primary,
      labelSecondary: labels.secondary,
      hasEffectivenessLabel: Boolean(labels.hasEffectivenessLabel),
      hasCriticalLabel: Boolean(labels.hasCriticalLabel),
      attackType,
      tone,
      color: palette.main,
      colorSecondary: palette.secondary,
      alphaFactor: palette.alpha,
      pulseStrength: toneStyle.pulseStrength,
      scaleFactor: 0.9 + damageScaleBoost * 0.32,
      swayPhase: Math.random() * Math.PI * 2,
      swayAmplitudePx: 10 + Math.random() * 12 + (isCritical ? 3.2 : 0),
      swayFrequencyHz: 1.9 + Math.random() * 1.4,
      visualTween,
    });
  }

  addEnemyHitEffects({ attackType, typeMultiplier, isCritical = false, targetX, targetY, damage }) {
    const safeMultiplier = Math.max(0, Number(typeMultiplier) || 0);
    const tone = resolveFloatingDamageTone({
      isMiss: false,
      typeMultiplier: safeMultiplier,
      isCritical,
    });
    const palette = getFloatingTextTonePalette(tone);
    const color = blendRgb(palette.main, palette.secondary, 0.35);
    const impactFactorBase = safeMultiplier >= 2
      ? 1.25
      : safeMultiplier > 0 && safeMultiplier < 1
        ? 0.9
        : safeMultiplier <= 0.001
          ? 0.72
          : 1;
    const impactFactor = impactFactorBase * (isCritical ? 1.18 : 1);
    this.triggerEnemyHitPulse(120);

    this.hitEffects.push({
      kind: "ring",
      x: targetX,
      y: targetY,
      radius: 7,
      expandSpeed: 220 * impactFactor,
      lifeMs: 170,
      maxLifeMs: 170,
      lineWidth: 2.4,
      color,
    });

    const particleCount = shouldRenderCelebrationParticles()
      ? clamp(Math.round(4 + damage / 28), 4, 8)
      : 0;
    for (let i = 0; i < particleCount; i += 1) {
      const angle = Math.random() * Math.PI * 2;
      const speed = (85 + Math.random() * 190) * impactFactor;
      const lifeMs = 150 + Math.random() * 190;
      this.hitEffects.push({
        kind: "spark",
        x: targetX + Math.cos(angle) * 4,
        y: targetY + Math.sin(angle) * 4,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 18,
        lifeMs,
        maxLifeMs: lifeMs,
        size: 1.8 + Math.random() * 2.8,
        color,
      });
    }
  }

  applyHit(projectile, options = {}) {
    const idleMode = Boolean(options.idleMode);
    const suppressTurnEvent = Boolean(options.suppressTurnEvent);
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      this.consumeQueuedProjectileDamage(projectile);
      return;
    }

    const attackerSnapshot = projectile?.attackerSnapshot && typeof projectile.attackerSnapshot === "object"
      ? projectile.attackerSnapshot
      : null;
    const attacker = attackerSnapshot || this.team[projectile.attackerIndex];
    if (!attacker) {
      this.consumeQueuedProjectileDamage(projectile);
      return;
    }
    const decision = projectile?.turnDecision && typeof projectile.turnDecision === "object"
      ? projectile.turnDecision
      : this.resolveTurnDecisionForSlot(projectile.attackerIndex, attacker);

    const precomputedHit = projectile?.precomputedHit && typeof projectile.precomputedHit === "object"
      ? projectile.precomputedHit
      : null;
    const attackType = String(
      precomputedHit?.attackType
      || projectile?.attackType
      || attacker.offensiveType
      || attacker.defensiveTypes?.[0]
      || "normal",
    );
    const missed = precomputedHit
      ? Boolean(precomputedHit.missed)
      : (!hasAlwaysHitTalent(attacker?.talent, attacker?.id) && Math.random() < ATTACK_MISS_CHANCE);
    if (missed) {
      this.consumeQueuedProjectileDamage(projectile);
      this.lastImpact = {
        attackerNameFr: attacker.nameFr,
        attackType,
        damage: 0,
        typeMultiplier: 1,
        enemyNameFr: this.enemy.nameFr,
        isCritical: false,
        missed: true,
      };
      if (!suppressTurnEvent) {
        this.recordTurnEvent(projectile.attackerIndex, attacker, {
          action: TURN_ACTION_ATTACK,
          reason: "hit_missed",
          talentId: decision.talentId,
          passiveBehaviorId: decision.passiveBehaviorId,
        }, {
          damage: 0,
          type_multiplier: 1,
          is_critical: false,
          missed: true,
        });
      }
      if (!idleMode) {
        const enemyVisualSize = Math.max(
          0,
          Number(options.layout?.enemySize) || Number(state.layout?.enemySize) || 0,
        );
        this.addFloatingDamageText({
          damage: 0,
          attackType,
          typeMultiplier: 1,
          isCritical: false,
          targetX: projectile.targetX,
          targetY: projectile.targetY,
          isMiss: true,
          targetVisualSize: enemyVisualSize,
        });
      }
      const teleportSwapResult = this.tryApplyTeleportSwap(
        projectile.attackerIndex,
        attacker,
        {
          ...decision,
          action: TURN_ACTION_ATTACK,
        },
        options.layout,
        { idleMode },
      );
      if (!suppressTurnEvent && teleportSwapResult?.swapped && this.lastTurnEvent) {
        this.lastTurnEvent.teleport_swap = true;
        this.lastTurnEvent.teleport_swap_from_slot = teleportSwapResult.fromSlotIndex;
        this.lastTurnEvent.teleport_swap_to_slot = teleportSwapResult.toSlotIndex;
        this.lastTurnEvent.teleport_boosted_slot = teleportSwapResult.boostedSlotIndex;
      }
      return;
    }

    let typeMultiplier;
    let teamAuraAttackBonus;
    let teleportDamageBoost;
    let isCriticalHit;
    let baseDamage;
    if (precomputedHit) {
      typeMultiplier = Number(precomputedHit.typeMultiplier || 1);
      teamAuraAttackBonus = Math.max(0, Number(precomputedHit.teamAuraAttackBonus) || 0);
      teleportDamageBoost = Math.max(1, Number(precomputedHit.teleportDamageBoost || 1));
      isCriticalHit = Boolean(precomputedHit.isCritical);
      baseDamage = Math.max(0, Number(precomputedHit.damage || 0));
    } else {
      typeMultiplier = getTypeMultiplier(attackType, this.enemy.defensiveTypes);
      const critChanceBonus = getTalentCritBonusChance(attacker?.talent, attacker?.id);
      teamAuraAttackBonus = this.getTeamAuraAttackBonusForAttacker(projectile.attackerIndex, attacker);
      teleportDamageBoost = this.consumeTeleportDamageBoostForSlot(projectile.attackerIndex);
      const damageOutcome = computeDamage(attacker, this.enemy, attackType, typeMultiplier, {
        critChanceBonus,
        damageMultiplier: (1 + teamAuraAttackBonus) * teleportDamageBoost,
      });
      baseDamage = Math.max(0, Number(damageOutcome?.damage || 0));
      isCriticalHit = Boolean(damageOutcome?.isCritical);
    }
    const damage = baseDamage <= 0 ? 0 : Math.max(1, Math.round(baseDamage));

    this.consumeQueuedProjectileDamage(projectile);
    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    if (damage > 0) {
      this.triggerEnemyDamageFlash(ENEMY_DAMAGE_FLASH_DURATION_MS);
    }
    this.lastImpact = {
      attackerNameFr: attacker.nameFr,
      attackType,
      damage,
      typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
      isCritical: isCriticalHit,
      missed: false,
    };
    if (!suppressTurnEvent) {
      this.recordTurnEvent(projectile.attackerIndex, attacker, {
        action: TURN_ACTION_ATTACK,
        reason: "hit_resolved",
        talentId: decision.talentId,
        passiveBehaviorId: decision.passiveBehaviorId,
      }, {
        damage,
        type_multiplier: Math.round(typeMultiplier * 1000) / 1000,
        is_critical: isCriticalHit,
        missed: false,
        team_aura_attack_bonus_pct: Math.round(Math.max(0, teamAuraAttackBonus) * 10000) / 100,
        teleport_damage_boost_pct: Math.round((Math.max(1, teleportDamageBoost) - 1) * 10000) / 100,
      });
    }
    if (!idleMode) {
      const enemyVisualSize = Math.max(
        0,
        Number(options.layout?.enemySize) || Number(state.layout?.enemySize) || 0,
      );
      this.addFloatingDamageText({
        damage,
        attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
        targetVisualSize: enemyVisualSize,
      });
      this.addEnemyHitEffects({
        damage,
        attackType,
        typeMultiplier,
        isCritical: isCriticalHit,
        targetX: projectile.targetX,
        targetY: projectile.targetY,
      });
    }
    const enemyDefeatedByThisHit = Boolean(this.enemy && this.enemy.hpCurrent <= 0 && !this.isEnemyRespawning());
    if (enemyDefeatedByThisHit) {
      const deferredTeleportPlan = this.buildTeleportSwapPlan(
        projectile.attackerIndex,
        attacker,
        {
          ...decision,
          action: TURN_ACTION_ATTACK,
        },
      );
      if (deferredTeleportPlan) {
        this.queueTeleportSwapAfterRespawn(deferredTeleportPlan);
        if (!suppressTurnEvent && this.lastTurnEvent) {
          this.lastTurnEvent.teleport_swap = true;
          this.lastTurnEvent.teleport_swap_from_slot = deferredTeleportPlan.attackerSlotIndex;
          this.lastTurnEvent.teleport_swap_to_slot = deferredTeleportPlan.allySlotIndex;
          this.lastTurnEvent.teleport_boosted_slot = deferredTeleportPlan.teleportPlusPlus
            ? deferredTeleportPlan.attackerSlotIndex
            : -1;
          this.lastTurnEvent.teleport_swap_deferred_until_next_spawn = true;
        }
      }
    } else {
      const teleportSwapResult = this.tryApplyTeleportSwap(
        projectile.attackerIndex,
        attacker,
        {
          ...decision,
          action: TURN_ACTION_ATTACK,
        },
        options.layout,
        { idleMode },
      );
      if (!suppressTurnEvent && teleportSwapResult?.swapped && this.lastTurnEvent) {
        this.lastTurnEvent.teleport_swap = true;
        this.lastTurnEvent.teleport_swap_from_slot = teleportSwapResult.fromSlotIndex;
        this.lastTurnEvent.teleport_swap_to_slot = teleportSwapResult.toSlotIndex;
        this.lastTurnEvent.teleport_boosted_slot = teleportSwapResult.boostedSlotIndex;
      }
    }

    if (this.enemy && this.enemy.hpCurrent <= 0 && !this.isEnemyRespawning()) {
      const defeatedEnemy = this.enemy;
      this.resetQueuedAttackState();
      this.enemiesDefeated += 1;
      this.defeatedEnemyName = this.enemy.nameFr;
      let captureResult = { captured: false, capture_attempted: false };
      try {
        captureResult = this.onEnemyDefeated(defeatedEnemy) || captureResult;
      } catch {
        captureResult = { captured: false, capture_attempted: false };
      }

      const captured = Boolean(captureResult?.captured);
      const captureAttempted = Boolean(captureResult?.capture_attempted);
      const captureCritical = Boolean(captureResult?.capture_critical);
      if (idleMode) {
        this.captureSequence = null;
        this.pendingRespawnMs = 0;
        this.koAnimMs = 0;
        this.clearProjectiles();
        this.resetCombatVisualTweens();
        this.hitEffects = [];
        this.clearFloatingTexts();
        this.spawnEnemy();
        return;
      }

       if (captureAttempted) {
         const captureChanceDisplay = Number(captureResult?.capture_chance_display);
         const captureOnComplete = captureResult?.capture_on_complete;
         const captureBallType = normalizeBallTypeForVisual(captureResult?.capture_ball_type || "poke_ball");
         this.captureSequence = {
           captured,
           isCritical: captureCritical,
           ballType: captureBallType,
           chanceDisplay: Number.isFinite(captureChanceDisplay) ? clamp(captureChanceDisplay, 0, 1) : null,
           onComplete: typeof captureOnComplete === "function" ? captureOnComplete : null,
           elapsedMs: 0,
           totalMs: this.buildCaptureTotalMs(captured),
           targetX: projectile.targetX,
           targetY: projectile.targetY,
           startX: projectile.targetX + 220,
          startY: projectile.targetY + 120,
          burstSpawned: false,
          breakSpawned: false,
          particles: [],
        };
        this.pendingRespawnMs = this.captureSequence.totalMs;
        this.koAnimMs = 0;
      } else {
        this.captureSequence = null;
        this.pendingRespawnMs = this.enemyRespawnDelayMs;
        this.koAnimMs = KO_ANIMATION_DURATION_MS;
      }
      this.clearProjectiles();
      this.resetCombatVisualTweens();
      this.hitEffects = [];
    }
  }

  spawnEnemy() {
    const source = this.createEnemy();
    if (!source) {
      this.enemy = null;
      this.resetCombatVisualTweens();
      this.resetQueuedAttackState();
      this.enemyTimerEnabled = false;
      this.enemyTimerDurationMs = 0;
      this.enemyTimerMs = 0;
      this.enemyTimerStyle = ENEMY_TIMER_STYLE_ROUTE;
      return;
    }

    this.enemy = {
      ...source,
      hpCurrent: source.hpMax,
    };
    this.clearProjectiles();
    this.hitEffects = [];
    this.resetCombatVisualTweens();
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.resetQueuedAttackState();
    this.defeatedEnemyName = null;
    this.captureSequence = null;
    this.lastTurnEvent = null;
    const deferredSwapResult = this.applyPendingTeleportSwapAfterRespawn(state.layout, { idleMode: false });
    this.resetEnemyTimer();
    this.onEnemySpawn(this.enemy);
  }
}

  return {
    PokemonBattleManager,
    getProjectileSprite,
  };
}
