import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { ErrorState, LoadingState, ResultsRegion } from '../ui';
import Pagination from '../Pagination';
import ColumnSelector from '../ColumnSelector';
import BandeGroupement from '../BandeGroupement';
import EtatColonnes from '../EtatColonnes';
import EnteteListe from '../liste/EnteteListe';
import EtatVideListe from '../liste/EtatVideListe';
import BarreEtatListe from '../liste/BarreEtatListe';
import BarreOutilsFlottante from '../liste/BarreOutilsFlottante';
import FiltresEtatVentesPanneau from './FiltresEtatVentesPanneau';
import EtatVentesTable, { type LigneEtatVentes } from './EtatVentesTable';
import { DEFAULT_PAGE_SIZE, listEtatVentes, listEtatVentesGroupes, totauxColonnes } from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_ETAT_VENTES } from '../../lib/dispositions';
import {
  FILTRES_ETAT_VENTES_DEFAUT,
  VIDE_ETAT_VENTES,
  filtresEtatVentesActifs,
  libelleStatutVente,
  paramsEtatVentes,
  type FiltresListeEtatVentes,
} from '../../lib/etatVentes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import { pluriel } from '../../lib/format';
import { referentielItems, useCategoriesBien, useColonnesEtatVentes, useTypesBienReferentiel } from '../../lib/referentiels';
import { useCascadeTranches, type SelectionCascade } from '../../lib/cascadeTranches';
import type { LigneEtatVentesDto, PageDto, StatutSynthese } from '../../types';

const CLE = 'etat-des-ventes-omran';

function avecId(p: PageDto<LigneEtatVentesDto>): PageDto<LigneEtatVentes> {
  return { ...p, content: p.content.map((l) => ({ ...l, id: l.articleId })) };
}

/** Onglet « Liste des articles » ; les filtres vivent dans la page pour survivre au changement d'onglet. */
export default function PanneauListeEtatVentes({
  filtres,
  setFiltres,
  statuts,
  onOuvrir,
}: Readonly<{
  filtres: FiltresListeEtatVentes;
  setFiltres: Dispatch<SetStateAction<FiltresListeEtatVentes>>;
  statuts: StatutSynthese[];
  onOuvrir: (ligne: LigneEtatVentes) => void;
}>) {
  const cascade = useCascadeTranches(filtres);
  const categorieItems = referentielItems(useCategoriesBien().data);
  const typeItems = referentielItems(useTypesBienReferentiel().data);

  const [page, setPage] = useState(0);
  const search = useDebouncedValue(filtres.search);
  const params = paramsEtatVentes({ ...filtres, search }, cascade.params(true));
  const cle = JSON.stringify(params);

  function changer<K extends keyof FiltresListeEtatVentes>(c: K, valeur: FiltresListeEtatVentes[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [c]: valeur }));
  }

  function changerCascade(sel: SelectionCascade) {
    setPage(0);
    setFiltres((f) => ({ ...f, ...sel }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_ETAT_VENTES_DEFAUT);
  }

  const catalogue = useColonnesEtatVentes();
  const colonnes = useColonnesVisibles(CLE, catalogue.data, DISPOSITION_ETAT_VENTES);
  const demandees = colonnes.demandees;
  const groupement = useGroupement(CLE, catalogue.data, useCallback(() => setPage(0), []));
  const enGroupes = groupement.actif;

  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes('etat-des-ventes', params, agregats),
    cle,
    !enGroupes,
    'etat-des-ventes-totaux-colonnes',
  );
  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listEtatVentes(params, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: demandees }).then(avecId),
    [cle, page, demandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'etat-des-ventes',
  );
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listEtatVentesGroupes(params, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [cle, page, enGroupes, groupement.cleDeps],
    'etat-des-ventes-groupes',
  );
  const lignesGroupes = useLignesGroupes<LigneEtatVentes>(
    (cleGroupe, taille) =>
      listEtatVentes(params, { page: 0, size: taille }, { colonnes: demandees, depliage: groupement.depliagePour(cleGroupe) }).then(avecId),
    `${cle}|${groupement.cleDeps}|${demandees?.join(',') ?? ''}`,
  );

  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const chargement = enGroupes ? groupes.loading : liste.loading;
  const erreur = enGroupes ? groupes.error : liste.error;
  const vide = (pageAffichee?.content.length ?? 0) === 0;
  const statutItems = statuts.map((s) => ({ label: libelleStatutVente(statuts, s.code), value: s.code }));
  const unite = enGroupes ? 'groupe' : 'article';
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;
  const exportListe = useExportListe('/api/etat-des-ventes/export', { ...params, colonnes: colonnes.visibles }, 'etat-des-ventes');

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <EnteteListe titre="État des ventes" lignes={decompte}>
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
      <FiltresEtatVentesPanneau
        filtres={filtres}
        changer={changer}
        changerCascade={changerCascade}
        cascade={cascade}
        reinitialiser={reinitialiser}
        categories={categorieItems}
        statuts={statutItems}
        types={typeItems}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {chargement && !pageAffichee && <LoadingState />}
        {erreur && <ErrorState message={erreur} />}
        {!erreur && pageAffichee && (
          <ResultsRegion loading={chargement}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EtatVideListe
                  filtresActifs={filtresEtatVentesActifs(filtres)}
                  sujet="article"
                  surMois={VIDE_ETAT_VENTES}
                  onReinitialiser={reinitialiser}
                  onToutesPeriodes={reinitialiser}
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <EtatVentesTable
                    rows={enGroupes ? [] : (liste.data?.content ?? [])}
                    colonnes={colonnes.colonnes}
                    onOuvrir={onOuvrir}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, {
                      statutCode: (brut) => libelleStatutVente(statuts, brut),
                    })}
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
        cle="etat-des-ventes"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </div>
  );
}
