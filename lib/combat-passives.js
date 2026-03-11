import { TALENT_NONE_ID, normalizeTalentId } from "./talents.js";

const PASSIVE_BEHAVIOR_NONE_ID = TALENT_NONE_ID;
const PASSIVE_BEHAVIOR_NO_ATTACK_ID = "NO_ATTACK";

export const TURN_ACTION_ATTACK = "attack";
export const TURN_ACTION_SKIP = "skip";

const PASSIVE_BEHAVIORS = Object.freeze({
  [PASSIVE_BEHAVIOR_NONE_ID]: Object.freeze({
    id: PASSIVE_BEHAVIOR_NONE_ID,
    aliases: Object.freeze(["NONE", "PASSIVE_NONE", "TALENT_NONE", "DEFAULT"]),
    resolveTurnAction() {
      return {
        action: TURN_ACTION_ATTACK,
        reason: "attack_ready",
      };
    },
  }),
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
