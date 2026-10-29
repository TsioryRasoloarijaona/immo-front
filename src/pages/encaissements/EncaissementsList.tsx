import { useCallback, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Info } from 'lucide-react';
import FicheEncaissementFenetre from '../../components/encaissements/fiche/FicheEncaissementFenetre';
import { voisinsDe } from '../../lib/fenetreFiche';
import { ErrorState, LoadingState, PerimetreBanner, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import EtatVideListe from '../../components/liste/EtatVideListe';
import { Input } from '../../components/ui/input';
import EncaissementTable from '../../components/EncaissementTable';
import ColumnSelector from '../../components/ColumnSelector';
import BandeGroupement from '../../components/BandeGroupement';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import FiltreTiers, { type TiersChoisi } from '../../components/encaissements/FiltreTiers';
import BandeTotalEncaissements from '../../components/encaissements/BandeTotalEncaissements';
import {
  DEFAULT_PAGE_SIZE,
  listEncaissements,
  listEncaissementsGroupes,
  totauxColonnes,
  type EncaissementChampDate,
} from '../../lib/api';
import { useTotauxServeur } from '../../lib/totauxServeur';
import { useColonnesVisibles } from '../../lib/colonnes';
import { DISPOSITION_ENCAISSEMENTS } from '../../lib/dispositions';
import { groupesGrille, useGroupement, useLignesGroupes } from '../../lib/groupement';
import EtatColonnes from '../../components/EtatColonnes';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useAuth } from '../../lib/auth';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { useExportListe } from '../../lib/useExportListe';
import {
  referentielItems,
  useColonnesEncaissements,
  useComptesReferentiel,
  useDepotsReferentiel,
  useEntitesReferentiel,
  useTranchesFiltre,
  useTypesReglement,
} from '../../lib/referentiels';
import { ENCAISSEMENT_ETAT_LABELS, encaissementEtatLabel } from '../../lib/domain';
import { debutMoisISO, finMoisISO, pluriel } from '../../lib/format';
import type { EncaissementDto } from '../../types';

type ComptabiliseFilter = 'all' | 'yes' | 'no';
const COMPTABILISE_PARAM: Record<ComptabiliseFilter, boolean | undefined> = { all: undefined, yes: true, no: false };
type ChampDate = EncaissementChampDate;

const ETAT_ITEMS: { label: string; value: string }[] = Object.entries(ENCAISSEMENT_ETAT_LABELS).map(([value, label]) => ({ label, value }));

const CHAMP_DATE_ITEMS: { label: string; value: ChampDate }[] = [
  { label: 'Date pièce', value: 'DATE_PIECE' },
  { label: 'Date échéance', value: 'DATE_ECHEANCE' },
  { label: 'Date règlement', value: 'DATE_REGLEMENT' },
  { label: 'Pointage prévu', value: 'POINTAGE_PREVU' },
];

const COMPTABILISE_ITEMS: { label: string; value: ComptabiliseFilter }[] = [
  { label: 'Comptabilisés', value: 'yes' },
  { label: 'Non comptabilisés', value: 'no' },
];

export default function EncaissementsList() {
  const navigate = useNavigate();
  const { id: idOuvert } = useParams();
  const { user } = useAuth();
  const projetsAutorises = user?.perimetreRestreint ? (user.projetsAutorises ?? []) : [];
  const entites = useEntitesReferentiel();
  const types = useTypesReglement();
  const comptes = useComptesReferentiel();
  const depots = useDepotsReferentiel();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('encaissements'));

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [reference, setReference] = useState('');
  const [entiteId, setEntiteId] = useState<string[]>([]);
  const [typeId, setTypeId] = useState<string[]>([]);
  const [etat, setEtat] = useState<string[]>([]);
  const [compteId, setCompteId] = useState<string | null>(null);
  const [depotId, setDepotId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string[]>([]);
  const [tiers, setTiers] = useState<TiersChoisi | null>(null);
  const [comptabilise, setComptabilise] = useState<ComptabiliseFilter>('all');
  const [champDate, setChampDate] = useState<ChampDate>('DATE_PIECE');
  const [dateDebut, setDateDebut] = useState(debutMoisISO);
  const [dateFin, setDateFin] = useState(finMoisISO);
  const [montantDe, setMontantDe] = useState('');
  const [montantA, setMontantA] = useState('');
  const [page, setPage] = useState(0);

  // Plusieurs colonnes servies par défaut sont des clés UUID : voir `DISPOSITION_ENCAISSEMENTS`.
  const catalogue = useColonnesEncaissements();
  const colonnes = useColonnesVisibles('encaissements', catalogue.data, DISPOSITION_ENCAISSEMENTS);
  const colonnesDemandees = colonnes.demandees;

  // Changer d'axe de groupement change le jeu de résultats : retour page 0, sinon écran vide.
  const groupement = useGroupement(
    'encaissements',
    catalogue.data,
    useCallback(() => setPage(0), []),
  );

  function resetAndSet<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function resetFilters() {
    setPage(0);
    setSearch('');
    setReference('');
    setEntiteId([]);
    setTypeId([]);
    setEtat([]);
    setCompteId(null);
    setDepotId(null);
    setTrancheId([]);
    setTiers(null);
    groupement.reinitialiser();
    setComptabilise('all');
    setChampDate('DATE_PIECE');
    setDateDebut(debutMoisISO());
    setDateFin(finMoisISO());
    setMontantDe('');
    setMontantA('');
  }

  function toutesLesPeriodes() {
    setPage(0);
    setDateDebut('');
    setDateFin('');
  }

  // Les dates se comparent au défaut (le mois courant), pas au vide.
  const hasActiveFilters =
    !!search || !!reference || entiteId.length > 0 || typeId.length > 0 || etat.length > 0 || !!compteId || !!depotId || trancheId.length > 0 || !!tiers || comptabilise !== 'all' || champDate !== 'DATE_PIECE' || dateDebut !== debutMoisISO() || dateFin !== finMoisISO() || !!montantDe || !!montantA;

  // Mêmes filtres pour la liste et les groupes : la somme des effectifs doit égaler le total.
  const filtresServeur = {
          search: debouncedSearch || undefined,
          reference: reference || undefined,
          entiteId: entiteId.length > 0 ? entiteId : undefined,
          typeId: typeId.length > 0 ? typeId : undefined,
          etat: etat.length > 0 ? etat : undefined,
          trancheId: trancheId.length > 0 ? trancheId : undefined,
          tierId: tiers?.id,
          compteId: compteId || undefined,
          depotId: depotId || undefined,
          comptabilise: COMPTABILISE_PARAM[comptabilise],
          champDate: dateDebut || dateFin ? champDate : undefined,
          dateDebut: dateDebut ? `${dateDebut}T00:00:00` : undefined,
          dateFin: dateFin ? `${dateFin}T23:59:59` : undefined,
          montantDe: montantDe ? Number(montantDe) : undefined,
          montantA: montantA ? Number(montantA) : undefined,
  };

  const enGroupes = groupement.actif;

  const clesFiltres = [
    debouncedSearch,
    reference,
    entiteId.join(','),
    typeId.join(','),
    etat.join(','),
    compteId,
    depotId,
    trancheId.join(','),
    tiers?.id,
    comptabilise,
    champDate,
    dateDebut,
    dateFin,
    montantDe,
    montantA,
    page,
  ];

  // Σ par colonne sur tout le filtre (hors `page`) ; colonnes affichées seulement.
  const totauxServeur = useTotauxServeur(
    colonnes.colonnes,
    (agregats) => totauxColonnes('encaissements', filtresServeur, agregats),
    clesFiltres.slice(0, -1).join('|'),
    !enGroupes,
    'encaissements-totaux-colonnes',
  );

  const liste = useApi(
    () =>
      enGroupes
        ? Promise.resolve(null)
        : listEncaissements(filtresServeur, { page, size: DEFAULT_PAGE_SIZE }, { colonnes: colonnesDemandees }),
    [...clesFiltres, colonnesDemandees?.join(',') ?? '', enGroupes, groupement.cleDeps],
    'encaissements',
  );

  const groupes = useApi(
    () =>
      enGroupes && groupement.paramsGroupes
        ? listEncaissementsGroupes(filtresServeur, groupement.paramsGroupes, { page, size: DEFAULT_PAGE_SIZE })
        : Promise.resolve(null),
    [...clesFiltres, enGroupes, groupement.cleDeps],
    'encaissements-groupes',
  );

  const lignesGroupes = useLignesGroupes<EncaissementDto>(
    (cle, taille) =>
      listEncaissements(
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
  const ouvrir = (id: string) => void navigate(`/encaissements/${id}`);
  const voisins = voisinsDe(rows.map((r) => r.id), idOuvert, ouvrir);

  const tranches = useTranchesFiltre();
  const trancheItems = tranches.data.map((t) => ({
    label: t.description || t.code || t.id,
    value: t.id,
  }));

  const entiteItems = referentielItems(entites.data);
  const typeItems = referentielItems(types.data);
  const compteItems = referentielItems(comptes.data);
  const depotItems = referentielItems(depots.data);

  const exportListe = useExportListe('/api/encaissements/export', { ...filtresServeur, colonnes: colonnes.visibles }, 'encaissements');
  const puces = [
    ...puceSelection('Entité', entiteItems, entiteId),
    ...puceSelection('Type', typeItems, typeId),
    ...puceSelection('État', ETAT_ITEMS, etat),
    ...puceSelection('Tranche', trancheItems, trancheId),
    ...puceUnique(compteItems, compteId),
    ...puceUnique(depotItems, depotId),
    ...puceUnique(COMPTABILISE_ITEMS, comptabilise === 'all' ? null : comptabilise),
    ...(reference ? [`Réf. ${reference}`] : []),
    ...(tiers ? [tiers.nom] : []),
    ...(search ? [`« ${search} »`] : []),
  ];
  const unite = enGroupes ? 'groupe' : 'encaissement';
  const decompte = pageAffichee ? pluriel(pageAffichee.totalElements, unite) : undefined;

  function periodeChangee(debut: string, fin: string) {
    setPage(0);
    setDateDebut(debut);
    setDateFin(fin);
  }

  return (
    <PageListe titre="Encaissements">
      <EnteteListe titre="Encaissements" lignes={decompte}>
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
        champDate={{ items: CHAMP_DATE_ITEMS, valeur: champDate, onChange: (v) => resetAndSet(setChampDate, v as ChampDate) }}
        periode={{ debut: dateDebut, fin: dateFin, onChange: periodeChangee }}
        recherche={{
          valeur: search,
          onChange: (v) => resetAndSet(setSearch, v),
          placeholder: 'Référence, tiers…',
        }}
        onReinitialiser={resetFilters}
        champs={
          <>
            <Input aria-label="Référence" placeholder="Référence" className="w-35" value={reference} onChange={(e) => resetAndSet(setReference, e.target.value)} />
            <FiltreTiers choisi={tiers} onChoisir={(t) => resetAndSet(setTiers, t)} />
            <Input type="number" aria-label="Montant de" placeholder="Montant de" className="w-30" value={montantDe} onChange={(e) => resetAndSet(setMontantDe, e.target.value)} />
            <Input type="number" aria-label="Montant à" placeholder="à" className="w-24" value={montantA} onChange={(e) => resetAndSet(setMontantA, e.target.value)} />
          </>
        }
      >
        <BoiteFiltre titre="Entité" mode="multiple" items={entiteItems} valeur={entiteId} onChange={(v) => resetAndSet(setEntiteId, v)} />
        <BoiteFiltre titre="Type" mode="multiple" items={typeItems} valeur={typeId} onChange={(v) => resetAndSet(setTypeId, v)} />
        <BoiteFiltre titre="État" mode="multiple" items={ETAT_ITEMS} valeur={etat} onChange={(v) => resetAndSet(setEtat, v)} />
        {/* Un règlement remonte dès qu'une de ses échéances porte sur un lot de
            la tranche : à cheval sur deux tranches, il remonte pour les deux. */}
        <BoiteFiltre titre="Tranche" mode="multiple" items={trancheItems} valeur={trancheId} onChange={(v) => resetAndSet(setTrancheId, v)} />
        <BoiteFiltre titre="Compte" mode="unique" items={compteItems} valeur={compteId} onChange={(v) => resetAndSet(setCompteId, v)} />
        <BoiteFiltre titre="Dépôt" mode="unique" items={depotItems} valeur={depotId} onChange={(v) => resetAndSet(setDepotId, v)} />
        <BoiteFiltre
          titre="Comptabilisé"
          mode="unique"
          items={COMPTABILISE_ITEMS}
          valeur={comptabilise === 'all' ? null : comptabilise}
          onChange={(v) => resetAndSet(setComptabilise, (v ?? 'all') as ComptabiliseFilter)}
        />
      </PanneauFiltresCoches>

      {/* `pageAffichee` et non `data` : en mode groupes `data` reste nul, le
          chargement plein écran se rallumerait par-dessus les groupes. */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 px-3 pt-2">
        {loading && !pageAffichee && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && pageAffichee && (
          <ResultsRegion loading={loading}>
            {/* Un règlement non imputé n'a aucune ligne : l'API ne le sert jamais, alors
                que l'écran légataire l'affiche. Sans cette mention, l'écart des totaux
                passerait pour un bug. */}
            <span className="inline-flex shrink-0 items-center gap-1 text-micro text-muted-foreground">
              <Info aria-hidden className="size-3 shrink-0" />
              Les règlements pas encore imputés à une échéance ne figurent pas dans cette liste.
            </span>
            {/* Liste plate seulement : en groupes, chaque groupe porte déjà ses totaux serveur.
                Au-dessus de la grille, comme les Σ de la maquette : la barre flottante ne la couvre pas. */}
            {!enGroupes && <BandeTotalEncaissements filtres={filtresServeur} cle={clesFiltres.slice(0, -1).join('|')} />}
            {/* La bande reste hors du test « vide » : un groupe vide garde sa sortie. */}
            <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto rounded-xl border border-border bg-card">
              <BandeGroupement etat={groupement} />
              {vide ? (
                <EtatVideListe
                  filtresActifs={hasActiveFilters}
                  sujet="encaissement"
                  surMois="Aucun encaissement daté du mois en cours."
                  onReinitialiser={resetFilters}
                  onToutesPeriodes={toutesLesPeriodes}
                />
              ) : (
                <EtatColonnes pret={colonnes.colonnes.length > 0} erreur={catalogue.error}>
                  <EncaissementTable
                    cleOrdre="encaissements"
                    rows={enGroupes ? [] : rows}
                    colonnes={colonnes.colonnes}
                    onOuvrir={ouvrir}
                    bandeauRegroupement={false}
                    groupes={groupesGrille(groupement, groupes.data, lignesGroupes, { etat: encaissementEtatLabel })}
                    totauxServeur={totauxServeur}
                  />
                </EtatColonnes>
              )}
            </div>
            {/* Sur `pageAffichee` : en mode groupes `liste.data` est nul et la pagination disparaîtrait. */}
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
        cle="encaissements"
        ligneSelectionnee={false}
        actions={[
          { id: 'rafraichir', onClick: refetchAllApis },
          { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
        ]}
      />
      {idOuvert && <FicheEncaissementFenetre key={idOuvert} id={idOuvert} voisins={voisins} onFermer={() => void navigate('/encaissements')} />}
    </PageListe>
  );
}
