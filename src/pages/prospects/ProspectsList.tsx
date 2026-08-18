import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui';
import { InputGroup, InputGroupAddon, InputGroupInput } from '../../components/ui/input-group';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { buildProspectRows } from '../../lib/prospects';
import { natureBadgeTone } from '../../lib/domain';

export default function ProspectsList() {
  const { prospections, dossiers, loading: storeLoading, error } = useStore();
  const { loading: dataLoading } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const rows = useMemo(() => buildProspectRows(prospections, dossiers), [prospections, dossiers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => `${r.displayName} ${r.phone} ${r.mobile} ${r.email}`.toLowerCase().includes(q));
  }, [rows, search]);

  const loading = storeLoading || dataLoading;

  if (loading) return <PageShell title="Prospects"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Prospects"><ErrorState message={error} /></PageShell>;

  return (
    <PageShell title="Prospects" crumbs={[{ label: 'Ventes' }, { label: 'Prospects' }]}>
      <p className="mb-4 max-w-[680px] text-[12.5px] text-muted-foreground">
        Vue centrée sur la fiche contact plutôt que sur la prospection — l'équivalent de la page
        Clients mais pour les contacts déjà liés à une prospection non encore convertie en dossier.
        Les pré-prospections sans contact lié n'apparaissent pas ici (voir la page Prospections).
      </p>

      <div className="mb-4 flex flex-wrap items-center gap-2.5">
        <InputGroup className="min-w-[220px] flex-1">
          <InputGroupAddon>
            <Search />
          </InputGroupAddon>
          <InputGroupInput
            placeholder="Rechercher un nom, téléphone, email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </InputGroup>
      </div>

      <div className="mb-2.5 text-[12.5px] text-muted-foreground">
        {filtered.length} prospect{filtered.length > 1 ? 's' : ''}
      </div>

      {filtered.length === 0 ? (
        <EmptyState title="Aucun résultat" message="Ajustez votre recherche." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <Table className="min-w-[720px]">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead>Nom</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Ville</TableHead>
                <TableHead>Prospection liée</TableHead>
                <TableHead>Étape</TableHead>
                <TableHead>Commercial</TableHead>
                <TableHead>Dossier de vente</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow
                  key={r.id}
                  tabIndex={0}
                  role="link"
                  aria-label={`Ouvrir la prospection de ${r.displayName}`}
                  className="cursor-pointer"
                  onClick={() => navigate(`/prospections/${r.prospection.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') navigate(`/prospections/${r.prospection.id}`);
                  }}
                >
                  <TableCell className="font-medium text-foreground">{r.displayName}</TableCell>
                  <TableCell className="text-muted-foreground">{r.mobile || r.phone || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.email || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.city || '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.prospection.code || '—'}</TableCell>
                  <TableCell>
                    <Badge tone={natureBadgeTone(r.prospection.nature, r.prospection.isClosed)}>
                      {r.prospection.isClosed ? 'Clôturée' : r.prospection.nature}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{r.commercial || '—'}</TableCell>
                  <TableCell>
                    {r.hasDossier ? <Badge tone="success">Dossier ouvert</Badge> : <span className="text-muted-foreground">—</span>}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </PageShell>
  );
}
