import { Link } from 'react-router-dom';
import { Badge, Card, EmptyState, ErrorState, LoadingState, ResultsRegion } from '../../../components/ui';
import { formatCurrency, formatDate } from '../../../lib/format';
import { lireQuiDoit } from '../../../lib/syndic';
import { useApi } from '../../../lib/useApi';
import CadreSyndic, { type ContexteSyndic } from './CadreSyndic';
import { RAISON_APPEL } from './donnees';
import type { Appel } from './types';

export default function QuiDoitSyndic() {
  return <CadreSyndic ecran="Qui doit">{(ctx) => <Liste ctx={ctx} />}</CadreSyndic>;
}

/** Une ligne = une personne à appeler (ses lots réunis), dans l'ordre donné par le service. */
function Liste({ ctx }: Readonly<{ ctx: ContexteSyndic }>) {
  const { data, loading, error } = useApi(lireQuiDoit, [ctx.revision]);
  if (!data) return error ? <ErrorState message={error} /> : <LoadingState />;
  if (error) return <ErrorState message={error} />;
  if (data.length === 0) return <EmptyState title="Personne ne doit rien" message="Tous les exercices commencés sont réglés." />;
  return (
    <ResultsRegion loading={loading}>
      <div className="flex flex-col gap-2">
        {data.map((a) => (
          <LigneAppel key={a.cle} appel={a} />
        ))}
      </div>
    </ResultsRegion>
  );
}

function LigneAppel({ appel: a }: Readonly<{ appel: Appel }>) {
  const raison = RAISON_APPEL[a.raison];
  const titre = (
    <span className="flex flex-wrap items-center gap-2">
      {a.noms.join(' et ') || 'Sans propriétaire'}
      <Badge tone={raison.ton}>{raison.libelle}</Badge>
    </span>
  );
  return (
    <Card title={titre} action={<span className="text-label font-semibold text-foreground">{formatCurrency(a.en_retard + a.a_venir)}</span>}>
      <div className="flex flex-col gap-1.5 text-body">
        {a.telephones.length > 0 && <p className="text-foreground">{a.telephones.join(' · ')}</p>}
        <ul className="flex flex-col gap-0.5">
          {a.dettes.map((d) => (
            <li key={`${d.code}-${d.exercice}`} className="flex flex-wrap gap-x-2">
              <Link to={`/outils/syndic/appartements/${encodeURIComponent(d.code)}`} className="font-mono hover:underline">
                {d.code}
              </Link>
              <span className="text-muted-foreground">exercice {d.exercice}</span>
              <span>reste à payer {formatCurrency(d.reste)}</span>
              {d.a_venir && <span className="text-muted-foreground">(commence le {formatDate(d.debut)})</span>}
            </li>
          ))}
        </ul>
        {a.en_retard_depuis && <p className="text-muted-foreground">En retard depuis le {formatDate(a.en_retard_depuis)}.</p>}
        {a.derniere_note && (
          <p className="text-muted-foreground">
            Dernière note ({formatDate(a.derniere_note.date)}) : {a.derniere_note.texte || '—'}
            {a.derniere_note.promis_le && ` — promis pour le ${formatDate(a.derniere_note.promis_le)}`}
          </p>
        )}
      </div>
    </Card>
  );
}
