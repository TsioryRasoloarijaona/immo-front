import { useState } from 'react';
import LignesSelectionnables from './LignesSelectionnables';
import { Button } from '../ui/button';
import { EmptyState, ErrorState, LoadingState } from '../ui';
import {
  basculerVisibles,
  correspond,
  FILTRES_ACTIVITE,
  resumeActivite,
  useActiviteLeads,
  type ActiviteLeads,
  type FiltreActivite,
} from '../../lib/activiteLeads';
import { basculer, libelleChargees } from '../../lib/equipe';
import type { LeadsPagines } from '../../lib/useLeadsPagines';
import type { UUID } from '../../types';

/**
 * Un onglet de la fenêtre « Leads de … » : états, état d'activité de chaque lead, filtres rapides, « Tout cocher »
 * sur les lignes visibles, « Afficher plus » (FEATURE-leads-a-relancer.md).
 */
export default function ListeLeadsReaffecter({
  liste,
  vide,
  selection,
  onSelection,
  onOuvrir,
}: Readonly<{
  liste: LeadsPagines;
  vide: string;
  selection: ReadonlySet<string>;
  onSelection: (s: Set<string>) => void;
  onOuvrir: (id: UUID) => void;
}>) {
  const { lignes } = liste;
  const ids = lignes.map((l) => l.id);
  const activite = useActiviteLeads(ids);
  const [filtre, setFiltre] = useState<FiltreActivite>('toutes');
  const visibles = lignes.filter((l) => correspond(activite.parId.get(l.id), filtre));
  const idsVisibles = visibles.map((l) => l.id);
  const toutesCochees = idsVisibles.length > 0 && idsVisibles.every((id) => selection.has(id));

  if (liste.error) return <ErrorState message={liste.error} />;
  if (!liste.chargee) return <LoadingState />;
  if (lignes.length === 0) return <EmptyState title={vide} message="Changez la période ou le projet en haut de l’écran." />;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2 text-micro text-muted-foreground">
        <span>
          {libelleChargees(lignes.length, liste.total)}
          <ResumeActivite ids={ids} activite={activite} />
        </span>
        <label className="flex cursor-pointer items-center gap-2 text-label text-foreground">
          <input
            type="checkbox"
            className="size-3.5"
            checked={toutesCochees}
            disabled={idsVisibles.length === 0}
            onChange={() => onSelection(basculerVisibles(selection, idsVisibles))}
          />
          Tout cocher
        </label>
      </div>
      <div className="flex items-center gap-1" role="group" aria-label="Filtrer par activité">
        {FILTRES_ACTIVITE.map((f) => (
          <button
            key={f.valeur}
            type="button"
            aria-pressed={filtre === f.valeur}
            disabled={f.valeur !== 'toutes' && !activite.chargee}
            onClick={() => setFiltre(f.valeur)}
            className={`rounded px-2 py-0.5 text-micro font-medium disabled:opacity-50 ${
              filtre === f.valeur ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {f.libelle}
          </button>
        ))}
      </div>
      {visibles.length > 0 ? (
        <LignesSelectionnables
          lignes={visibles}
          selection={selection}
          onBasculer={(id) => onSelection(basculer(selection, id))}
          onOuvrir={onOuvrir}
          activites={activite.parId}
        />
      ) : (
        <p className="rounded-md border border-border px-2.5 py-3 text-center text-micro text-muted-foreground">
          Aucun lead chargé pour ce filtre.
        </p>
      )}
      {liste.total > lignes.length && (
        <Button type="button" variant="outline" className="self-center" disabled={liste.loading} onClick={liste.afficherPlus}>
          {liste.loading ? 'Chargement…' : 'Afficher plus'}
        </Button>
      )}
    </div>
  );
}

/** Compteurs sur les lignes chargées ; en erreur, une mention discrète et la liste reste utilisable. */
function ResumeActivite({ ids, activite }: Readonly<{ ids: readonly UUID[]; activite: ActiviteLeads }>) {
  if (activite.error) return <span title={activite.error}> · état des leads indisponible</span>;
  if (!activite.chargee) return null;
  return <>{resumeActivite(ids, activite.parId)}</>;
}
