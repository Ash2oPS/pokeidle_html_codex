# AI Docs Map

Cette section range la doc destinee aux agents et aux humains qui les pilotent.

## Precedence

1. `AGENTS.md`
2. `docs/ai/ui-style-guidelines.md`
3. `docs/ai/implementation-guidelines.md`
4. `docs/history/progress.md`

Si deux docs se contredisent, l'ordre ci-dessus gagne.

## Files

- `AGENTS.md`
  - Point d'entree repo-wide.
  - Contient les guardrails, interdits et checklists qui font autorite.
- `docs/ai/implementation-guidelines.md`
  - Guide detaille.
  - Explique comment appliquer les guardrails selon le type de changement, y compris la robustesse UI et la migration canvas-first.
- `docs/ai/ui-style-guidelines.md`
  - Guide de direction visuelle UI.
  - Definis la densite, la compacite, la hierarchie, la lisibilite, le responsive, le scaling et la direction canvas-first du style UI.
- `docs/ai-guidelines.md`
  - Stub de compatibilite pour les anciens liens.
- `docs/history/progress.md`
  - Archive de progression.
  - Historique utile pour le contexte, mais ce n'est pas une source d'autorite.

## Update Policy

- Si un guardrail change, mettre a jour `AGENTS.md` en premier.
- Si la direction generale du style UI change, mettre a jour `docs/ai/ui-style-guidelines.md` dans la meme tache.
- Si la direction d'architecture UI runtime change, mettre a jour `AGENTS.md`, `docs/ai/ui-style-guidelines.md` et `docs/ai/implementation-guidelines.md` dans la meme tache.
- Si la facon de travailler change, mettre a jour `docs/ai/implementation-guidelines.md` dans la meme tache.
- Si un chemin de doc change, laisser un pointeur de compatibilite quand c'est raisonnable.
- Ne pas dupliquer une regle complete dans plusieurs fichiers sans raison.
- Preferer:
  - `AGENTS.md` pour les regles
  - `docs/ai/ui-style-guidelines.md` pour la direction visuelle UI
  - `docs/ai/implementation-guidelines.md` pour les exemples, playbooks et matrices
  - `docs/history/progress.md` pour l'historique

## Intent

Le but est simple:

- une entree rapide pour l'IA
- une seule source d'autorite
- moins de duplication
- une archive separee des regles actives
