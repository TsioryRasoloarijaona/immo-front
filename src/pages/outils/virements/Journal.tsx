import { useState } from 'react';
import { EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { Button } from '../../../components/ui/button';
import { formatDateTime } from '../../../lib/format';
import { useApi } from '../../../lib/useApi';
import { lireJournal } from '../../../lib/virements';
import { cn } from '../../../lib/utils';
import CadreVirements, { type ContexteCharge } from './CadreVirements';
import { LIBELLES_ACTION } from './donnees';

const LIMITE_INITIALE = 100;
const LIMITE_MAX = 1000;

export default function Journal() {
  return (
    <CadreVirements ecran="Journal" fullHeight adminSeulement>
      {(ctx) => <ListeJournal ctx={ctx} />}
    </CadreVirements>
  );
}

/** Journal d'activité du service (§11), admin seulement, lecture seule, du
 * plus récent au plus ancien. `created_at` est en UTC : affiché tel quel,
 * avec la mention. */
function ListeJournal({ ctx }: { ctx: ContexteCharge }) {
  const [limite, setLimite] = useState(LIMITE_INITIALE);
  const { data, loading, error } = useApi(() => lireJournal(limite), [limite, ctx.revision]);

  if (error && !data) return <ErrorState message={error} />;
  if (!data) return <LoadingState />;
  if (data.length === 0) return <EmptyState title="Aucune activité enregistrée" />;

  return (
    <ResultsRegion loading={loading}>
      <p className="shrink-0 text-body text-muted-foreground">
        {data.length} {data.length > 1 ? 'dernières actions' : 'dernière action'} · heures en UTC
      </p>
      <ol className="min-h-0 flex-1 divide-y divide-border overflow-auto rounded-xl border border-border bg-card">
        {data.map((l) => {
          const libelle = LIBELLES_ACTION[l.action] ?? l.action;
          const alerte = l.action === 'ordre_supprime' || l.action === 'acces_refuse' || l.action === 'connexion_refusee';
          return (
            <li key={l.id} className="px-3 py-2">
              <div className="text-body text-foreground">
                <span className={cn('font-medium', alerte && 'text-destructive')}>{libelle}</span>
                {l.cible && <span className="text-muted-foreground"> — </span>}
                {l.cible && <span className="font-mono text-label">{l.cible}</span>}
              </div>
              <div className="text-micro text-muted-foreground">
                {[l.utilisateur_nom || '—', formatDateTime(l.created_at), l.ip, l.detail].filter(Boolean).join(' · ')}
              </div>
            </li>
          );
        })}
      </ol>
      {limite < LIMITE_MAX && data.length >= limite && (
        <div className="flex shrink-0 justify-center">
          <Button type="button" variant="outline" size="sm" disabled={loading} onClick={() => setLimite(LIMITE_MAX)}>
            {loading ? 'Chargement…' : 'Charger plus'}
          </Button>
        </div>
      )}
    </ResultsRegion>
  );
}
