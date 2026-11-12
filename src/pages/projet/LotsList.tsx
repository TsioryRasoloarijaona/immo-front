import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { ColonneGrille } from '../../components/DataGrid';
import PageListe from '../../components/liste/PageListe';
import EnteteListe from '../../components/liste/EnteteListe';
import PanneauFiltresCoches from '../../components/liste/PanneauFiltresCoches';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import BarreEtatListe from '../../components/liste/BarreEtatListe';
import BarreOutilsFlottante from '../../components/liste/BarreOutilsFlottante';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listLots } from '../../lib/apiProjet';
import { formatPercentValue, pluriel } from '../../lib/format';
import { cleFiltresFermes, useBooleenMemorise } from '../../lib/outilsListe';
import { puceSelection, puceUnique } from '../../lib/pucesFiltres';
import { refetchAllApis, useApi, useDebouncedValue } from '../../lib/useApi';
import type { LotListItemDto } from '../../types/projet';
import { BadgeStatut, BarreAvancement, CorpsListe } from './commun';
import { fournisseursItems, libelleReferentiel, useReferentielsProjet } from './hooks';

const COLONNES: ColonneGrille<LotListItemDto>[] = [
  { nom: 'code', libelle: 'Code', largeur: 6 },
  { nom: 'description', libelle: 'Désignation', largeur: 16 },
  { nom: 'projetCode', libelle: 'Projet', largeur: 7 },
  { nom: 'typeDescription', libelle: 'Type', largeur: 8 },
  { nom: 'statutDescription', libelle: 'Statut', largeur: 8, valeur: (l) => l.statutDescription ?? l.statutCode, rendu: (l) => <BadgeStatut libelle={l.statutDescription ?? l.statutCode} /> },
  { nom: 'fournisseurNom', libelle: 'Fournisseur', largeur: 12 },
  { nom: 'dateDebut', libelle: 'Début', type: 'DATE', largeur: 6 },
  { nom: 'dateFin', libelle: 'Fin', type: 'DATE', largeur: 6 },
  { nom: 'montantTTC', libelle: 'Marché TTC', type: 'MONTANT', largeur: 9 },
  { nom: 'cumulDecomptesTTC', libelle: 'Décomptes TTC', type: 'MONTANT', largeur: 9 },
  {
    nom: 'avancementPct',
    libelle: 'Avancement',
    type: 'NOMBRE',
    largeur: 9,
    rendu: (l) => <BarreAvancement pct={l.avancementPct} />,
    formatValeur: (v) => formatPercentValue(typeof v === 'number' ? v : null),
  },
  { nom: 'cumulRetenueGarantie', libelle: 'RG cumulée', type: 'MONTANT', largeur: 8 },
  { nom: 'totalFacture', libelle: 'Facturé', type: 'MONTANT', largeur: 9 },
  { nom: 'totalRegle', libelle: 'Réglé', type: 'MONTANT', largeur: 9 },
  { nom: 'resteARegler', libelle: 'Reste', type: 'MONTANT', largeur: 9 },
];

export default function LotsList() {
  const navigate = useNavigate();
  const referentiels = useReferentielsProjet();
  const fournisseurs = fournisseursItems(referentiels.data);
  const [filtresFermes, basculerFiltres] = useBooleenMemorise(cleFiltresFermes('projet-lots'));
  const [projetIds, setProjetIds] = useState<string[]>([]);
  const [statutId, setStatutId] = useState<string | null>(null);
  const [typeId, setTypeId] = useState<string | null>(null);
  const [fournisseurId, setFournisseurId] = useState<string | null>(null);
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
    setStatutId(null);
    setTypeId(null);
    setFournisseurId(null);
    setSearch('');
  }

  const ref = referentiels.data;
  const projetItems = (ref?.projets ?? []).map((p) => ({ value: p.id, label: p.code ?? p.description ?? '—', compte: p.nbLots }));
  const statutItems = (ref?.statutsLot ?? []).map((s) => ({ value: s.id, label: libelleReferentiel(s) }));
  const typeItems = (ref?.typesLot ?? []).map((t) => ({ value: t.id, label: libelleReferentiel(t) }));

  const liste = useApi(
    () =>
      listLots(
        { projetIds: projetIds.length > 0 ? projetIds : undefined, statutIds: statutId ? [statutId] : undefined, typeId: typeId ?? undefined, fournisseurId: fournisseurId ?? undefined, search: debouncedSearch || undefined },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [projetIds.join(','), statutId, typeId, fournisseurId, debouncedSearch, page],
  );

  const actifs = projetIds.length > 0 || !!statutId || !!typeId || !!fournisseurId || !!search;
  const decompte = liste.data ? pluriel(liste.data.totalElements, 'lot') : undefined;
  const puces = [
    ...puceSelection('Projet', projetItems, projetIds),
    ...puceUnique(statutItems, statutId),
    ...puceUnique(typeItems, typeId),
    ...puceUnique(fournisseurs, fournisseurId),
    ...(search ? [`« ${search} »`] : []),
  ];

  return (
    <PageListe titre="Lots">
      <EnteteListe titre="Lots" lignes={decompte} />
      <PanneauFiltresCoches
        ferme={filtresFermes}
        onBasculer={basculerFiltres}
        puces={puces}
        recherche={{ valeur: search, onChange: (v) => changer(setSearch, v), placeholder: 'Code, désignation, fournisseur…' }}
        onReinitialiser={reinitialiser}
      >
        <BoiteFiltre titre="Projet" mode="multiple" items={projetItems} valeur={projetIds} onChange={(v) => changer(setProjetIds, v)} />
        <BoiteFiltre titre="Statut" mode="unique" items={statutItems} valeur={statutId} onChange={(v) => changer(setStatutId, v)} />
        <BoiteFiltre titre="Type" mode="unique" items={typeItems} valeur={typeId} onChange={(v) => changer(setTypeId, v)} />
        <BoiteFiltre titre="Fournisseur" mode="unique" items={fournisseurs} valeur={fournisseurId} onChange={(v) => changer(setFournisseurId, v)} />
      </PanneauFiltresCoches>
      <CorpsListe
        etat={liste}
        rows={liste.data?.content ?? []}
        colonnes={COLONNES}
        cleOrdre="projet-lots"
        messageVide={actifs ? 'Aucun lot ne correspond aux filtres actifs' : 'Aucun lot dans votre périmètre'}
        onOuvrir={(id) => void navigate(`/projet/lots/${id}`)}
        onPage={setPage}
      />
      <BarreEtatListe lignes={decompte ?? '—'} selection="aucune" />
      <BarreOutilsFlottante cle="projet-lots" ligneSelectionnee={false} actions={[{ id: 'rafraichir', onClick: refetchAllApis }]} />
    </PageListe>
  );
}
