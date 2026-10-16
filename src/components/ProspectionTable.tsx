import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import { InactiviteBadge } from './ActiviteProspection';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { formatCurrency, formatDate, formatSurface, isPastOrToday } from '../lib/format';
import { etapeBadgeTone, prospectionDisplayName, relanceEnRetard } from '../lib/domain';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_PROSPECTIONS } from '../lib/dispositions';
import type { TotauxServeurGrille } from '../lib/totauxServeur';
import type { ColonneDto, ProspectionListItemDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

const RENDUS: Record<string, (p: ProspectionListItemDto) => ReactNode> = {
  prospectNom: (p) => prospectionDisplayName(p),
  etape: (p) => <Badge tone={etapeBadgeTone(p.etape, p.fermee)}>{p.fermee ? 'Archivée' : p.etape || '—'}</Badge>,
  origine: (p) => (p.origine ? <Badge tone="info">{p.origine}</Badge> : TIRET),
  trancheDescription: (p) => (p.trancheDescription ? <Badge tone="neutral">{p.trancheDescription}</Badge> : TIRET),
  trancheCode: (p) => (p.trancheCode ? <Badge tone="neutral">{p.trancheCode}</Badge> : TIRET),
  // Le message d'alerte, note libre de longueur imprévisible, va en infobulle.
  derniereAlerteDate: (p) =>
    p.derniereAlerteDate ? (
      <Badge tone={isPastOrToday(p.derniereAlerteDate) ? 'warning' : 'neutral'}>{formatDate(p.derniereAlerteDate)}</Badge>
    ) : (
      TIRET
    ),
  // Même composant que la fiche : les seuils restent définis en un seul endroit.
  joursInactivite: (p) => (typeof p.joursInactivite === 'number' ? <InactiviteBadge jours={p.joursInactivite} /> : TIRET),
  derniereCommunicationResultat: (p) =>
    p.derniereCommunicationResultat ? <Badge tone="neutral">{p.derniereCommunicationResultat}</Badge> : TIRET,
  statutDossier: (p) => (p.statutDossier ? <Badge tone="success">{p.statutDossier}</Badge> : TIRET),
  prix: (p) => (p.prix ? formatCurrency(p.prix) : <span className="font-normal text-muted-foreground">—</span>),
  surface: (p) => (p.surface ? formatSurface(p.surface) : TIRET),
};

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

export default function ProspectionTable({
  rows,
  colonnes,
  onOuvrir,
  cleOrdre,
  entite = 'prospection',
  bandeauRegroupement,
  groupes,
  totauxServeur,
  actions,
}: Readonly<{
  rows: ProspectionListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  cleOrdre?: string;
  /** `false` quand l'écran rend sa propre bande de groupement au-dessus de la grille. */
  bandeauRegroupement?: boolean;
  groupes?: GroupementGrille<ProspectionListItemDto>;
  /** Σ serveur sur tout le filtre ; absent, Σ client des lignes chargées. */
  totauxServeur?: TotauxServeurGrille;
  /** Même DTO pour les deux écrans : c'est ce que le lecteur d'écran annonce par ligne. */
  entite?: 'prospection' | 'pré-prospection';
  actions?: (p: ProspectionListItemDto) => ReactNode;
}>) {
  /* Piloté par `c.nom`/`c.type`, pas par une liste en dur : une colonne ajoutée
     côté serveur s'affiche sans toucher à ce fichier. */
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
      cleOrdre={cleOrdre}
      rows={rows}
      colonnes={grille}
      onOuvrir={onOuvrir}
      /* Le retard doit aussi s'entendre : le fond rouge seul est un échec WCAG,
         et la colonne Alerte (qui porte un glyphe) est décochable. */
      libelleLigne={(p) =>
        `Ouvrir la ${entite} ${prospectionDisplayName(p)}${relanceEnRetard(p) ? ' — relance en retard' : ''}`
      }
      /* `hover:` répété : sans lui le survol repeint la ligne en `bg-muted/50` et
         le retard disparaît sous le curseur. */
      classeLigne={(p) => (relanceEnRetard(p) ? 'bg-(--retard-bg) hover:bg-(--retard-bg)' : undefined)}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
      totauxServeur={totauxServeur}
      actions={actions}
    />
  );
}
