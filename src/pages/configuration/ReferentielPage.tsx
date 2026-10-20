import { Link, useParams } from 'react-router-dom';
import { Settings2 } from 'lucide-react';
import PageShell from '../../components/PageShell';
import TableReferentiel from '../../components/configuration/TableReferentiel';
import { ErrorState, LoadingState } from '../../components/ui';
import { listDescripteursReferentiels } from '../../lib/apiReferentielsAdmin';
import { cn } from '../../lib/utils';
import { FAMILLES } from '../../lib/referentielsAdmin';
import { useApi } from '../../lib/useApi';

/** Écran unique piloté par `GET /api/referentiels-admin` : la liste des référentiels à gauche, la table du choisi à droite. */
export default function ReferentielPage() {
  const { slug } = useParams();
  const { data, loading, error } = useApi(listDescripteursReferentiels, [], 'referentiels-admin-descripteurs');
  const actif = data?.find((d) => d.slug === slug) ?? data?.[0];

  return (
    <PageShell title="Configuration des référentiels" icon={<Settings2 />} fullHeight
      crumbs={[{ label: 'Patrimoine' }, { label: 'Configuration' }, ...(actif ? [{ label: actif.libelle }] : [])]}>
      {loading && !data && <LoadingState />}
      {error && <ErrorState message={error} />}
      {!error && data && actif && (
        <div className="flex h-full min-h-0 flex-col gap-4 md:flex-row">
          <nav aria-label="Référentiels" className="flex max-h-48 shrink-0 flex-col gap-3 overflow-y-auto md:max-h-none md:w-56">
            {FAMILLES.map((f) => (
              <div key={f.code}>
                <h2 className="mb-1 px-2 text-micro font-medium uppercase text-muted-foreground">{f.libelle}</h2>
                {data.filter((d) => d.famille === f.code).map((d) => (
                  <Link key={d.slug} to={`/configuration/referentiels/${d.slug}`} aria-current={d.slug === actif.slug ? 'page' : undefined}
                    className={cn('block rounded-md px-2 py-1 text-body text-foreground no-underline hover:bg-muted',
                      d.slug === actif.slug && 'bg-muted font-medium')}>
                    {d.libelle}
                  </Link>
                ))}
              </div>
            ))}
          </nav>
          <section className="flex min-h-0 min-w-0 flex-1 flex-col gap-2">
            <h2 className="shrink-0 text-label font-medium text-foreground">{actif.libelle}</h2>
            {actif.codesProteges.length > 0 && (
              <p className="shrink-0 text-micro text-muted-foreground">
                Codes protégés ({actif.codesProteges.join(', ')}) : le CRM s'appuie dessus, ils ne peuvent être ni modifiés ni supprimés.
              </p>
            )}
            <TableReferentiel key={actif.slug} descripteur={actif} />
          </section>
        </div>
      )}
    </PageShell>
  );
}
