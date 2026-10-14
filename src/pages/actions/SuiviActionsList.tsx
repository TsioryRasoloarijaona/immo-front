import { useCallback, useMemo, useState } from 'react';
import { ListChecks, RotateCcw } from 'lucide-react';
import ActionDetailDialog from '../../components/ActionDetailDialog';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import MultiSelectDropdown from '../../components/MultiSelectDropdown';
import Pagination from '../../components/Pagination';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import SuiviActionTable from '../../components/SuiviActionTable';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import BoutonExporter from '../../components/BoutonExporter';
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
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { estAdministrateur } from '../../lib/roles';
import { referentielItems, useColonnesSuiviActions, useTranchesFiltre, useTypesContactProspection } from '../../lib/referentiels';
import { debutMoisISO as premierDuMois, pluriel, todayISO } from '../../lib/format';
import type { SuiviActionDto } from '../../types';

type SystemeFilter = 'all' | 'saisies' | 'systeme';
const SYSTEME_PARAM: Record<SystemeFilter, boolean | undefined> = { all: undefined, saisies: false, systeme: true };

const SYSTEME_ITEMS: { label: string; value: SystemeFilter }[] = [
  { label: 'Toutes les actions', value: 'all' },
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

  const aujourdhui = todayISO();
  const estAujourdhui = dateDebut === aujourdhui && dateFin === aujourdhui;
  const estCeMois = dateDebut === premierDuMois() && dateFin === aujourdhui;
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

  let messageVide = "Vous n'avez saisi aucune action ce mois-ci.";
  if (hasActiveFilters) messageVide = 'Aucune action ne correspond aux filtres actifs.';
  else if (isAdmin) messageVide = "Aucune action n'a été saisie ce mois-ci.";

  return (
    <PageShell
      title={isAdmin ? 'Suivi des actions' : 'Mes actions'}
      crumbs={[{ label: 'Ventes' }, { label: 'Suivi' }, { label: isAdmin ? 'Suivi des actions' : 'Mes actions' }]}
      fullHeight
      icon={<ListChecks />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
      actions={
        <BoutonExporter
          chemin="/api/suivi-actions/export"
          params={{ ...filtresServeur, colonnes: colonnes.visibles }}
          nomListe="suivi-actions"
        />
      }
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <PerimetreBanner projets={projetsAutorises.map((p) => ({ code: p.code ?? '' }))} />

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Button
              type="button"
              size="sm"
              variant={estAujourdhui ? 'default' : 'outline'}
              aria-pressed={estAujourdhui}
              onClick={() => poserPeriode(aujourdhui, aujourdhui)}
            >
              Aujourd'hui
            </Button>
            <Button
              type="button"
              size="sm"
              variant={estCeMois ? 'default' : 'outline'}
              aria-pressed={estCeMois}
              onClick={() => poserPeriode(premierDuMois(), aujourdhui)}
            >
              Ce mois
            </Button>
          </div>
          <div className="flex items-center gap-1.5">
            <InputGroup className="w-32.5">
              <InputGroupInput type="date" aria-label="Du" value={dateDebut} onChange={(e) => resetAndSet(setDateDebut, e.target.value)} />
            </InputGroup>
            <InputGroup className="w-32.5">
              <InputGroupInput type="date" aria-label="Au" value={dateFin} onChange={(e) => resetAndSet(setDateFin, e.target.value)} />
            </InputGroup>
          </div>
          {isAdmin && (
            <MultiSelectDropdown label="Utilisateur" placeholder="Tous" value={utilisateur} onChange={(v) => resetAndSet(setUtilisateur, v)} items={utilisateurItems} />
          )}
          <MultiSelectDropdown label="Action" placeholder="Toutes" value={typeId} onChange={(v) => resetAndSet(setTypeId, v)} items={typeItems} />
          <MultiSelectDropdown label="Tranche" placeholder="Toutes" value={trancheId} onChange={(v) => resetAndSet(setTrancheId, v)} items={trancheItems} />
          <Select items={SYSTEME_ITEMS} value={systeme} onValueChange={(v) => resetAndSet(setSysteme, v as SystemeFilter)}>
            <SelectTrigger className="w-42">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {SYSTEME_ITEMS.map((item) => (
                  <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
            <RotateCcw data-icon="inline-start" /> Réinitialiser
          </Button>
        </div>

        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-body text-muted-foreground">
                {pluriel(pageAffichee.totalElements, enGroupes ? 'groupe' : 'action')}
              </span>
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
                  title={hasActiveFilters ? 'Aucun résultat' : 'Rien à afficher'}
                  message={messageVide}
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  }
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
    </PageShell>
  );
}
