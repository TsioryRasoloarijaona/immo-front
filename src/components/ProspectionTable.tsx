import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import { InactiviteBadge } from './ActiviteProspection';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { formatCurrency, formatDate, isPastOrToday } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName, relanceEnRetard } from '../lib/domain';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_PROSPECTIONS } from '../lib/dispositions';
import type { ColonneDto, ProspectionListItemDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

const RENDUS: Record<string, (p: ProspectionListItemDto) => ReactNode> = {
  prospectNom: (p) => prospectionDisplayName(p),
  etape: (p) => <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Clôturée' : p.etape || '—'}</Badge>,
  origine: (p) => (p.origine ? <Badge tone="info">{p.origine}</Badge> : TIRET),
  trancheDescription: (p) => (p.trancheDescription ? <Badge tone="neutral">{p.trancheDescription}</Badge> : TIRET),
  trancheCode: (p) => (p.trancheCode ? <Badge tone="neutral">{p.trancheCode}</Badge> : TIRET),
  // Le message de l'alerte passe en infobulle plutôt qu'en colonne : c'est une
  // note libre, de longueur imprévisible, qui ferait éclater la largeur du
  // tableau. La date, elle, se compare d'un coup d'œil.
  derniereAlerteDate: (p) =>
    p.derniereAlerteDate ? (
      <Badge tone={isPastOrToday(p.derniereAlerteDate) ? 'warning' : 'neutral'}>{formatDate(p.derniereAlerteDate)}</Badge>
    ) : (
      TIRET
    ),
  // Mêmes seuils que la pastille de la fiche — 30/90 j en un seul endroit,
  // sinon la liste et le détail finiraient par colorer différemment la même
  // prospection.
  joursInactivite: (p) => (typeof p.joursInactivite === 'number' ? <InactiviteBadge jours={p.joursInactivite} /> : TIRET),
  derniereCommunicationResultat: (p) =>
    p.derniereCommunicationResultat ? <Badge tone="neutral">{p.derniereCommunicationResultat}</Badge> : TIRET,
  statutDossier: (p) => (p.statutDossier ? <Badge tone="success">{p.statutDossier}</Badge> : TIRET),
  prix: (p) => (p.prix ? formatCurrency(p.prix) : <span className="font-normal text-muted-foreground">—</span>),
  surface: (p) => (p.surface ? `${p.surface} m²` : TIRET),
};

/** Classes propres à une colonne, en plus de `truncate` et de l'alignement
 * déduit du type. Reprend la mise en forme d'avant le sélecteur. */
const CLASSES: Record<string, string> = {
  code: 'tabular-nums text-muted-foreground',
  prospectCode: 'tabular-nums text-muted-foreground',
  prospectNom: 'font-medium text-foreground',
  dateDocument: 'text-muted-foreground',
  commercialNom: 'text-muted-foreground',
  commercialCode: 'tabular-nums text-muted-foreground',
  societeCode: 'tabular-nums text-muted-foreground',
  societeLibelle: 'text-muted-foreground',
  derniereAlerteDate: 'text-muted-foreground',
  telephone: 'tabular-nums text-muted-foreground',
  indicatifMobile: 'tabular-nums text-muted-foreground',
  mobileProspect: 'tabular-nums text-muted-foreground',
  email: 'text-muted-foreground',
  emailFiche: 'text-muted-foreground',
  cin: 'tabular-nums text-muted-foreground',
  pays: 'text-muted-foreground',
  prix: 'font-semibold tabular-nums text-(--success)',
  dossierCode: 'tabular-nums text-foreground',
  dateFermeture: 'text-muted-foreground',
  raisonFermeture: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
};

/** Infobulle par colonne — le texte complet de ce que `truncate` a coupé, et
 * pour la relance le message que la colonne ne montre pas. */
const TITRES: Record<string, (p: ProspectionListItemDto) => string | undefined> = {
  prospectNom: (p) => prospectionDisplayName(p),
  origine: (p) => p.origine || undefined,
  commercialNom: (p) => p.commercialNom || undefined,
  derniereAlerteDate: (p) => p.derniereAlerteMessage || undefined,
  telephone: (p) => p.telephone || undefined,
  email: (p) => p.email || undefined,
  trancheDescription: (p) => p.trancheDescription || undefined,
  projetLibelle: (p) => p.projetLibelle || undefined,
  derniereCommunicationResultat: (p) => p.derniereCommunicationResultat || undefined,
  societeLibelle: (p) => p.societeLibelle || undefined,
  emailFiche: (p) => p.emailFiche || undefined,
  raisonFermeture: (p) => p.raisonFermeture || undefined,
  actionCommerciale: (p) => p.actionCommerciale || undefined,
  origineSupport: (p) => p.origineSupport || undefined,
};

/** Tableau partagé par la liste des prospections et celle des
 * pré-prospections : les deux consomment le même `ProspectionListItemDto` et
 * affichaient jusqu'ici deux copies du même balisage.
 *
 * Adaptateur au-dessus de `DataGrid` : tout le chrome de grille (tri, filtres,
 * Σ, gouttières, bandeau) y vit désormais, et ce fichier ne garde que ce qui
 * est propre à la prospection — les rendus riches, les classes par colonne,
 * les infobulles, et la traduction du catalogue serveur `ColonneDto` en
 * colonnes de grille. */
export default function ProspectionTable({
  rows,
  colonnes,
  onOuvrir,
  entite = 'prospection',
  bandeauRegroupement,
  groupes,
}: {
  rows: ProspectionListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  /** Coupe le bandeau inerte de `DataGrid` : l'écran rend sa propre bande de
   * groupement au-dessus de la grille. Voir `DataGrid.bandeauRegroupement`. */
  bandeauRegroupement?: boolean;
  /** Repliage en groupes dépliables sur place. Passe-plat vers `DataGrid`. */
  groupes?: GroupementGrille<ProspectionListItemDto>;
  /** Nom de l'entité dans l'étiquette d'accessibilité de chaque ligne — les
   * deux écrans lisent le même DTO mais un lecteur d'écran doit entendre
   * « pré-prospection » sur l'un et « prospection » sur l'autre. */
  entite?: 'prospection' | 'pré-prospection';
}) {
  /* Le catalogue vient du serveur et peut changer à chaque livraison : la
     traduction reste donc pilotée par `c.nom`/`c.type` et non par une liste en
     dur. Une colonne ajoutée côté serveur apparaît formatée et alignée sans
     toucher à ce fichier ; seuls les rendus riches sont nommés. */
  const grille = useMemo<ColonneGrille<ProspectionListItemDto>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_PROSPECTIONS.poids),
        rendu: RENDUS[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      })),
    [colonnes],
  );

  return (
    <DataGrid
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* Le retard doit aussi s'entendre. Le fond rouge seul serait un échec
         WCAG de sévérité High — la raison même pour laquelle les pastilles de
         statut ont gardé leurs glyphes. Le badge de la colonne Alerte porte
         déjà un glyphe, mais cette colonne est décochable alors que le fond,
         lui, reste. */
      libelleLigne={(p) =>
        `Ouvrir la ${entite} ${prospectionDisplayName(p)}${relanceEnRetard(p) ? ' — relance en retard' : ''}`
      }
      /* Repérer un retard sans lire la colonne Alerte : c'est ce que fait le
         logiciel de bureau avec son icône rouge, porté ici sur la ligne
         entière. `--retard-bg` reprend la teinte du badge d'alerte échue — les
         deux s'allument sur le même critère et doivent se lire comme un seul
         signal — mais à un alpha plus faible : voir `index.css`, où l'alpha des
         pastilles faisait échouer le texte des cellules en contraste.

         `hover:` répété : sans lui le survol repeindrait la ligne en
         `bg-muted/50` et le retard disparaîtrait sous le curseur, c'est-à-dire
         exactement quand on le regarde. */
      classeLigne={(p) => (relanceEnRetard(p) ? 'bg-(--retard-bg) hover:bg-(--retard-bg)' : undefined)}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
