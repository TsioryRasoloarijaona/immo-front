import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import BoutonExporter from '../BoutonExporter';
import SyntheseVendusLibres from './SyntheseVendusLibres';
import { getSyntheseVendusLibres, type FiltresVendusLibres } from '../../lib/api';
import type { ChoixSynthese } from '../../lib/etatVentes';
import { useApi } from '../../lib/useApi';

/** Section « Libres / Réservés / Vendus » : récupère, affiche et exporte avec les mêmes filtres. */
export default function SectionVendusLibres({
  params,
  onChoisir,
}: Readonly<{ params: FiltresVendusLibres; onChoisir: (choix: ChoixSynthese) => void }>) {
  const { data, loading, error } = useApi(
    () => getSyntheseVendusLibres(params),
    [JSON.stringify(params)],
    'etat-des-ventes-vendus-libres',
  );
  return (
    <section aria-label="Libres, réservés, vendus" className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-label font-semibold">Libres / Réservés / Vendus</h2>
        <BoutonExporter
          chemin="/api/etat-des-ventes/synthese-vendus-libres/export"
          params={{ ...params }}
          nomListe="etat-des-ventes-vendus-libres"
          disabled={!data || data.lignes.length === 0}
        />
      </div>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="max-h-112 overflow-auto rounded-xl border border-border bg-card">
            {data.lignes.length === 0 ? (
              <EmptyState title="Aucun article pour ces filtres" />
            ) : (
              <SyntheseVendusLibres synthese={data} onChoisir={onChoisir} />
            )}
          </div>
          <p className="text-micro text-muted-foreground">
            Les parkings rattachés à un appartement suivent l'appartement et ne sont pas comptés dans Parkings.
          </p>
        </ResultsRegion>
      )}
    </section>
  );
}
