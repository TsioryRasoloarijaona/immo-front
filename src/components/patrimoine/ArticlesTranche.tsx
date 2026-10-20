import { useMemo, useState } from 'react';
import BarreFiltresArticles from './BarreFiltresArticles';
import DataGrid from '../DataGrid';
import Pagination from '../Pagination';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { listTrancheArticles } from '../../lib/api';
import { useApi } from '../../lib/useApi';
import { usePreview } from '../../lib/previewContext';
import { colonnesArticles, useFiltresArticles } from '../../lib/articlesListe';

/** Onglet Articles de la tranche : mêmes filtres et colonnes que `/articles`, sur `GET /api/tranches/{id}/articles`. */
export default function ArticlesTranche({ trancheId }: Readonly<{ trancheId: string }>) {
  const { ouvrirFicheDossier, ouvrirFicheArticle } = usePreview();
  const [page, setPage] = useState(0);
  const filtres = useFiltresArticles(() => setPage(0));
  const { data, loading, error } = useApi(
    () => listTrancheArticles(trancheId, filtres.params, { page, size: 20 }),
    [trancheId, filtres.cle, page],
  );
  const colonnes = useMemo(() => colonnesArticles(ouvrirFicheDossier), [ouvrirFicheDossier]);

  return (
    <div className="flex flex-col gap-3">
      <BarreFiltresArticles
        filtres={filtres}
        onReinitialiser={() => {
          setPage(0);
          filtres.reinitialiser();
        }}
      />
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          {data.content.length === 0 ? (
            <EmptyState title="Aucun article" />
          ) : (
            <div className="min-w-0 overflow-auto rounded-xl border border-border">
              <DataGrid
                cleOrdre="articles-tranche"
                rows={data.content}
                colonnes={colonnes}
                onOuvrir={ouvrirFicheArticle}
                libelleLigne={(a) => `Ouvrir la fiche de ${a.code}`}
              />
            </div>
          )}
          <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
        </ResultsRegion>
      )}
    </div>
  );
}
