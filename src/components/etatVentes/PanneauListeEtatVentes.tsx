import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { RotateCcw } from 'lucide-react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import Pagination from '../Pagination';
import { Button } from '../ui/button';
import ColumnSelector from '../ColumnSelector';
import BandeGroupement from '../BandeGroupement';
import BoutonExporter from '../BoutonExporter';
import EtatColonnes from '../EtatColonnes';
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
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { pluriel } from '../../lib/format';
import {
  referentielItems,
  useCategoriesBien,
  useColonnesEtatVentes,
  useProjetsReferentiel,
  useTranchesFiltre,
  useTypesBienReferentiel,
} from '../../lib/referentiels';
import type { LigneEtatVentesDto, PageDto, StatutSynthese } from '../../types';

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
  onOuvrir: (id: string) => void;
}>) {
  const projetItems = referentielItems(useProjetsReferentiel().data);
  const trancheItems = useTranchesFiltre().data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const categorieItems = referentielItems(useCategoriesBien().data);
  const typeItems = referentielItems(useTypesBienReferentiel().data);

  const [page, setPage] = useState(0);
  const search = useDebouncedValue(filtres.search);
  const params = paramsEtatVentes({ ...filtres, search });
  const cle = JSON.stringify(params);

  function changer<K extends keyof FiltresListeEtatVentes>(c: K, valeur: FiltresListeEtatVentes[K]) {
    setPage(0);
    setFiltres((f) => ({ ...f, [c]: valeur }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_ETAT_VENTES_DEFAUT);
  }

  const catalogue = useColonnesEtatVentes();
  const colonnes = useColonnesVisibles('etat-des-ventes', catalogue.data, DISPOSITION_ETAT_VENTES);
  const demandees = colonnes.demandees;
  const groupement = useGroupement('etat-des-ventes', catalogue.data, useCallback(() => setPage(0), []));
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
  const actifs = filtresEtatVentesActifs(filtres);
  const statutItems = statuts.map((s) => ({ label: libelleStatutVente(statuts, s.code), value: s.code }));

  return (
    <div className="flex flex-col gap-3">
      <FiltresEtatVentesPanneau
        filtres={filtres}
        changer={changer}
        reinitialiser={reinitialiser}
        projets={projetItems}
        tranches={trancheItems}
        categories={categorieItems}
        statuts={statutItems}
        types={typeItems}
      />
      {chargement && !pageAffichee && <LoadingState />}
      {erreur && <ErrorState message={erreur} />}
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
        <span className="text-body text-muted-foreground">
          {!erreur && pageAffichee && pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'article')}
        </span>
        <div className="flex items-center gap-2">
          {colonnes.catalogueServi.length > 0 && (
            <ColumnSelector
              catalogue={colonnes.catalogueServi}
              visibles={colonnes.visibles}
              onBasculer={colonnes.basculer}
              onReinitialiser={colonnes.reinitialiser}
              estDefaut={colonnes.estDefaut}
            />
          )}
          <BoutonExporter
            chemin="/api/etat-des-ventes/export"
            params={{ ...params, colonnes: colonnes.visibles }}
            nomListe="etat-des-ventes"
            disabled={chargement || !!erreur || vide}
          />
        </div>
      </div>
      {!erreur && pageAffichee && (
        <ResultsRegion loading={chargement}>
          <div className="flex h-[70vh] min-w-0 flex-col overflow-auto rounded-xl border border-border bg-card">
            <BandeGroupement etat={groupement} />
            {vide ? (
              <EmptyState
                title={VIDE_ETAT_VENTES}
                action={
                  actifs ? (
                    <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  ) : undefined
                }
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
          <Pagination
            page={pageAffichee.page}
            totalPages={pageAffichee.totalPages}
            totalElements={pageAffichee.totalElements}
            onPageChange={setPage}
          />
        </ResultsRegion>
      )}
    </div>
  );
}
