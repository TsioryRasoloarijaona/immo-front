import { useCallback, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListChecks, RotateCcw } from 'lucide-react';
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
import {
  DEFAULT_PAGE_SIZE,
  listSuiviActions,
  listSuiviActionsGroupes,
  listTranches,
  type SuiviActionsFilterParams,
} from '../../lib/api';
import { useColonnesVisibles } from '../../lib/colonnes';
import { CLES_OUVERTURE_SUIVI_ACTION, DISPOSITION_SUIVI_ACTIONS } from '../../lib/dispositions';
import { useGroupement, useLignesGroupes } from '../../lib/groupement';
import { useApi } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { referentielItems, useColonnesSuiviActions, useTypesContactProspection } from '../../lib/referentiels';
import { todayISO } from '../../lib/format';
import type { SuiviActionDto } from '../../types';

type SystemeFilter = 'all' | 'saisies' | 'systeme';

const SYSTEME_ITEMS: { label: string; value: SystemeFilter }[] = [
  { label: 'Toutes les actions', value: 'all' },
  { label: 'Saisies seules', value: 'saisies' },
  { label: 'Système seules', value: 'systeme' },
];

/** Le premier jour du mois courant, `YYYY-MM-DD`. */
function premierDuMois(): string {
  return `${todayISO().slice(0, 8)}01`;
}

/** Le lendemain d'une date `YYYY-MM-DD`, en `YYYY-MM-DD`. Calculé en UTC pour
 * ne pas dépendre du fuseau : on ne manipule que des jours. */
function lendemain(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10);
}

/* L'écran OMRAN « Suivi des actions » (FEATURE-suivi-actions.md) : les
 * appels, visites, messages saisis par chaque commercial, jour par jour.
 * Consultation seule — l'écran sert d'abord à **compter** (téléphone sortant :
 * 5 258 sur 12 mois), d'où la bande de groupement par jour, par utilisateur,
 * par type.
 *
 * Même mécanique que les autres listes à catalogue : `?colonnes=` piloté par
 * le sélecteur, `/groupes` pour la bande, `useLignesGroupes` pour déplier un
 * groupe sur place. Aucune colonne n'est agrégeable ici — la mesure d'un
 * groupe est son effectif — et la bande n'offre donc pas de Σ.
 *
 * **Période fin exclue**, comme OMRAN : l'utilisateur choisit un « Au »
 * inclusif, et c'est le lendemain à minuit qui part en `dateFin`. Par défaut,
 * le mois courant — décision utilisateur du 23/09. */
export default function SuiviActionsList() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
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
  /* Contrairement aux autres écrans, `?colonnes=` part **toujours** : le clic
     sur une ligne ouvre la prospection (à défaut le dossier), et ces deux clés
     sont hors défaut côté serveur. Sans elles dans la requête, la ligne
     n'ouvrirait rien, sans erreur ni explication. Tant que le catalogue n'est
     pas arrivé (`visibles` vide), rien n'est envoyé : la première page vient
     avec les défauts serveur et se recharge une fois avec les clés. */
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

  /* Deux raccourcis de période, parce que l'écran sert d'abord à répondre à
     « qu'a-t-on fait aujourd'hui ? » et « ce mois-ci ? ». Ils posent les deux
     dates, et s'allument quand les champs y correspondent — saisir la même
     plage à la main allume donc le même bouton. */
  const aujourdhui = todayISO();
  const estAujourdhui = dateDebut === aujourdhui && dateFin === aujourdhui;
  const estCeMois = dateDebut === premierDuMois() && dateFin === aujourdhui;
  function poserPeriode(debut: string, fin: string) {
    setPage(0);
    setDateDebut(debut);
    setDateFin(fin);
  }

  /* Les filtres serveur, mot pour mot les mêmes pour la liste et les groupes :
     la somme des effectifs des groupes égale le total de la liste. */
  const filtresServeur: SuiviActionsFilterParams = {
    dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
    dateFin: dateFin ? `${lendemain(dateFin)}T00:00:00` : undefined,
    utilisateur: utilisateur.length > 0 ? utilisateur : undefined,
    typeId: typeId.length > 0 ? typeId : undefined,
    trancheId: trancheId.length > 0 ? trancheId : undefined,
    systeme: systeme === 'systeme' ? true : systeme === 'saisies' ? false : undefined,
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
        /* Tri déterministe : « en charger davantage » redemande la page 0 avec
           une taille plus grande — le lot précédent doit en être le préfixe. */
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

  /* Ouvrir une ligne : la prospection, à défaut le dossier. `DataGrid` ne
     rend que l'id de l'action, d'où la table id → ligne sur ce qui est à
     l'écran — la page à plat ou les groupes dépliés. */
  const lignesParId = useMemo(() => {
    const m = new Map<string, SuiviActionDto>();
    for (const r of data?.content ?? []) m.set(r.id, r);
    for (const r of lignesGroupes.lignesChargees) m.set(r.id, r);
    return m;
  }, [data, lignesGroupes.lignesChargees]);
  function ouvrir(id: string) {
    const r = lignesParId.get(id);
    if (r?.prospectionId) navigate(`/prospections/${r.prospectionId}`);
    else if (r?.dossierId) navigate(`/dossiers/${r.dossierId}`);
  }

  /* Le filtre Utilisateur, comme la spec le prescrit : les valeurs réellement
     présentes (`UserName` de l'action, égalité exacte), avec leur effectif —
     un référentiel des comptes en offrirait qui n'ont jamais rien saisi.
     Hors période, exprès : un utilisateur sans action ce mois-ci doit rester
     choisissable pour élargir la période ensuite. */
  const utilisateurs = useApi(
    () => listSuiviActionsGroupes({}, { groupBy: 'utilisateur', tri: 'LIBELLE' }, { page: 0, size: 200 }),
    [],
    'suivi-actions-utilisateurs',
  );
  const utilisateurItems = (utilisateurs.data?.content ?? [])
    .filter((g) => g.cle !== null && g.cle !== undefined)
    .map((g) => ({ label: `${g.libelle ?? String(g.cle)} (${g.nombre})`, value: String(g.cle) }));

  const tranches = useApi(() => listTranches(undefined, { page: 0, size: 500 }), [], 'tranches-filtre');
  const trancheItems = (tranches.data?.content ?? []).map((t) => ({ label: t.description || t.code || t.id, value: t.id }));
  const typeItems = referentielItems(typesAction.data);

  return (
    <PageShell
      title="Suivi des actions"
      crumbs={[{ label: 'Ventes' }, { label: 'Suivi des actions' }]}
      fullHeight
      icon={<ListChecks />}
      accent="var(--sec-accent)"
      accentBg="var(--sec-accent-bg)"
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
          <MultiSelectDropdown label="Utilisateur" placeholder="Tous" value={utilisateur} onChange={(v) => resetAndSet(setUtilisateur, v)} items={utilisateurItems} />
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
                {enGroupes
                  ? `${pageAffichee.totalElements} groupe${pageAffichee.totalElements > 1 ? 's' : ''}`
                  : `${pageAffichee.totalElements} action${pageAffichee.totalElements > 1 ? 's' : ''}`}
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
                  message={
                    hasActiveFilters
                      ? 'Aucune action ne correspond aux filtres actifs.'
                      : "Aucune action n'a été saisie ce mois-ci."
                  }
                  action={
                    <Button type="button" variant="outline" size="sm" onClick={resetFilters}>
                      <RotateCcw data-icon="inline-start" /> Réinitialiser les filtres
                    </Button>
                  }
                />
              ) : colonnes.colonnes.length > 0 ? (
                <SuiviActionTable
                  cleOrdre="suivi-actions"
                  rows={enGroupes ? [] : rows}
                  colonnes={colonnes.colonnes}
                  onOuvrir={ouvrir}
                  bandeauRegroupement={false}
                  groupes={
                    enGroupes && groupement.colonneGroupee
                      ? {
                          liste: groupes.data?.content ?? [],
                          colonneLibelle: groupement.colonneGroupee.libelle,
                          agregats: groupement.agregatsActifs,
                          totaux: groupes.data?.totaux ?? {},
                          nombreTotal: groupes.data?.nombreTotal ?? 0,
                          estOuvert: lignesGroupes.estOuvert,
                          etat: lignesGroupes.etat,
                          basculer: lignesGroupes.basculer,
                          chargerPlus: lignesGroupes.chargerPlus,
                          lignesChargees: lignesGroupes.lignesChargees,
                        }
                      : undefined
                  }
                />
              ) : catalogue.error ? (
                <ErrorState message={`Colonnes indisponibles — ${catalogue.error}`} />
              ) : (
                <LoadingState />
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
    </PageShell>
  );
}
