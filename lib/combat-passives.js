import { TALENT_NONE_ID, normalizeTalentId } from "./talents.js";

const PASSIVE_BEHAVIOR_NONE_ID = TALENT_NONE_ID;
const PASSIVE_BEHAVIOR_NO_ATTACK_ID = "NO_ATTACK";
const PASSIVE_BEHAVIOR_ACCURATE_ATTACK_ID = "ACCURATE_ATTACK";
const PASSIVE_BEHAVIOR_VALIANT_ATTACK_ID = "VALIANT_ATTACK";
const PASSIVE_BEHAVIOR_MORPHING_ID = "MORPHING";
const PASSIVE_BEHAVIOR_MIND_CONTROL_ID = "MIND_CONTROL";
const PASSIVE_BEHAVIOR_ORIGIN_MIMICRY_ID = "ORIGIN_MIMICRY";
const PASSIVE_BEHAVIOR_TEAM_AURA_ATTACK_ID = "TEAM_AURA_ATTACK";
const PASSIVE_BEHAVIOR_TELEPORT_SWAP_ID = "TELEPORT_SWAP";

export const TURN_ACTION_ATTACK = "attack";
export const TURN_ACTION_SKIP = "skip";

function createAttackBehavior(id, aliases, reason) {
  return Object.freeze({
    id,
    aliases: Object.freeze(Array.isArray(aliases) ? aliases : [id]),
    resolveTurnAction() {
      return {
        action: TURN_ACTION_ATTACK,
        reason,
      };
    },
  });
}

const PASSIVE_BEHAVIORS = Object.freeze({
  [PASSIVE_BEHAVIOR_NONE_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_NONE_ID,
    ["NONE", "PASSIVE_NONE", "TALENT_NONE", "DEFAULT", "JACKPOT", "JACKPOT_PLUS"],
    "attack_ready",
  ),
  [PASSIVE_BEHAVIOR_ACCURATE_ATTACK_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_ACCURATE_ATTACK_ID,
    ["ACCURATE_ATTACK", "KEEN_EYE", "OEIL_VIF"],
    "passive_accurate_attack",
  ),
  [PASSIVE_BEHAVIOR_VALIANT_ATTACK_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_VALIANT_ATTACK_ID,
    ["VALIANT_ATTACK", "VALIANT_EYE", "OEIL_VAILLANT"],
    "passive_valiant_attack",
  ),
  [PASSIVE_BEHAVIOR_MORPHING_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_MORPHING_ID,
    ["MORPHING", "MORPHING_PASSIVE", "MORPH", "METAMORPH"],
    "passive_morphing_attack",
  ),
  [PASSIVE_BEHAVIOR_MIND_CONTROL_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_MIND_CONTROL_ID,
    ["MIND_CONTROL", "MENTAL_CONTROL", "CONTROLE_MENTAL", "CONTROLEMENTAL"],
    "passive_mind_control_attack",
  ),
  [PASSIVE_BEHAVIOR_ORIGIN_MIMICRY_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_ORIGIN_MIMICRY_ID,
    ["ORIGIN_MIMICRY", "ORIGINAL_MIMICRY", "MIMETISME_ORIGINEL", "MIMETISMEORIGINEL"],
    "passive_origin_mimicry_attack",
  ),
  [PASSIVE_BEHAVIOR_TEAM_AURA_ATTACK_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_TEAM_AURA_ATTACK_ID,
    [
      "TEAM_AURA_ATTACK",
      "OVERGROW",
      "OVERGROW_PLUS",
      "OVERGROW_PLUS_PLUS",
      "ENGRAIS",
      "ENGRAIS_PLUS",
      "ENGRAIS_PLUS_PLUS",
      "BLAZE",
      "BLAZE_PLUS",
      "BLAZE_PLUS_PLUS",
      "BRASIER",
      "BRASIER_PLUS",
      "BRASIER_PLUS_PLUS",
      "TORRENT",
      "TORRENT_PLUS",
      "TORRENT_PLUS_PLUS",
    ],
    "passive_team_aura_attack",
  ),
  [PASSIVE_BEHAVIOR_TELEPORT_SWAP_ID]: createAttackBehavior(
    PASSIVE_BEHAVIOR_TELEPORT_SWAP_ID,
    [
      "TELEPORT_SWAP",
      "TELEPORT",
      "TELEPORT_PLUS",
      "TELEPORT_PLUS_PLUS",
      "TELEPORTATION",
      "TELEPORTATION_PLUS",
      "TELEPORTATION_PLUS_PLUS",
    ],
    "passive_teleport_swap",
  ),
  [PASSIVE_BEHAVIOR_NO_ATTACK_ID]: Object.freeze({
    id: PASSIVE_BEHAVIOR_NO_ATTACK_ID,
    aliases: Object.freeze([
      "NO_ATTACK",
      "NOATTACK",
      "CANNOT_ATTACK",
      "DO_NOT_ATTACK",
      "DONT_ATTACK",
      "PACIFIST",
      "PACIFISTE",
      "LOSER",
      "PERDANT",
    ]),
    resolveTurnAction() {
      return {
        action: TURN_ACTION_SKIP,
        reason: "passive_no_attack",
      };
    },
  }),
});

const TALENT_ALIAS_TO_BEHAVIOR_ID = (() => {
  const map = new Map();
  for (const behavior of Object.values(PASSIVE_BEHAVIORS)) {
    for (const alias of behavior.aliases) {
      map.set(alias, behavior.id);
    }
  }
  return map;
})();

function normalizeAliasKey(value) {
  return normalizeTalentId(value);
}

function extractTalentId(attacker) {
  if (!attacker || typeof attacker !== "object") {
    return PASSIVE_BEHAVIOR_NONE_ID;
  }
  const rawTalent = attacker.talent;
  if (typeof rawTalent === "string") {
    return normalizeAliasKey(rawTalent);
  }
  if (rawTalent && typeof rawTalent === "object") {
    const talentId = rawTalent.id ?? rawTalent.talent_id ?? rawTalent.talentId;
    return normalizeTalentId(talentId);
  }
  return PASSIVE_BEHAVIOR_NONE_ID;
}

export function getPassiveBehaviorIdForTalentId(rawTalentId) {
  const aliasKey = normalizeTalentId(rawTalentId);
  return TALENT_ALIAS_TO_BEHAVIOR_ID.get(aliasKey) || PASSIVE_BEHAVIOR_NONE_ID;
}

export function resolveCombatTurnDecision({ attacker, enemy }) {
  if (!attacker) {
    return {
      action: TURN_ACTION_SKIP,
      reason: "empty_slot",
      talentId: PASSIVE_BEHAVIOR_NONE_ID,
      passiveBehaviorId: PASSIVE_BEHAVIOR_NONE_ID,
    };
  }

  if (!enemy || Number(enemy.hpCurrent) <= 0) {
    return {
      action: TURN_ACTION_SKIP,
      reason: "enemy_unavailable",
      talentId: extractTalentId(attacker),
      passiveBehaviorId: PASSIVE_BEHAVIOR_NONE_ID,
    };
  }

  const talentId = extractTalentId(attacker);
  const passiveBehaviorId = getPassiveBehaviorIdForTalentId(talentId);
  const behavior = PASSIVE_BEHAVIORS[passiveBehaviorId] || PASSIVE_BEHAVIORS[PASSIVE_BEHAVIOR_NONE_ID];
  const behaviorDecision = behavior.resolveTurnAction({ attacker, enemy }) || {};
  const action = behaviorDecision.action === TURN_ACTION_ATTACK ? TURN_ACTION_ATTACK : TURN_ACTION_SKIP;
  return {
    action,
    reason: String(behaviorDecision.reason || (action === TURN_ACTION_ATTACK ? "attack_ready" : "passive_skip")),
    talentId,
    passiveBehaviorId,
  };
}
