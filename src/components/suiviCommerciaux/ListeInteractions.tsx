import { useCallback, useMemo } from 'react';
import { RotateCcw } from 'lucide-react';
import { Badge, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../ui';
import { Button } from '../ui/button';
import BandeGroupement from '../BandeGroupement';
import BoutonExporter from '../BoutonExporter';
import ColumnSelector from '../ColumnSelector';
import DataGrid, { type ColonneGrille } from '../DataGrid';
import EtatColonnes from '../EtatColonnes';
import Pagination from '../Pagination';
import FiltresSuiviPanneau from './FiltresSuiviPanneau';
import { DEFAULT_PAGE_SIZE, listSuiviCommerciaux, listSuiviCommerciauxGroupes, totauxColonnes } from '../../lib/api';
import { grilleDepuisCatalogue, useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_SUIVI_COMMERCIAUX } from '../../lib/dispositions';
import { pluriel } from '../../lib/format';
import { usePreview } from '../../lib/previewContext';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import { useColonnesSuiviCommerciaux } from '../../lib/referentiels';
import { catalogueGroupement, filtresDuGroupe, paramsSuivi, type FiltresListeSuivi } from '../../lib/suiviCommerciaux';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ColonneDto, LigneSuiviCommerciauxDto } from '../../types';

const CLE = 'suivi-commerciaux';
const VIDE = 'Aucune activité sur cette période';

function grille(colonnes: ColonneDto[]): ColonneGrille<LigneSuiviCommerciauxDto>[] {
  return grilleDepuisCatalogue<LigneSuiviCommerciauxDto>(colonnes, DISPOSITION_SUIVI_COMMERCIAUX.poids, 'personneNom').map((c) =>
    c.nom === 'joint'
      ? {
          ...c,
          rendu: (r) => (r.joint == null ? null : <Badge tone={r.joint ? 'success' : 'neutral'}>{r.joint ? 'Joint' : 'Non joint'}</Badge>),
        }
      : c,
  );
}

/** Liste des interactions ; filtres et page sont tenus par l'écran, que la synthèse pilote au clic. */
export default function ListeInteractions({
  filtres,
  page,
  setPage,
  changer,
  reinitialiser,
  actifs,
  commerciaux,
}: Readonly<{
  filtres: FiltresListeSuivi;
  page: number;
  setPage: (page: number) => void;
  changer: <K extends keyof FiltresListeSuivi>(cle: K, valeur: FiltresListeSuivi[K]) => void;
  reinitialiser: () => void;
  actifs: boolean;
  commerciaux: { label: string; value: string }[];
}>) {
  const { ouvrirFicheProspection } = usePreview();
  const search = useDebouncedValue(filtres.search);
  const params = paramsSuivi({ ...filtres, search });
  const cle = JSON.stringify(params);

  const catalogue = useColonnesSuiviCommerciaux();
  const colonnes = useColonnesVisibles(CLE, catalogue.data, DISPOSITION_SUIVI_COMMERCIAUX);
  const demandees = colonnes.demandees;
  const colonnesGrille = useMemo(() => grille(colonnes.colonnes), [colonnes.colonnes]);
  const groupables = useMemo(() => catalogueGroupement(catalogue.data), [catalogue.data]);
  const groupement = useGroupement(CLE, groupables, useCallback(() => setPage(0), [setPage]));
  const enGroupes = groupement.actif;

  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes(CLE, params, agregats),
    cle,
    !enGroupes,
    'suivi-commerciaux-totaux-colonnes',
  );
  const liste = useApi(
    () => (enGroupes ? Promise.resolve(null) : listSuiviCommerciaux(params, { page, size: DEFAULT_PAGE_SIZE }, demandees)),
    [cle, page, demandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    CLE,
  );
  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listSuiviCommerciauxGroupes(params, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [cle, page, enGroupes, groupement.cleDeps],
    'suivi-commerciaux-groupes',
  );
  const colonneGroupee = groupement.colonneGroupee?.nom ?? '';
  const lignesGroupes = useLignesGroupes<LigneSuiviCommerciauxDto>(
    (cleGroupe, taille) => listSuiviCommerciaux(filtresDuGroupe(params, colonneGroupee, cleGroupe), { page: 0, size: taille }, demandees),
    `${cle}|${groupement.cleDeps}|${demandees?.join(',') ?? ''}`,
  );

  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const chargement = enGroupes ? groupes.loading : liste.loading;
  const erreur = enGroupes ? groupes.error : liste.error;
  const lignes = [...(liste.data?.content ?? []), ...lignesGroupes.lignesChargees];

  function ouvrir(id: string) {
    const prospectionId = lignes.find((l) => l.id === id)?.prospectionId;
    if (prospectionId) ouvrirFicheProspection(prospectionId, false);
  }

  return (
    <section aria-label="Liste des interactions" className="flex flex-col gap-3">
      <FiltresSuiviPanneau filtres={filtres} changer={changer} reinitialiser={reinitialiser} commerciaux={commerciaux} />
      {chargement && !pageAffichee && <LoadingState />}
      {erreur && <ErrorState message={erreur} />}
      {!erreur && pageAffichee && (
        <ResultsRegion loading={chargement}>
          <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span className="text-body text-muted-foreground">
              {pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'interaction')}
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
              <BoutonExporter chemin="/api/suivi-commerciaux/export" params={{ ...params, colonnes: colonnes.visibles }} nomListe={CLE} />
            </div>
          </div>
          <div className="flex h-[70vh] min-w-0 flex-col overflow-auto rounded-xl border border-border bg-card">
            <BandeGroupement etat={groupement} />
            {pageAffichee.content.length === 0 ? (
              <EmptyState
                title={VIDE}
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
                <DataGrid
                  cleOrdre={CLE}
                  rows={enGroupes ? [] : (liste.data?.content ?? [])}
                  colonnes={colonnesGrille}
                  onOuvrir={ouvrir}
                  libelleLigne={(r) => `Ouvrir la prospection de ${r.personneNom ?? '—'}`}
                  bandeauRegroupement={false}
                  groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
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
    </section>
  );
}
