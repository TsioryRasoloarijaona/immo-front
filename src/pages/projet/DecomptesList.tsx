import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { RotateCcw } from 'lucide-react';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante, { type ActionOutil } from '../../components/liste/BarreOutilsFlottante';
import { ErrorState } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { creerDecompte, EXPORT_DECOMPTES, getTotauxDecomptes, listDecomptes, supprimerDecompte } from '../../lib/apiProjet';
import { listEntitesJuridiques } from '../../lib/apiEntites';
import { useConfirm } from '../../lib/confirmContext';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { useExportListe } from '../../lib/useExportListe';
import type { FiltresDecomptes } from '../../types/projet';
import DialogueRecalculDecompte from '../../components/projet/DialogueRecalculDecompte';
import { CorpsListe } from './commun';
import { COLONNES_DECOMPTES, totauxBandeDecomptes } from './colonnesDecomptes';
import { fournisseursItems, libelleReferentiel, useReferentielsProjet } from './hooks';

const CASE = 'flex items-center gap-1.5 text-body text-foreground';
const TRI = ['docDate,desc', 'code,desc'];

export default function DecomptesList() {
  const navigate = useNavigate();
  const confirmer = useConfirm();
  const [params, setParams] = useSearchParams();
  const lotId = params.get('lotId');
  const referentiels = useReferentielsProjet();
  const entites = useApi(() => listEntitesJuridiques('true'), [], 'projet-decomptes-entites');
  const fournisseurs = fournisseursItems(referentiels.data);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-decomptes'));
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [societeId, setSocieteId] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
  const [statutFactureId, setStatutFactureId] = useState<string | null>(null);
  const [sansFacture, setSansFacture] = useState(false);
  const [ecartSeulement, setEcartSeulement] = useState(false);
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const [selectionne, setSelectionne] = useState<string | null>(null);
  const [erreurSuppression, setErreurSuppression] = useState<string | null>(null);
  const [creation, setCreation] = useState(false);

  function changer<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function reinitialiser() {
    setPage(0);
    setProjetIds([]);
    setSocieteId(null);
    setFournisseurId(null);
    setStatutFactureId(null);
    setSansFacture(false);
    setEcartSeulement(false);
    setDu('');
    setAu('');
    setSearch('');
    setParams({});
  }

  const ref = referentiels.data;
  const projetItems = (ref?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—', compte: p.nbLots }));
  const statutItems = (ref?.statutsFacture ?? []).map((s) => ({ value: s.id, label: libelleReferentiel(s) }));
  const entiteItems = (entites.data ?? []).map((e) => ({ value: e.id, label: e.description ?? e.code ?? '—' }));

  const filtres: FiltresDecomptes = {
    projetIds: projetIds.length > 0 ? projetIds : undefined,
    lotId: lotId ?? undefined,
    societeId: societeId ?? undefined,
    fournisseurId: fournisseurId ?? undefined,
    du: du || undefined,
    au: au || undefined,
    statutFactureId: statutFactureId ?? undefined,
    sansFacture: sansFacture || undefined,
    search: debouncedSearch || undefined,
  };
  const cle = JSON.stringify(filtres);
  const liste = useApi(() => listDecomptes(filtres, { page, size: DEFAULT_PAGE_SIZE, sort: TRI }), [cle, page]);
  const totaux = useApi(() => getTotauxDecomptes(filtres), [cle], 'projet-decomptes-totaux');
  const exportListe = useExportListe(EXPORT_DECOMPTES, { ...filtres, sort: TRI }, 'decomptes');

  // Filtre client : la page chargée seulement.
  const rows = (liste.data?.content ?? []).filter((d) => !ecartSeulement || d.ecartSignificatif);
  const ligne = rows.find((d) => d.id === selectionne);
  const actifs = projetIds.length > 0 || !!lotId || !!societeId || !!fournisseurId || !!statutFactureId || sansFacture || ecartSeulement || !!du || !!au || !!search;
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'décompte') : undefined;
  const puces = [
    ...puceSelection('Projet', projetItems, projetIds),
    ...(lotId ? ['Un lot'] : []),
    ...puceUnique(entiteItems, societeId),
    ...puceUnique(fournisseurs, fournisseurId),
    ...puceUnique(statutItems, statutFactureId),
    ...(sansFacture ? ['Sans facture'] : []),
    ...(ecartSeulement ? ['Écart OMRAN seulement'] : []),
    ...(search ? [`« ${search} »`] : []),
  ];

  async function supprimer() {
    if (!ligne) return;
    const ok = await confirmer({ title: 'Supprimer le décompte', message: `Supprimer le décompte ${ligne.code ?? ''} ? Cette action est définitive.`, confirmLabel: 'Supprimer' });
    if (!ok) return;
    setErreurSuppression(null);
    try {
      await supprimerDecompte(ligne.id);
      setSelectionne(null);
      refetchAllApis();
    } catch (err) {
      setErreurSuppression(err instanceof Error ? err.message : 'La suppression a échoué.');
    }
  }

  function creer(date: string) {
    if (!lotId) return;
    setErreurSuppression(null);
    creerDecompte(lotId, date)
      .then((d) => void navigate(`/projet/decomptes/${d.id}`))
      .catch((err: unknown) => {
        setCreation(false);
        setErreurSuppression(err instanceof Error ? err.message : 'La création a échoué.');
      });
  }

  const actions: ActionOutil[] = [
    ...(ligne?.peutSupprimer ? [{ id: 'supprimer' as const, onClick: () => void supprimer() }] : []),
    { id: 'rafraichir', onClick: refetchAllApis },
    { id: 'exporter', onClick: () => void exportListe.exporter('xlsx'), disabled: exportListe.enCours },
  ];

  return (
    <PageListe titre="Décomptes">
      <EnteteListe titre="Décomptes" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        periode={{ debut: du, fin: au, onChange: (d, f) => { setPage(0); setDu(d); setAu(f); } }}
        recherche={{ valeur: search, onChange: (v) => changer(setSearch, v), placeholder: 'Code, lot, fournisseur…' }}
        onReinitialiser={reinitialiser}
        champs={
          <>
            <label className={CASE}>
              <input type="checkbox" checked={sansFacture} onChange={(e) => changer(setSansFacture, e.target.checked)} />
              Sans facture
            </label>
            <label className={CASE}>
              <input type="checkbox" checked={ecartSeulement} onChange={(e) => setEcartSeulement(e.target.checked)} />
              Écart OMRAN seulement
            </label>
          </>
        }
      >
        <BoiteFiltre titre="Entité" mode="unique" items={entiteItems} valeur={societeId} onChange={(v) => changer(setSocieteId, v)} />
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={(v) => changer(setProjetIds, v)} />
        <BoiteFiltre titre="Fournisseur" mode="unique" items={fournisseurs} valeur={fournisseurId} onChange={(v) => changer(setFournisseurId, v)} />
        <BoiteFiltre titre="Statut facture" mode="unique" items={statutItems} valeur={statutFactureId} onChange={(v) => changer(setStatutFactureId, v)} />
      </PanneauFiltresCoches>
      {liste.error && (
        <div className="flex flex-col items-center gap-2 px-3 pt-2">
          <ErrorState message={liste.error} />
          <Button type="button" variant="outline" size="sm" onClick={() => void liste.refetch()}>
            <RotateCcw data-icon="inline-start" /> Réessayer
          </Button>
        </div>
      )}
      {!liste.error && (
        <CorpsListe
          etat={liste}
          rows={rows}
          colonnes={COLONNES_DECOMPTES}
          cleOrdre="projet-decomptes"
          messageVide={actifs ? 'Aucun décompte pour ces filtres' : 'Aucun décompte dans votre périmètre'}
          onOuvrir={(id) => void navigate(`/projet/decomptes/${id}`)}
          onPage={setPage}
          totauxServeur={totauxBandeDecomptes(totaux.data, totaux.loading, totaux.error, () => void totaux.refetch())}
          selection={{
            ids: new Set(selectionne ? [selectionne] : []),
            onToggle: (id) => setSelectionne((s) => (s === id ? null : id)),
            onToggleAll: () => setSelectionne(null),
          }}
        />
      )}
      <BarreEtatListe lignes={decompte ?? '—'} selection={ligne ? ligne.code ?? '1 ligne' : 'aucune'} alerte={erreurSuppression ?? exportListe.erreur} />
      <BarreOutilsFlottante
        cle="projet-decomptes"
        ligneSelectionnee={!!ligne}
        actions={actions}
        nouveau={lotId ? { libelle: 'Nouveau décompte', onClick: () => setCreation(true) } : undefined}
      />
      {creation && (
        <DialogueRecalculDecompte
          titre="Nouveau décompte"
          description="Le décompte est créé pour le lot filtré, à la date choisie."
          confirmation="Créer le décompte"
          dateInitiale={new Date().toISOString().slice(0, 10)}
          enCours={false}
          onAnnuler={() => setCreation(false)}
          onConfirmer={creer}
        />
      )}
    </PageListe>
  );
}
