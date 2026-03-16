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
      buttonEl: allButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_UNOWNED,
      label: "Capturer les Pok\u00e9mon non poss\u00e9d\u00e9s",
      buttonEl: unownedButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_OWNED,
      label: "Capturer les Pok\u00e9mon d\u00e9j\u00e0 poss\u00e9d\u00e9s",
      buttonEl: ownedButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_SHINY,
      label: "Capturer les Pok\u00e9mon shiny",
      buttonEl: shinyButtonEl,
    },
    {
      key: BALL_CAPTURE_RULE_CAPTURE_ULTRA_SHINY,
      label: "Capturer les Pok\u00e9mon ultra shiny",
      buttonEl: ultraButtonEl,
    },
  ];
}
