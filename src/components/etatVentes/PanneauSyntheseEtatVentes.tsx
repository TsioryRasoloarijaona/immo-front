import type { Dispatch, SetStateAction } from 'react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import MultiSelectDropdown from '../MultiSelectDropdown';
import FiltreEntiteProjetTranche from '../liste/FiltreEntiteProjetTranche';
import SyntheseEtatVentes from './SyntheseEtatVentes';
import { VIDE_ETAT_VENTES, type ChoixSynthese, type FiltresSyntheseEtatVentes } from '../../lib/etatVentes';
import type { CascadeTranches } from '../../lib/cascadeTranches';
import type { ApiState } from '../../lib/useApi';
import { referentielItems, useCategoriesBien } from '../../lib/referentiels';
import type { SyntheseEtatVentesDto } from '../../types';

/** Onglet « Synthèse par statut » : filtres entité / projet / tranche / catégorie, puis le tableau cliquable. */
export default function PanneauSyntheseEtatVentes({
  filtres,
  setFiltres,
  cascade,
  synthese,
  onChoisir,
}: Readonly<{
  filtres: FiltresSyntheseEtatVentes;
  setFiltres: Dispatch<SetStateAction<FiltresSyntheseEtatVentes>>;
  cascade: CascadeTranches;
  synthese: ApiState<SyntheseEtatVentesDto>;
  onChoisir: (choix: ChoixSynthese) => void;
}>) {
  const categorieItems = referentielItems(useCategoriesBien().data);
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-start gap-2">
        <FiltreEntiteProjetTranche valeur={filtres} onChange={(sel) => setFiltres((f) => ({ ...f, ...sel }))} cascade={cascade} />
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
