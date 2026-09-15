import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { encaissementEtatLabel, encaissementEtatTone } from '../lib/domain';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_ENCAISSEMENTS } from '../lib/dispositions';
import type { ColonneDto, EncaissementDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

/** Rendus riches. Le reste des colonnes est formaté par `DataGrid` à partir du
 * `type` que le catalogue porte — une colonne ajoutée côté serveur apparaît
 * donc alignée et formatée sans toucher à ce fichier. */
const RENDUS: Record<string, (r: EncaissementDto) => ReactNode> = {
  etat: (r) => <Badge tone={encaissementEtatTone(r.etat)}>{encaissementEtatLabel(r.etat)}</Badge>,
  comptabilise: (r) => <Badge tone={r.comptabilise ? 'success' : 'neutral'}>{r.comptabilise ? 'Oui' : 'Non'}</Badge>,
  /* Même traitement que `comptabilise` : un booléen métier se lit mieux en
     pastille qu'en « Oui »/« Non » nu au milieu de colonnes de texte. */
  remisAuCentre: (r) =>
    r.remisAuCentre === undefined ? TIRET : (
      <Badge tone={r.remisAuCentre ? 'success' : 'neutral'}>{r.remisAuCentre ? 'Oui' : 'Non'}</Badge>
    ),
};

/** Valeurs de tri et de filtre, quand le texte affiché n'est pas `row[nom]`.
 *
 * Sans elles, l'utilisateur voit et tape « Pointé » pendant que le tri et le
 * filtre comparent le code brut du serveur (`IN_WORK`). C'était déjà la règle
 * des deux colonnes à pastille avant la conversion au catalogue. */
const VALEURS: Record<string, (r: EncaissementDto) => unknown> = {
  etat: (r) => encaissementEtatLabel(r.etat),
};

/** Classes propres à une colonne, en plus de `truncate` et de l'alignement
 * déduit du type. Reprend la mise en forme d'avant le sélecteur. */
const CLASSES: Record<string, string> = {
  dateDocument: 'text-muted-foreground',
  dateReglement: 'text-muted-foreground',
  dateEcheance: 'text-muted-foreground',
  tierNom: 'font-medium text-foreground',
  dossierCode: 'text-muted-foreground',
  typeLibelle: 'text-muted-foreground',
  typeCode: 'tabular-nums text-muted-foreground',
  montantBrut: 'text-foreground',
  montantBrutRestant: 'text-muted-foreground',
  montantNet: 'text-muted-foreground',
  montantBase: 'text-muted-foreground',
  reference: 'text-muted-foreground',
  description: 'text-muted-foreground',
  entiteCode: 'tabular-nums text-muted-foreground',
  entiteLibelle: 'text-muted-foreground',
  banqueNom: 'text-muted-foreground',
  tierPayeurNom: 'text-muted-foreground',
  notes: 'text-muted-foreground',
  recuCode: 'tabular-nums text-muted-foreground',
  bordereauCode: 'tabular-nums text-muted-foreground',
  dateRemiseAuCentre: 'text-muted-foreground',
  dateBordereau: 'text-muted-foreground',
  compteCode: 'tabular-nums text-muted-foreground',
  depotCode: 'tabular-nums text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

/** Infobulle : le texte complet de ce que `truncate` a coupé. */
const TITRES: Record<string, (r: EncaissementDto) => string | undefined> = {
  tierNom: (r) => r.tierNom || undefined,
  dossierCode: (r) => r.dossierCode || undefined,
  typeLibelle: (r) => r.typeLibelle || undefined,
  reference: (r) => r.reference || undefined,
  // 327 valeurs distinctes sur 332 lignes, et des phrases entières : c'est la
  // colonne que le plafond de largeur coupe le plus souvent.
  description: (r) => r.description || undefined,
  entiteLibelle: (r) => r.entiteLibelle || undefined,
  banqueNom: (r) => r.banqueNom || undefined,
  tierPayeurNom: (r) => r.tierPayeurNom || undefined,
  notes: (r) => r.notes || undefined,
};

/** Tableau de la liste des encaissements.
 *
 * Adaptateur au-dessus de `DataGrid`, sur le même patron que `DossierTable` et
 * `ProspectionTable` : tout le chrome de grille vit dans `DataGrid`, et ce
 * fichier ne garde que ce qui est propre au règlement — les rendus riches, les
 * valeurs de tri, les classes, les infobulles, et la traduction du catalogue
 * serveur `ColonneDto` en colonnes de grille.
 *
 * L'écran déclarait auparavant dix colonnes en dur. Les largeurs et les rendus
 * de ces dix-là sont repris **tels quels** : la vue s'élargit, elle ne se
 * réorganise pas. */
export default function EncaissementTable({
  rows,
  colonnes,
  onOuvrir,
  cleOrdre,
  bandeauRegroupement,
  groupes,
}: {
  rows: EncaissementDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  /** Identité d'écran pour la persistance de l'ordre des colonnes.
   * Passe-plat vers `DataGrid.cleOrdre`. */
  cleOrdre?: string;
  /** Coupe le bandeau inerte de `DataGrid` : l'écran rend sa propre bande de
   * groupement au-dessus de la grille. Voir `DataGrid.bandeauRegroupement`. */
  bandeauRegroupement?: boolean;
  /** Repliage en groupes dépliables sur place. Passe-plat vers `DataGrid`. */
  groupes?: GroupementGrille<EncaissementDto>;
}) {
  /* Le catalogue vient du serveur et peut changer à chaque livraison : la
     traduction reste donc pilotée par `c.nom`/`c.type` et non par une liste en
     dur. Une colonne ajoutée côté serveur apparaît formatée et alignée sans
     toucher à ce fichier ; seuls les rendus riches sont nommés. */
  const grille = useMemo<ColonneGrille<EncaissementDto>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_ENCAISSEMENTS.poids),
        rendu: RENDUS[c.nom],
        valeur: VALEURS[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      })),
    [colonnes],
  );

  return (
    <DataGrid
      cleOrdre={cleOrdre}
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* `reference` est décochable : sans repli, un lecteur d'écran
         annoncerait « Ouvrir le règlement » sans rien derrière. */
      libelleLigne={(r) => `Ouvrir le règlement ${r.reference || r.description || r.id}`}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
