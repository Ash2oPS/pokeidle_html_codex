import type { ContentRegistry } from "@pokeidle/content-data";
import type {
  ActiveBattleSessionState,
  CombatReactionOutcome,
  CombatResolvedAttackEvent,
  BattleEnemyDefinition,
  BattleEnemyState,
  BattleDefinition,
  CombatZoneDefinition,
  GameSaveV1,
  GymBattleSessionState,
  PokemonSpeciesDefinition,
  WildBattleSessionState,
} from "@pokeidle/contracts";
import {
  getSpeciesAttackClass,
  getSpeciesGuard,
  getSpeciesLevel,
  getSpeciesMaxHp,
  getSpeciesOffense,
  getXpToNextLevel,
} from "../pokemon/scaling";
import { countFilledTeamSlots, ensureSpeciesProgress } from "../roster/runtime";
import { getTypeMultiplier } from "./type-chart";

export type CombatVisualEventCollector = (event: CombatResolvedAttackEvent) => void;

export interface CombatViewState {
  session: ActiveBattleSessionState | null;
  enemySpecies: PokemonSpeciesDefinition | null;
  enemyName: string | null;
  enemyHpPercent: number;
  activeSlotIndex: number | null;
  defeatProgressLabel: string | null;
  remainingTimerLabel: string | null;
  reactionLabel: "wet" | null;
}

export function buildCombatSessionKey(session: ActiveBattleSessionState): string {
  return session.kind === "wild"
    ? `wild:${session.zoneId}:${session.startedAt}`
    : `gym:${session.battleId}:${session.startedAt}`;
}

function createSeed(input: string): number {
  let seed = 0;

  for (let index = 0; index < input.length; index += 1) {
    seed = (seed * 31 + input.charCodeAt(index)) >>> 0;
  }

  return seed || 1;
}

function stepSeed(seed: number): number {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function pickRandomEnemyId(pool: readonly string[], seed: number): { nextSeed: number; speciesId: string } {
  const nextSeed = stepSeed(seed);
  const speciesId = pool[nextSeed % pool.length] ?? pool[0]!;
  return {
    nextSeed,
    speciesId,
  };
}

function createEnemyState(
  species: PokemonSpeciesDefinition,
  level: number,
  registry: ContentRegistry,
): BattleEnemyState {
  const maxHp = getSpeciesMaxHp(species, level, registry.progression);

  return {
    speciesId: species.id,
    level,
    currentHp: maxHp,
    maxHp,
    defensiveTypes: species.defensiveTypes,
    reactionState: null,
  };
}

function createWildEnemyState(
  zoneId: string,
  seed: number,
  registry: ContentRegistry,
): { enemy: BattleEnemyState; nextSeed: number } {
  const zone = getCombatZone(registry, zoneId);

  if (!zone) {
    throw new Error(`Cannot create wild enemy for zone "${zoneId}".`);
  }

  const picked = pickRandomEnemyId(zone.battle.enemyPoolIds, seed);
  const species = registry.speciesById[picked.speciesId];

  if (!species) {
    throw new Error(`Missing species "${picked.speciesId}" in registry.`);
  }

  return {
    enemy: createEnemyState(species, zone.battle.enemyLevel, registry),
    nextSeed: picked.nextSeed,
  };
}

function createGymEnemyState(enemy: BattleEnemyDefinition, registry: ContentRegistry): BattleEnemyState {
  const species = registry.speciesById[enemy.speciesId];

  if (!species) {
    throw new Error(`Missing gym species "${enemy.speciesId}" in registry.`);
  }

  return createEnemyState(species, enemy.level, registry);
}

function getCombatZone(registry: ContentRegistry, zoneId: string): CombatZoneDefinition | null {
  const zone = registry.zonesById[zoneId];
  return zone?.kind === "combat" ? zone : null;
}

function readWildSeed(session: WildBattleSessionState): number {
  return typeof session.rngState === "number"
    ? session.rngState
    : createSeed(`${session.zoneId}:${session.startedAt}`);
}

function writeWildSeed(session: WildBattleSessionState, rngState: number): void {
  session.rngState = rngState;
}

function awardExperience(
  save: GameSaveV1,
  actingSlotIndex: number,
  registry: ContentRegistry,
  rewardKind: "wild" | "gym",
): void {
  const actingXp =
    rewardKind === "wild" ? registry.progression.wildActingXp : registry.progression.gymActingXp;
  const benchXp =
    rewardKind === "wild" ? registry.progression.wildBenchXp : registry.progression.gymBenchXp;

  save.player.teamSlots.forEach((speciesId, slotIndex) => {
    if (!speciesId) {
      return;
    }

    const progress = ensureSpeciesProgress(save, speciesId);
    progress.experience += slotIndex === actingSlotIndex ? actingXp : benchXp;

    while (progress.experience >= getXpToNextLevel(progress.level, registry.progression)) {
      progress.experience -= getXpToNextLevel(progress.level, registry.progression);
      progress.level += 1;
      progress.highestLevelReached = Math.max(progress.highestLevelReached, progress.level);
    }
  });
}

function updateReactionState(
  enemy: BattleEnemyState,
  attackType: string,
): {
  multiplier: number;
  reactionState: BattleEnemyState["reactionState"];
  outcome: CombatReactionOutcome;
} {
  if (enemy.reactionState === "wet" && attackType === "electric") {
    return {
      multiplier: 1.5,
      reactionState: null,
      outcome: "wet-boost",
    };
  }

  if (enemy.reactionState === "wet" && attackType === "fire") {
    return {
      multiplier: 0.5,
      reactionState: null,
      outcome: "wet-dampen",
    };
  }

  if (attackType === "water") {
    return {
      multiplier: 1,
      reactionState: "wet",
      outcome: "wet-applied",
    };
  }

  return {
    multiplier: 1,
    reactionState: enemy.reactionState,
    outcome: "none",
  };
}

interface AttackResolutionResult {
  enemyDefeated: boolean;
  visualEvent: CombatResolvedAttackEvent | null;
}

function resolveAttackStep(
  save: GameSaveV1,
  registry: ContentRegistry,
  session: ActiveBattleSessionState,
): AttackResolutionResult {
  const actingSlotIndex = session.currentSlotIndex;
  const actingSpeciesId = save.player.teamSlots[actingSlotIndex];

  session.currentSlotIndex = (session.currentSlotIndex + 1) % 6;

  if (!actingSpeciesId) {
    return {
      enemyDefeated: false,
      visualEvent: null,
    };
  }

  const actingSpecies = registry.speciesById[actingSpeciesId];
  const enemySpecies = registry.speciesById[session.enemy.speciesId];

  if (!actingSpecies || !enemySpecies) {
    return {
      enemyDefeated: false,
      visualEvent: null,
    };
  }

  const actingProgress = ensureSpeciesProgress(save, actingSpeciesId);
  const offense = getSpeciesOffense(
    actingSpecies,
    getSpeciesLevel(actingProgress),
    registry.progression,
  );
  const enemyGuard = getSpeciesGuard(enemySpecies, session.enemy.level, registry.progression);
  const typeMultiplier = getTypeMultiplier(
    actingSpecies.defaultOffensiveType,
    session.enemy.defensiveTypes,
  );
  const reaction = updateReactionState(session.enemy, actingSpecies.defaultOffensiveType);
  const enemyHpBefore = session.enemy.currentHp;
  const damage = Math.max(
    1,
    Math.round(
      (offense / Math.max(1, enemyGuard)) *
        registry.progression.damageConstant *
        typeMultiplier *
        reaction.multiplier,
    ),
  );
  const appliedDamage = Math.min(enemyHpBefore, damage);

  session.enemy.currentHp = Math.max(0, session.enemy.currentHp - damage);
  session.enemy.reactionState = reaction.reactionState;
  const enemyDefeated = session.enemy.currentHp <= 0;
  const eventKey = `${buildCombatSessionKey(session)}:${session.lastProcessedAt}:${actingSlotIndex}`;
  const visualEvent: CombatResolvedAttackEvent = {
    eventKey,
    sessionKey: buildCombatSessionKey(session),
    slotIndex: actingSlotIndex,
    attackerSpeciesId: actingSpecies.id,
    enemySpeciesId: enemySpecies.id,
    offensiveType: actingSpecies.defaultOffensiveType,
    attackClass: getSpeciesAttackClass(actingSpecies),
    damage: appliedDamage,
    didDefeatEnemy: enemyDefeated,
    reactionOutcome: reaction.outcome,
    enemyHpBefore,
    enemyHpAfter: session.enemy.currentHp,
    enemyMaxHp: session.enemy.maxHp,
  };

  if (!enemyDefeated) {
    return {
      enemyDefeated: false,
      visualEvent,
    };
  }

  awardExperience(save, actingSlotIndex, registry, session.kind === "wild" ? "wild" : "gym");
  return {
    enemyDefeated: true,
    visualEvent,
  };
}

function clearBattleSession(save: GameSaveV1): void {
  save.battle.activeSession = null;
}

function finalizeWildDefeat(
  save: GameSaveV1,
  registry: ContentRegistry,
  session: WildBattleSessionState,
): void {
  const zone = getCombatZone(registry, session.zoneId);

  if (!zone) {
    clearBattleSession(save);
    return;
  }

  session.defeatsThisRun += 1;
  save.player.pokedollars += registry.progression.wildPokedollars;
  save.zones[zone.id] ??= {
    accessible: true,
    completed: false,
    visible: true,
    bestDefeatCount: 0,
  };
  save.zones[zone.id]!.bestDefeatCount = Math.max(
    save.zones[zone.id]!.bestDefeatCount,
    session.defeatsThisRun,
  );
  session.elapsedMs = 0;

  if (session.defeatsThisRun >= zone.battle.defeatsRequired) {
    save.zones[zone.id]!.completed = true;
    save.zones[zone.id]!.accessible = true;
    clearBattleSession(save);
    return;
  }

  const enemy = createWildEnemyState(session.zoneId, readWildSeed(session), registry);
  session.enemy = enemy.enemy;
  writeWildSeed(session, enemy.nextSeed);
}

function handleWildTimeout(
  save: GameSaveV1,
  registry: ContentRegistry,
  session: WildBattleSessionState,
): void {
  session.defeatsThisRun = 0;
  session.elapsedMs = 0;
  const enemy = createWildEnemyState(session.zoneId, readWildSeed(session), registry);
  session.enemy = enemy.enemy;
  writeWildSeed(session, enemy.nextSeed);
}

function finalizeGymDefeat(
  save: GameSaveV1,
  registry: ContentRegistry,
  session: GymBattleSessionState,
): void {
  const battle = registry.battlesById[session.battleId];

  if (!battle?.enemyTeam) {
    clearBattleSession(save);
    return;
  }

  if (session.enemyIndex >= battle.enemyTeam.length - 1) {
    save.flags[`battle:${battle.id}:won`] = true;
    if (battle.unlockFlagOnWin) {
      save.flags[battle.unlockFlagOnWin] = true;
    }
    save.player.pokedollars += registry.progression.gymClearPokedollars;
    clearBattleSession(save);
    return;
  }

  session.enemyIndex += 1;
  session.enemy = createGymEnemyState(battle.enemyTeam[session.enemyIndex]!, registry);
}

function processSingleStep(
  save: GameSaveV1,
  registry: ContentRegistry,
  session: ActiveBattleSessionState,
  visualEventCollector?: CombatVisualEventCollector,
): void {
  if (session.kind === "wild") {
    const zone = getCombatZone(registry, session.zoneId);

    if (!zone) {
      clearBattleSession(save);
      return;
    }

    session.elapsedMs += registry.progression.slotIntervalMs;

    if (session.elapsedMs > zone.battle.enemyTimerSeconds * 1000) {
      handleWildTimeout(save, registry, session);
      return;
    }

    const result = resolveAttackStep(save, registry, session);

    if (result.visualEvent) {
      visualEventCollector?.(result.visualEvent);
    }

    if (result.enemyDefeated) {
      finalizeWildDefeat(save, registry, session);
    }

    return;
  }

  const battle = registry.battlesById[session.battleId];

  if (!battle) {
    clearBattleSession(save);
    return;
  }

  session.elapsedMs += registry.progression.slotIntervalMs;

  if (session.elapsedMs > battle.timeLimitSeconds * 1000) {
    clearBattleSession(save);
    return;
  }

  const result = resolveAttackStep(save, registry, session);

  if (result.visualEvent) {
    visualEventCollector?.(result.visualEvent);
  }

  if (result.enemyDefeated) {
    finalizeGymDefeat(save, registry, session);
  }
}

export function startWildBattle(
  save: GameSaveV1,
  registry: ContentRegistry,
  zoneId: string,
  nowIso = new Date().toISOString(),
): void {
  const zone = registry.zonesById[zoneId];

  if (!zone || zone.kind !== "combat") {
    return;
  }

  const seed = createSeed(`${zoneId}:${nowIso}`);
  const enemy = createWildEnemyState(zoneId, seed, registry);
  save.player.activeZoneId = zoneId;
  save.battle.activeSession = {
    kind: "wild",
    zoneId,
    startedAt: nowIso,
    lastProcessedAt: nowIso,
    currentSlotIndex: 0,
    elapsedMs: 0,
    defeatsThisRun: 0,
    enemy: enemy.enemy,
    rngState: enemy.nextSeed,
  };
}

export function startGymBattle(
  save: GameSaveV1,
  registry: ContentRegistry,
  zoneId: string,
  battleId: string,
  nowIso = new Date().toISOString(),
): boolean {
  const battle = registry.battlesById[battleId];

  if (!battle || !battle.enemyTeam || countFilledTeamSlots(save) > (battle.teamSizeLimit ?? 6)) {
    return false;
  }

  save.player.activeZoneId = zoneId;
  save.battle.activeSession = {
    kind: "gym",
    zoneId,
    battleId,
    startedAt: nowIso,
    lastProcessedAt: nowIso,
    currentSlotIndex: 0,
    elapsedMs: 0,
    enemyIndex: 0,
    enemy: createGymEnemyState(battle.enemyTeam[0]!, registry),
  };
  return true;
}

export function syncCombatState(
  save: GameSaveV1,
  registry: ContentRegistry,
  nowIso = new Date().toISOString(),
  visualEventCollector?: CombatVisualEventCollector,
): void {
  const session = save.battle.activeSession;

  if (!session) {
    return;
  }

  const intervalMs = registry.progression.slotIntervalMs;
  const nowMs = Date.parse(nowIso);
  const lastProcessedMs = Date.parse(session.lastProcessedAt);

  if (Number.isNaN(nowMs) || Number.isNaN(lastProcessedMs) || nowMs <= lastProcessedMs) {
    return;
  }

  let remainingMs = nowMs - lastProcessedMs;

  while (save.battle.activeSession && remainingMs >= intervalMs) {
    processSingleStep(save, registry, save.battle.activeSession, visualEventCollector);
    remainingMs -= intervalMs;
  }

  if (save.battle.activeSession) {
    save.battle.activeSession.lastProcessedAt = new Date(nowMs - remainingMs).toISOString();
  }
}

export function deriveCombatView(
  save: GameSaveV1,
  registry: ContentRegistry,
  nowIso = new Date().toISOString(),
): CombatViewState {
  const session = save.battle.activeSession;

  if (!session) {
    return {
      session: null,
      enemySpecies: null,
      enemyName: null,
      enemyHpPercent: 0,
      activeSlotIndex: null,
      defeatProgressLabel: null,
      remainingTimerLabel: null,
      reactionLabel: null,
    };
  }

  const pendingMs = Math.max(0, Date.parse(nowIso) - Date.parse(session.lastProcessedAt));
  const enemySpecies = registry.speciesById[session.enemy.speciesId] ?? null;
  const pendingElapsedMs = session.elapsedMs + pendingMs;
  const wildZone = session.kind === "wild" ? getCombatZone(registry, session.zoneId) : null;
  const gymBattle = session.kind === "gym" ? registry.battlesById[session.battleId] ?? null : null;
  const remainingTimerMs =
    session.kind === "wild"
      ? Math.max(0, (wildZone ? wildZone.battle.enemyTimerSeconds * 1000 : 0) - pendingElapsedMs)
      : Math.max(
          0,
          (gymBattle?.timeLimitSeconds ?? 0) * 1000 - pendingElapsedMs,
        );

  return {
    session,
    enemySpecies,
    enemyName: enemySpecies?.name.en ?? null,
    enemyHpPercent: session.enemy.maxHp > 0 ? session.enemy.currentHp / session.enemy.maxHp : 0,
    activeSlotIndex: session.currentSlotIndex,
    defeatProgressLabel:
      session.kind === "wild" && wildZone
        ? `${session.defeatsThisRun}/${wildZone.battle.defeatsRequired}`
        : session.kind === "gym" && gymBattle?.enemyTeam
          ? `${session.enemyIndex + 1}/${gymBattle.enemyTeam.length}`
          : null,
    remainingTimerLabel: `${Math.ceil(remainingTimerMs / 1000)}s`,
    reactionLabel: session.enemy.reactionState,
  };
}

export function canResumeBattle(
  save: GameSaveV1,
  target:
    | {
        kind: "wild";
        zoneId: string;
      }
    | {
        kind: "gym";
        battleId: string;
      },
): boolean {
  const session = save.battle.activeSession;

  if (!session) {
    return false;
  }

  return target.kind === "wild"
    ? session.kind === "wild" && session.zoneId === target.zoneId
    : session.kind === "gym" && session.battleId === target.battleId;
}

export function canStartGymBattle(save: GameSaveV1, battle: BattleDefinition): boolean {
  return countFilledTeamSlots(save) <= (battle.teamSizeLimit ?? 6);
}

export function hasCombatStepDue(
  save: GameSaveV1,
  registry: ContentRegistry,
  nowIso = new Date().toISOString(),
): boolean {
  const session = save.battle.activeSession;

  if (!session) {
    return false;
  }

  return Date.parse(nowIso) - Date.parse(session.lastProcessedAt) >= registry.progression.slotIntervalMs;
}
