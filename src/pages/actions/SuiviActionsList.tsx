import { useCallback, useMemo, useState } from 'react';
import ActionDetailDialog from '../../components/ActionDetailDialog';
import { ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import SuiviActionTable from '../../components/SuiviActionTable';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import EtatVideListe from '../../components/liste/EtatVideListe';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import {
  DEFAULT_PAGE_SIZE,
  listSuiviActions,
  listSuiviActionsGroupes,
  type SuiviActionsFilterParams,
} from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { CLES_OUVERTURE_SUIVI_ACTION, DISPOSITION_SUIVI_ACTIONS } from '../../lib/dispositions';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import { refetchAllApis, useApi } from '../../lib/useApi';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { useExportListe } from '../../lib/useExportListe';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { referentielItems, useColonnesSuiviActions, useTranchesFiltre, useTypesContactProspection } from '../../lib/referentiels';
import { debutMoisISO as premierDuMois, pluriel, todayISO } from '../../lib/format';
import type { SuiviActionDto } from '../../types';

type SystemeFilter = 'all' | 'saisies' | 'systeme';
const SYSTEME_PARAM: Record<SystemeFilter, boolean | undefined> = { all: undefined, saisies: false, systeme: true };

const SYSTEME_ITEMS: { label: string; value: string }[] = [
  { label: 'Saisies seules', value: 'saisies' },
  { label: 'Système seules', value: 'systeme' },
];

// En UTC pour ne pas dépendre du fuseau : on ne manipule que des jours.
function lendemain(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

// `dateFin` est exclusive côté serveur : le « Au » saisi est inclusif, c'est le lendemain à minuit qui part.
export default function SuiviActionsList() {
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  /* Hors administrateur, le serveur ne renvoie que ses propres actions : demander
     quelqu'un d'autre rendrait une page vide, sans 403. D'où le sélecteur masqué. */
  const isAdmin = estAdministrateur(user);
  const typesAction = useTypesContactProspection();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('suivi-actions'));

  const [dateDebut, setDateDebut] = useState(premierDuMois);
  const [dateFin, setDateFin] = useState(todayISO);
  const [utilisateur, setUtilisateur] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string[]>([]);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [systeme, setSysteme] = useState<SystemeFilter>('all');
  const [page, setPage] = useState(0);

  const catalogue = useColonnesSuiviActions();
  const colonnes = useColonnesVisibles('suivi-actions', catalogue.data, DISPOSITION_SUIVI_ACTIONS);
  /* `?colonnes=` part toujours ici : les clés d'ouverture (prospection, dossier) sont
     hors défaut côté serveur, sans elles une ligne n'ouvrirait rien. Rien n'est
     envoyé tant que le catalogue n'est pas arrivé. */
  const colonnesDemandees = useMemo(
    () =>
      colonnes.visibles.length > 0
        ? Array.from(new Set([...(colonnes.demandees ?? colonnes.visibles), ...CLES_OUVERTURE_SUIVI_ACTION]))
        : undefined,
    [colonnes.visibles, colonnes.demandees],
  );

  const groupement = useGroupement(
    'suivi-actions',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setDateDebut(premierDuMois());
    setDateFin(todayISO());
    setUtilisateur([]);
    setTypeId([]);
    setTrancheId([]);
    setSysteme('all');
    groupement.reinitialiser();
  }

  const hasActiveFilters =
    dateDebut !== premierDuMois() || dateFin !== todayISO() || utilisateur.length > 0 || typeId.length > 0 || trancheId.length > 0 || systeme !== 'all';

  function poserPeriode(debut: string, fin: string) {
    setPage(0);
    setDateDebut(debut);
    setDateFin(fin);
  }

  // Mêmes filtres pour la liste et les groupes : la somme des effectifs doit égaler le total.
  const filtresServeur: SuiviActionsFilterParams = {
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${lendemain(dateFin)}T00:00:00` : undefined,
    utilisateur: utilisateur.length > 0 ? utilisateur : undefined,
    typeId: typeId.length > 0 ? typeId : undefined,
    trancheId: trancheId.length > 0 ? trancheId : undefined,
    systeme: SYSTEME_PARAM[systeme],
  };

  const enGroupes = groupement.actif;

  const clesFiltres = [dateDebut, dateFin, utilisateur.join(','), typeId.join(','), trancheId.join(','), systeme, page];

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listSuiviActions(filtresServeur, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'suivi-actions',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listSuiviActionsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'suivi-actions-groupes',
  );

  const lignesGroupes = useLignesGroupes<SuiviActionDto>(
    (cle, taille) =>
      listSuiviActions(
        filtresServeur,
        /* `id,asc` départage les dates ex æquo : « en charger davantage » redemande
           la page 0 plus grande et suppose que le lot précédent en soit le préfixe. */
        { page: 0, size: taille, sort: ['docDate,desc', 'id,asc'] },
        { colonnes: colonnesDemandees, depliage: groupement.depliagePour(cle) },
      ),
    `${clesFiltres.join('|')}|${groupement.cleDeps}|${colonnesDemandees?.join(',') ?? ''}`,
  );

  const data = liste.data;
  const rows = data?.content ?? [];
  const pageAffichee = enGroupes ? groupes.data : liste.data;
  const loading = enGroupes ? groupes.loading : liste.loading;
  const error = enGroupes ? groupes.error : liste.error;
  const vide = enGroupes ? (groupes.data?.content.length ?? 0) === 0 : rows.length === 0;

  // `DataGrid` ne rend que l'id : table id → ligne sur la page à plat et les groupes dépliés.
  const lignesParId = useMemo(() => {
    const m = new Map<string, SuiviActionDto>();
    for (const r of data?.content ?? []) m.set(r.id, r);
    for (const r of lignesGroupes.lignesChargees) m.set(r.id, r);
    return m;
  }, [data, lignesGroupes.lignesChargees]);
  const [actionOuverte, setActionOuverte] = useState<SuiviActionDto | null>(null);
  function ouvrir(id: string) {
    const r = lignesParId.get(id);
    if (r) setActionOuverte(r);
  }

  /* Valeurs réellement présentes (`UserName`, égalité exacte), pas un référentiel des
     comptes. Hors période exprès : un utilisateur sans action ce mois-ci reste choisissable. */
  const utilisateurs = useApi(
    () =>
      isAdmin
        ? listSuiviActionsGroupes({}, { groupBy: 'utilisateur', tri: 'LIBELLE' }, { page: 0, size: 200 })
        : Promise.resolve(null),
    [isAdmin],
    'suivi-actions-utilisateurs',
  );
  const utilisateurItems = (utilisateurs.data?.content ?? [])
    .filter((g) => g.cle != null)
    .map((g) => ({ label: `${g.libelle ?? String(g.cle)} (${g.nombre})`, value: String(g.cle) }));

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const typeItems = referentielItems(typesAction.data);

  const surMois = isAdmin ? "Aucune action n'a été saisie ce mois-ci." : "Vous n'avez saisi aucune action ce mois-ci.";
  const titre = isAdmin ? 'Suivi des actions' : 'Mes actions';
  const exportListe = useExportListe('/api/suivi-actions/export', { ...filtresServeur, colonnes: colonnes.visibles }, 'suivi-actions');
  const unite = enGroupes ? 'groupe' : 'action';
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;
  const puces = [
    ...(isAdmin ? puceSelection('Utilisateur', utilisateurItems, utilisateur) : []),
    ...puceSelection('Action', typeItems, typeId),
    ...puceSelection('Tranche', trancheItems, trancheId),
    ...puceUnique(SYSTEME_ITEMS, systeme === 'all' ? null : systeme),
  ];

  return (
    <PageListe titre={titre}>
      <EnteteListe titre={titre} lignes={decompte}>
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
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: dateDebut, fin: dateFin, onChange: poserPeriode }}
        onReinitialiser={resetFilters}
      >
        {isAdmin && (
          <BoiteFiltre titre="Utilisateur" mode="multiple" items={utilisateurItems} valeur={utilisateur} onChange={(v) => resetAndSet(setUtilisateur, v)} />
        )}
        <BoiteFiltre titre="Action" mode="multiple" items={typeItems} valeur={typeId} onChange={(v) => resetAndSet(setTypeId, v)} />
        <BoiteFiltre titre="Tranche" mode="multiple" items={trancheItems} valeur={trancheId} onChange={(v) => resetAndSet(setTrancheId, v)} />
        <BoiteFiltre
          titre="Saisie"
          mode="unique"
          items={SYSTEME_ITEMS}
          valeur={systeme === 'all' ? null : systeme}
          onChange={(v) => resetAndSet(setSysteme, (v ?? 'all') as SystemeFilter)}
        />
      </PanneauFiltresCoches>

      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EtatVideListe
                  filtresActifs={hasActiveFilters}
                  sujet="action"
                  surMois={surMois}
                  onReinitialiser={resetFilters}
                  onToutesPeriodes={() => poserPeriode('', '')}
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <SuiviActionTable
                    cleOrdre="suivi-actions"
                    rows={enGroupes ? [] : rows}
                    colonnes={colonnes.colonnes}
                    onOuvrir={ouvrir}
                    bandeauRegroupement={false}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes)}
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

      {actionOuverte && (
        <ActionDetailDialog action={actionOuverte} catalogue={catalogue.data} onClose={() => setActionOuverte(null)} />
      )}

      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" alerte={exportListe.erreur} />
      <BarreOutilsFlottante
        cle="suivi-actions"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
    </PageListe>
  );
}
