import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import CadreListe from '../../components/patrimoine/CadreListe';
import { DEFAULT_PAGE_SIZE, listProjets } from '../../lib/api';
import { pluriel } from '../../lib/format';
import { useExportListe } from '../../lib/useExportListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { colonneLocale as colonne, grilleDepuisCatalogue, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import type { ColonneDto, ProjetListItemDto } from '../../types';

/** Tableau Liste de la page PROGRAMMES de l'aide OMRAN ; le serveur renvoie toutes les colonnes, le choix est local. */

const CATALOGUE: ColonneDto[] = [
  colonne('description', 'Description', 'GENERAL', 'TEXTE', true),
  colonne('code', 'Code', 'GENERAL', 'TEXTE', true),
  colonne('entiteCode', 'Entité', 'GENERAL', 'TEXTE', true),
  colonne('ville', 'Ville', 'COORDONNEES', 'TEXTE', true),
  colonne('descriptionLongue', 'Description détaillée', 'GENERAL'),
  colonne('dateDebutTravaux', 'Date lancement des travaux', 'DELAIS', 'DATE'),
  colonne('dateFinTravaux', 'Date fin des travaux', 'DELAIS', 'DATE'),
  colonne('dateDebutCommercialisation', 'Date début de commercialisation', 'DELAIS', 'DATE'),
  colonne('dateFinCommercialisation', 'Date fin de commercialisation', 'DELAIS', 'DATE'),
  colonne('adresse', 'Adresse', 'COORDONNEES'),
  colonne('telephone', 'Tél.', 'COORDONNEES'),
  colonne('mobile', 'Mobile', 'COORDONNEES'),
  colonne('fax', 'Fax', 'COORDONNEES'),
  colonne('email', 'Email', 'COORDONNEES'),
  colonne('siteWeb', 'Site web', 'COORDONNEES'),
  colonne('villeSignature', 'Courrier fait à', 'PROGRAMME'),
  colonne('signataireLibelle', 'Courrier signataire', 'PROGRAMME'),
  colonne('representantLegalLibelle', 'Représentant légal', 'PROGRAMME'),
  colonne('responsableCommercialLibelle', 'Représentant commercial', 'PROGRAMME'),
  colonne('responsableTechniqueLibelle', 'Représentant technique', 'PROGRAMME'),
  colonne('creePar', 'Crée par', 'AUDIT'),
  colonne('creeLe', 'Crée le', 'AUDIT', 'DATE'),
  colonne('modifiePar', 'Modifié par', 'AUDIT'),
  colonne('modifieLe', 'Modifié le', 'AUDIT', 'DATE'),
];

const DISPOSITION: DispositionColonnes = {
  ordre: CATALOGUE.map((c) => c.nom),
  poids: { description: 40, ville: 20, entiteCode: 12, code: 14 },
};

export default function ProjetsList() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);
  const { data, loading, error } = useApi(
    () => listProjets({ page, size: DEFAULT_PAGE_SIZE }, { search: debouncedSearch || undefined }),
    [page, debouncedSearch],
  );
  const colonnes = useColonnesVisibles('projets', CATALOGUE, DISPOSITION);
  const grille = useMemo(
    () => grilleDepuisCatalogue<ProjetListItemDto>(colonnes.colonnes, DISPOSITION.poids, 'description'),
    [colonnes.colonnes],
  );
  const rows = data?.content ?? [];
  const exportListe = useExportListe('/api/projets/export', { search: debouncedSearch || undefined, colonnes: colonnes.visibles }, 'projets');

  function resetFilters() {
    setPage(0);
    setSearch('');
  }

  return (
    <CadreListe
      titre="Projets"
      cle="projets"
      lignes={data ? pluriel(data.totalElements, 'programme') : undefined}
      selecteur={
        <ColumnSelector
          compact
          catalogue={colonnes.catalogueServi}
          visibles={colonnes.visibles}
          onBasculer={colonnes.basculer}
          onReinitialiser={colonnes.reinitialiser}
          estDefaut={colonnes.estDefaut}
        />
      }
      panneau={{
        puces: search ? [`« ${search} »`] : [],
        recherche: {
          valeur: search,
          onChange: (v) => {
            setPage(0);
            setSearch(v);
          },
          placeholder: 'Code, description, ville, entité…',
        },
        onReinitialiser: resetFilters,
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucun programme', filtresActifs: !!search, onReinitialiser: resetFilters } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{
        nouveau: { libelle: 'Nouveau programme', onClick: () => void navigate('/projets/nouveau') },
        actions: [{ id: 'importer', onClick: () => void navigate('/articles/import?type=projets') }],
      }}
      exportListe={{ export: exportListe, pdf: true }}
    >
      <DataGrid
        cleOrdre="projets"
        rows={rows}
        colonnes={grille}
        onOuvrir={(id) => navigate(`/projets/${id}`)}
        libelleLigne={(p) => `Ouvrir le projet ${p.description || p.code || ''}`.trim()}
      />
    </CadreListe>
  );
}
