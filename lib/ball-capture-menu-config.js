import {
  BALL_CAPTURE_RULE_CAPTURE_ALL,
  BALL_CAPTURE_RULE_CAPTURE_OWNED,
  BALL_CAPTURE_RULE_CAPTURE_SHINY,
  BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
  BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
} from "./gameplay-ui-config.js";

export function createBallCaptureToggleDefinitions({
  allButtonEl,
  unownedButtonEl,
  ownedButtonEl,
  shinyButtonEl,
  ultraButtonEl,
}) {
  return [
    {
      key: BALL_CAPTURE_RULE_CAPTURE_ALL,
      label: "Tout capturer",
      description: "Active tous les filtres de cette ball.",
      buttonEl: allButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
      label: "Capturer les Pok\u00e9mon non poss\u00e9d\u00e9s",
      description: "Priorit\u00e9 \u00e0 la compl\u00e9tion du Pok\u00e9dex.",
      buttonEl: unownedButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_OWNED,
      label: "Capturer les Pok\u00e9mon d\u00e9j\u00e0 poss\u00e9d\u00e9s",
      description: "Autorise les doublons d\u00e9j\u00e0 rencontr\u00e9s.",
      buttonEl: ownedButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_SHINY,
      label: "Capturer les Pok\u00e9mon shiny",
      description: "Cible les variantes shiny de cette esp\u00e8ce.",
      buttonEl: shinyButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
      label: "Capturer les Pok\u00e9mon ultra shiny",
      description: "R\u00e9serve la ball aux ultra shiny.",
      buttonEl: ultraButtonEl,
    },
  ];
}
