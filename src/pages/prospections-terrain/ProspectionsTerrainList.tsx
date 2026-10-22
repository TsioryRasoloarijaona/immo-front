import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPinned, Search } from 'lucide-react';
import ColumnSelector from '../../components/ColumnSelector';
import DataGrid from '../../components/DataGrid';
import PageShell from '../../components/PageShell';
import Pagination from '../../components/Pagination';
import ActionAdmin from '../../components/patrimoine/ActionAdmin';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DEFAULT_PAGE_SIZE } from '../../lib/api';
import { listProspectionsTerrain } from '../../lib/apiProspectionsTerrain';
import { listLignesReferentiel } from '../../lib/apiReferentielsAdmin';
import { useColonnesVisibles } from '../../lib/colonnes';
import {
  CATALOGUE_PROSPECTIONS_TERRAIN, DISPOSITION_PROSPECTIONS_TERRAIN, grilleProspectionsTerrain,
} from '../../lib/colonnesProspectionsTerrain';
import { formatNumber } from '../../lib/format';
import { choixDepuisLignes } from '../../lib/fraisTerrain';
import { referentielItems, useNiveauxTerrain } from '../../lib/referentiels';
import { useApi, useDebouncedValue } from '../../lib/useApi';
import type { FiltresProspectionsTerrain } from '../../types/prospectionsTerrain';

const ARCHIVEE = [
  { label: 'Archivée : toutes', value: 'tous' },
  { label: 'Archivées', value: 'true' },
  { label: 'Non archivées', value: 'false' },
];

type Option = { label: string; value: string | null };

function FiltreListe({ libelle, tous, options, valeur, onChange }: Readonly<{
  libelle: string;
  tous: string;
  options: { label: string; value: string }[];
  valeur: string | null;
  onChange: (v: string | null) => void;
}>) {
  const items: Option[] = [{ label: tous, value: null }, ...options];
  return (
    <Select items={items} value={valeur} onValueChange={onChange}>
      <SelectTrigger aria-label={libelle} className="w-44"><SelectValue placeholder={tous} /></SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {items.map((o) => <SelectItem key={o.value ?? ''} value={o.value}>{o.label}</SelectItem>)}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}

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
  const { data, loading, error, refetch } = useApi(
    () => listProspectionsTerrain(filtres, { page, size: DEFAULT_PAGE_SIZE }),
    [recherche, archivee, statutId, vocationId, niveauId, page],
  );
  const rows = data?.content ?? [];
  const filtre = !!recherche || archivee !== 'tous' || !!statutId || !!vocationId || !!niveauId;
  const apresFiltre = <T,>(set: (v: T) => void) => (v: T) => {
    setPage(0);
    set(v);
  };

  return (
    <PageShell
      title="Prospections terrain"
      crumbs={[{ label: 'Patrimoine' }, { label: 'Prospections terrain' }]}
      icon={<MapPinned />}
      accent="var(--sec-tranche)"
      accentBg="var(--sec-tranche-bg)"
      actions={<ActionAdmin to="/terrains-prospection/nouveau" libelle="Nouvelle prospection" />}
      fullHeight
    >
      <div className="flex h-full min-h-0 flex-col gap-3 pt-1">
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <InputGroup className="min-w-55 max-w-md flex-1">
            <InputGroupAddon><Search /></InputGroupAddon>
            <InputGroupInput placeholder="Rechercher un code, une description, une ville, une catégorie…" value={search}
              onChange={(e) => apresFiltre(setSearch)(e.target.value)} />
          </InputGroup>
          <Select items={ARCHIVEE} value={archivee} onValueChange={(v) => apresFiltre(setArchivee)(v ?? 'tous')}>
            <SelectTrigger aria-label="Archivée" className="w-44"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {ARCHIVEE.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectGroup>
            </SelectContent>
          </Select>
          <FiltreListe libelle="Statut" tous="Tous les statuts" options={optionsStatut} valeur={statutId} onChange={apresFiltre(setStatutId)} />
          <FiltreListe libelle="Vocation" tous="Toutes les vocations"
            options={referentielItems(choixDepuisLignes(vocations.data ?? undefined))} valeur={vocationId} onChange={apresFiltre(setVocationId)} />
          <FiltreListe libelle="Niveau" tous="Tous les niveaux" options={referentielItems(niveaux.data)} valeur={niveauId}
            onChange={apresFiltre(setNiveauId)} />
        </div>

        {loading && !data && <LoadingState />}
        {error && (
          <div className="flex flex-col items-center gap-2">
            <ErrorState message={error} />
            <Button type="button" variant="outline" size="sm" onClick={() => void refetch()}>Réessayer</Button>
          </div>
        )}
        {!error && data && (
          <ResultsRegion loading={loading}>
            <div className="flex shrink-0 items-center justify-between gap-3">
              <div className="text-body text-muted-foreground">
                {formatNumber(data.totalElements)} prospection{data.totalElements > 1 ? 's' : ''} terrain
              </div>
              <ColumnSelector catalogue={colonnes.catalogueServi} visibles={colonnes.visibles} onBasculer={colonnes.basculer}
                onReinitialiser={colonnes.reinitialiser} estDefaut={colonnes.estDefaut} />
            </div>
            {rows.length === 0 ? (
              <EmptyState
                title={filtre ? 'Aucun résultat' : 'Aucune prospection terrain.'}
                action={filtre ? undefined : <ActionAdmin to="/terrains-prospection/nouveau" libelle="Nouvelle prospection" />}
              />
            ) : (
              <div className="min-h-0 min-w-0 flex-1 overflow-auto rounded-xl border border-border bg-card">
                <DataGrid
                  cleOrdre="prospections-terrain"
                  rows={rows}
                  colonnes={grille}
                  onOuvrir={(id) => void navigate(`/terrains-prospection/${id}`)}
                  libelleLigne={(p) => `Ouvrir la fiche de ${p.code ?? ''}`.trim()}
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
