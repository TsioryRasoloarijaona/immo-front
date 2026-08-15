# Feature : Changement de statut du dossier — sélecteur à transitions filtrées

## Contexte

Vu sur l'écran réel Omran (dossier APF 2023/00255, statut `ENVOI AU
NOTAIRE`) : cliquer sur l'icône à côté du champ Statut ouvre un popup
"Sélecteur" listant **uniquement les statuts atteignables depuis le
statut courant**, pas les 11 valeurs du pipeline. Depuis `ENVOI AU
NOTAIRE`, la liste proposée est : `CONCRETISATION`, `COMPROMIS`,
`MINUTE`, `ANNULATION`, `DESISTEMENT`.

## Où

Sur la fiche Dossier existante, à côté du badge de statut en en-tête
(remplace l'icône crayon/pastille bleue vue sur Omran par une icône
cohérente avec le design system actuel du prototype).

## Comportement UI — version interactive (pas un simple sélecteur)

Le popup liste plate d'Omran est volontairement remplacé par une
**visualisation de pipeline horizontale** (cohérente avec la direction
Linear/Stripe déjà retenue pour le prototype) plutôt qu'un modal avec
une `<select>`-like list. Objectif : que l'utilisateur voie où en est
le dossier dans le processus, pas juste qu'il choisisse une valeur dans
une liste.

**Important — la progression n'est pas strictement linéaire.** Sur
l'écran capturé, depuis `ENVOI_AU_NOTAIRE` on peut revenir à
`COMPROMIS` — ce n'est donc pas un pur "next step" à sens unique. Le
composant doit refléter ça : les étapes de la voie "normale" sont
affichées en ligne, mais n'importe quelle étape listée dans
`TRANSITIONS_VALIDES[statutCourant]` doit rester cliquable, même si
elle est "derrière" dans la timeline visuelle.

1. Sur la fiche Dossier, remplacer le badge de statut statique par un
   **stepper horizontal** affichant les étapes connues de la voie
   normale, dans l'ordre : `RESERVATION → COMPROMIS → ENVOI_AU_NOTAIRE
   → MINUTE → CONCRETISATION`. L'étape courante est visuellement
   distincte (couleur pleine, pastille remplie) ; les étapes passées
   sont cochées/atténuées ; les étapes futures sont en contour.
2. `ANNULATION` et `DESISTEMENT` ne sont pas des étapes de la timeline
   — ce sont des sorties. Les afficher séparément, à droite ou en
   dessous du stepper, avec un traitement visuel distinct (teinte
   d'alerte, pas de position dans la ligne de progression).
3. **Seules les étapes présentes dans `TRANSITIONS_VALIDES[statutCourant]`
   sont cliquables** — hover actif, curseur pointeur, légère
   élévation/surbrillance. Les autres étapes du stepper restent
   visibles (contexte du processus complet) mais non interactives
   (curseur par défaut, pas de hover, opacité réduite).
4. Clic sur une étape valide → petite popover/panneau inline ancré sur
   l'étape cliquée (pas une modal plein centre qui casse le contexte
   visuel du stepper) avec :
   - Confirmation du changement ("Passer à MINUTE ?")
   - Champ texte libre optionnel (motif/note)
   - Boutons `Confirmer` / `Annuler`
5. `Annuler` ou clic en dehors referme le panneau sans rien changer.
6. Après confirmation, le stepper se met à jour immédiatement (l'étape
   sélectionnée devient l'étape courante), sans rechargement de la
   fiche.

## Modèle de données

Encoder les transitions comme une table de correspondance statique
plutôt que de la logique conditionnelle éparpillée dans les
composants — c'est ce qui permet au TypeScript de vérifier
l'exhaustivité :

```ts
type StatutDossier =
  | "RESERVATION"
  | "COMPROMIS"
  | "ENVOI_AU_NOTAIRE"
  | "MINUTE"
  | "CONCRETISATION"
  | "ANNULATION"
  | "DESISTEMENT";
  // liste incomplète — les statuts encore inconnus seront ajoutés au
  // fur et à mesure des captures d'écran suivantes

const TRANSITIONS_VALIDES: Record<StatutDossier, StatutDossier[]> = {
  ENVOI_AU_NOTAIRE: ["CONCRETISATION", "COMPROMIS", "MINUTE", "ANNULATION", "DESISTEMENT"],
  // les autres entrées seront complétées au fur et à mesure —
  // ne pas inventer de transitions non observées
};
```

Pour le prototype (données mock), seule la transition depuis
`ENVOI_AU_NOTAIRE` est confirmée par une vraie capture d'écran. Pour les
autres statuts, afficher **tous les autres statuts sauf le statut
courant** comme repli temporaire, avec un commentaire dans le code
signalant que la vraie règle de transition reste à confirmer
écran par écran. Ne pas deviner de règles métier non observées.

## UI / cohérence visuelle

Réutiliser les composants modal et badge déjà présents dans le
prototype. Le badge de statut garde sa couleur/style actuel ; seule
l'interaction change (clic → modal au lieu d'edit inline s'il y en
avait un).

## Critères d'acceptation

- [ ] Le badge de statut statique est remplacé par un stepper
      horizontal affichant la voie normale connue
- [ ] `ANNULATION`/`DESISTEMENT` sont visuellement distincts du
      stepper (sorties, pas des étapes de progression)
- [ ] Seules les étapes de `TRANSITIONS_VALIDES[statutCourant]` sont
      cliquables ; les autres sont visibles mais inertes
- [ ] Clic sur une étape valide ouvre un panneau inline ancré sur
      l'étape (pas une modal centrée qui coupe le contexte visuel)
- [ ] Le motif/note reste optionnel dans ce panneau
- [ ] Le stepper se met à jour sans rechargement après confirmation
- [ ] La table de transitions est centralisée dans un seul fichier
      (pas de logique de transition dupliquée dans les composants)
- [ ] Le statut courant n'apparaît jamais dans sa propre liste de
      transitions cliquables
