import { Link } from 'react-router-dom';
import { CircleCheck, CircleDashed, CircleX, Wallet } from 'lucide-react';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion, StatCard } from '../../../components/ui';
import { formatCurrency, formatNumber, pluriel } from '../../../lib/format';
import { lireTableauDeBordSyndic } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import { ChoixSimple } from '../virements/CadreVirements';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import { PASTILLE } from './donnees';
import { useExercice } from './useExercice';

export default function TableauDeBordSyndic() {
  return <CadreSyndic ecran="Tableau de bord">{(ctx) => <Tableau ctx={ctx} />}</CadreSyndic>;
}

/** Tous les chiffres viennent du service (`lecture.js`) : rien n'est recalculé ici. */
function Tableau({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const { exercice, setExercice, items, error: erreurExercices } = useExercice(ctx.revision);
  const { data, loading, error } = useApi(
    () => lireTableauDeBordSyndic(exercice ?? undefined),
    [exercice, ctx.revision],
  );

  if (erreurExercices) return <ErrorState message={erreurExercices} />;

  return (
    <>
      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {exercice && items.length > 0 && (
          <ChoixSimple items={items} value={exercice} onChange={setExercice} className="w-52" />
        )}
      </div>

      {!data && (error ? <ErrorState message={error} /> : <LoadingState />)}
      {!error && data && (
        <ResultsRegion loading={loading}>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Payés" value={formatNumber(data.payes)} icon={<CircleCheck />} tone="success" sub={`sur ${pluriel(data.nombre_appartements, 'appartement')}`} />
            <StatCard label="Payés en partie" value={formatNumber(data.partiels)} icon={<CircleDashed />} tone={data.partiels > 0 ? 'amber' : 'neutral'} />
            <StatCard label="Impayés" value={formatNumber(data.impayes)} icon={<CircleX />} tone={data.impayes > 0 ? 'warning' : 'neutral'} />
            <StatCard label="Reste à récupérer" value={formatCurrency(data.a_recouvrer)} icon={<Wallet />} sub={`${formatCurrency(data.paye)} payés sur ${formatCurrency(data.du)}`} />
          </div>

          <Card title={`À relancer (${data.a_relancer.length})`} padded={false}>
            {data.a_relancer.length === 0 ? (
              <EmptyState title="Personne à relancer" message="Tous les appartements sont à jour pour cet exercice." />
            ) : (
              <ul className="divide-y divide-border">
                {data.a_relancer.map((l) => (
                  <li key={l.code} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-body">
                    <Link to={`/outils/syndic/appartements/${encodeURIComponent(l.code)}`} className="font-mono font-medium text-foreground hover:underline">
                      {l.code}
                    </Link>
                    <span className="min-w-0 flex-1 truncate text-foreground">{l.proprietaires}</span>
                    {l.telephone && <span className="text-muted-foreground">{l.telephone}</span>}
                    {l.depuis && <span className="text-muted-foreground">{l.depuis}</span>}
                    <Badge tone={PASTILLE[l.pastille].ton}>{PASTILLE[l.pastille].libelle}</Badge>
                    <span className="w-28 text-right font-semibold text-foreground">{formatCurrency(l.reste)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {data.fiches_incompletes.length > 0 && (
            <Card title={`Fiches incomplètes (${data.fiches_incompletes.length})`}>
              <ul className="flex flex-col gap-1 text-body">
                {data.fiches_incompletes.map((f) => (
                  <li key={f.code}>
                    <span className="font-mono font-medium">{f.code}</span> — <span className="text-muted-foreground">{f.manque}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </ResultsRegion>
      )}
    </>
  );
}
