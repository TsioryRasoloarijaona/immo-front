import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listDecomptes } from '../../lib/apiProjet';
import { pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import { CorpsListe } from './commun';
import { COLONNES_DECOMPTES } from './colonnesDecomptes';
import { libelleReferentiel, useFournisseursItems, useReferentielsProjet } from './hooks';

const CASE = 'flex items-center gap-1.5 text-body text-foreground';

export default function DecomptesList() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const lotId = params.get('lotId');
  const referentiels = useReferentielsProjet();
  const fournisseurs = useFournisseursItems();
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-decomptes'));
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
  const [statutFactureId, setStatutFactureId] = useState<string | null>(null);
  const [sansFacture, setSansFacture] = useState(false);
  const [ecartSeulement, setEcartSeulement] = useState(false);
  const [du, setDu] = useState('');
  const [au, setAu] = useState('');
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);

  function changer<T>(setter: (v: T) => void, v: T) {
    setPage(0);
    setter(v);
  }

  function reinitialiser() {
    setPage(0);
    setProjetIds([]);
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

  const liste = useApi(
    () =>
      listDecomptes(
        {
          projetIds: projetIds.length > 0 ? projetIds : undefined,
          lotId: lotId ?? undefined,
          fournisseurId: fournisseurId ?? undefined,
          du: du || undefined,
          au: au || undefined,
          statutFactureId: statutFactureId ?? undefined,
          sansFacture: sansFacture || undefined,
          search: debouncedSearch || undefined,
        },
        { page, size: DEFAULT_PAGE_SIZE, sort: ['docDate,desc', 'code,desc'] },
      ),
    [projetIds.join(','), lotId, fournisseurId, du, au, statutFactureId, sansFacture, debouncedSearch, page],
  );

  // Filtre client : la page chargée seulement.
  const rows = (liste.data?.content ?? []).filter((d) => !ecartSeulement || d.ecartSignificatif);
  const actifs = projetIds.length > 0 || !!lotId || !!fournisseurId || !!statutFactureId || sansFacture || ecartSeulement || !!du || !!au || !!search;
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'décompte') : undefined;
  const puces = [
    ...puceSelection('Projet', projetItems, projetIds),
    ...(lotId ? ['Un lot'] : []),
    ...puceUnique(fournisseurs, fournisseurId),
    ...puceUnique(statutItems, statutFactureId),
    ...(sansFacture ? ['Sans facture'] : []),
    ...(ecartSeulement ? ['Écart OMRAN seulement'] : []),
    ...(search ? [`« ${search} »`] : []),
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
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={(v) => changer(setProjetIds, v)} />
        <BoiteFiltre titre="Fournisseur" mode="unique" items={fournisseurs} valeur={fournisseurId} onChange={(v) => changer(setFournisseurId, v)} />
        <BoiteFiltre titre="Statut facture" mode="unique" items={statutItems} valeur={statutFactureId} onChange={(v) => changer(setStatutFactureId, v)} />
      </PanneauFiltresCoches>
      <CorpsListe
        etat={liste}
        rows={rows}
        colonnes={COLONNES_DECOMPTES}
        cleOrdre="projet-decomptes"
        messageVide={actifs ? 'Aucun décompte ne correspond aux filtres actifs' : 'Aucun décompte dans votre périmètre'}
        onOuvrir={(id) => void navigate(`/projet/decomptes/${id}`)}
        onPage={setPage}
      />
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle="projet-decomptes" ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: refetchAllApis }]} />
    </PageListe>
  );
}
