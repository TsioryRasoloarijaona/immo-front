import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutGrid, Plus, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { DEFAULT_PAGE_SIZE, listProjets } from '../../lib/api';
import { useAuth } from '../../lib/auth';
import { poidsColonne, useColonnesVisibles, type DispositionColonnes } from '../../lib/colonnes';
import { formatNumber } from '../../lib/format';
import { estAdministrateur } from '../../lib/roles';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { ColonneDto, GroupeColonne, ProjetListItemDto, TypeColonne } from '../../types';

/* Les 23 colonnes de la liste PROGRAMMES de l'aide OMRAN : toutes servies par `GET /api/projets` (8 programmes),
   d'où un catalogue local ; seule la sélection affichée change. */
const col = (nom: string, libelle: string, groupe: GroupeColonne, type: TypeColonne, parDefaut = false): ColonneDto => ({
  nom,
  libelle,
  groupe,
  type,
  parDefaut,
  groupable: false,
  agregeable: false,
  fonctions: [],
});

const CATALOGUE: ColonneDto[] = [
  col('code', 'Code', 'IDENTITE', 'TEXTE', true),
  col('description', 'Description', 'IDENTITE', 'TEXTE', true),
  col('entiteLibelle', 'Entité', 'IDENTITE', 'TEXTE', true),
  col('descriptionLongue', 'Description détaillée', 'IDENTITE', 'TEXTE'),
  col('dateDebutTravaux', 'Date lancement des travaux', 'DELAIS', 'DATE'),
  col('dateFinTravaux', 'Date fin des travaux', 'DELAIS', 'DATE'),
  col('dateDebutCommercialisation', 'Date début de commercialisation', 'DELAIS', 'DATE'),
  col('dateFinCommercialisation', 'Date fin de commercialisation', 'DELAIS', 'DATE'),
  col('adresseComplete', 'Adresse', 'COORDONNEES', 'TEXTE', true),
  col('ville', 'Ville', 'COORDONNEES', 'TEXTE', true),
  col('telephone', 'Tél.', 'COORDONNEES', 'TEXTE'),
  col('mobile', 'Mobile', 'COORDONNEES', 'TEXTE'),
  col('fax', 'Fax', 'COORDONNEES', 'TEXTE'),
  col('email', 'Email', 'COORDONNEES', 'TEXTE'),
  col('siteWeb', 'Site web', 'COORDONNEES', 'TEXTE'),
  col('villeSignature', 'Courrier fait à', 'ACTEURS', 'TEXTE'),
  col('signataireLibelle', 'Courrier signataire', 'ACTEURS', 'TEXTE'),
  col('representantLegal', 'Représentant légal', 'ACTEURS', 'TEXTE'),
  col('responsableCommercialLibelle', 'Représentant commercial', 'ACTEURS', 'TEXTE'),
  col('responsableTechniqueLibelle', 'Représentant technique', 'ACTEURS', 'TEXTE'),
  col('creePar', 'Créé par', 'AUDIT', 'TEXTE'),
  col('creeLe', 'Créé le', 'AUDIT', 'DATE'),
  col('modifiePar', 'Modifié par', 'AUDIT', 'TEXTE'),
  col('modifieLe', 'Modifié le', 'AUDIT', 'DATE'),
];

const DISPOSITION: DispositionColonnes = {
  ordre: [],
  poids: { code: 10, description: 24, entiteLibelle: 14, adresseComplete: 24, ville: 12, descriptionLongue: 24 },
};

const CLASSES: Record<string, string> = {
  code: 'text-muted-foreground',
  description: 'font-medium text-foreground',
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
  const grille = useMemo<ColonneGrille<ProjetListItemDto>[]>(
    () =>
      colonnes.colonnes.map((c) => ({
        nom: c.nom,
        libelle: c.libelle,
        type: c.type,
        largeur: poidsColonne(c.nom, DISPOSITION.poids),
        classe: CLASSES[c.nom] ?? 'text-muted-foreground',
      })),
    [colonnes.colonnes],
  );
  const { user } = useAuth();
  const rows = data?.content ?? [];

  return (
    <PageShell
      title="Projets"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Projets' }]}
      actions={
        estAdministrateur(user) ? (
          <Button size="sm" onClick={() => void navigate('/projets/nouveau')}>
            <Plus data-icon="inline-start" /> Nouveau programme
          </Button>
        ) : undefined
      }
      icon={<LayoutGrid />}
      accent="var(--sec-projet)"
      accentBg="var(--sec-projet-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <InputGroup className="max-w-md shrink-0">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher — code, libellé, entité, ville…"
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
                {formatNumber(data.totalElements)} programme{data.totalElements > 1 ? 's' : ''}
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
              <EmptyState
                title={search ? 'Aucun résultat' : 'Rien à afficher'}
                message={search ? 'Aucun programme ne correspond à la recherche.' : "Aucun programme n'est encore enregistré."}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="projets"
                  rows={rows}
                  colonnes={grille}
                  onOuvrir={(id) => navigate(`/projets/${id}`)}
                  libelleLigne={(p) => `Ouvrir le programme ${p.description || p.code || ''}`.trim()}
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
