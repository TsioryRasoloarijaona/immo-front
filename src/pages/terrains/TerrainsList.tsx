import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileImage, Paperclip } from 'lucide-react';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import BoiteFiltre from '../../components/liste/BoiteFiltre';
import CadreListe from '../../components/patrimoine/CadreListe';
import ImportPlanDialog from '../../components/patrimoine/ImportPlanDialog';
import FicheLotissementFenetre from '../../components/terrain/fiche/FicheLotissementFenetre';
import FicheTerrainFenetre from '../../components/terrain/fiche/FicheTerrainFenetre';
import useFenetreListe from '../../lib/useFenetreListe';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listTerrains } from '../../lib/apiTerrains';
import { formatSurface, pluriel } from '../../lib/format';
import { puceUnique } from '../../lib/pucesFiltres';
import { referentielItems, useEntitesReferentiel, useTranchesFiltre } from '../../lib/referentiels';
import { useExportListe } from '../../lib/useExportListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ReferentielItemDto } from '../../types';
import type { TerrainListeDto } from '../../types/terrains';

const libelle = (r?: ReferentielItemDto | null) => r?.description || r?.code || '';

const reference = (nom: string, titre: string, lire: (t: TerrainListeDto) => ReferentielItemDto | null | undefined, largeur: number): ColonneGrille<TerrainListeDto> =>
  ({ nom, libelle: titre, largeur, valeur: (t) => libelle(lire(t)) });

function colonnes(lotissements: boolean): ColonneGrille<TerrainListeDto>[] {
  return [
    { nom: 'code', libelle: 'Code', largeur: 12, classe: 'font-medium text-foreground' },
    { nom: 'description', libelle: 'Description', largeur: 28 },
    reference('entite', 'Société', (t) => t.entite, 16),
    reference('ville', 'Ville', (t) => t.ville, 12),
    reference('statut', 'Statut', (t) => t.statut, 10),
    reference('vocation', 'Vocation', (t) => t.vocation, 10),
    ...(lotissements ? [reference('tranche', 'Tranche', (t) => t.tranche, 14)] : []),
    { nom: 'surfaceDefinitive', libelle: 'Surface définitive', type: 'NOMBRE', largeur: 12, rendu: (t) => formatSurface(t.surfaceDefinitive) },
    { nom: 'prixDefinitifTTC', libelle: 'Prix définitif TTC', type: 'MONTANT', largeur: 14 },
    { nom: 'titreFoncier', libelle: 'Titre foncier', largeur: 14 },
    { nom: 'occupe', libelle: 'Occupé', type: 'BOOLEEN', largeur: 8 },
  ];
}

/** `/terrains` : tous les terrains (lotissements compris) ; `/lotissements` : ceux d'une tranche, vocation autre que Projet. */
export default function TerrainsList({ liste = 'terrains' }: Readonly<{ liste?: 'terrains' | 'lotissements' }>) {
  const navigate = useNavigate();
  const lotissements = liste === 'lotissements';
  const nom = lotissements ? 'lotissement' : 'terrain';
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [entiteId, setEntiteId] = useState<string | null>(null);
  const [trancheId, setTrancheId] = useState<string | null>(null);
  const [planOuvert, setPlanOuvert] = useState(false);
  const debouncedSearch = useDebouncedValue(search);
  const entites = useEntitesReferentiel();
  const tranches = useTranchesFiltre();
  const itemsSocietes = referentielItems(entites.data);
  const itemsTranches = referentielItems(tranches.data);
  const filtres = { search: debouncedSearch || undefined, entiteId: entiteId ?? undefined, trancheId: lotissements ? (trancheId ?? undefined) : undefined };
  const { data, loading, error } = useApi(
    () => listTerrains(liste, filtres, { page, size: DEFAULT_PAGE_SIZE }),
    [liste, debouncedSearch, entiteId, trancheId, page],
  );
  const rows = data?.content ?? [];
  const fenetre = useFenetreListe(`/${liste}`, rows.map((t) => t.id));
  const Fiche = lotissements ? FicheLotissementFenetre : FicheTerrainFenetre;
  const filtre = !!search || entiteId !== null || trancheId !== null;
  const sansTranche = trancheId === null;
  const exportListe = useExportListe(`/api/${liste}/export`, { ...filtres, colonnes: colonnes(lotissements).map((c) => c.nom) }, liste);

  function resetFilters() {
    setPage(0);
    setSearch('');
    setEntiteId(null);
    setTrancheId(null);
  }

  const apresFiltre = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(0);
    set(v);
  };

  return (
    <CadreListe
      titre={lotissements ? 'Lotissements' : 'Terrains'}
      cle={liste}
      lignes={data ? pluriel(data.totalElements, nom) : undefined}
      panneau={{
        puces: [
          ...puceUnique(itemsSocietes, entiteId),
          ...(lotissements ? puceUnique(itemsTranches, trancheId) : []),
          ...(search ? [`« ${search} »`] : []),
        ],
        recherche: { valeur: search, onChange: apresFiltre(setSearch), placeholder: 'Code, description, titre foncier, adresse…' },
        onReinitialiser: resetFilters,
        champs: lotissements && sansTranche && <span className="text-label text-muted-foreground">Vous devez sélectionner une Tranche !</span>,
        children: (
          <>
            <BoiteFiltre titre="Société" mode="unique" items={itemsSocietes} valeur={entiteId} onChange={apresFiltre(setEntiteId)} />
            {lotissements && <BoiteFiltre titre="Tranche" mode="unique" items={itemsTranches} valeur={trancheId} onChange={apresFiltre(setTrancheId)} />}
          </>
        ),
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: `Aucun ${nom}`, filtresActifs: filtre, onReinitialiser: resetFilters } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{
        nouveau: {
          libelle: lotissements ? 'Nouveau lotissement' : 'Nouveau terrain',
          onClick: () => void navigate(lotissements && trancheId ? `/lotissements/nouveau?trancheId=${trancheId}` : `/${liste}/nouveau`),
        },
        actions: [{ id: 'importer', onClick: () => void navigate(lotissements ? `/articles/import?type=lotissements&trancheId=${trancheId}` : '/articles/import?type=terrains'), disabled: lotissements && sansTranche }],
        propres: lotissements
          ? [
              { id: 'fichiers', libelle: 'Fichiers attachés', icone: Paperclip, disabled: sansTranche, onClick: () => void navigate(`/articles/attachement-masse?trancheId=${trancheId}&nature=TER`) },
              { id: 'plans', libelle: 'Importer plans', icone: FileImage, disabled: sansTranche, onClick: () => setPlanOuvert(true) },
            ]
          : [],
      }}
      exportListe={{ export: exportListe, pdf: true }}
      dialogues={
        <>
          {planOuvert && trancheId && (
            <ImportPlanDialog trancheId={trancheId} onClose={() => setPlanOuvert(false)} onImporte={() => setPlanOuvert(false)} />
          )}
          {fenetre.idOuvert && (
            <Fiche key={fenetre.idOuvert} id={fenetre.idOuvert} voisins={fenetre.voisins} onFermer={fenetre.fermer} />
          )}
        </>
      }
    >
      <DataGrid
        cleOrdre={liste}
        rows={rows}
        colonnes={colonnes(lotissements)}
        onOuvrir={fenetre.ouvrir}
        libelleLigne={(t) => `Ouvrir la fiche de ${t.code ?? ''}`.trim()}
      />
    </CadreListe>
  );
}
