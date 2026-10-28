import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import EtatColonnes from '../../components/EtatColonnes';
import CadreListe from '../../components/patrimoine/CadreListe';
import { DEFAULT_PAGE_SIZE, listTranches } from '../../lib/api';
import { pluriel } from '../../lib/format';
import { useExportListe } from '../../lib/useExportListe';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { grilleDepuisCatalogue, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { useColonnesTranches } from '../../lib/referentiels';
import type { TrancheListItemDto } from '../../types';

/** `id` et `projetId` sont servis par défaut pour la navigation, jamais affichés. */
const DISPOSITION: DispositionColonnes = {
  ordre: ['description', 'code', 'projetCode', 'standingLibelle', 'entiteCode', 'ville', 'dateOctroiTitresFonciers', 'estEnVente'],
  poids: { description: 30, code: 12, projetCode: 16, standingLibelle: 12, entiteCode: 10, ville: 14 },
  masquees: new Set(['id', 'projetId']),
};

export default function TranchesList() {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const catalogue = useColonnesTranches();
  const colonnes = useColonnesVisibles('tranches', catalogue.data, DISPOSITION);
  const demandees = colonnes.demandees;
  const { data, loading, error } = useApi(
    () => listTranches({ search: debouncedSearch || undefined, colonnes: demandees }, { page, size: DEFAULT_PAGE_SIZE }),
    [debouncedSearch, page, demandees?.join(',') ?? ''],
  );
  const grille = useMemo(
    () => grilleDepuisCatalogue<TrancheListItemDto>(colonnes.colonnes, DISPOSITION.poids, 'description'),
    [colonnes.colonnes],
  );
  const rows = data?.content ?? [];
  const exportListe = useExportListe('/api/tranches/export', { search: debouncedSearch || undefined, colonnes: colonnes.visibles }, 'tranches');

  function resetFilters() {
    setPage(0);
    setSearch('');
  }

  return (
    <CadreListe
      titre="Tranches"
      cle="tranches"
      lignes={data ? pluriel(data.totalElements, 'tranche') : undefined}
      selecteur={
        colonnes.catalogueServi.length > 0 && (
          <ColumnSelector
            compact
            catalogue={colonnes.catalogueServi}
            visibles={colonnes.visibles}
            onBasculer={colonnes.basculer}
            onReinitialiser={colonnes.reinitialiser}
            estDefaut={colonnes.estDefaut}
          />
        )
      }
      panneau={{
        puces: search ? [`« ${search} »`] : [],
        recherche: {
          valeur: search,
          onChange: (v) => {
            setPage(0);
            setSearch(v);
          },
          placeholder: 'Code, description, ville, programme…',
        },
        onReinitialiser: resetFilters,
      }}
      etat={{ chargement: loading, erreur: error, pret: !!data }}
      vide={rows.length === 0 ? { aucun: 'Aucune tranche', filtresActifs: !!search, onReinitialiser: resetFilters } : null}
      pagination={data ? { page: data.page, totalPages: data.totalPages, totalElements: data.totalElements, onPageChange: setPage } : undefined}
      admin={{
        nouveau: { libelle: 'Nouvelle tranche', onClick: () => void navigate('/tranches/nouveau') },
        actions: [{ id: 'importer', onClick: () => void navigate('/articles/import?type=tranches') }],
      }}
      exportListe={{ export: exportListe, pdf: true, inactif: colonnes.visibles.length === 0 }}
    >
      <EtatColonnes pret={grille.length > 0} erreur={catalogue.error}>
        <DataGrid
          cleOrdre="tranches"
          rows={rows}
          colonnes={grille}
          onOuvrir={(id) => navigate(`/tranches/${id}`)}
          libelleLigne={(t) => `Ouvrir la tranche ${t.description || t.code || ''}`.trim()}
        />
      </EtatColonnes>
    </CadreListe>
  );
}
