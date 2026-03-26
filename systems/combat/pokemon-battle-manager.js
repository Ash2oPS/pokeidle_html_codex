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

function fallbackEaseOutBack(t) {
  const value = Number(t) || 0;
  const c1 = 1.70158;
  const c3 = c1 + 1;
  const shifted = value - 1;
  return 1 + c3 * shifted * shifted * shifted + c1 * shifted * shifted;
}

function fallbackEaseOutQuad(t) {
  const value = Number(t) || 0;
  const shifted = 1 - value;
  return 1 - shifted * shifted;
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
    easeOutBack = fallbackEaseOutBack,
    easeOutQuad = fallbackEaseOutQuad,
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
    LASER_TICK_INTERVAL_MULTIPLIER = 1,
    LASER_TICK_JITTER_MS = 100,
    LASER_DAMAGE_PER_TICK_DIVISOR = 6,
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
    ENEMY_ENTER_ANIM_DURATION_MS = 400,
    ENEMY_ENTER_ANIM_OFFSET_PX = 100,
    ENEMY_ENTER_ANIM_ROTATION_DEG = 10,
    ENEMY_ENTER_ANIM_FADE_RATIO = 0.7,
    ENEMY_ENTER_ANIM_ROTATE_RATIO = 0.5,
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

  const ATTACK_MODE_PROJECTILE = "projectile";
  const ATTACK_MODE_LASER = "laser";

  function normalizeAttackMode(mode, fallback = ATTACK_MODE_PROJECTILE) {
    const normalized = String(mode || "").toLowerCase().trim();
    if (normalized === ATTACK_MODE_LASER) {
      return ATTACK_MODE_LASER;
    }
    if (normalized === ATTACK_MODE_PROJECTILE || normalized === `${ATTACK_MODE_PROJECTILE}s`) {
      return ATTACK_MODE_PROJECTILE;
    }
    return fallback;
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
    defaultAttackMode = ATTACK_MODE_LASER,
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
    this.defaultAttackMode = normalizeAttackMode(defaultAttackMode, ATTACK_MODE_LASER);
    this.turnIndex = 0;
    this.projectiles = [];
    this.laserStates = Array.from({ length: MAX_TEAM_SIZE }, (_, slotIndex) => this.createLaserState(slotIndex));
    this.activeLaserView = [];
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
    this.enemyEnterAnim = {
      active: false,
      elapsedMs: Math.max(1, toSafeInt(ENEMY_ENTER_ANIM_DURATION_MS, 400)),
      durationMs: Math.max(1, toSafeInt(ENEMY_ENTER_ANIM_DURATION_MS, 400)),
      direction: 1,
      offsetPx: Math.max(0, Number(ENEMY_ENTER_ANIM_OFFSET_PX) || 100),
      rotationRad: (Math.max(0, Number(ENEMY_ENTER_ANIM_ROTATION_DEG) || 10) * Math.PI) / 180,
      fadeRatio: clamp(Number(ENEMY_ENTER_ANIM_FADE_RATIO) || 0.7, 0.05, 1),
      rotateRatio: clamp(Number(ENEMY_ENTER_ANIM_ROTATE_RATIO) || 0.5, 0.05, 1),
    };
    this.pendingEnemyDamage = 0;
    this.enemyDefeatReserved = false;
    this.enemyDefeatReservedBySlot = -1;
    this.spawnEnemy();
  }

  createLaserState(slotIndex, overrides = {}) {
    const initialTickIntervalMs = this.rollLaserTickIntervalMs();
    return {
      slotIndex: clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1),
      active: false,
      attackType: "normal",
      attackerNameFr: null,
      sourceX: 0,
      sourceY: 0,
      targetX: 0,
      targetY: 0,
      visualSourceInsetPx: 0,
      visualTargetInsetPx: 0,
      tickIntervalMs: initialTickIntervalMs,
      tickTimerMs: initialTickIntervalMs,
      damageCarry: 0,
      phaseOffset: randomRange(0, Math.PI * 2),
      talentGateReady: false,
      pendingTurnDecision: null,
      ...overrides,
    };
  }

  getLaserTickJitterMs() {
    return Math.max(0, Number(LASER_TICK_JITTER_MS) || 0);
  }

  getLaserTickIntervalMultiplier() {
    return Math.max(0.01, Number(LASER_TICK_INTERVAL_MULTIPLIER) || 1);
  }

  getLaserDamagePerTickDivisor() {
    return Math.max(1, Number(LASER_DAMAGE_PER_TICK_DIVISOR) || 1);
  }

  getLaserTickIntervalBoundsMs(attackIntervalMs = this.attackIntervalMs) {
    const baseIntervalMs =
      Math.max(1, Number(attackIntervalMs) || ATTACK_INTERVAL_MS) * this.getLaserTickIntervalMultiplier();
    const jitterMs = this.getLaserTickJitterMs();
    const minIntervalMs = Math.max(1, baseIntervalMs - jitterMs);
    const maxIntervalMs = Math.max(minIntervalMs, baseIntervalMs + jitterMs);
    return {
      baseIntervalMs,
      minIntervalMs,
      maxIntervalMs,
    };
  }

  getLaserTickIntervalMs() {
    return this.getLaserTickIntervalBoundsMs().baseIntervalMs;
  }

  normalizeLaserTickIntervalMs(intervalMs, attackIntervalMs = this.attackIntervalMs) {
    const bounds = this.getLaserTickIntervalBoundsMs(attackIntervalMs);
    const numeric = Number(intervalMs);
    if (!Number.isFinite(numeric) || numeric <= 0) {
      return bounds.baseIntervalMs;
    }
    return clamp(numeric, bounds.minIntervalMs, bounds.maxIntervalMs);
  }

  rollLaserTickIntervalMs(attackIntervalMs = this.attackIntervalMs) {
    const bounds = this.getLaserTickIntervalBoundsMs(attackIntervalMs);
    if (bounds.maxIntervalMs - bounds.minIntervalMs <= 0.000001) {
      return bounds.baseIntervalMs;
    }
    const rolled = Number(randomRange(bounds.minIntervalMs, bounds.maxIntervalMs));
    if (!Number.isFinite(rolled)) {
      return bounds.baseIntervalMs;
    }
    return clamp(rolled, bounds.minIntervalMs, bounds.maxIntervalMs);
  }

  scheduleNextLaserTick(laserState) {
    if (!laserState) {
      return;
    }
    const nextTickIntervalMs = this.rollLaserTickIntervalMs();
    laserState.tickIntervalMs = nextTickIntervalMs;
    const timer = Number(laserState.tickTimerMs);
    if (!Number.isFinite(timer)) {
      laserState.tickTimerMs = nextTickIntervalMs;
      return;
    }
    laserState.tickTimerMs = timer + nextTickIntervalMs;
  }

  clearLasers(options = {}) {
    const preserveDamageCarry = options.preserveDamageCarry === true;
    const preserveTickTimers = options.preserveTickTimers === true;
    this.laserStates = Array.from({ length: MAX_TEAM_SIZE }, (_, slotIndex) => {
      const previous = this.laserStates?.[slotIndex];
      const preservedTickIntervalMs = preserveTickTimers
        ? this.normalizeLaserTickIntervalMs(previous?.tickIntervalMs)
        : this.rollLaserTickIntervalMs();
      return this.createLaserState(slotIndex, {
        damageCarry: preserveDamageCarry ? Math.max(0, Number(previous?.damageCarry) || 0) : 0,
        tickIntervalMs: preservedTickIntervalMs,
        tickTimerMs: preserveTickTimers
          ? Math.min(
            Math.max(0, Number(previous?.tickTimerMs) || preservedTickIntervalMs),
            preservedTickIntervalMs,
          )
          : preservedTickIntervalMs,
      });
    });
  }

  getLasers() {
    const activeLaserView = Array.isArray(this.activeLaserView) ? this.activeLaserView : [];
    activeLaserView.length = 0;
    for (const laser of this.laserStates || []) {
      if (laser?.active) {
        activeLaserView.push(laser);
      }
    }
    this.activeLaserView = activeLaserView;
    return activeLaserView;
  }

  getActiveLaserCount() {
    let count = 0;
    for (const laser of this.laserStates || []) {
      if (laser?.active) {
        count += 1;
      }
    }
    return count;
  }

  hasLiveLaserRuntimeState() {
    for (const laser of this.laserStates || []) {
      if (!laser) {
        continue;
      }
      if (
        laser.active
        || Math.max(0, Number(laser.damageCarry) || 0) > 0
        || laser.pendingTurnDecision
      ) {
        return true;
      }
    }
    return false;
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
    const prevBounds = this.getLaserTickIntervalBoundsMs(prevInterval);
    const nextBounds = this.getLaserTickIntervalBoundsMs(nextInterval);
    const prevRange = Math.max(0, prevBounds.maxIntervalMs - prevBounds.minIntervalMs);
    const nextRange = Math.max(0, nextBounds.maxIntervalMs - nextBounds.minIntervalMs);
    const timer = Number(this.attackTimerMs);
    if (!Number.isFinite(timer)) {
      this.attackIntervalMs = nextInterval;
      this.attackTimerMs = nextInterval;
      for (const laserState of this.laserStates || []) {
        if (!laserState) {
          continue;
        }
        laserState.tickIntervalMs = nextBounds.baseIntervalMs;
        laserState.tickTimerMs = nextBounds.baseIntervalMs;
      }
      return;
    }
    if (Math.abs(nextInterval - prevInterval) > 0.01) {
      const remainingRatio = clamp(timer / prevInterval, 0, 1);
      this.attackTimerMs = nextInterval * remainingRatio;
      for (const laserState of this.laserStates || []) {
        if (!laserState) {
          continue;
        }
        const prevTickIntervalMs = this.normalizeLaserTickIntervalMs(laserState.tickIntervalMs, prevInterval);
        const intervalRatio = prevRange <= 0.000001
          ? 0.5
          : clamp((prevTickIntervalMs - prevBounds.minIntervalMs) / prevRange, 0, 1);
        const nextTickIntervalMs = nextRange <= 0.000001
          ? nextBounds.baseIntervalMs
          : nextBounds.minIntervalMs + nextRange * intervalRatio;
        laserState.tickIntervalMs = this.normalizeLaserTickIntervalMs(nextTickIntervalMs, nextInterval);
        const tickTimer = Number(laserState.tickTimerMs);
        if (!Number.isFinite(tickTimer)) {
          laserState.tickTimerMs = laserState.tickIntervalMs;
          continue;
        }
        const tickRemainingRatio = clamp(tickTimer / Math.max(1, prevTickIntervalMs), 0, 1);
        laserState.tickTimerMs = laserState.tickIntervalMs * tickRemainingRatio;
      }
    }
    this.attackIntervalMs = nextInterval;
  }

  advanceAttackTimerDuringDowntime(deltaMs) {
    if (this.captureSequence) {
      return;
    }
    const safeDeltaMs = Math.max(0, Number(deltaMs) || 0);
    if (safeDeltaMs <= 0) {
      return;
    }
    const currentTimer = Number(this.attackTimerMs);
    if (!Number.isFinite(currentTimer)) {
      this.attackTimerMs = Math.max(1, this.getEffectiveAttackIntervalMs());
      return;
    }
    this.attackTimerMs = Math.max(0, currentTimer - safeDeltaMs);
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
    this.clearLasers();
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

  resolveAttackModeForAttacker(attackerIndex, attacker = this.team[attackerIndex] || null) {
    if (!attacker) {
      return normalizeAttackMode(this.defaultAttackMode, ATTACK_MODE_LASER);
    }
    return normalizeAttackMode(attacker.attackMode, this.defaultAttackMode);
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

  buildAttackerSnapshot(attacker) {
    if (!attacker || typeof attacker !== "object") {
      return null;
    }
    return {
      id: Number(attacker.id || 0),
      nameFr: String(attacker.nameFr || ""),
      level: Math.max(1, Number(attacker.level || 1)),
      stats: attacker.stats && typeof attacker.stats === "object"
        ? { ...attacker.stats }
        : null,
      talent: attacker.talent || null,
      offensiveType: attacker.offensiveType || null,
      defensiveTypes: Array.isArray(attacker.defensiveTypes) ? [...attacker.defensiveTypes] : [],
      attackMode: attacker.attackMode || null,
    };
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

  resetEnemyEnterAnimation() {
    if (!this.enemyEnterAnim) {
      return;
    }
    this.enemyEnterAnim.active = false;
    this.enemyEnterAnim.elapsedMs = this.enemyEnterAnim.durationMs;
    this.enemyEnterAnim.direction = 1;
  }

  startEnemyEnterAnimation() {
    if (!this.enemyEnterAnim || !this.enemy) {
      return;
    }
    this.enemyEnterAnim.active = true;
    this.enemyEnterAnim.elapsedMs = 0;
    this.enemyEnterAnim.direction = randomInt(0, 1) === 0 ? 1 : -1;
  }

  updateEnemyEnterAnimation(deltaMs) {
    if (!this.enemyEnterAnim || !this.enemyEnterAnim.active) {
      return;
    }
    const safeDelta = Math.max(0, Number(deltaMs) || 0);
    const durationMs = Math.max(1, Number(this.enemyEnterAnim.durationMs) || 1);
    this.enemyEnterAnim.elapsedMs = Math.min(durationMs, this.enemyEnterAnim.elapsedMs + safeDelta);
    if (this.enemyEnterAnim.elapsedMs >= durationMs) {
      this.enemyEnterAnim.active = false;
      this.enemyEnterAnim.elapsedMs = durationMs;
    }
  }

  isEnemyEntering() {
    return Boolean(this.enemy && this.enemyEnterAnim?.active);
  }

  getEnemyEnterAnimationState() {
    if (!this.enemy) {
      return {
        active: false,
        progress: 1,
        alpha: 1,
        offset_x: 0,
        rotation_rad: 0,
      };
    }
    const anim = this.enemyEnterAnim;
    if (!anim?.active) {
      return {
        active: false,
        progress: 1,
        alpha: 1,
        offset_x: 0,
        rotation_rad: 0,
      };
    }
    const durationMs = Math.max(1, Number(anim.durationMs) || 1);
    const elapsedMs = clamp(Number(anim.elapsedMs) || 0, 0, durationMs);
    const progress = clamp(elapsedMs / durationMs, 0, 1);
    const direction = Number(anim.direction || 1) >= 0 ? 1 : -1;
    const moveRatio = easeOutBack(progress);
    const fadeDurationMs = Math.max(1, durationMs * clamp(Number(anim.fadeRatio) || 0.7, 0.05, 1));
    const fadeRatio = clamp(elapsedMs / fadeDurationMs, 0, 1);
    const alpha = clamp(easeOutBack(fadeRatio), 0, 1);
    const rotationDurationMs = Math.max(1, durationMs * clamp(Number(anim.rotateRatio) || 0.5, 0.05, 1));
    const rotationRatio = clamp(elapsedMs / rotationDurationMs, 0, 1);
    const rotationProgress = clamp(easeOutQuad(rotationRatio), 0, 1);
    const startOffsetX = -Math.max(0, Number(anim.offsetPx) || 0) * direction;
    const startRotation = -Math.max(0, Number(anim.rotationRad) || 0) * direction;
    return {
      active: true,
      progress,
      alpha,
      offset_x: startOffsetX * (1 - moveRatio),
      rotation_rad: startRotation * (1 - rotationProgress),
    };
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
    return this.enemyTimerEnabled
      && Boolean(this.enemy)
      && this.enemy.hpCurrent > 0
      && !this.isEnemyRespawning();
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

  buildHitResolution(attackPayload) {
    const attackerSnapshot = attackPayload?.attackerSnapshot && typeof attackPayload.attackerSnapshot === "object"
      ? attackPayload.attackerSnapshot
      : null;
    const attacker = attackerSnapshot || this.team[attackPayload?.attackerIndex];
    if (!attacker || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return null;
    }
    const decision = attackPayload?.turnDecision && typeof attackPayload.turnDecision === "object"
      ? attackPayload.turnDecision
      : this.resolveTurnDecisionForSlot(attackPayload.attackerIndex, attacker);
    const precomputedHit = attackPayload?.precomputedHit && typeof attackPayload.precomputedHit === "object"
      ? attackPayload.precomputedHit
      : this.buildPrecomputedHitOutcome(
        attackPayload.attackerIndex,
        attacker,
        attackPayload?.attackType || this.resolveAttackTypeForAttacker(attackPayload.attackerIndex, attacker),
      );
    const attackType = String(
      precomputedHit?.attackType
      || attackPayload?.attackType
      || attacker.offensiveType
      || attacker.defensiveTypes?.[0]
      || "normal"
    );
    return {
      attacker,
      attackerIndex: clamp(toSafeInt(attackPayload?.attackerIndex, -1), -1, MAX_TEAM_SIZE - 1),
      attackerNameFr: String(attackPayload?.attackerNameFr || attacker.nameFr || ""),
      targetX: Number(attackPayload?.targetX) || 0,
      targetY: Number(attackPayload?.targetY) || 0,
      attackMode: normalizeAttackMode(
        attackPayload?.attackMode,
        this.resolveAttackModeForAttacker(attackPayload?.attackerIndex, attacker),
      ),
      decision,
      attackType,
      missed: Boolean(precomputedHit?.missed),
      typeMultiplier: Number(precomputedHit?.typeMultiplier || 1),
      teamAuraAttackBonus: Math.max(0, Number(precomputedHit?.teamAuraAttackBonus) || 0),
      teleportDamageBoost: Math.max(1, Number(precomputedHit?.teleportDamageBoost || 1)),
      isCriticalHit: Boolean(precomputedHit?.isCritical),
      referenceDamage: Math.max(0, Number(precomputedHit?.damage || 0)),
    };
  }

  finalizeResolvedHit(attackPayload, hitResolution, options = {}) {
    const idleMode = Boolean(options.idleMode);
    const suppressTurnEvent = Boolean(options.suppressTurnEvent);
    const suppressImpactVisuals = Boolean(options.suppressImpactVisuals);
    const suppressLaserDamageText =
      normalizeAttackMode(hitResolution?.attackMode) === ATTACK_MODE_LASER
      && !Boolean(hitResolution?.missed);
    const suppressFloatingText =
      suppressImpactVisuals
      || Boolean(options.suppressFloatingText)
      || suppressLaserDamageText;
    const suppressHitEffects = suppressImpactVisuals || Boolean(options.suppressHitEffects);
    const suppressDamageFlash = Boolean(options.suppressDamageFlash);
    const allowTalentTriggers = options.allowTalentTriggers !== false;
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning() || !hitResolution) {
      return false;
    }

    const damageOverride = Number(options.damageOverride);
    const damage = hitResolution.missed
      ? 0
      : Number.isFinite(damageOverride)
        ? Math.max(0, Math.round(damageOverride))
        : Math.max(0, Math.round(hitResolution.referenceDamage));
    if (!hitResolution.missed && options.skipZeroDamage === true && damage <= 0) {
      return false;
    }

    if (hitResolution.missed) {
      this.lastImpact = {
        attackerNameFr: hitResolution.attacker.nameFr,
        attackType: hitResolution.attackType,
        damage: 0,
        typeMultiplier: 1,
        enemyNameFr: this.enemy.nameFr,
        isCritical: false,
        missed: true,
      };
      if (!suppressTurnEvent) {
        this.recordTurnEvent(hitResolution.attackerIndex, hitResolution.attacker, {
          action: TURN_ACTION_ATTACK,
          reason: "hit_missed",
          talentId: hitResolution.decision.talentId,
          passiveBehaviorId: hitResolution.decision.passiveBehaviorId,
        }, {
          attack_mode: hitResolution.attackMode,
          damage: 0,
          type_multiplier: 1,
          is_critical: false,
          missed: true,
        });
      }
      if (!idleMode && !suppressFloatingText) {
        const enemyVisualSize = Math.max(
          0,
          Number(options.layout?.enemySize) || Number(state.layout?.enemySize) || 0,
        );
        this.addFloatingDamageText({
          damage: 0,
          attackType: hitResolution.attackType,
          typeMultiplier: 1,
          isCritical: false,
          targetX: hitResolution.targetX,
          targetY: hitResolution.targetY,
          isMiss: true,
          targetVisualSize: enemyVisualSize,
        });
      }
      if (allowTalentTriggers) {
        const teleportSwapResult = this.tryApplyTeleportSwap(
          hitResolution.attackerIndex,
          hitResolution.attacker,
          {
            ...hitResolution.decision,
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
      return true;
    }

    this.enemy.hpCurrent = clamp(this.enemy.hpCurrent - damage, 0, this.enemy.hpMax);
    if (damage > 0 && !suppressDamageFlash) {
      this.triggerEnemyDamageFlash(ENEMY_DAMAGE_FLASH_DURATION_MS);
    }
    this.lastImpact = {
      attackerNameFr: hitResolution.attacker.nameFr,
      attackType: hitResolution.attackType,
      damage,
      typeMultiplier: hitResolution.typeMultiplier,
      enemyNameFr: this.enemy.nameFr,
      isCritical: hitResolution.isCriticalHit,
      missed: false,
    };
    if (!suppressTurnEvent) {
      this.recordTurnEvent(hitResolution.attackerIndex, hitResolution.attacker, {
        action: TURN_ACTION_ATTACK,
        reason: "hit_resolved",
        talentId: hitResolution.decision.talentId,
        passiveBehaviorId: hitResolution.decision.passiveBehaviorId,
      }, {
        attack_mode: hitResolution.attackMode,
        damage,
        type_multiplier: Math.round(hitResolution.typeMultiplier * 1000) / 1000,
        is_critical: hitResolution.isCriticalHit,
        missed: false,
        team_aura_attack_bonus_pct: Math.round(Math.max(0, hitResolution.teamAuraAttackBonus) * 10000) / 100,
        teleport_damage_boost_pct: Math.round((Math.max(1, hitResolution.teleportDamageBoost) - 1) * 10000) / 100,
      });
    }
    if (!idleMode && !suppressFloatingText) {
      const enemyVisualSize = Math.max(
        0,
        Number(options.layout?.enemySize) || Number(state.layout?.enemySize) || 0,
      );
      this.addFloatingDamageText({
        damage,
        attackType: hitResolution.attackType,
        typeMultiplier: hitResolution.typeMultiplier,
        isCritical: hitResolution.isCriticalHit,
        targetX: hitResolution.targetX,
        targetY: hitResolution.targetY,
        targetVisualSize: enemyVisualSize,
      });
    }
    if (!idleMode && !suppressHitEffects) {
      this.addEnemyHitEffects({
        damage,
        attackType: hitResolution.attackType,
        typeMultiplier: hitResolution.typeMultiplier,
        isCritical: hitResolution.isCriticalHit,
        targetX: hitResolution.targetX,
        targetY: hitResolution.targetY,
      });
    }

    if (allowTalentTriggers) {
      const enemyDefeatedByThisHit = Boolean(this.enemy && this.enemy.hpCurrent <= 0 && !this.isEnemyRespawning());
      if (enemyDefeatedByThisHit) {
        const deferredTeleportPlan = this.buildTeleportSwapPlan(
          hitResolution.attackerIndex,
          hitResolution.attacker,
          {
            ...hitResolution.decision,
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
          hitResolution.attackerIndex,
          hitResolution.attacker,
          {
            ...hitResolution.decision,
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
    }

    if (this.enemy && this.enemy.hpCurrent <= 0 && !this.isEnemyRespawning()) {
      const defeatedEnemy = this.enemy;
      this.resetQueuedAttackState();
      this.clearLasers();
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
        if (!this.enemy || this.enemy.hpCurrent <= 0) {
          this.spawnEnemy();
        }
      } else if (captureAttempted) {
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
          targetX: hitResolution.targetX,
          targetY: hitResolution.targetY,
          startX: hitResolution.targetX + 220,
          startY: hitResolution.targetY + 120,
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
      this.clearLasers();
      this.resetCombatVisualTweens();
      this.hitEffects = [];
    }
    return true;
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

  getLaserState(slotIndex) {
    const safeSlotIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    if (safeSlotIndex < 0) {
      return null;
    }
    if (!this.laserStates?.[safeSlotIndex]) {
      this.laserStates[safeSlotIndex] = this.createLaserState(safeSlotIndex);
    }
    return this.laserStates[safeSlotIndex];
  }

  updateLaserStateVisual(slotIndex, attacker, layout, options = {}) {
    const laserState = this.getLaserState(slotIndex);
    if (!laserState) {
      return null;
    }
    const attackType = String(options.attackType || laserState.attackType || "normal");
    const slot = layout?.teamSlots?.[slotIndex];
    const impactPoint = this.getEnemyImpactPoint(layout);
    const enemyCenterX = Number(layout?.centerX);
    const enemyCenterY = Number(layout?.centerY);
    const enemySize = Math.max(0, Number(layout?.enemySize) || 0);
    laserState.attackType = attackType;
    laserState.attackerNameFr = attacker?.nameFr || laserState.attackerNameFr || null;
    if (slot) {
      laserState.sourceX = Number(slot.x) || 0;
      laserState.sourceY = Number(slot.y) || 0;
      laserState.visualSourceInsetPx = clamp(slot.size * 0.44, 28, 58);
    }
    laserState.targetX = Number.isFinite(enemyCenterX) ? enemyCenterX : (Number(impactPoint.x) || 0);
    laserState.targetY = Number.isFinite(enemyCenterY) ? enemyCenterY : (Number(impactPoint.y) || 0);
    laserState.visualTargetInsetPx = clamp(enemySize * 0.48, 36, 92);
    return laserState;
  }

  refreshLaserStates(layout) {
    const battleActive = Boolean(
      this.enemy
      && this.enemy.hpCurrent > 0
      && !this.isEnemyRespawning()
      && !this.captureSequence
      && this.canTeamAttack(),
    );
    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const laserState = this.getLaserState(i);
      const attacker = this.team[i] || null;
      const attackMode = this.resolveAttackModeForAttacker(i, attacker);
      const decision = this.resolveTurnDecisionForSlot(i, attacker);
      const active = Boolean(attacker && battleActive && attackMode === ATTACK_MODE_LASER && decision.action === TURN_ACTION_ATTACK);
      const tickIntervalMs = this.normalizeLaserTickIntervalMs(laserState.tickIntervalMs);
      laserState.tickIntervalMs = tickIntervalMs;
      if (!active) {
        laserState.active = false;
        laserState.attackerNameFr = attacker?.nameFr || null;
        laserState.sourceX = 0;
        laserState.sourceY = 0;
        laserState.targetX = 0;
        laserState.targetY = 0;
        laserState.tickTimerMs = Math.min(Math.max(0, Number(laserState.tickTimerMs) || tickIntervalMs), tickIntervalMs);
        laserState.talentGateReady = false;
        laserState.pendingTurnDecision = null;
        continue;
      }
      laserState.active = true;
      laserState.tickTimerMs = Math.min(Math.max(0, Number(laserState.tickTimerMs) || tickIntervalMs), tickIntervalMs);
      const attackType = this.resolveAttackTypeForAttacker(i, attacker);
      this.updateLaserStateVisual(i, attacker, layout, { attackType });
    }
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
    const interval = Math.max(1, this.attackIntervalMs);
    const normalizedTimer = ((this.attackTimerMs % interval) + interval) % interval;
    for (let offset = 0; offset < MAX_TEAM_SIZE; offset += 1) {
      const slotIndex = (((this.turnIndex % MAX_TEAM_SIZE) + MAX_TEAM_SIZE) + offset) % MAX_TEAM_SIZE;
      const attacker = this.team[slotIndex] || null;
      if (!attacker) {
        continue;
      }
      const preview = this.resolveTurnDecisionForSlot(slotIndex, attacker);
      const attackMode = this.resolveAttackModeForAttacker(slotIndex, attacker);
      if (preview.action !== TURN_ACTION_ATTACK || attackMode !== ATTACK_MODE_PROJECTILE) {
        continue;
      }
      const progressToNextAttack = 1 - normalizedTimer / interval;
      const timeUntilAttackMs = normalizedTimer + offset * interval;
      return {
        preview: {
          slot_index: slotIndex,
          skipped_empty_slots: offset,
          attacker_name_fr: attacker?.nameFr || null,
          action: preview.action,
          reason: preview.reason,
          talent_id: preview.talentId,
          passive_behavior_id: preview.passiveBehaviorId,
        },
        interval,
        normalizedTimer,
        progressToNextAttack,
        canAttack: true,
        timeUntilAttackMs: Math.max(0, timeUntilAttackMs),
      };
    }
    return null;
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
    const tempLaserState = this.laserStates[a];
    this.laserStates[a] = this.laserStates[b];
    this.laserStates[b] = tempLaserState;
    if (this.laserStates[a]) {
      this.laserStates[a].slotIndex = a;
    }
    if (this.laserStates[b]) {
      this.laserStates[b].slotIndex = b;
    }

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
    this.processAttackCadenceTick(layout, { idleMode: true });
  }

  updateIdleCombat(deltaMs, layout) {
    let remainingMs = Math.max(0, Number(deltaMs) || 0);
    let safety = 0;
    const safetyMax = Math.max(48, Math.ceil(remainingMs / Math.max(1, Math.min(this.getLaserTickIntervalMs(), 210))) + 48);

    while (remainingMs > 0.01 && safety < safetyMax) {
      this.flushRespawnForIdleMode();
      if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
        break;
      }

      this.refreshLaserStates(layout);
      const timeToAttack = Math.max(0, Number(this.attackTimerMs) || 0);
      let timeToLaserTick = Number.POSITIVE_INFINITY;
      for (const laserState of this.laserStates || []) {
        if (!laserState?.active) {
          continue;
        }
        timeToLaserTick = Math.min(timeToLaserTick, Math.max(0, Number(laserState.tickTimerMs) || 0));
      }
      const timerRunning = this.isEnemyTimerRunning();
      const timeToTimeout = timerRunning ? Math.max(0, Number(this.enemyTimerMs) || 0) : Number.POSITIVE_INFINITY;
      let advanceMs = remainingMs;
      if (timeToAttack <= 0) {
        advanceMs = 0;
      } else {
        advanceMs = Math.min(advanceMs, timeToAttack);
      }
      if (Number.isFinite(timeToLaserTick)) {
        if (timeToLaserTick <= 0) {
          advanceMs = 0;
        } else {
          advanceMs = Math.min(advanceMs, timeToLaserTick);
        }
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
        for (const laserState of this.laserStates || []) {
          if (!laserState?.active) {
            continue;
          }
          laserState.tickTimerMs = Math.max(0, Number(laserState.tickTimerMs || 0) - advanceMs);
        }
        remainingMs -= advanceMs;
      }

      let eventHandled = false;
      if (this.attackTimerMs <= 0 && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.processAttackCadenceTick(layout, { idleMode: true });
        this.attackTimerMs += this.attackIntervalMs;
        eventHandled = true;
      }
      if (this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
          const laserState = this.laserStates?.[i];
          while (
            laserState?.active
            && laserState.tickTimerMs <= 0
            && this.enemy
            && this.enemy.hpCurrent > 0
            && !this.isEnemyRespawning()
          ) {
            this.applyLaserTick(i, layout, { idleMode: true });
            this.scheduleNextLaserTick(laserState);
            eventHandled = true;
          }
        }
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
    const safeDeltaMs = Math.max(0, Number(deltaMs) || 0);
    const downtimeAtStart = !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning();
    this.setAttackInterval(this.getEffectiveAttackIntervalMs());
    this.updateEnemyEnterAnimation(safeDeltaMs);
    this.updateFloatingTexts(safeDeltaMs);
    this.updateHitEffects(safeDeltaMs);
    this.updateKoTransition(safeDeltaMs);
    this.updateSlotRecoil(safeDeltaMs);
    this.updateSlotAttackFlash(safeDeltaMs);
    this.updateSlotSkipTurnEffects(safeDeltaMs);
    this.updateSlotTeleportScale(safeDeltaMs);
    this.updateTeleportBoostVisuals(safeDeltaMs);
    if (!layout) {
      return;
    }

    if (idleMode) {
      this.resetQueuedAttackState();
      this.updateIdleCombat(safeDeltaMs, layout);
      this.clearProjectiles();
      this.clearFloatingTexts();
      this.hitEffects = [];
      this.resetCombatVisualTweens();
      return;
    }

    if (downtimeAtStart) {
      if (this.hasLiveLaserRuntimeState()) {
        this.clearLasers();
      }
      this.advanceAttackTimerDuringDowntime(safeDeltaMs);
      return;
    }

    this.refreshLaserStates(layout);

    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return;
    }

    this.advanceEnemyTimer(safeDeltaMs);
    this.attackTimerMs -= safeDeltaMs;
    while (this.attackTimerMs <= 0) {
      if (this.isEnemyDefeatReserved()) {
        this.attackTimerMs = 0;
        break;
      }
      this.processAttackCadenceTick(layout);
      this.attackTimerMs += this.attackIntervalMs;
    }

    for (let i = 0; i < MAX_TEAM_SIZE; i += 1) {
      const laserState = this.laserStates?.[i];
      if (!laserState?.active) {
        continue;
      }
      laserState.tickTimerMs = Math.max(0, Number(laserState.tickTimerMs || 0) - safeDeltaMs);
      while (
        laserState.active
        && laserState.tickTimerMs <= 0
        && this.enemy
        && this.enemy.hpCurrent > 0
        && !this.isEnemyRespawning()
      ) {
        this.applyLaserTick(i, layout);
        this.scheduleNextLaserTick(laserState);
      }
    }

    this.updateProjectiles(safeDeltaMs, layout);
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
      attackerSnapshot: this.buildAttackerSnapshot(attacker),
      attackMode: ATTACK_MODE_PROJECTILE,
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

  triggerMindControlFollowup(attackerIndex, layout, options = {}) {
    const decision = options?.decision && typeof options.decision === "object" ? options.decision : null;
    if (decision?.talentId !== TALENT_MIND_CONTROL_ID) {
      return false;
    }
    const supportSlotIndex = this.getRandomAllySlotIndex(attackerIndex, { requireAttackReady: true });
    const supportAttacker = supportSlotIndex >= 0 ? this.team[supportSlotIndex] : null;
    if (!supportAttacker || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return false;
    }
    const supportDecision = this.resolveTurnDecisionForSlot(supportSlotIndex, supportAttacker);
    const supportMode = this.resolveAttackModeForAttacker(supportSlotIndex, supportAttacker);
    if (supportMode === ATTACK_MODE_PROJECTILE) {
      if (options.idleMode) {
        const impactPoint = this.getEnemyImpactPoint(layout);
        const payload = {
          attackType: this.resolveAttackTypeForAttacker(supportSlotIndex, supportAttacker),
          attackMode: ATTACK_MODE_PROJECTILE,
          attackerIndex: supportSlotIndex,
          attackerNameFr: supportAttacker.nameFr,
          attackerSnapshot: this.buildAttackerSnapshot(supportAttacker),
          targetX: impactPoint.x,
          targetY: impactPoint.y,
          turnDecision: supportDecision,
        };
        const hitResolution = this.buildHitResolution(payload);
        if (!hitResolution) {
          return false;
        }
        this.finalizeResolvedHit(payload, hitResolution, {
          idleMode: true,
          suppressTurnEvent: true,
          allowTalentTriggers: false,
          layout,
        });
        return true;
      }
      this.enqueueAttackProjectile(layout, supportSlotIndex, supportAttacker, {
        targetOffsetX: randomRange(-7, 7),
        targetOffsetY: randomRange(-5, 5),
        turnDecision: supportDecision,
      });
      return true;
    }
    return this.applyLaserTick(supportSlotIndex, layout, {
      idleMode: Boolean(options.idleMode),
      suppressTurnEvent: true,
      allowTalentTriggers: false,
      forcedDecision: supportDecision,
      forceImmediateResolution: true,
    });
  }

  processAttackCadenceTick(layout, options = {}) {
    if (this.isEnemyDefeatReserved()) {
      return;
    }
    const turn = this.consumeTurnSlot();
    const attackerIndex = turn.slotIndex;
    const attacker = turn.attacker;
    const decision = this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    if (decision.action !== TURN_ACTION_ATTACK || !attacker) {
      if (attacker && decision.action !== TURN_ACTION_ATTACK) {
        this.triggerSlotSkipTurnEffect(attackerIndex);
      }
      return;
    }

    const attackMode = this.resolveAttackModeForAttacker(attackerIndex, attacker);
    if (attackMode === ATTACK_MODE_LASER) {
      const laserState = this.getLaserState(attackerIndex);
      const attackType = this.resolveAttackTypeForAttacker(attackerIndex, attacker);
      this.updateLaserStateVisual(attackerIndex, attacker, layout, { attackType });
      laserState.active = true;
      laserState.talentGateReady = true;
      laserState.pendingTurnDecision = decision;
      return;
    }

    this.recordTurnEvent(attackerIndex, attacker, {
      ...decision,
      attackMode,
    });
    const mainProjectile = this.enqueueAttackProjectile(layout, attackerIndex, attacker, { turnDecision: decision });
    if (!mainProjectile) {
      return;
    }
    this.triggerMindControlFollowup(attackerIndex, layout, {
      decision,
      idleMode: Boolean(options.idleMode),
    });
  }

  spawnNextProjectile(layout) {
    this.processAttackCadenceTick(layout);
  }

  applyLaserTick(slotIndex, layout, options = {}) {
    const attackerIndex = clamp(toSafeInt(slotIndex, -1), -1, MAX_TEAM_SIZE - 1);
    const attacker = attackerIndex >= 0 ? this.team[attackerIndex] : null;
    const laserState = this.getLaserState(attackerIndex);
    if (!attacker || !laserState || !this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      return false;
    }
    const decision = options?.forcedDecision && typeof options.forcedDecision === "object"
      ? options.forcedDecision
      : laserState.pendingTurnDecision || this.resolveTurnDecisionForSlot(attackerIndex, attacker);
    if (decision.action !== TURN_ACTION_ATTACK) {
      return false;
    }

    const attackType = this.resolveAttackTypeForAttacker(attackerIndex, attacker);
    this.updateLaserStateVisual(attackerIndex, attacker, layout, { attackType });
    const payload = {
      attackType,
      attackMode: ATTACK_MODE_LASER,
      attackerIndex,
      attackerNameFr: attacker.nameFr,
      attackerSnapshot: this.buildAttackerSnapshot(attacker),
      targetX: laserState.targetX,
      targetY: laserState.targetY,
      turnDecision: decision,
    };
    const hitResolution = this.buildHitResolution(payload);
    if (!hitResolution) {
      return false;
    }

    const talentGateReady = options.forceImmediateResolution === true || Boolean(laserState.talentGateReady);
    const suppressLaserMicroTickVisuals =
      !talentGateReady
      && options.forceImmediateResolution !== true
      && options.allowMicrotickVisuals !== true;
    const suppressImpactVisuals = Boolean(options.suppressImpactVisuals);
    const suppressFloatingText = suppressImpactVisuals || Boolean(options.suppressFloatingText);
    const suppressHitEffects =
      suppressImpactVisuals
      || Boolean(options.suppressHitEffects)
      || suppressLaserMicroTickVisuals;
    const suppressDamageFlash = Boolean(options.suppressDamageFlash) || suppressLaserMicroTickVisuals;
    if (!hitResolution.missed) {
      const scaledDamage = Math.max(0, hitResolution.referenceDamage / this.getLaserDamagePerTickDivisor());
      const combinedDamage = Math.max(0, Number(laserState.damageCarry || 0)) + scaledDamage;
      const resolvedDamage = Math.floor(combinedDamage + 0.000001);
      laserState.damageCarry = Math.max(0, combinedDamage - resolvedDamage);
      if (resolvedDamage <= 0 && options.forceImmediateResolution !== true) {
        return false;
      }
      const applied = this.finalizeResolvedHit(payload, hitResolution, {
        idleMode: Boolean(options.idleMode),
        suppressTurnEvent: options.suppressTurnEvent === true ? true : !talentGateReady,
        suppressImpactVisuals,
        suppressFloatingText,
        suppressHitEffects,
        suppressDamageFlash,
        allowTalentTriggers: options.allowTalentTriggers === false ? false : talentGateReady,
        damageOverride: options.forceImmediateResolution === true && resolvedDamage <= 0 ? 1 : resolvedDamage,
        skipZeroDamage: options.forceImmediateResolution !== true,
        layout,
      });
      if (applied && talentGateReady && decision.talentId === TALENT_MIND_CONTROL_ID && this.enemy && this.enemy.hpCurrent > 0 && !this.isEnemyRespawning()) {
        this.triggerMindControlFollowup(attackerIndex, layout, {
          decision,
          idleMode: Boolean(options.idleMode),
        });
      }
      if (applied && talentGateReady) {
        laserState.talentGateReady = false;
        laserState.pendingTurnDecision = null;
      }
      return applied;
    }

    const appliedMiss = this.finalizeResolvedHit(payload, hitResolution, {
      idleMode: Boolean(options.idleMode),
      suppressTurnEvent: options.suppressTurnEvent === true ? true : !talentGateReady,
      suppressImpactVisuals,
      suppressFloatingText: suppressFloatingText || suppressLaserMicroTickVisuals,
      suppressHitEffects,
      suppressDamageFlash,
      allowTalentTriggers: options.allowTalentTriggers === false ? false : talentGateReady,
      layout,
    });
    if (appliedMiss && talentGateReady) {
      laserState.talentGateReady = false;
      laserState.pendingTurnDecision = null;
    }
    return appliedMiss;
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
    if (!this.enemy || this.enemy.hpCurrent <= 0 || this.isEnemyRespawning()) {
      this.consumeQueuedProjectileDamage(projectile);
      return;
    }
    this.consumeQueuedProjectileDamage(projectile);
    const hitResolution = this.buildHitResolution({
      ...projectile,
      attackMode: ATTACK_MODE_PROJECTILE,
    });
    if (!hitResolution) {
      return;
    }
    this.finalizeResolvedHit(projectile, hitResolution, options);
  }

  spawnEnemy() {
    const source = this.createEnemy();
    if (!source) {
      this.enemy = null;
      this.clearLasers();
      this.resetEnemyEnterAnimation();
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
    this.clearLasers();
    this.hitEffects = [];
    this.resetCombatVisualTweens();
    this.pendingRespawnMs = 0;
    this.koAnimMs = 0;
    this.resetQueuedAttackState();
    this.startEnemyEnterAnimation();
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
  };
}
