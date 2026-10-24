import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Search } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import PageShell from '../../components/PageShell';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import Pagination from '../../components/Pagination';
import ColumnSelector from '../../components/ColumnSelector';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import DataGrid from '../../components/DataGrid';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { DEFAULT_PAGE_SIZE, listProjets } from '../../lib/api';
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

  return (
    <PageShell
      title="Projets"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Projets' }]}
      icon={<LayoutGrid />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
      actions={
        <div className="flex gap-2">
          <BoutonExporter pdf chemin="/api/projets/export" nomListe="projets"
            params={{ search: debouncedSearch || undefined, colonnes: colonnes.visibles }} />
          <ActionAdmin to="/projets/nouveau" libelle="Nouveau programme" />
        </div>
      }
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <InputGroup className="max-w-md shrink-0">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un code, une description, une ville, une entité…"
            value={search}
            onChange={(e) => {
              setPage(0);
              setSearch(e.target.value);
            }}
          />
        </InputGroup>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {data.totalElements} programme{data.totalElements > 1 ? 's' : ''}
              </div>
              <ColumnSelector
                catalogue={colonnes.catalogueServi}
                visibles={colonnes.visibles}
                onBasculer={colonnes.basculer}
                onReinitialiser={colonnes.reinitialiser}
                estDefaut={colonnes.estDefaut}
              />
            </div>
            {rows.length === 0 ? (
              <EmptyState title={search ? 'Aucun résultat' : 'Aucun programme'} />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="projets"
                  rows={rows}
                  colonnes={grille}
                  onOuvrir={(id) => navigate(`/projets/${id}`)}
                  libelleLigne={(p) => `Ouvrir le projet ${p.description || p.code || ''}`.trim()}
                />
              </div>
            )}
            <div className="shrink-0">
              <Pagination page={data.page} totalPages={data.totalPages} totalElements={data.totalElements} onPageChange={setPage} />
            </div>
          </ResultsRegion>
        )}
      </div>
    </PageShell>
  );
}
