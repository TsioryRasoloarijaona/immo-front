import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ReceiptText, RotateCcw, Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import DataGrid from '../../components/DataGrid';
import Pagination from '../../components/Pagination';
import RefSelect from '../../components/RefSelect';
import { EmptyState, ErrorState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import {
  DEFAULT_PAGE_SIZE,
  getReferentielsChantier,
  listDecomptesChantier,
  listLotsProjetChantier,
  listProjetsChantier,
} from '../../lib/api';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import { pluriel } from '../../lib/format';
import { SqueletteGrille } from './chantierUi';
import { COLONNES_DECOMPTES_GLOBAL } from './colonnesDecomptes';

// Lots d'un projet pour le filtre dépendant : ARS-PRJ en a 144.
const TAILLE_LOTS_FILTRE = 500;

interface Filtres {
  projetId: string | null;
  lotId: string | null;
  statutFactureId: string | null;
  du: string;
  au: string;
  sansFacture: boolean;
}

const FILTRES_VIDES: Filtres = { projetId: null, lotId: null, statutFactureId: null, du: '', au: '', sansFacture: false };

export default function DecomptesList() {
  const navigate = useNavigate();
  const [filtres, setFiltres] = useState<Filtres>(FILTRES_VIDES);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search);
  const [page, setPage] = useState(0);

  const projets = useApi(() => listProjetsChantier(), [], 'chantier-projets');
  const referentiels = useApi(() => getReferentielsChantier(), [], 'chantier-referentiels');
  const lots = useApi(
    () =>
      filtres.projetId
        ? listLotsProjetChantier(filtres.projetId, undefined, { page: 0, size: TAILLE_LOTS_FILTRE, sort: ['code,asc'] })
        : Promise.resolve(null),
    [filtres.projetId],
  );

  const { data, loading, error } = useApi(
    () =>
      listDecomptesChantier(
        {
          projetId: filtres.projetId ?? undefined,
          lotId: filtres.lotId ?? undefined,
          statutFactureId: filtres.statutFactureId ?? undefined,
          du: filtres.du || undefined,
          au: filtres.au || undefined,
          sansFacture: filtres.sansFacture || undefined,
          search: debouncedSearch || undefined,
        },
        { page, size: DEFAULT_PAGE_SIZE },
      ),
    [filtres, debouncedSearch, page],
  );

  function changer(partiel: Partial<Filtres>) {
    setPage(0);
    setFiltres((f) => ({ ...f, ...partiel }));
  }

  function reinitialiser() {
    setPage(0);
    setFiltres(FILTRES_VIDES);
    setSearch('');
  }

  const filtreActif = search !== '' || JSON.stringify(filtres) !== JSON.stringify(FILTRES_VIDES);
  const optionsProjets = (projets.data ?? [])
    .filter((p) => !p.estCentreDeCouts)
    .map((p) => ({ label: `${p.code ?? ''} — ${p.description ?? ''}`, value: p.id }));
  const optionsLots = (lots.data?.content ?? []).map((l) => ({ label: `${l.code ?? ''} — ${l.description ?? ''}`, value: l.id }));
  const optionsStatuts = (referentiels.data?.statutsFacture ?? []).map((s) => ({ label: s.description ?? s.code ?? '', value: s.id }));

  return (
    <PageShell
      title="Décomptes"
      crumbs={[{ label: 'Chantier' }, { label: 'Décomptes' }]}
      icon={<ReceiptText />}
      accent="var(--sec-chantier-decompte)"
      accentBg="var(--sec-chantier-decompte-bg)"
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup className="min-w-55 flex-1">
            <InputGroupAddon>
              <Search />
            </InputGroupAddon>
            <InputGroupInput
              placeholder="Code du décompte, code ou désignation du lot, fournisseur…"
              aria-label="Rechercher un décompte"
              value={search}
              onChange={(e) => {
                setPage(0);
                setSearch(e.target.value);
              }}
            />
          </InputGroup>
          <RefSelect id="decomptes-projet" label="Projet" placeholder="Tous" size="sm" value={filtres.projetId} items={optionsProjets}
            onChange={(v) => changer({ projetId: v, lotId: null })} />
          {filtres.projetId && (
            <RefSelect id="decomptes-lot" label="Lot" placeholder="Tous" size="sm" value={filtres.lotId} items={optionsLots}
              onChange={(v) => changer({ lotId: v })} />
          )}
          <RefSelect id="decomptes-statut" label="Facture" placeholder="Tous statuts" size="sm" value={filtres.statutFactureId}
            items={optionsStatuts} onChange={(v) => changer({ statutFactureId: v })} />
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Du" value={filtres.du} onChange={(e) => changer({ du: e.target.value })} />
          </InputGroup>
          <InputGroup className="w-32.5">
            <InputGroupInput type="date" aria-label="Au" value={filtres.au} onChange={(e) => changer({ au: e.target.value })} />
          </InputGroup>
          <label className="flex items-center gap-1.5 text-body text-foreground">
            <input type="checkbox" checked={filtres.sansFacture} onChange={(e) => changer({ sansFacture: e.target.checked })} />
            Sans facture
          </label>
          {filtreActif && (
            <Button type="button" variant="ghost" size="sm" onClick={reinitialiser}>
              <RotateCcw data-icon="inline-start" /> Réinitialiser
            </Button>
          )}
        </div>

        {loading && !data && <SqueletteGrille />}
        {error && <ErrorState message={error} />}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="shrink-0 text-body text-muted-foreground">{pluriel(data.totalElements, 'décompte')}</div>
            {data.content.length === 0 ? (
              <EmptyState
                title={filtreActif ? 'Aucun résultat' : 'Aucun décompte dans votre périmètre'}
                message={filtreActif ? 'Aucun décompte ne correspond aux filtres actifs.' : undefined}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="chantier-decomptes"
                  rows={data.content}
                  colonnes={COLONNES_DECOMPTES_GLOBAL}
                  onOuvrir={(id) => void navigate(`/chantier/decomptes/${id}`)}
                  libelleLigne={(r) => `Ouvrir le décompte ${r.code ?? r.id}`}
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
