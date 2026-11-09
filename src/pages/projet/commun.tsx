import type { ReactNode } from 'react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import { Badge, EmptyState, ErrorState, ResultsRegion } from '../../components/ui';
import { Skeleton } from '../../components/ui/skeleton';
import { formatPercentValue } from '../../lib/format';
import NotFound from '../NotFound';
import type { ApiState } from '../../lib/useApi';
import type { PageDto } from '../../types';

/** Chargement, erreur, 404 (fiche inconnue ou hors périmètre) puis la fiche. */
export function EtatFiche<T>({ etat, children }: Readonly<{ etat: ApiState<T | null>; children: (data: T) => ReactNode }>) {
  if (etat.error) return <ErrorState message={etat.error} />;
  if (etat.data) return <>{children(etat.data)}</>;
  if (etat.loading) {
    return (
      <div className="flex flex-col gap-3 p-4" aria-busy>
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  return <NotFound />;
}

/** Squelette de grille pendant le premier chargement d'une liste. */
export function SqueletteGrille() {
  return (
    <div className="flex flex-col gap-1.5 p-3" aria-busy>
      {Array.from({ length: 10 }, (_, i) => (
        <Skeleton key={i} className="h-6 w-full" />
      ))}
    </div>
  );
}

/** Corps d'une liste paginée serveur : squelette, erreur, vide, grille et pagination. `rows` = lignes après filtre client. */
export function CorpsListe<T extends { id: string }>({
  etat,
  rows,
  colonnes,
  cleOrdre,
  messageVide,
  onOuvrir,
  onPage,
}: Readonly<{
  etat: ApiState<PageDto<T>>;
  rows: T[];
  colonnes: ColonneGrille<T>[];
  cleOrdre: string;
  messageVide: string;
  onOuvrir: (id: string) => void;
  onPage: (page: number) => void;
}>) {
  const { data, loading, error } = etat;
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
      {loading && !data && <SqueletteGrille />}
      {error && <ErrorState message={error} />}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
            {rows.length === 0 ? (
              <EmptyState title={messageVide} />
            ) : (
              <DataGrid rows={rows} colonnes={colonnes} cleOrdre={cleOrdre} onOuvrir={onOuvrir} bandeauRegroupement={false} />
            )}
          </div>
          <div className="shrink-0">
            <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={onPage} />
          </div>
        </ResultsRegion>
      )}
    </div>
  );
}

/** Pourcentage 0–100, non plafonné ; la barre, elle, s'arrête à 100 %. */
export function BarreAvancement({ pct }: Readonly<{ pct: number | null }>) {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="flex items-center gap-1.5">
      <span aria-hidden className="h-1.5 w-14 overflow-hidden rounded-full bg-(--neutral-bg)">
        <span className="block h-full rounded-full bg-(--brand)" style={{ width: `${Math.min(100, Math.max(0, pct))}%` }} />
      </span>
      <span>{formatPercentValue(pct, 2)}</span>
    </span>
  );
}

export function BadgeStatut({ libelle }: Readonly<{ libelle: string | null }>) {
  if (!libelle) return <span className="text-muted-foreground">—</span>;
  return <Badge tone="info">{libelle}</Badge>;
}
