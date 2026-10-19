import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import PageShell from '../PageShell';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import ActionAdmin from '../patrimoine/ActionAdmin';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import type { ApiState } from '../../lib/useApi';

/** Liste non paginée (entités, actionnaires, groupes) : création réservée à l'Administrateur. */
export default function ListeAdmin<T extends { id: string; code?: string; description?: string }>({
  titre, icon, chemin, libelleNouveau, etat, colonnes, filtres, outils, filtre = false,
}: Readonly<{
  titre: string;
  icon: ReactNode;
  /** `/actionnaires` : fiche `<chemin>/<id>`, création `<chemin>/nouveau`. */
  chemin: string;
  libelleNouveau: string;
  etat: ApiState<T[]>;
  colonnes: ColonneGrille<T>[];
  filtres?: ReactNode;
  outils?: ReactNode;
  /** Une recherche ou un filtre est posé (message de liste vide). */
  filtre?: boolean;
}>) {
  const navigate = useNavigate();
  const { data, loading, error } = etat;
  return (
    <PageShell title={titre} crumbs={[{ label: 'Patrimoine' }, { label: titre }]} icon={icon} fullHeight
      actions={<ActionAdmin to={`${chemin}/nouveau`} libelle={libelleNouveau} />}>
      <div className="flex h-full min-h-0 flex-col gap-3">
        {filtres && <div className="flex shrink-0 flex-wrap items-center gap-2">{filtres}</div>}
        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">{data.length} ligne{data.length > 1 ? 's' : ''}</div>
              {outils}
            </div>
            {data.length === 0 ? <EmptyState title={filtre ? 'Aucun résultat' : 'Aucune ligne'} /> : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid cleOrdre={chemin} rows={data} colonnes={colonnes} onOuvrir={(id) => void navigate(`${chemin}/${id}`)}
                  libelleLigne={(r) => `Ouvrir ${r.description || r.code || ''}`.trim()} />
              </div>
            )}
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
