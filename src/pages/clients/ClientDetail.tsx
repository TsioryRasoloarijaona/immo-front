import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Coins, Folder, TrendingUp } from 'lucide-react';
import PageShell from '../../components/PageShell';
import { Badge, Card, EmptyState, ErrorState, Field, FieldGrid, LoadingState, StatCard } from '../../components/ui';
import { Button } from '../../components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/table';
import { useStore } from '../../lib/storeContext';
import { useData } from '../../lib/useData';
import { buildClientRows } from '../../lib/clients';
import { formatCurrency, formatDate } from '../../lib/format';

export default function ClientDetail() {
  const { id } = useParams();
  const { dossiers, getDossierStatus, loading: storeLoading, error } = useStore();
  const { data, loading: dataLoading } = useData();
  const navigate = useNavigate();

  const rows = useMemo(() => {
    if (!data) return [];
    return buildClientRows(dossiers, data.settlements);
  }, [dossiers, data]);

  const client = useMemo(() => rows.find((r) => r.id === id), [rows, id]);

  const loading = storeLoading || dataLoading;

  if (loading) return <PageShell title="Client"><LoadingState /></PageShell>;
  if (error) return <PageShell title="Client"><ErrorState message={error} /></PageShell>;
  if (!data) return null;
  if (!client) {
    return (
      <PageShell title="Client introuvable" crumbs={[{ label: 'Clients', to: '/clients' }]}>
        <p>Ce client n'existe pas dans l'échantillon.</p>
      </PageShell>
    );
  }

  const c = client;

  return (
    <PageShell
      title={c.displayName}
      crumbs={[{ label: 'Clients', to: '/clients' }, { label: c.code || c.displayName }]}
    >
      <Button variant="outline" size="sm" className="mb-4" onClick={() => navigate('/clients')}>
        <ArrowLeft data-icon="inline-start" /> Retour à la liste
      </Button>

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-[21px] font-semibold tracking-tight text-foreground">{c.displayName}</h1>
          {c.dossiers.length > 1 && <Badge tone="info">{c.dossiers.length} dossiers</Badge>}
        </div>
        <div className="mt-1 text-[13px] text-muted-foreground">Code {c.code}</div>
      </div>

      <div className="mb-5 grid grid-cols-[repeat(auto-fit,minmax(210px,1fr))] gap-3.5">
        <StatCard icon={<Coins />} label="À payer (total)" value={formatCurrency(c.totalDue)} sub={`${c.dossiers.length} dossier${c.dossiers.length > 1 ? 's' : ''}`} />
        <StatCard icon={<TrendingUp />} label="Réglé (total)" value={formatCurrency(c.totalPaid)} />
        <StatCard
          icon={<Folder />}
          label="Reste (total)"
          value={formatCurrency(c.totalRemaining)}
          sub={c.totalRemaining <= 0 ? 'Soldé' : undefined}
        />
      </div>

      <div className="flex flex-col gap-4">
        <Card title="Coordonnées">
          <FieldGrid>
            <Field label="Titre" value={c.title} />
            <Field label="Sexe" value={c.gender} />
            <Field label="Mobile" value={c.mobile} />
            <Field label="Téléphone" value={c.phone} />
            <Field label="Email" value={c.email} />
            <Field label="Ville" value={c.city} />
            <Field label="Adresse" value={c.address} />
            <Field label="Nationalité" value={c.nationality} />
            <Field label="Pièce d'identité" value={c.idNumber} />
            <Field label="Profession" value={c.profession} />
            <Field label="Âge" value={c.age ? `${c.age} ans` : undefined} />
          </FieldGrid>
        </Card>

        <Card title={`Dossiers (${c.dossiers.length})`}>
          {c.dossiers.length === 0 ? (
            <EmptyState title="Aucun dossier" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Code</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Article</TableHead>
                    <TableHead className="text-right">À payer</TableHead>
                    <TableHead>Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {c.dossiers.map((d) => {
                    const status = getDossierStatus(d.id);
                    return (
                      <TableRow
                        key={d.id}
                        tabIndex={0}
                        role="link"
                        aria-label={`Ouvrir le dossier ${d.code}`}
                        className="cursor-pointer"
                        onClick={() => navigate(`/dossiers/${d.id}`)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') navigate(`/dossiers/${d.id}`);
                        }}
                      >
                        <TableCell className="font-medium text-foreground">{d.code}</TableCell>
                        <TableCell><Badge tone={status.tone}>{status.label}</Badge></TableCell>
                        <TableCell className="text-muted-foreground">{d.article?.code ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums">{formatCurrency(d.totalToPay)}</TableCell>
                        <TableCell className="text-muted-foreground">{formatDate(d.date)}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </div>
    </PageShell>
  );
}
