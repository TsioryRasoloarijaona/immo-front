# Fix: page "Clients" (vue financière agrégée) + sélecteur de module style ERPNext

## Partie 1 — Nouvelle page "Clients"

### Ce qui manque

Omran a une vue dédiée **Vente > Clients**, distincte de la liste de
Dossiers. Ce n'est pas un doublon : c'est une vue **centrée sur la
personne**, pas sur le dossier — utile quand un même client a plusieurs
dossiers/tranches (ex: un investisseur qui a acheté 3 lots dans des
tranches différentes). Colonnes réelles observées :

**Code | Affiché comme | Mobile | Tél. | Age | Tranches | À payer | Réglé
| Reste | EMail**

- `À payer` / `Réglé` / `Reste` sont des **totaux agrégés par client**,
  pas par dossier — si un client a 2 dossiers, ces montants sont la somme
  des deux. Réglé s'affiche en vert, Reste en rouge (garder ce
  code-couleur, déjà utilisé ailleurs dans le prototype pour la cohérence).
- `Tranches` liste les tranches où ce client a un dossier (peut être
  multiple).
- Filtre par Tranche (checklist, même pattern que partout ailleurs) +
  recherche multi-critère + Rafraîchir.

### Limite honnête des données actuelles — à corriger AVANT de construire cette page

Dans `dossiers.json` actuel, chaque client mock est généré de façon
déterministe **par dossier**, donc il n'y a jamais deux dossiers qui
pointent vers le même client — l'agrégation multi-dossier ne peut pas être
démontrée avec les données telles quelles, ce qui rendrait cette page
trompeuse (elle aurait l'air de fonctionner mais ne montrerait jamais de
vrai cas à plusieurs dossiers).

**Correction nécessaire côté données avant d'implémenter cette page** :
dans le script de transformation (`transform.py`), pour un sous-ensemble
réaliste de dossiers (~15-20%), réutiliser délibérément le même client
mock sur 2-3 dossiers différents plutôt que d'en générer un nouveau à
chaque fois — ça permet à la page Clients de démontrer sa vraie valeur.
Si tu (Claude Code) n'as pas accès à `transform.py` pour régénérer les
JSON, une alternative acceptable pour ce prototype : construire la liste
de clients directement dans le frontend en group-by sur `client.id`
existant, et pour la démo, dupliquer manuellement 3-4 clients dans le
JSON local pour qu'ils aient plusieurs dossiers (documenté clairement
comme donnée de démo ajoutée, pas une vraie limitation cachée).

### Où l'ajouter

Nouvelle entrée "Clients" dans la sidebar, sous VENTES, entre
Prospections et Dossiers de vente (ou après Dossiers — l'ordre exact
importe peu). Route `/clients`, détail `/clients/:id` qui liste tous les
dossiers de ce client avec leurs statuts et montants individuels (pas
juste le total agrégé — le détail doit permettre de voir la décomposition
par dossier).

## Partie 2 — Sélecteur de module (style ERPNext/Odoo)

### Comportement

Un bouton/icône dans le header (en haut, visible sur toutes les pages)
ouvre un **overlay plein écran** avec une grille d'icônes de modules,
façon sélecteur d'application ERPNext/Odoo :

- **Vente** et **Patrimoine** — cliquables, mènent vers leurs pages
  respectives existantes.
- **Achat, Location, Service Après Vente, Ressources Humaines,
  Trésorerie, Comptabilité, Administration** — visibles dans la grille
  (pour représenter la portée complète du futur système, cohérent avec
  les entrées "Bientôt" déjà grisées dans la sidebar), mais cliquer dessus
  mène vers un **écran "Bientôt disponible"** dédié — pas une page morte
  ou une erreur. Cet écran peut être simple : icône du module, titre,
  une phrase "Ce module sera disponible dans une prochaine phase du
  projet.", et un bouton retour au Dashboard.
- Fermeture de l'overlay : clic en dehors, touche Échap, ou une icône de
  fermeture explicite.

### Design

- Grille responsive d'icônes/cartes, chaque module avec une icône
  distincte + label. Réutiliser les mêmes icônes que celles déjà choisies
  pour la sidebar (cohérence visuelle).
- Modules actifs (Vente, Patrimoine) visuellement distincts des modules
  "Bientôt" (ex: opacité réduite ou un petit badge "Bientôt" sur la
  carte) — l'utilisateur doit comprendre l'état avant même de cliquer,
  pas seulement après.
- Garder l'esthétique Linear/Stripe déjà établie — pas besoin de copier
  le style visuel exact d'ERPNext/Odoo, seulement le **pattern
  d'interaction** (overlay plein écran, grille de modules, un clic pour
  changer de contexte).

### Où le déclencher

Ajouter l'icône déclencheur dans le header à côté du logo "Ayad Estate"
(en haut à gauche, zone actuellement occupée seulement par le logo/nom) —
c'est l'emplacement naturel pour un sélecteur de contexte d'application,
cohérent avec où ERPNext/Odoo le placent.
