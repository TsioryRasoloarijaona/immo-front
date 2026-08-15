# Fix : corrections de la fiche Dossier de vente

À appliquer avec `FEATURE-changement-statut.md` (le stepper de statut)
et `FEATURE-plan-financement.md` (à corriger — voir section 3
ci-dessous avant de l'implémenter).

## 1. Champs manquants sur la fiche Dossier

Ajouter à l'en-tête / bloc "Montants" de la fiche Dossier :

- `mode_paie` — select, valeur par défaut "Non défini", pas encore de
  référentiel confirmé pour les valeurs possibles (à traiter comme
  texte libre en attendant une capture d'écran du menu déroulant)
- `prix_contractuel` — champ numérique séparé du prix de vente TTC,
  même si les deux coïncident dans l'exemple observé — ne pas le
  dériver automatiquement du TTC
- `probabilite_finalisation` — pourcentage affiché en bas du bloc
  Montants, avec le bouton d'action associé ("Facturer la vente" côté
  Omran — pour le prototype, un bouton désactivé/placeholder suffit,
  la facturation est hors scope Vente/Patrimoine)

## 2. Champs manquants sur la fiche Lot (section "Article" du Dossier)

- `titre_foncier` — numéro de titre foncier, texte libre (ex.
  "70075/64")
- `typologie` — distinct du type de bien existant (APPARTEMENT/VILLA/
  etc.) : c'est un descriptif du nombre de chambres (ex. "1 CHAMBRES+").
  Nouveau champ, ne pas réutiliser le champ `type` existant.

## 3. Fusionner "Plan de financement" et "Échéancier" — correction de FEATURE-plan-financement.md

L'écran réel montre que le "Schéma de financement" n'est pas une étape
préparatoire distincte de l'échéancier : chaque ligne du plan de
financement porte directement son propre suivi de règlement (`Montant
| Réglé | Reste`), une référence de facture, et des sous-lignes de
paiement dépliables.

**Correction à apporter** : dans l'assistant de création de dossier,
l'étape "Plan de financement" **devient** l'étape "Échéancier" — ce
n'est plus deux étapes séparées. Les lignes générées (par défaut, selon
le signal fonds propres/crédit) sont directement les lignes
d'échéancier, éditables, avec la même mécanique de validation (somme =
prix TTC) déjà spécifiée.

## 4. Référentiel des catégories de financement — à corriger

Remplacer le référentiel deviné par la liste réelle observée sur
l'écran Montants :

`FRAIS`, `MODIFICATIONS`, `PRIX_DE_VENTE`, `AVANCE`, `CREDIT`,
`LOYERS`, `AUTO_FINANCEMENT`, `PENALITE`, `RESILIATION`

(remplace l'ancienne liste `AVANCE / AUTO_FINANCEMENT / PRET_BANCAIRE /
FRAIS_SYNDIC` — `PRET_BANCAIRE` devient `CREDIT`, et 5 nouvelles
catégories apparaissent)

## 5. Nouveau composant : panneau "Montants" récapitulatif

Ajouter sur la fiche Dossier un panneau récapitulatif par catégorie
(reprend le bloc de droite de l'écran Omran) : une ligne par catégorie
du référentiel (section 4), avec 3 colonnes `Montant | Réglé | Reste`,
calculées à partir des lignes d'échéancier de cette catégorie. Une
ligne `Net à payer` en bas, somme de toutes les catégories.

## 6. Statuts à compléter

Les valeurs suivantes sont confirmées réelles et doivent être ajoutées
à l'enum `StatutDossier` (déjà entamé dans `FEATURE-changement-statut.md`) :
`RESERVATION`, `COMPROMIS`, `ENVOI_AU_NOTAIRE`, `MINUTE`,
`CONCRETISATION`, `ANNULATION`, `DESISTEMENT`. Il en manque
probablement encore — ne pas considérer cette liste comme définitive.

## Critères d'acceptation

- [ ] `mode_paie`, `prix_contractuel`, `probabilite_finalisation`
      présents sur la fiche Dossier
- [ ] `titre_foncier`, `typologie` présents sur la fiche Lot/Article
- [ ] L'assistant de création de dossier n'a plus qu'une étape
      "Échéancier" fusionnée (pas deux étapes séparées)
- [ ] Le référentiel de catégories de financement reflète la liste de
      la section 4
- [ ] Le panneau "Montants" récapitulatif est présent et calculé à
      partir des lignes d'échéancier, pas saisi manuellement
