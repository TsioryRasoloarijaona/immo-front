import { useMemo, type ReactNode } from 'react';
import { MailWarning, TriangleAlert } from 'lucide-react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { formatPercent, formatPercentValue } from '../lib/format';
import { toneForStatus } from '../lib/dossierStatus';
import { libelleStatutLigne } from '../lib/dossierListe';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_DOSSIERS } from '../lib/dispositions';
import type { ColonneDto, DossierListItemDto } from '../types';

const TIRET = <span className="text-muted-foreground">—</span>;

/** Icônes de tête de ligne d'OMRAN : alerte active, instruction non lue adressée à l'utilisateur. */
function IconesLigne({ d }: Readonly<{ d: DossierListItemDto }>) {
  return (
    <>
      {d.alerte && (
        <TriangleAlert className="size-3.5 shrink-0 text-(--warning)" aria-label="Alerte active" role="img" />
      )}
      {d.instructionNonLue && (
        <MailWarning className="size-3.5 shrink-0 text-(--info)" aria-label="Instruction non lue" role="img" />
      )}
    </>
  );
}

const RENDUS: Partial<Record<string, (d: DossierListItemDto, ctx: Contexte) => ReactNode>> = {
  code: (d) => (
    <span className="inline-flex items-center gap-1">
      <IconesLigne d={d} />
      {d.code ? (
        <Badge tone="neutral" className="font-mono">
          {d.code}
        </Badge>
      ) : (
        TIRET
      )}
      {/* Lot libre : `code` est celui de l'article, la tranche le situe. */}
      {d.libre && d.trancheCode && <span className="text-muted-foreground">{d.trancheCode}</span>}
    </span>
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
  statut: (d) => {
    const libelle = libelleStatutLigne(d);
    return <Badge tone={toneForStatus(libelle)}>{libelle || '—'}</Badge>;
  },
  origineProspection: (d) => (d.origineProspection ? <Badge tone="info">{d.origineProspection}</Badge> : TIRET),
  trancheCode: (d) => (d.trancheCode ? <Badge tone="neutral">{d.trancheCode}</Badge> : TIRET),
  articleCode: (d) => (d.articleCode ? <Badge tone="neutral" className="font-mono">{d.articleCode}</Badge> : TIRET),
  trancheLibelle: (d) => (d.trancheLibelle ? <Badge tone="neutral">{d.trancheLibelle}</Badge> : TIRET),
  projetCode: (d) => (d.projetCode ? <Badge tone="neutral">{d.projetCode}</Badge> : TIRET),
  /* Typées `NOMBRE` par le serveur : `remise` est déjà en pourcentage 0–100, la probabilité est
     un ratio 0–1 (idem `FORMATS_VALEUR`). Une remise négative est une majoration. */
  remise: (d) => (typeof d.remise === 'number' ? formatPercentValue(d.remise, 2) : TIRET),
  probabiliteFinalisation: (d) =>
    typeof d.probabiliteFinalisation === 'number' ? formatPercent(d.probabiliteFinalisation) : TIRET,
  // Fraction 0–1 comme la probabilité.
  tva: (d) => (typeof d.tva === 'number' ? formatPercent(d.tva) : TIRET),
};

// Sans elles, tri et filtre comparent le statut brut du serveur, pas le libellé affiché.
const VALEURS: Record<string, (d: DossierListItemDto) => unknown> = {
  statut: (d) => libelleStatutLigne(d),
};

const FORMATS_VALEUR: Record<string, (v: unknown) => string> = {
  remise: (v) => formatPercentValue(typeof v === 'number' ? v : null, 2),
  probabiliteFinalisation: (v) => formatPercent(typeof v === 'number' ? v : null),
  tva: (v) => formatPercent(typeof v === 'number' ? v : null),
};

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
  articleLibelle: 'text-muted-foreground',
  typeArticle: 'text-muted-foreground',
  categorieArticle: 'text-muted-foreground',
  bloc: 'text-muted-foreground',
  etage: 'text-muted-foreground',
  typePresentation: 'text-muted-foreground',
  articleTitreFoncier: 'tabular-nums text-muted-foreground',
  delaiConcretisation: 'text-muted-foreground',
  delaiNotaire: 'text-muted-foreground',
  delaiLivraison: 'text-muted-foreground',
  dateEnvoiNotaire: 'text-muted-foreground',
  dateCompromis: 'text-muted-foreground',
  dateLivraisonReelle: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

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

export default function DossierTable({
  rows,
  colonnes,
  onOuvrir,
  onOuvrirProspection,
  cleOrdre,
  selection,
  bandeauRegroupement,
  groupes,
}: Readonly<{
  rows: DossierListItemDto[];
  colonnes: ColonneDto[];
  onOuvrir: (id: string) => void;
  onOuvrirProspection: (prospectionId: string) => void;
  cleOrdre?: string;
  bandeauRegroupement?: boolean;
  groupes?: GroupementGrille<DossierListItemDto>;
  selection?: { ids: Set<string>; onToggle: (id: string) => void; onToggleAll: (ids: string[]) => void };
}>) {
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
      libelleLigne={(d) =>
        d.libre ? `Ouvrir l'article ${d.articleCode || d.id}` : `Ouvrir le dossier ${d.clientNom || d.code || d.id}`
      }
      selection={selection}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
