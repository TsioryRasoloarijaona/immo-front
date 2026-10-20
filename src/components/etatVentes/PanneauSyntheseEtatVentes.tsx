import type { Dispatch, SetStateAction } from 'react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import ChoixUnique from '../ChoixUnique';
import MultiSelectDropdown from '../MultiSelectDropdown';
import SyntheseEtatVentes from './SyntheseEtatVentes';
import { VIDE_ETAT_VENTES, type ChoixSynthese, type FiltresSyntheseEtatVentes } from '../../lib/etatVentes';
import type { ApiState } from '../../lib/useApi';
import {
  referentielItems,
  useCategoriesBien,
  useProjetsReferentiel,
  useTranchesFiltre,
} from '../../lib/referentiels';
import type { SyntheseEtatVentesDto } from '../../types';

/** Onglet « Synthèse par statut » : filtres projet / tranche / catégorie, puis le tableau cliquable. */
export default function PanneauSyntheseEtatVentes({
  filtres,
  setFiltres,
  synthese,
  onChoisir,
}: Readonly<{
  filtres: FiltresSyntheseEtatVentes;
  setFiltres: Dispatch<SetStateAction<FiltresSyntheseEtatVentes>>;
  synthese: ApiState<SyntheseEtatVentesDto>;
  onChoisir: (choix: ChoixSynthese) => void;
}>) {
  const projetItems = referentielItems(useProjetsReferentiel().data);
  const trancheItems = useTranchesFiltre().data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const categorieItems = referentielItems(useCategoriesBien().data);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <ChoixUnique
          items={projetItems}
          tous="Tous les projets"
          value={filtres.projetId}
          placeholder="Projet…"
          largeur="w-44"
          onChange={(v) => setFiltres((f) => ({ ...f, projetId: v }))}
        />
        <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={filtres.trancheId} onChange={(v) => setFiltres((f) => ({ ...f, trancheId: v }))} items={trancheItems} />
        <MultiSelectDropdown label="Catégorie" placeholder="Toutes" value={filtres.categorieId} onChange={(v) => setFiltres((f) => ({ ...f, categorieId: v }))} items={categorieItems} />
      </div>
      {synthese.loading && !synthese.data && <LoadingState />}
      {synthese.error && <ErrorState message={synthese.error} />}
      {!synthese.error && synthese.data && (
        <ResultsRegion loading={synthese.loading}>
          <div className="max-h-[70vh] overflow-auto rounded-xl border border-border bg-card">
            {synthese.data.lignes.length === 0 ? (
              <EmptyState title={VIDE_ETAT_VENTES} />
            ) : (
              <SyntheseEtatVentes synthese={synthese.data} onChoisir={onChoisir} />
            )}
          </div>
        </ResultsRegion>
      )}
    </div>
  );
}
