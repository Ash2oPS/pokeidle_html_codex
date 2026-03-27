const WEEKDAY_OFFICE_HOURS_WINDOW = Object.freeze({
  daysOfWeek: Object.freeze([
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
  ]),
  startTimeLocal: "09:00",
  endTimeLocal: "17:59",
  message: "",
});

// `enabled: true` active le gate de maintenance sur le web de prod.
// `alwaysOn: true` force la maintenance toute la journee, sans regarder la schedule.
// `timezone` doit etre un nom IANA, par exemple `Europe/Paris`.
// `weeklyWindows` accepte une liste de creneaux hebdo avec:
// - `daysOfWeek`: `monday` ... `sunday`
// - `startTimeLocal` / `endTimeLocal`: format `HH:MM` sur 24h, borne de fin incluse
// - `message`: override optionnel du message global pour ce creneau precis
// Laisse `message` vide pour reutiliser le message par defaut.
export const MAINTENANCE_CONFIG = Object.freeze({
  enabled: true,
  alwaysOn: false,
  message: "",
  timezone: "Europe/Paris",
  weeklyWindows: Object.freeze([WEEKDAY_OFFICE_HOURS_WINDOW]),
});
