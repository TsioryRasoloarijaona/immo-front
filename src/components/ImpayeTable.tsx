import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille } from './DataGrid';
import { canonicalStatusLabel, toneForStatus } from '../lib/dossierStatus';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_IMPAYES } from '../lib/dispositions';
import type { ColonneDto, ImpayeDto } from '../types';

/** La grille exige un `id` : celui de l'échéance. */
export type LigneImpaye = ImpayeDto & { id: string };

const RENDUS: Record<string, (r: LigneImpaye) => ReactNode> = {
  statutDossier: (r) => <Badge tone={toneForStatus(r.statutDossier)}>{canonicalStatusLabel(r.statutDossier) || '—'}</Badge>,
  penaliteId: (r) => (r.penaliteId ? <Badge tone="warning">Oui</Badge> : <span className="text-muted-foreground">—</span>),
};

// Sans elles, tri et filtre compareraient le code brut et non le libellé affiché.
const VALEURS: Record<string, (r: LigneImpaye) => unknown> = {
  statutDossier: (r) => canonicalStatusLabel(r.statutDossier),
  penaliteId: (r) => (r.penaliteId ? 'Oui' : ''),
};

const CLASSES: Record<string, string> = {
  dateEcheance: 'text-muted-foreground',
  dateRecouvrement: 'text-muted-foreground',
  dossierCode: 'tabular-nums text-muted-foreground',
  clientNom: 'font-medium text-foreground',
  projet: 'text-muted-foreground',
  tranche: 'text-muted-foreground',
  article: 'tabular-nums text-muted-foreground',
  categorie: 'text-muted-foreground',
  montantAPayer: 'text-foreground',
  montantRegle: 'text-muted-foreground',
  montantReste: 'font-semibold text-destructive',
  joursRetard: 'text-muted-foreground',
  commercial: 'text-muted-foreground',
  societe: 'text-muted-foreground',
  description: 'text-muted-foreground',
  notes: 'text-muted-foreground',
};

const TITRES: Record<string, (r: LigneImpaye) => string | undefined> = {
  clientNom: (r) => r.clientNom || undefined,
  projet: (r) => r.projet || undefined,
  tranche: (r) => r.tranche || undefined,
  categorie: (r) => r.categorie || undefined,
  description: (r) => r.description || undefined,
  notes: (r) => r.notes || undefined,
};

export default function ImpayeTable({
  rows,
  colonnes,
  onOuvrir,
}: Readonly<{
  rows: LigneImpaye[];
  colonnes: ColonneDto[];
  /** Reçoit la ligne entière : la fiche à ouvrir est celle du dossier, pas de l'échéance. */
  onOuvrir: (ligne: LigneImpaye) => void;
}>) {
  const grille = useMemo<ColonneGrille<LigneImpaye>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_IMPAYES.poids),
        rendu: RENDUS[c.nom],
        valeur: VALEURS[c.nom],
        classe: CLASSES[c.nom],
        titre: TITRES[c.nom],
      })),
    [colonnes],
  );
  const parId = useMemo(() => new Map(rows.map((r) => [r.id, r])), [rows]);

  return (
    <DataGrid
      cleOrdre="impayes"
      rows={rows}
      colonnes={grille}
      onOuvrir={(id) => {
        const ligne = parId.get(id);
        if (ligne) onOuvrir(ligne);
      }}
      libelleLigne={(r) => `Ouvrir l'échéancier du dossier ${r.dossierCode || r.dossierId}`}
      bandeauRegroupement={false}
    />
  );
}
