import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import FicheProspectionTerrainFenetre from '../../components/terrain/fiche/FicheProspectionTerrainFenetre';
import useFenetreListe from '../../lib/useFenetreListe';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listProspectionsTerrain } from '../../lib/apiProspectionsTerrain';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { useColonnesVisibles } from '../../lib/colonnes';
import {
  CATALOGUE_PROSPECTIONS_TERRAIN, DISPOSITION_PROSPECTIONS_TERRAIN, grilleProspectionsTerrain,
} from '../../lib/colonnesProspectionsTerrain';
import { pluriel } from '../../lib/format';
import { choixDepuisLignes } from '../../lib/fraisTerrain';
import { puceUnique } from '../../lib/pucesFiltres';
import { referentielItems, useNiveauxTerrain } from '../../lib/referentiels';
import { useExportListe } from '../../lib/useExportListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { FiltresProspectionsTerrain } from '../../types/prospectionsTerrain';

const ARCHIVEE = [
  { label: 'Archivées', value: 'true' },
  { label: 'Non archivées', value: 'false' },
];

/** `/terrains-prospection` : prospections terrain (LndLand), lecture pour tous, création pour l'Administrateur. */
export default function ProspectionsTerrainList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [archivee, setArchivee] = useState('tous');
  const [statutId, setStatutId] = useState<string | null>(null);
  const [vocationId, setVocationId] = useState<string | null>(null);
  const [niveauId, setNiveauId] = useState<string | null>(null);
  const recherche = useDebouncedValue(search).trim();
  const colonnes = useColonnesVisibles('prospections-terrain', CATALOGUE_PROSPECTIONS_TERRAIN, DISPOSITION_PROSPECTIONS_TERRAIN);
  const grille = useMemo(() => grilleProspectionsTerrain(colonnes.colonnes), [colonnes.colonnes]);
  const niveaux = useNiveauxTerrain();
  const vocations = useApi(() => listLignesReferentiel('vocations-terrain'), []);
  // Pas de liste de statuts dédiée : ceux des prospections existantes (quelques statuts par entité).
  const statuts = useApi(() => listProspectionsTerrain(undefined, { page: 0, size: 200 }), []);
  const optionsStatut = useMemo(() => {
    const parId = new Map((statuts.data?.content ?? []).flatMap((p) => (p.statut ? [[p.statut.id, p.statut.description || p.statut.code || '']] : [])));
    return [...parId].map(([value, label]) => ({ value, label }));
  }, [statuts.data]);

  const filtres: FiltresProspectionsTerrain = {
    search: recherche || undefined,
    archivee: archivee === 'tous' ? undefined : archivee === 'true',
    statutId: statutId ?? undefined,
    vocationId: vocationId ?? undefined,
    niveauId: niveauId ?? undefined,
  };
  const { data, loading, error } = useApi(
    () => listProspectionsTerrain(filtres, { page, size: DEFAULT_PAGE_SIZE }),
    [recherche, archivee, statutId, vocationId, niveauId, page],
  );
  const rows = data?.content ?? [];
  const fenetre = useFenetreListe('/terrains-prospection', rows.map((p) => p.id));
  const filtre = !!recherche || archivee !== 'tous' || !!statutId || !!vocationId || !!niveauId;
  const apresFiltre = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(0);
    set(v);
  };
  const itemsVocation = referentielItems(choixDepuisLignes(vocations.data ?? undefined));
  const itemsNiveau = referentielItems(niveaux.data);
  const exportListe = useExportListe('/api/prospections-terrain/export', { ...filtres, colonnes: colonnes.visibles }, 'prospections-terrain');

  function resetFilters() {
    setPage(0);
    setSearch('');
    setArchivee('tous');
    setStatutId(null);
    setVocationId(null);
    setNiveauId(null);
  }

  return (
    <CadreListe
      titre="Prospections terrain"
      cle="terrains-prospection"
      lignes={data ? pluriel(data.totalElements, 'prospection terrain', 'prospections terrain') : undefined}
      selecteur={
        <ColumnSelector compact catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
          onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
      }
      panneau={{
        puces: [
          ...puceUnique(ARCHIVEE, archivee === 'tous' ? null : archivee),
          ...puceUnique(optionsStatut, statutId),
          ...puceUnique(itemsVocation, vocationId),
          ...puceUnique(itemsNiveau, niveauId),
          ...(search ? [`« ${search} »`] : []),
        ],
        recherche: { valeur: search, onChange: apresFiltre(setSearch), placeholder: 'Code, description, ville, catégorie…' },
        onReinitialiser: resetFilters,
        children: (
          <>
            <BoiteFiltre titre="Archivée" mode="unique" items={ARCHIVEE} valeur={archivee === 'tous' ? null : archivee}
              onChange={(v) => apresFiltre(setArchivee)(v ?? 'tous')} />
            <BoiteFiltre titre="Statut" mode="unique" items={optionsStatut} valeur={statutId} onChange={apresFiltre(setStatutId)} />
            <BoiteFiltre titre="Vocation" mode="unique" items={itemsVocation} valeur={vocationId} onChange={apresFiltre(setVocationId)} />
            <BoiteFiltre titre="Niveau" mode="unique" items={itemsNiveau} valeur={niveauId} onChange={apresFiltre(setNiveauId)} />
          </>
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucune prospection terrain', filtresActifs: filtre, onReinitialiser: resetFilters } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{
        nouveau: { libelle: 'Nouvelle prospection', onClick: () => void navigate('/terrains-prospection/nouveau') },
        actions: [{ id: 'importer', onClick: () => void navigate('/articles/import?type=prospections-terrain') }],
      }}
      exportListe={{ export: exportListe, pdf: true }}
      dialogues={
        fenetre.idOuvert && (
          <FicheProspectionTerrainFenetre key={fenetre.idOuvert} id={fenetre.idOuvert} voisins={fenetre.voisins} onFermer={fenetre.fermer} />
        )
      }
    >
      <DataGrid
        cleOrdre="prospections-terrain"
        rows={rows}
        colonnes={grille}
        onOuvrir={fenetre.ouvrir}
        libelleLigne={(p) => `Ouvrir la fiche de ${p.code ?? ''}`.trim()}
      />
    </CadreListe>
  );
}
