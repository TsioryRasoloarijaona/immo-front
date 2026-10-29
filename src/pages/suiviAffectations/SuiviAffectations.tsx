import { useCallback, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import EtatColonnes from '../../components/EtatColonnes';
import { usePreview } from '../../lib/previewContext';
import FiltresAffectationsPanneau from '../../components/suiviAffectations/FiltresAffectationsPanneau';
import AffectationsTable, { type LigneAffectation } from '../../components/suiviAffectations/AffectationsTable';
import { DEFAULT_PAGE_SIZE, listSuiviAffectations, listSuiviAffectationsGroupes, totauxColonnes } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_SUIVI_AFFECTATIONS } from '../../lib/dispositions';
import { canonicalStatusLabel } from '../../lib/dossierStatus';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import {
  LIBELLES_GROUPE_AFFECTATIONS,
  SANS_CATEGORIE,
  SANS_STATUT,
  filtresAffectationsActifs,
  filtresAffectationsDefaut,
  paramsAffectations,
  type FiltresListeAffectations,
} from '../../lib/suiviAffectations';
import {
  referentielItems,
  useCategoriesEcheance,
  useColonnesSuiviAffectations,
  useStatutsSuiviAffectations,
  useTypesReglement,
} from '../../lib/referentiels';
import { useCascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { useExportListe } from '../../lib/useExportListe';
import { pluriel } from '../../lib/format';

const CLE = 'suivi-affectations';
const VIDE = 'Aucune affectation pour ces filtres';

export default function SuiviAffectations() {
  const { user } = useAuth();
  const { ouvrirFicheDossier } = usePreview();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes(CLE));

  const [filtres, setFiltres] = useState<FiltresListeAffectations>(filtresAffectationsDefaut);
  const cascade = useCascadeTranches(filtres);

  const choix = {
    categories: [...referentielItems(useCategoriesEcheance().data), SANS_CATEGORIE],
    types: useTypesReglement().data.map((t) => ({ label: t.description || t.code || t.id, value: t.id })),
    statuts: [
      ...useStatutsSuiviAffectations().data.map((s) => ({ label: canonicalStatusLabel(s.libelle ?? s.code), value: s.code })),
      SANS_STATUT,
    ],
  };

  const [page, setPage] = useState(0);
  const search = useDebouncedValue(filtres.search);
  const params = paramsAffectations({ ...filtres, search }, cascade.params(true));
  const cle = JSON.stringify(params);

  function changer<K extends keyof FiltresListeAffectations>(c: K, valeur: FiltresListeAffectations[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [c]: valeur }));
  }

  function changerCascade(sel: SelectionCascade) {
    setPage(0);
    setFiltres((f) => ({ ...f, ...sel }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(filtresAffectationsDefaut());
  }

  const catalogue = useColonnesSuiviAffectations();
  const colonnes = useColonnesVisibles(CLE, catalogue.data, DISPOSITION_SUIVI_AFFECTATIONS);
  const demandees = colonnes.demandees;
  const groupement = useGroupement(CLE, catalogue.data, useCallback(() => setPage(0), []));
  const enGroupes = groupement.actif;

  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes(CLE, params, agregats),
    cle,
    !enGroupes,
    'suivi-affectations-totaux-colonnes',
  );
  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listSuiviAffectations(params, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: demandees }),
    [cle, page, demandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    CLE,
  );
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listSuiviAffectationsGroupes(params, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [cle, page, enGroupes, groupement.cleDeps],
    'suivi-affectations-groupes',
  );
  const lignesGroupes = useLignesGroupes<LigneAffectation>(
    (cleGroupe, taille) =>
      listSuiviAffectations(params, { page: 0, size: taille }, { colonnes: demandees, depliage: groupement.depliagePour(cleGroupe) }),
    `${cle}|${groupement.cleDeps}|${demandees?.join(',') ?? ''}`,
  );

  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const chargement = enGroupes ? groupes.loading : liste.loading;
  const erreur = enGroupes ? groupes.error : liste.error;
  const vide = (pageAffichee?.content.length ?? 0) === 0;
  const lignes = [...(liste.data?.content ?? []), ...lignesGroupes.lignesChargees];
  const total = enGroupes ? groupes.data?.nombreTotal : liste.data?.totalElements;

  function ouvrir(id: string) {
    const dossierId = lignes.find((l) => l.id === id)?.dossierId;
    if (dossierId) ouvrirFicheDossier(dossierId);
  }

  const exportListe = useExportListe('/api/suivi-affectations/export', { ...params, colonnes: colonnes.visibles }, CLE);
  const unite = enGroupes ? 'groupe' : 'affectation';
  const decompte = total == null ? undefined : pluriel(total, unite);

  return (
    <PageListe titre="Suivi des affectations">
      <EnteteListe titre="Suivi des affectations" lignes={decompte}>
        {colonnes.catalogueServi.length > 0 && (
          <ColumnSelector
            compact
            catalogue={colonnes.catalogueServi}
            visibles={colonnes.visibles}
            onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser}
            estDefaut={colonnes.estDefaut}
          />
        )}
      </EnteteListe>
      <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />
      <FiltresAffectationsPanneau
        filtres={filtres}
        changer={changer}
        changerCascade={changerCascade}
        cascade={cascade}
        reinitialiser={reinitialiser}
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        choix={choix}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {chargement && !pageAffichee && <LoadingState />}
        {erreur && <ErrorState message={erreur} />}
        {!erreur && pageAffichee && (
          <ResultsRegion loading={chargement}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title={VIDE}
                  action={
                    filtresAffectationsActifs(filtres) ? (
                      <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <AffectationsTable
                    rows={enGroupes ? [] : (liste.data?.content ?? [])}
                    colonnes={colonnes.colonnes}
                    onOuvrir={ouvrir}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, LIBELLES_GROUPE_AFFECTATIONS)}
                    totauxServeur={totauxServeur}
                  />
                </EtatColonnes>
              )}
            </div>
            <div className="shrink-0">
              <Pagination
                page={pageAffichee.page}
                totalPages={pageAffichee.totalPages}
                totalElements={pageAffichee.totalElements}
                onPageChange={setPage}
              />
            </div>
          </ResultsRegion>
        )}
      </div>
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle={CLE}
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
