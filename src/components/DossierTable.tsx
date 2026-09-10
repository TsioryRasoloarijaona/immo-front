import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille } from './DataGrid';
import { formatPercent } from '../lib/format';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_DOSSIERS } from '../lib/dispositions';
import type { ColonneDto, DossierListItemDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

/** Rendus riches. Le reste des colonnes est formaté par `DataGrid` à partir du
 * `type` que le catalogue porte — une colonne ajoutée côté serveur apparaît
 * donc alignée et formatée sans toucher à ce fichier. */
const RENDUS: Record<string, (d: DossierListItemDto, ctx: Contexte) => ReactNode> = {
  code: (d) => (
    <Badge tone="neutral" className="font-mono">
      {d.code}
    </Badge>
  ),
  prospectionCode: (d, ctx) =>
    d.prospectionId ? (
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          ctx.onOuvrirProspection(d.prospectionId as string);
        }}
        title="Ouvrir la prospection d'origine"
      >
        <Badge tone="info">{d.prospectionCode || 'Voir'}</Badge>
      </button>
    ) : (
      TIRET
    ),
  statut: (d) => <Badge tone={toneForStatus(d.statut)}>{canonicalStatusLabel(d.statut) || '—'}</Badge>,
  origineProspection: (d) => (d.origineProspection ? <Badge tone="info">{d.origineProspection}</Badge> : TIRET),
  trancheCode: (d) => (d.trancheCode ? <Badge tone="neutral">{d.trancheCode}</Badge> : TIRET),
  trancheLibelle: (d) => (d.trancheLibelle ? <Badge tone="neutral">{d.trancheLibelle}</Badge> : TIRET),
  projetCode: (d) => (d.projetCode ? <Badge tone="neutral">{d.projetCode}</Badge> : TIRET),
  /* Le serveur la type `NOMBRE` alors que c'est un **ratio 0–1** : le rendu par
     défaut lui appliquerait `formatNumber(v, 0)` et afficherait « 0 » pour
     0,35. À ne pas confondre avec `remise`, qui est un pourcentage entier et
     que le formatage par défaut sert correctement — son libellé serveur porte
     déjà l'unité. */
  probabiliteFinalisation: (d) =>
    typeof d.probabiliteFinalisation === 'number' ? formatPercent(d.probabiliteFinalisation) : TIRET,
};

/** Valeurs de tri et de filtre, quand le texte affiché n'est pas `row[nom]`.
 *
 * Sans elles, l'utilisateur voit et tape « Concrétisation » pendant que le tri
 * et le filtre comparent le statut brut du serveur. */
const VALEURS: Record<string, (d: DossierListItemDto) => unknown> = {
  statut: (d) => canonicalStatusLabel(d.statut),
};

/** Classes propres à une colonne, en plus de `truncate` et de l'alignement
 * déduit du type. Reprend la mise en forme d'avant le sélecteur. */
const CLASSES: Record<string, string> = {
  clientNom: 'font-medium text-foreground',
  commercialNom: 'text-muted-foreground',
  prix: 'text-(--info)',
  totalAPayer: 'font-semibold text-(--success)',
  dateDocument: 'text-muted-foreground',
  dateConcretisation: 'text-muted-foreground',
  prixAvantRemise: 'text-muted-foreground',
  prixApresRemise: 'text-muted-foreground',
  remiseMontant: 'text-muted-foreground',
  montantAvance: 'text-muted-foreground',
  modePaie: 'text-muted-foreground',
  etapeProspection: 'text-muted-foreground',
  dateProspection: 'text-muted-foreground',
  projetLibelle: 'text-muted-foreground',
  societeCode: 'tabular-nums text-muted-foreground',
  societeLibelle: 'text-muted-foreground',
  vocationCode: 'tabular-nums text-muted-foreground',
  vocationLibelle: 'text-muted-foreground',
  avocatNom: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

/** Infobulle : le texte complet de ce que `truncate` a coupé. */
const TITRES: Record<string, (d: DossierListItemDto) => string | undefined> = {
  clientNom: (d) => d.clientNom ?? undefined,
  code: (d) => d.code,
  commercialNom: (d) => d.commercialNom ?? undefined,
  projetLibelle: (d) => d.projetLibelle ?? undefined,
  trancheLibelle: (d) => d.trancheLibelle ?? undefined,
  societeLibelle: (d) => d.societeLibelle ?? undefined,
  vocationLibelle: (d) => d.vocationLibelle ?? undefined,
  avocatNom: (d) => d.avocatNom ?? undefined,
  modePaie: (d) => d.modePaie ?? undefined,
  etapeProspection: (d) => d.etapeProspection ?? undefined,
  origineProspection: (d) => d.origineProspection ?? undefined,
};

type Contexte = { onOuvrirProspection: (prospectionId: string) => void };

/** Tableau de la liste des dossiers de vente.
 *
 * Adaptateur au-dessus de `DataGrid`, sur le même patron que
 * `ProspectionTable` : tout le chrome de grille vit dans `DataGrid`, et ce
 * fichier ne garde que ce qui est propre au dossier — les rendus riches, les
 * valeurs de tri, les classes, les infobulles, et la traduction du catalogue
 * serveur `ColonneDto` en colonnes de grille.
 *
 * `onOuvrirProspection` plutôt qu'un `useNavigate` interne : le composant reste
 * présentationnel, et la navigation continue de venir de l'écran. */
export default function DossierTable({
  rows,
  colonnes,
  onOuvrir,
  onOuvrirProspection,
  selection,
}: {
  rows: DossierListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  onOuvrirProspection: (prospectionId: string) => void;
  /** Passe-plat vers `DataGrid` : sur cet écran la gouttière à cases **est**
   * le sélecteur de lot documentaire, et non une colonne décorative. */
  selection?: { ids: Set<string>; onToggle: (id: string) => void; onToggleAll: (ids: string[]) => void };
}) {
  const grille = useMemo<ColonneGrille<DossierListItemDto>[]>(() => {
    const ctx: Contexte = { onOuvrirProspection };
    return colonnes.map((c) => {
      const rendu = RENDUS[c.nom];
      return {
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_DOSSIERS.poids),
        rendu: rendu ? (d: DossierListItemDto) => rendu(d, ctx) : undefined,
        valeur: VALEURS[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      };
    });
  }, [colonnes, onOuvrirProspection]);

  return (
    <DataGrid
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* `clientNom` et `code` sont décochables : sans repli sur l'id, un
         lecteur d'écran annoncerait « Ouvrir le dossier undefined ». */
      libelleLigne={(d) => `Ouvrir le dossier ${d.clientNom || d.code || d.id}`}
      selection={selection}
    />
  );
}
