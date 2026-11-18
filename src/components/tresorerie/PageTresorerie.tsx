import type { ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import Pagination from '../Pagination';
import BarreEtatListe from '../liste/BarreEtatListe';
import BarreOutilsFlottante from '../liste/BarreOutilsFlottante';
import EnteteListe from '../liste/EnteteListe';
import PageListe from '../liste/PageListe';
import { EmptyState, ErrorState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import FiltresTresorerie from './FiltresTresorerie';
import TotauxTresorerie from './TotauxTresorerie';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { pluriel } from '../../lib/format';
import { filtresActifs, type useFiltresTresorerie } from '../../lib/tresorerie';
import type { ApiState } from '../../lib/useApi';
import { SqueletteGrille } from '../../pages/projet/commun';

/** Gabarit commun des listes de trésorerie : filtres, états chargement/erreur/vide, grille, Σ, pagination, fiche. */
export default function PageTresorerie({
  cle,
  titre,
  unite,
  liste,
  total,
  vide,
  filtres,
  totaux,
  grille,
  fiche,
}: Readonly<{
  cle: string;
  titre: string;
  /** Nom au singulier de la ligne, pour les décomptes. */
  unite: string;
  liste: ApiState<unknown>;
  total: number | undefined;
  vide: boolean;
  filtres: ReturnType<typeof useFiltresTresorerie>;
  totaux: { libelle: string; valeur: number; ton?: 'debit' | 'credit' }[];
  grille: ReactNode;
  fiche?: ReactNode;
}>) {
  const decompte = total === undefined ? undefined : pluriel(total, unite);
  const actifs = filtresActifs(filtres.etat);
  return (
    <PageListe titre={titre}>
      <EnteteListe titre={titre} lignes={decompte} />
      <FiltresTresorerie cle={cle} etat={filtres.etat} onChange={filtres.changer} onReinitialiser={filtres.reinitialiser} />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {liste.loading && !liste.data && !liste.error && <SqueletteGrille />}
        {liste.error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={liste.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
              <RotateCcw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!liste.error && !!liste.data && total !== undefined && (
          <ResultsRegion loading={liste.loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              {vide ? <EmptyState title={actifs ? 'Aucune ligne ne correspond aux filtres actifs' : 'Aucune pièce'} /> : grille}
            </div>
            <TotauxTresorerie totaux={totaux} />
            <div className="shrink-0">
              <Pagination
                page={filtres.page}
                totalPages={Math.ceil(total / DEFAULT_PAGE_SIZE)}
                totalElements={total}
                onPageChange={filtres.setPage}
              />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle={cle} ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: () => void liste.refetch() }]} />
      {fiche}
    </PageListe>
  );
}
