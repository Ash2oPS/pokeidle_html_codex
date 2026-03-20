import { bootstrapGame } from "./lib/maintenance-bootstrap.js";

void bootstrapGame().catch((error) => {
  console.error("[boot] Impossible de demarrer le jeu.", error);
});
