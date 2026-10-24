import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Trees } from 'lucide-react';
import BoutonExporter from '../../components/BoutonExporter';
import DataGrid, { type ColonneGrille } from '../../components/DataGrid';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listTerrains } from '../../lib/apiTerrains';
import { formatNumber, formatSurface } from '../../lib/format';
import { referentielItems, useEntitesReferentiel } from '../../lib/referentiels';
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
  const debouncedSearch = useDebouncedValue(search);
  const entites = useEntitesReferentiel();
  const societes = [{ label: 'Toutes les sociétés', value: null }, ...referentielItems(entites.data)];
  const { data, loading, error } = useApi(
    () => listTerrains(liste, { search: debouncedSearch || undefined, entiteId: entiteId ?? undefined }, { page, size: DEFAULT_PAGE_SIZE }),
    [liste, debouncedSearch, entiteId, page],
  );
  const rows = data?.content ?? [];
  const filtre = !!search || entiteId !== null;

  return (
    <PageShell
      title={lotissements ? 'Lotissements' : 'Terrains'}
      crumbs={[{ label: 'Patrimoine' }, { label: lotissements ? 'Lotissements' : 'Terrains' }]}
      icon={<Trees />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={
        <div className="flex gap-2">
          <BoutonExporter pdf chemin={`/api/${liste}/export`} nomListe={liste}
            params={{ search: debouncedSearch || undefined, entiteId: entiteId ?? undefined, colonnes: colonnes(lotissements).map((c) => c.nom) }} />
          {!lotissements && <ActionAdmin to="/terrains/nouveau" libelle="Nouveau terrain" />}
        </div>
      }
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3 pt-1">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup className="min-w-55 max-w-md flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Rechercher un code, une description, un titre foncier, une adresse…"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </InputGroup>
          <Select items={societes} value={entiteId}
            onValueChange={(v) => {
              setPage(0);
              setEntiteId(v);
            }}>
            <SelectTrigger aria-label="Société" className="w-56"><SelectValue placeholder="Toutes les sociétés" /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {societes.map((s) => <SelectItem key={s.value ?? ''} value={s.value}>{s.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        {loading && !data && <LoadingState />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">
              {formatNumber(data.totalElements)} {nom}{data.totalElements > 1 ? 's' : ''}
            </div>
            {rows.length === 0 ? (
              <EmptyState title={filtre ? 'Aucun résultat' : `Aucun ${nom}`} />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre={liste}
                  rows={rows}
                  colonnes={colonnes(lotissements)}
                  onOuvrir={(id) => navigate(`/terrains/${id}`)}
                  libelleLigne={(t) => `Ouvrir la fiche de ${t.code ?? ''}`.trim()}
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
