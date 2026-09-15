import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
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
  /* Le lot lui-même, au même traitement que la tranche et le projet qui le
     surplombent : c'est une référence, pas une phrase. */
  articleCode: (d) => (d.articleCode ? <Badge tone="neutral" className="font-mono">{d.articleCode}</Badge> : TIRET),
  trancheLibelle: (d) => (d.trancheLibelle ? <Badge tone="neutral">{d.trancheLibelle}</Badge> : TIRET),
  projetCode: (d) => (d.projetCode ? <Badge tone="neutral">{d.projetCode}</Badge> : TIRET),
  /* Deux colonnes que le serveur type `NOMBRE` alors que ce sont des **ratios
     0–1**. Le rendu par défaut leur applique `formatNumber(v, 0)`, qui rend
     « 0 » pour 0,35 comme pour 0,068783.

     `remise` était dans ce cas et l'affichait vraiment : mesurées sur les 116
     dossiers réels, ses valeurs vont de -0,207865 à 0,988329, donc la colonne
     entière sortait à « 0 » — et à « -0 » pour les majorations. Le commentaire
     qui vivait ici affirmait l'inverse (« un pourcentage entier que le
     formatage par défaut sert correctement ») ; c'est ce qui a permis au bug
     de tenir. Vérifié par recoupement : `remiseMontant / prixAvantRemise`
     retombe bien sur le même ordre de grandeur que `remise`.

     Négatif compris : une remise négative est une majoration, et
     `formatPercent` la rend telle quelle plutôt que de la masquer. */
  remise: (d) => (typeof d.remise === 'number' ? formatPercent(d.remise, 2) : TIRET),
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

/** Formatage d'une **valeur nue**, pour les bandes de totaux où il n'y a pas
 * de ligne à passer à `rendu`.
 *
 * Les deux seules colonnes concernées sont celles que le serveur type `NOMBRE`
 * alors que ce sont des **ratios** : sans ça, une remise moyenne s'afficherait
 * « 0,07 » au lieu de « 7,31 % », et le total mentirait d'un facteur cent.
 * C'est le pendant, côté agrégats, de ce que `RENDUS` fait pour les cellules —
 * la même vérité dite au même endroit. */
const FORMATS_VALEUR: Record<string, (v: unknown) => string> = {
  remise: (v) => formatPercent(typeof v === 'number' ? v : null, 2),
  probabiliteFinalisation: (v) => formatPercent(typeof v === 'number' ? v : null),
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
  responsableVenteNom: 'text-muted-foreground',
  // Article : des attributs du lot, secondaires par rapport au client et au
  // montant. `articleTitreFoncier` en chiffres, d'où les tabulaires.
  articleLibelle: 'text-muted-foreground',
  typeArticle: 'text-muted-foreground',
  categorieArticle: 'text-muted-foreground',
  bloc: 'text-muted-foreground',
  etage: 'text-muted-foreground',
  typePresentation: 'text-muted-foreground',
  articleTitreFoncier: 'tabular-nums text-muted-foreground',
  // Délais : le serveur les type NOMBRE, donc DataGrid les aligne à droite et
  // les formate déjà. Rien à ajouter qu'une teinte secondaire.
  delaiConcretisation: 'text-muted-foreground',
  delaiNotaire: 'text-muted-foreground',
  delaiLivraison: 'text-muted-foreground',
  dateCompromis: 'text-muted-foreground',
  dateLivraisonReelle: 'text-muted-foreground',
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
  responsableVenteNom: (d) => d.responsableVenteNom ?? undefined,
  articleLibelle: (d) => d.articleLibelle ?? undefined,
  bloc: (d) => d.bloc ?? undefined,
  etage: (d) => d.etage ?? undefined,
  typePresentation: (d) => d.typePresentation ?? undefined,
  articleTitreFoncier: (d) => d.articleTitreFoncier ?? undefined,
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
  cleOrdre,
  selection,
  bandeauRegroupement,
  groupes,
}: {
  rows: DossierListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  onOuvrirProspection: (prospectionId: string) => void;
  /** Identité d'écran pour la persistance de l'ordre des colonnes.
   * Passe-plat vers `DataGrid.cleOrdre`. */
  cleOrdre?: string;
  /** Coupe le bandeau inerte de `DataGrid` : l'écran rend sa propre bande de
   * groupement au-dessus de la grille. Voir `DataGrid.bandeauRegroupement`. */
  bandeauRegroupement?: boolean;
  /** Repliage en groupes dépliables sur place. Passe-plat vers `DataGrid`. */
  groupes?: GroupementGrille<DossierListItemDto>;
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
        formatValeur: FORMATS_VALEUR[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      };
    });
  }, [colonnes, onOuvrirProspection]);

  return (
    <DataGrid
      cleOrdre={cleOrdre}
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* `clientNom` et `code` sont décochables : sans repli sur l'id, un
         lecteur d'écran annoncerait « Ouvrir le dossier undefined ». */
      libelleLigne={(d) => `Ouvrir le dossier ${d.clientNom || d.code || d.id}`}
      selection={selection}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
