import { useMemo, type ReactNode } from 'react';
import { Badge } from './ui';
import DataGrid, { type ColonneGrille, type GroupementGrille } from './DataGrid';
import { poidsColonne } from '../lib/colonnes';
import { DISPOSITION_SUIVI_ACTIONS } from '../lib/dispositions';
import type { ColonneDto, SuiviActionDto } from '../types';

/** `alerteActive` en pastille : seul booléen qui appelle une action (rappeler). */
const RENDUS: Record<string, (r: SuiviActionDto) => ReactNode> = {
  alerteActive: (r) =>
    r.alerteActive ? <Badge tone="warning">Active</Badge> : <span className="text-muted-foreground">—</span>,
};

/** Valeurs de tri et de filtre quand le texte affiché n'est pas `row[nom]`. */
const VALEURS: Record<string, (r: SuiviActionDto) => unknown> = {
  alerteActive: (r) => (r.alerteActive ? 'Active' : ''),
};

const CLASSES: Record<string, string> = {
  utilisateur: 'font-medium text-foreground',
  typeAction: 'text-foreground',
  rang: 'tabular-nums text-muted-foreground',
  dateAction: 'text-muted-foreground',
  dateAlerte: 'text-muted-foreground',
  categorie: 'text-muted-foreground',
  resultat: 'text-muted-foreground',
  message: 'text-muted-foreground',
  commercial: 'text-muted-foreground',
  personnel: 'text-muted-foreground',
  tiersNom: 'font-medium text-foreground',
  prospectionCode: 'tabular-nums text-muted-foreground',
  dossierCode: 'tabular-nums text-muted-foreground',
  etat: 'text-muted-foreground',
  articleCode: 'tabular-nums text-muted-foreground',
  articleLibelle: 'text-muted-foreground',
  trancheCode: 'tabular-nums text-muted-foreground',
  trancheLibelle: 'text-muted-foreground',
  programme: 'text-muted-foreground',
  entite: 'text-muted-foreground',
  creePar: 'text-muted-foreground',
  creeLe: 'text-muted-foreground',
  modifiePar: 'text-muted-foreground',
  modifieLe: 'text-muted-foreground',
};

const TITRES: Record<string, (r: SuiviActionDto) => string | undefined> = {
  message: (r) => r.message || undefined,
  tiersNom: (r) => r.tiersNom || undefined,
  resultat: (r) => r.resultat || undefined,
  articleLibelle: (r) => r.articleLibelle || undefined,
  trancheLibelle: (r) => r.trancheLibelle || undefined,
  programme: (r) => r.programme || undefined,
};

/** `onOuvrir` reçoit l'id de l'action, pas de la fiche : la page choisit quelle
 * fiche ouvrir (prospection, à défaut dossier). */
export default function SuiviActionTable({
  rows,
  colonnes,
  onOuvrir,
  cleOrdre,
  bandeauRegroupement,
  groupes,
}: Readonly<{
  rows: SuiviActionDto[];
  colonnes: ColonneDto[];
  onOuvrir?: (id: string) => void;
  cleOrdre?: string;
  bandeauRegroupement?: boolean;
  groupes?: GroupementGrille<SuiviActionDto>;
}>) {
  const grille = useMemo<ColonneGrille<SuiviActionDto>[]>(
    () =>
      colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION_SUIVI_ACTIONS.poids),
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
      libelleLigne={(r) => `Ouvrir l'action ${r.typeAction || ''} ${r.tiersNom || r.prospectionCode || r.id}`.trim()}
      bandeauRegroupement={bandeauRegroupement}
      groupes={groupes}
    />
  );
}
