import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History, RefreshCw, RotateCcw } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import ColumnSelector from '../../components/ColumnSelector';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import DossierTable from '../../components/DossierTable';
import BandeGroupement from '../../components/BandeGroupement';
import BoutonExporter from '../../components/BoutonExporter';
import EtatColonnes from '../../components/EtatColonnes';
import TotauxDossiers from '../../components/dossier/liste/TotauxDossiers';
import FiltresHistoriqueVentes from '../../components/historiqueVentes/FiltresHistoriqueVentes';
import {
  DEFAULT_PAGE_SIZE,
  listChampsDateDossiers,
  listDossiers,
  listDossiersGroupes,
  listStatutsDossiers,
  totauxColonnes,
} from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { useColonnesVisibles } from '../../lib/colonnes';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { DISPOSITION_HISTORIQUE_VENTES } from '../../lib/dispositions';
import { useColonnesDossiers, useEntitesReferentiel, useTranchesFiltre } from '../../lib/referentiels';
import { useAppData, commercialLabel } from '../../lib/appData';
import { pluriel } from '../../lib/format';
import { usePreview } from '../../lib/previewContext';
import { useTotauxNature } from '../../lib/totauxDossiers';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { AGREGATS_TOTAUX, colonnesListe, libelleStatut } from '../../lib/dossierListe';
import {
  FILTRES_DEFAUT,
  catalogueHistorique,
  estModifie,
  optionsProjets,
  optionsSocietes,
  optionsStatutsHistorique,
  versParams,
  type FiltresHistorique,
} from '../../lib/historiqueVentes';
import type { DossierListItemDto } from '../../types';

const TRI = ['docDate,desc'];
const CLE = 'historique-ventes';
/** Référence stable pour la grille. */
const AUCUNE: DossierListItemDto[] = [];

/** Suivi des dossiers de vente (OMRAN F_0254) : tous les dossiers, sortis compris, sur les composants de la liste. */
export default function HistoriqueVentes() {
  const navigate = useNavigate();
  const { commerciaux } = useAppData();
  const { ouvrirFicheProspection } = usePreview();
  const [filtres, setFiltres] = useState<FiltresHistorique>(FILTRES_DEFAUT);
  const [page, setPage] = useState(0);
  const filtresServeur = versParams(useDebouncedValue(filtres));
  const cle = JSON.stringify(filtresServeur);

  const statuts = useApi(() => listStatutsDossiers(), [], 'dossiers-statuts');
  const champsDate = useApi(() => listChampsDateDossiers(), [], 'dossiers-champs-date');
  const tranches = useTranchesFiltre();
  const entites = useEntitesReferentiel();

  const catalogueBrut = useColonnesDossiers();
  const catalogue = useMemo(() => catalogueHistorique(catalogueBrut.data), [catalogueBrut.data]);
  const colonnes = useColonnesVisibles(CLE, catalogue, DISPOSITION_HISTORIQUE_VENTES);
  const colonnesDemandees = colonnesListe(colonnes.demandees, catalogue, DISPOSITION_HISTORIQUE_VENTES.toujoursDemandees ?? []);
  const groupement = useGroupement(CLE, catalogue, useCallback(() => setPage(0), []));
  const enGroupes = groupement.actif;

  const liste = useApi(
    () => (enGroupes ? Promise.resolve(null) : listDossiers(filtresServeur, { page, size: DEFAULT_PAGE_SIZE, sort: TRI }, { colonnes: colonnesDemandees })),
    [cle, page, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'historique-ventes',
  );
  const groupes = useApi(
    () => (enGroupes && groupement.paramsGroupes ? listDossiersGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE }) : Promise.resolve(null)),
    [cle, page, enGroupes, groupement.cleDeps],
    'historique-ventes-groupes',
  );
  // Σ en tête sur tout le filtre : `totaux` de `/groupes`, puis montants par nature (`/totaux`) et par colonne.
  const totaux = useApi(
    () => listDossiersGroupes(filtresServeur, { groupBy: 'statut', agregats: [...AGREGATS_TOTAUX], inclureSansValeur: true }, { page: 0, size: 1 }),
    [cle],
    'historique-ventes-totaux',
  );
  const totauxNature = useTotauxNature(filtresServeur, [cle], colonnes.colonnes);
  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes('dossiers', filtresServeur, agregats),
    cle,
    !enGroupes,
    'historique-ventes-totaux-colonnes',
  );
  const lignesGroupes = useLignesGroupes(
    (cleGroupe, taille) =>
      listDossiers(filtresServeur, { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] }, { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cleGroupe) }),
    `${cle}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  function changer(patch: Partial<FiltresHistorique>) {
    setPage(0);
    setFiltres((avant) => ({ ...avant, ...patch }));
  }

  function reinitialiser() {
    setPage(0);
    groupement.reinitialiser();
    setFiltres(FILTRES_DEFAUT);
  }

  const options = {
    societes: optionsSocietes(tranches.data, entites.data),
    projets: optionsProjets(tranches.data),
    tranches: tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id })),
    statuts: optionsStatutsHistorique(statuts.data ?? []),
    champsDate: champsDate.data?.map((c) => ({ label: c.libelle, value: c.code })) ?? [{ label: 'Date réservation', value: 'RESERVATION' }],
    commerciaux: commerciaux.map((c) => ({ label: commercialLabel(c), value: c.id })),
  };

  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const etat = enGroupes ? groupes : liste;
  const vide = (pageAffichee?.content.length ?? 0) === 0;

  return (
    <PageShell
      title="Historique des ventes"
      crumbs={[{ label: 'Ventes' }, { label: 'Tableaux de bord' }, { label: 'Historique des ventes' }]}
      fullHeight
      icon={<History />}
      accent="var(--sec-dossier)"
      accentBg="var(--sec-dossier-bg)"
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-start gap-2">
          <FiltresHistoriqueVentes filtres={filtres} onChange={changer} onReinitialiser={reinitialiser} options={options} />
          <BoutonExporter chemin="/api/dossiers/export" params={{ ...filtresServeur, colonnes: colonnes.visibles, sort: TRI }} nomListe="historique-ventes" />
        </div>

        {etat.loading && !pageAffichee && <LoadingState />}
        {etat.error && (
          <div className="flex flex-col items-center">
            <ErrorState message={etat.error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void etat.refetch()}>
              <RefreshCw data-icon="inline-start" /> Réessayer
            </Button>
          </div>
        )}
        {!etat.error && pageAffichee && (
          <ResultsRegion loading={etat.loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
                <span className="text-body text-muted-foreground">{pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'dossier')}</span>
                <TotauxDossiers totaux={totaux.data} montants={totauxNature.data} colonnes={colonnes.colonnes} />
              </div>
              {colonnes.catalogueServi.length > 0 && (
                <ColumnSelector
                  catalogue={colonnes.catalogueServi}
                  visibles={colonnes.visibles}
                  onBasculer={colonnes.basculer}
                  onReinitialiser={colonnes.reinitialiser}
                  estDefaut={colonnes.estDefaut}
                />
              )}
            </div>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EmptyState
                  title="Aucun dossier pour ces filtres"
                  action={
                    estModifie(filtres) ? (
                      <Button type="button" variant="outline" size="sm" onClick={reinitialiser}>
                        <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                      </Button>
                    ) : undefined
                  }
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogueBrut.error}>
                  <DossierTable
                    cleOrdre={CLE}
                    rows={enGroupes ? AUCUNE : (liste.data?.content ?? AUCUNE)}
                    colonnes={colonnes.colonnes}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, { statut: libelleStatut }, enGroupes)}
                    onOuvrir={(id) => void navigate(`/dossiers/${id}`)}
                    onOuvrirProspection={(prospectionId) => ouvrirFicheProspection(prospectionId, false)}
                    bandeauRegroupement={false}
                    totauxServeur={totauxServeur}
                  />
                </EtatColonnes>
              )}
            </div>
            <div className="shrink-0">
              <Pagination page={pageAffichee.page} totalPages={pageAffichee.totalPages} totalElements={pageAffichee.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
